// src/utils/rankHistory.js
//
// Derives each manager's league-position history purely from the
// `gameweekTable` the app already has in state (cumulative net points per
// gameweek, ranked against the rest of the league) — no extra API calls.
// Used for the rank-trend sparkline and the Season Awards "movers" stats.

export function computeRankHistory(gameweekTable = []) {
  const cumulative = {}; // managerId -> running net total
  const history = {}; // managerId -> [{ gw, rank, total }], oldest first

  const sortedGws = [...gameweekTable].sort((a, b) => a.gameweek - b.gameweek);

  sortedGws.forEach((gw) => {
    (gw.managers || []).forEach((m) => {
      const net = (m.points || 0) - (m.transferCost || 0);
      const id = String(m.id);
      cumulative[id] = (cumulative[id] || 0) + net;
    });

    const ranked = Object.entries(cumulative).sort((a, b) => b[1] - a[1]);
    ranked.forEach(([id, total], index) => {
      if (!history[id]) history[id] = [];
      history[id].push({ gw: gw.gameweek, rank: index + 1, total });
    });
  });

  return history;
}
