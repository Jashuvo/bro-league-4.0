// src/utils/seasonRecords.js
//
// Season-long ranked boards computed from data the app already has
// (gameweekTable + standings) — the "records" counterpart to
// SeasonAwards' one-manager superlatives. Pure functions, unit-tested in
// seasonRecords.test.js: no fetching, no component code.
import { getNetPoints } from './h2hSchedule';

const nameOf = (standingsRow) => standingsRow?.managerName || standingsRow?.player_name || `Manager ${standingsRow?.id}`;

/** The gameweek winner per GW row — net of hits, same ranking everywhere. */
function winnerOf(gw) {
  if (!gw?.managers?.length) return null;
  return [...gw.managers].sort((a, b) => getNetPoints(b) - getNetPoints(a))[0];
}

/**
 * All boards at once, from `gameweekTable` (league-complete.js's shape:
 * `{ gameweek, managers: [{ id, name, points, transferCost, transfers,
 * benchPoints }] }`) + `standings` (for display names). Boards:
 *
 *  - weeklyWins:   how many gameweeks each manager topped (net points)
 *  - mostTransfers: season transfer count (activity, not quality)
 *  - consistency:  standard deviation of net points, most consistent
 *                  (lowest) first, managers with ≥ 4 gameweeks only
 *  - benchStrength: season total of points left on the bench
 */
export function computeSeasonRecords(gameweekTable = [], standings = []) {
  const byId = Object.fromEntries(standings.map((m) => [String(m.id ?? m.entry), m]));
  const displayName = (id) => nameOf(byId[String(id)]);

  // ── weekly wins ──
  const wins = new Map();
  gameweekTable.forEach((gw) => {
    const winner = winnerOf(gw);
    if (!winner) return;
    wins.set(winner.id, (wins.get(winner.id) || 0) + 1);
  });
  const weeklyWins = [...wins.entries()]
    .map(([id, count]) => ({ id, name: displayName(id), value: count }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name))
    .slice(0, 5);

  // ── transfers / bench / consistency accumulators ──
  const transfers = new Map();
  const bench = new Map();
  const netScores = new Map(); // id → array of per-GW net points

  gameweekTable.forEach((gw) => {
    (gw.managers || []).forEach((m) => {
      transfers.set(m.id, (transfers.get(m.id) || 0) + (m.transfers || 0));
      bench.set(m.id, (bench.get(m.id) || 0) + (m.benchPoints || 0));
      if (!netScores.has(m.id)) netScores.set(m.id, []);
      netScores.get(m.id).push(getNetPoints(m));
    });
  });

  const mostTransfers = [...transfers.entries()]
    .filter(([, count]) => count > 0)
    .map(([id, count]) => ({ id, name: displayName(id), value: count }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name))
    .slice(0, 5);

  const benchStrength = [...bench.entries()]
    .filter(([, total]) => total > 0)
    .map(([id, total]) => ({ id, name: displayName(id), value: total }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name))
    .slice(0, 5);

  // Population standard deviation over per-GW net points; at least four
  // gameweeks before one lucky week can masquerade as "consistency".
  const MIN_GWS_FOR_CONSISTENCY = 4;
  const consistency = [...netScores.entries()]
    .filter(([, scores]) => scores.length >= MIN_GWS_FOR_CONSISTENCY)
    .map(([id, scores]) => {
      const mean = scores.reduce((s, v) => s + v, 0) / scores.length;
      const variance = scores.reduce((s, v) => s + (v - mean) ** 2, 0) / scores.length;
      return { id, name: displayName(id), value: Math.round(Math.sqrt(variance) * 10) / 10 };
    })
    .sort((a, b) => a.value - b.value || a.name.localeCompare(b.name))
    .slice(0, 5);

  return { weeklyWins, mostTransfers, consistency, benchStrength };
}