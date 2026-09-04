// api/_lib/prizeConfig.js
//
// A Node-safe duplicate of the season-agnostic parts of
// src/data/leagueData.js (monthly gameweek windows + weekly/monthly prize
// amounts) for use by serverless functions and local scripts.
//
// Why duplicated instead of imported: src/data/leagueData.js reads
// `import.meta.env.VITE_LEAGUE_NAME` at module-eval time — a Vite
// build-time feature that doesn't exist under plain Node, so importing it
// from here throws immediately ("Cannot read properties of undefined")
// rather than silently working. Keep this file's values in sync by hand
// with leagueData.js's `monthlyWindows` / `prizeStructure.weekly` /
// `prizeStructure.monthly` whenever those change.
export const monthlyWindows = [
  { id: 1, name: 'Month 1', start: 1, end: 4 },
  { id: 2, name: 'Month 2', start: 5, end: 8 },
  { id: 3, name: 'Month 3', start: 9, end: 12 },
  { id: 4, name: 'Month 4', start: 13, end: 16 },
  { id: 5, name: 'Month 5', start: 17, end: 20 },
  { id: 6, name: 'Month 6', start: 21, end: 24 },
  { id: 7, name: 'Month 7', start: 25, end: 28 },
  { id: 8, name: 'Month 8', start: 29, end: 32 },
  { id: 9, name: 'Final Month', start: 33, end: 38, isFinal: true },
];

export const weeklyPrize = 30;
export const monthlyRegularPrizes = [350, 250, 150];
export const monthlyFinalPrizes = [500, 400, 250];

/**
 * Given one gameweekTable entry (league-complete.js's shape:
 * `{ gameweek, managers: [{ id, name, managerName, teamName, points,
 * transferCost }] }`), returns that gameweek's net-points winner, or null
 * if there's no manager data. Same ranking `WeeklyPrizes`/`usePrizeStats.js`
 * use client-side: gameweek points minus transfer-cost hits, highest first.
 */
export function getWeeklyWinner(gwEntry) {
  if (!gwEntry?.managers?.length) return null;
  const netPoints = (m) => (m.points || 0) - (m.transferCost || 0);
  const winner = [...gwEntry.managers].sort((a, b) => netPoints(b) - netPoints(a))[0];
  return {
    managerId: winner.id,
    managerName: winner.managerName || winner.name,
    teamName: winner.teamName,
    netPoints: netPoints(winner),
  };
}

/**
 * Given the full gameweekTable and one monthly window `{ start, end }`,
 * sums each manager's net points across every gameweek in that window and
 * returns the top `prizeCount` managers, highest first. Same aggregation
 * MonthlyPrizes.jsx uses client-side.
 */
export function getMonthlyTop(gameweekTable, window, prizeCount) {
  const windowGws = gameweekTable.filter((gw) => gw.gameweek >= window.start && gw.gameweek <= window.end);
  if (windowGws.length === 0) return [];

  const totals = new Map();
  windowGws.forEach((gw) => {
    (gw.managers || []).forEach((m) => {
      const netPoints = (m.points || 0) - (m.transferCost || 0);
      const entry = totals.get(m.id) || {
        managerId: m.id,
        managerName: m.managerName || m.name,
        teamName: m.teamName,
        totalPoints: 0,
      };
      entry.totalPoints += netPoints;
      totals.set(m.id, entry);
    });
  });

  return [...totals.values()]
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .slice(0, prizeCount);
}
