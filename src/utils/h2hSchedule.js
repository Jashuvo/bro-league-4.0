// src/utils/h2hSchedule.js
//
// A simulated FPL-rules head-to-head mini-league laid on top of this
// (classic) league's existing data. Real FPL H2H leagues are a different
// league TYPE with their own fixed season schedule from FPL itself — this
// classic league has no such official schedule, so this generates an
// equivalent one using the same standard round-robin algorithm sports
// leagues (and FPL's own H2H mode) use, seeded so it's identical for
// every viewer rather than reshuffling on every page load.
//
// Scoring is FPL's actual H2H rule set, confirmed against
// https://fpltoolbox.com/blog/a-beginners-guide-to-head-to-head-h2h-leagues-in-fantasy-premier-league/
// and cross-checked against the Premier League's own tiebreaker
// explainer (https://www.premierleague.com/en/news/1210781): win = 3
// league points, draw = 1 each, loss = 0; a match's score is each
// manager's gameweek points AFTER transfer-cost deductions (matching the
// "net points" this app already computes everywhere else — weekly prize
// winners, monthly prize totals); ties in the table are broken by season
// total points, not by any points-difference/goal-difference equivalent.

// Tiny deterministic PRNG (mulberry32) — good enough to make the fixture
// order look arbitrary rather than sorted by manager ID; not intended for
// anything security-sensitive.
function mulberry32(seed) {
  let a = seed | 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A stable seed from a list of manager IDs — same league membership
 * always produces the same schedule; the schedule only changes if who's
 * actually in the league changes. */
export function seedFromIds(managerIds) {
  const joined = [...managerIds].sort((a, b) => a - b).join(',');
  let h = 0;
  for (let i = 0; i < joined.length; i++) {
    h = (Math.imul(31, h) + joined.charCodeAt(i)) | 0;
  }
  return h;
}

function seededShuffle(array, seed) {
  const rand = mulberry32(seed);
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const BYE = Symbol('bye');

/**
 * Standard round-robin "circle method": fix the first team, rotate the
 * rest around it for N-1 rounds (N padded to even with a bye if the
 * league has an odd number of managers). Returns an array of rounds, each
 * an array of `[managerIdA, managerIdB]` pairs.
 */
function circleMethod(ids) {
  const teams = [...ids];
  if (teams.length % 2 !== 0) teams.push(BYE);
  const n = teams.length;
  const rounds = [];
  const arr = [...teams];
  for (let round = 0; round < n - 1; round++) {
    const pairs = [];
    for (let i = 0; i < n / 2; i++) {
      const a = arr[i];
      const b = arr[n - 1 - i];
      if (a !== BYE && b !== BYE) pairs.push([a, b]);
    }
    rounds.push(pairs);
    // Keep arr[0] fixed, rotate everyone else by one position.
    arr.splice(1, 0, arr.pop());
  }
  return rounds;
}

/**
 * Builds a full-season H2H schedule for `managerIds`. One round-robin
 * cycle covers N-1 gameweeks (for N managers); it repeats to fill the
 * rest of the season, the same way a real round-robin schedule would for
 * a season longer than one full cycle. Returns
 * `[{ gameweek, pairs: [[idA, idB], ...] }, ...]`.
 */
export function generateH2HSchedule(managerIds, seed, totalGameweeks = 38) {
  if (managerIds.length < 2) return [];
  const rounds = circleMethod(seededShuffle(managerIds, seed));
  if (rounds.length === 0) return [];
  const schedule = [];
  for (let gw = 1; gw <= totalGameweeks; gw++) {
    schedule.push({ gameweek: gw, pairs: rounds[(gw - 1) % rounds.length] });
  }
  return schedule;
}

const getNetPoints = (manager) => {
  const raw = manager?.points ?? manager?.gameweekPoints ?? 0;
  const cost = manager?.transferCost ?? manager?.transfersCost ?? manager?.event_transfers_cost ?? 0;
  return raw - cost;
};

/**
 * The FPL-rules H2H table computed from `schedule` + `gameweekTable`
 * (already-fetched per-gameweek net points, same shape league-complete.js
 * emits everywhere else in this app) + `standings` (for each manager's
 * season total — the tiebreak). Only gameweeks actually present in
 * `gameweekTable` count — a future, unplayed fixture just isn't scored
 * yet, same as a real H2H league mid-season.
 */
export function computeH2HStandings(schedule, gameweekTable, standings) {
  const netPointsByGw = new Map();
  gameweekTable.forEach((gw) => {
    const m = new Map();
    (gw.managers || []).forEach((mgr) => m.set(mgr.id, getNetPoints(mgr)));
    netPointsByGw.set(gw.gameweek, m);
  });

  const table = new Map();
  const ensure = (id) => {
    if (!table.has(id)) table.set(id, { managerId: id, wins: 0, draws: 0, losses: 0, played: 0, h2hPoints: 0 });
    return table.get(id);
  };

  schedule.forEach(({ gameweek, pairs }) => {
    const gwPoints = netPointsByGw.get(gameweek);
    if (!gwPoints) return;
    pairs.forEach(([a, b]) => {
      const aPts = gwPoints.get(a);
      const bPts = gwPoints.get(b);
      if (aPts == null || bPts == null) return;
      const rowA = ensure(a);
      const rowB = ensure(b);
      rowA.played += 1;
      rowB.played += 1;
      if (aPts > bPts) {
        rowA.wins += 1; rowA.h2hPoints += 3;
        rowB.losses += 1;
      } else if (bPts > aPts) {
        rowB.wins += 1; rowB.h2hPoints += 3;
        rowA.losses += 1;
      } else {
        rowA.draws += 1; rowA.h2hPoints += 1;
        rowB.draws += 1; rowB.h2hPoints += 1;
      }
    });
  });

  const seasonTotalById = new Map(standings.map((m) => [m.id ?? m.entry, m.totalPoints ?? m.total ?? 0]));

  return [...table.values()]
    .map((row) => ({ ...row, seasonTotal: seasonTotalById.get(row.managerId) ?? 0 }))
    // FPL's own tiebreak: H2H points first, season total points second —
    // never a points-difference/goal-difference equivalent.
    .sort((a, b) => b.h2hPoints - a.h2hPoints || b.seasonTotal - a.seasonTotal);
}

export { getNetPoints };
