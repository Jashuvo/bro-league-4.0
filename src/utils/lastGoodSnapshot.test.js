import { describe, it, expect, beforeEach } from 'vitest';
import {
  pickSnapshot,
  hasLeagueData,
  saveLastGood,
  loadLastGood,
  clearLastGood,
  formatStaleAge,
} from './lastGoodSnapshot';

// A minimal stand-in for localStorage — vitest runs in node here, where
// there isn't one. Same surface the module uses: getItem/setItem/removeItem.
const fakeStorage = () => {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    size: () => map.size,
  };
};

const payload = (overrides = {}) => ({
  authenticated: true,
  league: { name: 'BRO League' },
  standings: [{ id: 1, totalPoints: 300 }],
  gameweekTable: [{ gameweek: 1, managers: [{ id: 1, points: 60 }] }],
  leagueStats: { averageScore: 250 },
  bootstrap: {
    currentGameweek: 4,
    totalGameweeks: 38,
    gameweeks: [{ id: 1, deadline_time: '2026-08-15T10:00:00Z' }],
    // Large data no component reads — must not be persisted.
    players: new Array(500).fill({ id: 1, web_name: 'Someone' }),
  },
  ...overrides,
});

describe('hasLeagueData', () => {
  it('is true only when the payload carries standings or gameweeks', () => {
    expect(hasLeagueData(payload())).toBe(true);
    expect(hasLeagueData(payload({ standings: [], gameweekTable: [{ gameweek: 1 }] }))).toBe(true);
    expect(hasLeagueData(payload({ standings: [], gameweekTable: [] }))).toBe(false);
    expect(hasLeagueData(null)).toBe(false);
  });
});

describe('pickSnapshot', () => {
  it('keeps the league data and only the bootstrap fields the client reads', () => {
    const snapshot = pickSnapshot(payload(), 1000);
    expect(snapshot.savedAt).toBe(1000);
    expect(snapshot.standings).toHaveLength(1);
    expect(snapshot.bootstrap.gameweeks).toHaveLength(1);
    expect(snapshot.bootstrap).not.toHaveProperty('players');
  });
});

describe('saveLastGood / loadLastGood', () => {
  let storage;

  beforeEach(() => {
    storage = fakeStorage();
  });

  it('round-trips a payload, flagged stale with an age', () => {
    saveLastGood('123', payload(), storage);
    const loaded = loadLastGood('123', storage, Date.now());
    expect(loaded.standings).toHaveLength(1);
    expect(loaded.authenticated).toBe(false);
    expect(loaded.isStale).toBe(true);
    expect(loaded.staleAgeMs).toBeGreaterThanOrEqual(0);
  });

  it('refuses to store an empty payload over a good one', () => {
    saveLastGood('123', payload(), storage);
    const wrote = saveLastGood('123', payload({ standings: [], gameweekTable: [] }), storage);
    expect(wrote).toBe(false);
    expect(loadLastGood('123', storage).standings).toHaveLength(1);
  });

  it('keeps leagues apart and ignores other leagues', () => {
    saveLastGood('123', payload(), storage);
    expect(loadLastGood('999', storage)).toBeNull();
  });

  it('discards a corrupt or outdated snapshot instead of crashing the load', () => {
    storage.setItem('broleague:lastGood:123', '{ not json');
    expect(loadLastGood('123', storage)).toBeNull();

    storage.setItem('broleague:lastGood:123', JSON.stringify({ version: 0, standings: [{ id: 1 }] }));
    expect(loadLastGood('123', storage)).toBeNull();
  });

  it('is a silent no-op when storage is unavailable', () => {
    expect(saveLastGood('123', payload(), null)).toBe(false);
    expect(loadLastGood('123', null)).toBeNull();
    expect(() => clearLastGood('123', null)).not.toThrow();
  });

  it('survives a storage that throws (private mode)', () => {
    const hostile = {
      getItem: () => { throw new Error('denied'); },
      setItem: () => { throw new Error('quota'); },
      removeItem: () => { throw new Error('denied'); },
    };
    expect(saveLastGood('123', payload(), hostile)).toBe(false);
    expect(loadLastGood('123', hostile)).toBeNull();
    expect(() => clearLastGood('123', hostile)).not.toThrow();
  });

  it('forgets on request', () => {
    saveLastGood('123', payload(), storage);
    clearLastGood('123', storage);
    expect(loadLastGood('123', storage)).toBeNull();
  });
});

describe('formatStaleAge', () => {
  it('describes the age in words', () => {
    expect(formatStaleAge(5_000)).toBe('less than a minute ago');
    expect(formatStaleAge(12 * 60_000)).toBe('12 minutes ago');
    expect(formatStaleAge(60 * 60_000)).toBe('1 hour ago');
    expect(formatStaleAge(5 * 60 * 60_000)).toBe('5 hours ago');
    expect(formatStaleAge(2 * 24 * 60 * 60_000)).toBe('2 days ago');
  });
});
