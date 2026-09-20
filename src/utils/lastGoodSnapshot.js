// src/utils/lastGoodSnapshot.js
//
// The last payload that actually came from FPL, kept in localStorage so a
// cold page load while FPL is down (or while the phone is offline on the
// walk to the match) shows the league instead of an empty screen.
//
// This is deliberately NOT the same thing as fplApi's two-minute response
// cache: that one is short-lived and gets cleared by the Refresh button,
// precisely because it is meant to be re-fetched. This snapshot is the
// opposite — it lives until the next successful load replaces it, and it is
// never treated as fresh: whoever reads it gets `isStale: true` and an age,
// so the UI can say where the numbers came from rather than quietly
// presenting them as live.
//
// Storage is injectable so the behaviour can be unit-tested without a DOM
// (vitest runs in node here, where `localStorage` doesn't exist) and so
// Safari's private mode — where touching localStorage throws — degrades to
// "no snapshot" instead of breaking the load.

const KEY_PREFIX = 'broleague:lastGood:';
const STORAGE_VERSION = 1;

const defaultStorage = () => {
  try {
    return globalThis.localStorage || null;
  } catch {
    // Safari private mode throws on ACCESS, not just on write.
    return null;
  }
};

/**
 * The parts of a league-complete payload worth keeping. `bootstrap` is
 * reduced to the three fields anything on the client actually reads
 * (`gameweeks` for deadlines/GW metadata, plus the two counters) — persisting
 * the whole shaped bootstrap would store every player in the league's
 * payload, which is megabytes of localStorage for data no component reads.
 */
export const pickSnapshot = (payload, savedAt = Date.now()) => {
  if (!payload) return null;
  const bootstrap = payload.bootstrap || {};
  return {
    version: STORAGE_VERSION,
    savedAt,
    league: payload.league || null,
    standings: payload.standings || [],
    gameweekTable: payload.gameweekTable || [],
    leagueStats: payload.leagueStats || {},
    bootstrap: {
      currentGameweek: bootstrap.currentGameweek,
      totalGameweeks: bootstrap.totalGameweeks,
      gameweeks: bootstrap.gameweeks || [],
    },
  };
};

/**
 * Does this payload carry real league data? Used both to decide whether a
 * snapshot is worth writing and to refuse to overwrite a full-screen
 * loading state with an empty one.
 */
export const hasLeagueData = (payload) => Boolean(
  payload && ((payload.standings?.length || 0) > 0 || (payload.gameweekTable?.length || 0) > 0)
);

export function saveLastGood(leagueId, payload, storage = defaultStorage()) {
  if (!leagueId || !storage || !hasLeagueData(payload)) return false;
  const snapshot = pickSnapshot(payload);
  if (!snapshot) return false;
  try {
    storage.setItem(`${KEY_PREFIX}${leagueId}`, JSON.stringify(snapshot));
    return true;
  } catch {
    // Quota exceeded / storage disabled — the app works fine without this.
    return false;
  }
}

/**
 * The stored snapshot for this league, marked as stale and dated, or null if
 * there is nothing usable. A snapshot from another season is still returned
 * — the caller decides what to say about its age — but a malformed one is
 * discarded rather than handed to the UI.
 */
export function loadLastGood(leagueId, storage = defaultStorage(), now = Date.now()) {
  if (!leagueId || !storage) return null;
  let raw;
  try {
    raw = storage.getItem(`${KEY_PREFIX}${leagueId}`);
  } catch {
    return null;
  }
  if (!raw) return null;

  try {
    const snapshot = JSON.parse(raw);
    if (!snapshot || snapshot.version !== STORAGE_VERSION || !hasLeagueData(snapshot)) return null;
    return {
      ...snapshot,
      authenticated: false,
      fromCache: true,
      isStale: true,
      staleAgeMs: Math.max(0, now - (snapshot.savedAt || 0)),
    };
  } catch {
    return null;
  }
}

/** Test hook / manual reset — used by the Refresh button's own flow. */
export function clearLastGood(leagueId, storage = defaultStorage()) {
  if (!leagueId || !storage) return;
  try {
    storage.removeItem(`${KEY_PREFIX}${leagueId}`);
  } catch {
    // Nothing to do.
  }
}

/**
 * "12 minutes ago" for the offline banner. Coarse on purpose — the exact
 * second is noise, and at this resolution it never reads as a live figure.
 */
export function formatStaleAge(ms) {
  const seconds = Math.max(0, Math.round((ms || 0) / 1000));
  if (seconds < 90) return 'less than a minute ago';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}
