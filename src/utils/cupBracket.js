// src/utils/cupBracket.js
//
// A season-long knockout cup laid on top of this classic league's own data
// — same trick as h2hSchedule.js (a simulated FPL "cup competition"),
// fully deterministic so every viewer sees the same bracket.
//
// Seeding: managers ranked by season total points (the standings order —
// the same figure every other competition in the app ranks on). Round
// pairing is 1vN, 2vN-1, … the standard cup convention (top seed plays
// bottom seed first).
//
// Scheduling: rounds are spread EVENLY between the cup's opening gameweek
// (default GW8, so a few gameweeks of form exist before knockouts) and
// the season's final gameweek — the final is always on the last GW. Each
// round is decided by that gameweek's net-of-hits points, higher
// advancing; ties break by season total, then by better seed (the only
// remaining deterministic order, and equivalent to "the underdog must
// beat the seed outright" convention).
//
// Rounds whose gameweek has no gameweekTable data yet are undecided, and
// every later round then shows TBD placeholders — the bracket fills in
// progressively as gameweeks complete, exactly like the rest of the app.

import { getNetPoints } from './h2hSchedule';

export const ROUND_NAMES = {
  2: 'Final',
  4: 'Semi-finals',
  8: 'Quarter-finals',
  16: 'Round of 16',
};

/** Largest power of two ≤ manager count (16→16, 15→8, 7→4). */
export function bracketSizeFor(managerCount) {
  let size = 1;
  while (size * 2 <= managerCount) size *= 2;
  return size;
}

/**
 * The gameweek each round plays on: evenly spaced integers from
 * `startGameweek` to `totalGameweeks`, final round on the final GW.
 * With one round it's just the final GW; rounds never share a GW.
 */
export function roundGameweeks(rounds, startGameweek, totalGameweeks) {
  if (rounds <= 1) return [totalGameweeks];
  const gws = [];
  for (let i = 0; i < rounds; i++) {
    gws.push(Math.round(startGameweek + (i * (totalGameweeks - startGameweek)) / (rounds - 1)));
  }
  // Guard against the rounding collapsing two adjacent rounds onto one GW.
  for (let i = 1; i < gws.length; i++) {
    if (gws[i] <= gws[i - 1]) gws[i] = gws[i - 1] + 1;
  }
  return gws;
}

/**
 * Builds the cup. Returns `{ bracketSize, startGameweek, rounds, champion }`
 * where `rounds` is `[{ name, gameweek, matches: [{ a, b, aPts, bPts,
 * winnerId, decided }] }]` and `a`/`b` are `{ id, name }` (or null for a
 * TBD slot). `champion` is set only once the final has been decided.
 */
export function buildCupBracket(
  standings = [],
  gameweekTable = [],
  { totalGameweeks = 38, startGameweek = 8 } = {}
) {
  if (standings.length < 2) {
    return { bracketSize: 0, startGameweek, rounds: [], champion: null };
  }

  const bracketSize = bracketSizeFor(standings.length);
  const seedCount = bracketSize;
  // Seeds by season total (standings already carry `totalPoints`); the
  // id tiebreak keeps seeding stable across cache-freshness differences.
  const seeds = [...standings]
    .sort((x, y) =>
      (y.totalPoints || 0) - (x.totalPoints || 0) ||
      (x.id ?? x.entry) - (y.id ?? y.entry))
    .slice(0, seedCount)
    .map((m) => ({ id: m.id ?? m.entry, name: m.managerName || m.player_name }));

  const netByGw = new Map();
  gameweekTable.forEach((gw) => {
    const m = new Map();
    (gw.managers || []).forEach((mgr) => m.set(mgr.id, getNetPoints(mgr)));
    netByGw.set(gw.gameweek, m);
  });
  const totalById = new Map(standings.map((m) => [m.id ?? m.entry, m.totalPoints || 0]));

  const roundCount = Math.log2(bracketSize);
  const gwForRound = roundGameweeks(roundCount, startGameweek, totalGameweeks);

  // Seed pairing: 1 v seedCount, 2 v seedCount-1, … standard cup bracket.
  const pairUp = (participants) => {
    const matches = [];
    for (let i = 0; i < participants.length / 2; i++) {
      matches.push([participants[i], participants[participants.length - 1 - i]]);
    }
    return matches;
  };

  let roundTeams = seeds; // array of { id, name } or null (TBD)
  const rounds = [];

  for (let r = 0; r < roundCount; r++) {
    const gameweek = gwForRound[r];
    const gwNet = netByGw.get(gameweek);
    const matches = pairUp(roundTeams).map(([a, b]) => {
      const aPts = a && b && gwNet ? gwNet.get(a.id) : null;
      const bPts = a && b && gwNet ? gwNet.get(b.id) : null;
      const decided = aPts != null && bPts != null;
      let winnerId = null;
      if (decided) {
        if (aPts > bPts) winnerId = a.id;
        else if (bPts > aPts) winnerId = b.id;
        else {
          // Net points tied: season total decides, then the better seed.
          const aTotal = totalById.get(a.id) || 0;
          const bTotal = totalById.get(b.id) || 0;
          if (aTotal !== bTotal) winnerId = aTotal > bTotal ? a.id : b.id;
          else winnerId = a.id; // `a` is always the better seed here
        }
      }
      return { a, b, aPts, bPts, winnerId, decided };
    });

    rounds.push({
      name: ROUND_NAMES[matches.length * 2] || `Round of ${matches.length * 2}`,
      gameweek,
      matches
    });

    // Winners advance; any undecided match makes both next-round slots TBD.
    roundTeams = matches.map(({ a, b, winnerId, decided }) =>
      decided ? [a, b].find((p) => p.id === winnerId) : null
    );
  }

  const finalMatches = rounds[rounds.length - 1]?.matches || [];
  const champion = finalMatches[0]?.decided
    ? [finalMatches[0].a, finalMatches[0].b].find((p) => p.id === finalMatches[0].winnerId)
    : null;

  return { bracketSize, startGameweek: gwForRound[0], rounds, champion };
}