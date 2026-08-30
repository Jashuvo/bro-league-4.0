// src/utils/rankHistory.js
//
// Derives each manager's league-position history purely from the
// `gameweekTable` the app already has in state (cumulative net points per
// gameweek, ranked against the rest of the league) — no extra API calls.
// Used for the rank-trend sparkline and the Season Awards "movers" stats.

export function computeRankHistory(gameweekTable = [], standings = []) {
  const cumulative = {}; // managerId -> running net total
  const history = {}; // managerId -> [{ gw, rank, total }], oldest first

  // FPL's own standings order is the authoritative tie-break for two
  // managers level on points (it accounts for whatever rule FPL actually
  // uses — total transfers, entry id, join order, none of which we can see
  // ourselves) — without this, two managers tied on cumulative points get
  // ordered by nothing more meaningful than object-insertion order, which
  // can (and did) disagree with the manager's real, currently-displayed
  // league position: the trend line's own final dot said someone was 3rd
  // the same moment the table above it said they were 2nd. Falling back
  // to a tie-break of `Infinity` for anyone missing from `standings` just
  // pushes them after every manager FPL did rank, rather than crashing.
  const standingsOrder = {};
  standings.forEach((m, index) => {
    standingsOrder[String(m.id || m.entry)] = index;
  });

  const sortedGws = [...gameweekTable].sort((a, b) => a.gameweek - b.gameweek);

  sortedGws.forEach((gw) => {
    (gw.managers || []).forEach((m) => {
      const net = (m.points || 0) - (m.transferCost || 0);
      const id = String(m.id);
      cumulative[id] = (cumulative[id] || 0) + net;
    });

    const ranked = Object.entries(cumulative).sort(([idA, totalA], [idB, totalB]) => {
      if (totalB !== totalA) return totalB - totalA;
      const orderA = standingsOrder[idA] ?? Infinity;
      const orderB = standingsOrder[idB] ?? Infinity;
      return orderA - orderB;
    });
    ranked.forEach(([id, total], index) => {
      if (!history[id]) history[id] = [];
      history[id].push({ gw: gw.gameweek, rank: index + 1, total });
    });
  });

  return history;
}
