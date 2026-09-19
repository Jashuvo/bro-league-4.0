// src/utils/managerProfile.js
//
// One manager's season, derived entirely from data already in memory when the
// standings table renders (the shaped standings row + `gameweekTable` +
// computeRankHistory's output). Nothing here fetches: the profile sheet opens
// instantly, and — unlike a captain-accuracy stat, which would need a picks
// fetch per manager per gameweek — it costs the league's shared FPL rate
// limit absolutely nothing.
//
// Pure functions, covered by managerProfile.test.js.
import { getNetPoints } from './h2hSchedule';
import { computeRecentForm } from './formGuide';
import { computeRankHistory } from './rankHistory';

// The four chips every manager holds once per half of the season. FPL also
// hands out an Assistant Manager chip in each half, but its behaviour has
// changed between seasons, so the "still holding" list deliberately sticks to
// the four that have been in the game unchanged — under-promising beats
// telling someone they've burned a chip they still have.
export const CLASSIC_CHIPS = ['wildcard', 'freehit', 'bboost', '3xc'];

// FPL's own half-season boundary: GW1-19 is the first half, GW20-38 the
// second. Each half re-issues the chip set, which is why "how many chips
// left" is only answerable relative to a gameweek.
export const HALF_LENGTH = 19;
export const halfOf = (gameweek) => (gameweek > HALF_LENGTH ? 2 : 1);

/** This manager's row in one gameweek, or null if they had no row (e.g. the
 * gameweek predates their entry). */
const rowFor = (gwRow, id) => (gwRow.managers || []).find((m) => m.id === id) || null;

/**
 * Season totals from the gameweek rows: points, hits, transfers, bench.
 * Every point figure is net of transfer hits, matching the rest of the app
 * (LeagueTable's GW column, FormDots, SeasonRecords).
 */
function seasonTotals(rows) {
  return rows.reduce(
    (acc, { gwRow, row }, index) => {
      const net = getNetPoints(row);
      const points = row.points || 0;
      const hits = row.transferCost || 0;
      const gameweek = gwRow.gameweek;

      acc.points += points;
      acc.hits += hits;
      acc.net += net;
      acc.transfers += row.transfers || 0;
      acc.bench += row.benchPoints || 0;

      if (index === 0 || net > acc.best.net) acc.best = { gameweek, points, net, hits };
      if (index === 0 || net < acc.worst.net) acc.worst = { gameweek, points, net, hits };
      if (hits > acc.biggestHit.hits) acc.biggestHit = { gameweek, hits };
      if ((row.benchPoints || 0) > acc.worstBench.points) {
        acc.worstBench = { gameweek, points: row.benchPoints || 0 };
      }

      return acc;
    },
    {
      points: 0,
      hits: 0,
      net: 0,
      transfers: 0,
      bench: 0,
      best: { gameweek: null, points: 0, net: 0, hits: 0 },
      worst: { gameweek: null, points: 0, net: 0, hits: 0 },
      biggestHit: { gameweek: null, hits: 0 },
      worstBench: { gameweek: null, points: 0 },
    }
  );
}

/** Where this manager's league position has been, from the rank trend. */
function positionStats(trend) {
  if (trend.length === 0) return { current: null, best: null, worst: null, change: 0 };
  let best = trend[0];
  let worst = trend[0];
  trend.forEach((point) => {
    if (point.rank < best.rank) best = point;
    if (point.rank > worst.rank) worst = point;
  });
  const current = trend[trend.length - 1];
  return {
    current,
    best,
    worst,
    // Positive = climbed (rank number got smaller).
    change: trend[0].rank - current.rank,
  };
}
/**
 * The full profile object the sheet renders. `rankHistory` is
 * computeRankHistory's whole map when the caller already has it (LeagueTable
 * does) — passing it in saves recomputing; omitted, we compute it here so the
 * function stands alone.
 */
export function buildManagerProfile({
  manager = {},
  gameweekTable = [],
  standings = [],
  rankHistory = null,
} = {}) {
  const id = manager.id ?? manager.entry;
  const played = [];

  gameweekTable.forEach((gwRow) => {
    const row = rowFor(gwRow, id);
    if (row) played.push({ gwRow, row });
  });

  const totals = seasonTotals(played);
  const gameweeksPlayed = played.length;

  const historyMap = rankHistory || computeRankHistory(gameweekTable, standings);
  const trend = historyMap[String(id)] || [];

  const form = computeRecentForm(gameweekTable, id, 5);
  // The same tested trend rule as the dots, run over the whole season, so
  // "weeks above the league average" can't drift from what the dots claim.
  const fullForm = computeRecentForm(gameweekTable, id, gameweekTable.length);

  const chips = (manager.chips || [])
    .map((chip) => ({ name: chip.name, gameweek: chip.event }))
    .sort((a, b) => (a.gameweek || 0) - (b.gameweek || 0));
  const lastHalf = halfOf(trend.length ? trend[trend.length - 1].gw : 1);
  const playedThisHalf = new Set(
    chips.filter((chip) => halfOf(chip.gameweek) === lastHalf).map((chip) => chip.name)
  );

  return {
    id,
    managerName: manager.managerName || manager.player_name || '',
    teamName: manager.teamName || manager.entry_name || '',
    gameweeksPlayed,
    // Season totals (all net of hits, like every other points figure).
    points: totals.points,
    netPoints: totals.net,
    hits: totals.hits,
    transfers: totals.transfers,
    benchPoints: totals.bench,
    averageNet: gameweeksPlayed ? Math.round((totals.net / gameweeksPlayed) * 10) / 10 : 0,
    transfersPerGameweek: gameweeksPlayed
      ? Math.round((totals.transfers / gameweeksPlayed) * 10) / 10
      : 0,
    best: totals.best,
    worst: totals.worst,
    biggestHit: totals.biggestHit,
    worstBench: totals.worstBench,
    position: positionStats(trend),
    rankTrend: trend,
    form,
    // Season-long tally of how often this manager beat the field.
    aboveAverage: {
      above: fullForm.filter((f) => f.trend === 'up').length,
      below: fullForm.filter((f) => f.trend === 'down').length,
      par: fullForm.filter((f) => f.trend === 'flat').length,
    },
    chips: {
      played: chips,
      playedCount: chips.length,
      half: lastHalf,
      holding: CLASSIC_CHIPS.filter((name) => !playedThisHalf.has(name)),
    },
  };
}
