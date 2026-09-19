// api/_lib/leagueShape.js
//
// The pure reshape half of api/league-complete.js, extracted so it can be
// unit-tested (same reasoning that put prizeConfig.js here before it).
// Everything in this file is deterministic data-shaping: no fetches, no
// env, no KV — hand it what the FPL API returned, it hands back the
// response payload league-complete.js caches and serves.
//
// Why bother: the reshaper is where real production bugs have lived
// (overall-rank vs league-rank, stale current-gameweek points from
// /history/) and none of it was testable while it lived inline in the
// handler. See leagueShape.test.js for the regression coverage this
// extraction buys.

// Cap on how much per-manager detail gets fetched. Standings above this
// cut are still counted in totalManagers but won't have per-manager
// history/chips data.
export const MAX_MANAGERS = 20;

/** Net-of-hits points for one gameweekTable manager row. */
export const getNetPoints = (m) => (m.points || 0) - (m.transferCost || 0);

/** "N pts avg" across a manager's last five played gameweeks — net of
 * transfer hits, like every other points figure in the app. Returns
 * 'N/A' until at least one gameweek exists. */
export function formSummary(currentSeasonRows) {
  const rows = currentSeasonRows || [];
  if (rows.length === 0) return 'N/A';
  const last = rows.slice(-5);
  const total = last.reduce((sum, gw) => sum + ((gw.points || 0) - (gw.event_transfers_cost || 0)), 0);
  return `${Math.round(total / last.length)} pts avg`;
}

/**
 * Shapes one FPL classic-standings row into the manager object the
 * frontend's `standings` arrays are built from.
 *
 * `historyData` is that manager's /entry/{id}/history/ payload (or null
 * if that fetch failed). The classic-standings row carries the manager
 * name, team name and this gameweek's points/total, but NOT the transfer
 * hits, transfer count or overall rank — those come from the current
 * gameweek's row inside /history/ (the old fan-out fetched /entry/{id}
 * per manager just for `summary_overall_rank` + names; one fewer fetch
 * per manager, same data, with the only trade-off being that overall
 * rank rides FPL's /history/ snapshot refresh rather than the /entry/
 * endpoint — indistinguishable in practice, see the staleness notes in
 * league-complete.js).
 */
export function shapeManager(entry, historyData, currentGameweek) {
  const currentHistoryRow = historyData?.currentSeason?.find((h) => h.event === currentGameweek);
  const lastHistoryRow = historyData?.currentSeason?.[historyData.currentSeason.length - 1];

  return {
    id: entry.entry,
    // The classic-standings row carries the manager's name (the old
    // fan-out reassembled it from /entry/{id}'s first+last name) — no
    // per-manager fetch needed for it.
    managerName: entry.player_name || `Manager ${entry.entry}`,
    teamName: entry.entry_name || 'Unknown Team',
    totalPoints: entry.total,
    gameweekPoints: entry.event_total || 0,
    // This gameweek's hits/transfers — only /history/ has them.
    gameweekHits: currentHistoryRow?.event_transfers_cost || 0,
    gameweekTransfers: currentHistoryRow?.event_transfers || 0,
    rank: entry.rank,
    lastRank: entry.last_rank,
    rankChange: (entry.last_rank || entry.rank) - entry.rank,
    form: formSummary(historyData?.currentSeason),
    // Kept for frontend compatibility with the old shape.
    avgPoints: 0,
    overallRank: currentHistoryRow?.overall_rank || 0,
    // Drill-downs (manager-history / team-picks endpoints) carry the deep
    // data on demand; hasData just reports whether /history/ came back.
    hasData: !!historyData,
    chips: historyData?.chips || [],
    // FPL reports these in tenths of a million (pence-style); the
    // /history/ reshape in league-complete.js divides by 10 before this
    // point, so they're already £m here (100.3, not 1003).
    bankValue: lastHistoryRow?.bank || 0,
    teamValue: lastHistoryRow?.value || 100
  };
}

/**
 * Builds the per-gameweek table from the standings rows + each manager's
 * /history/ `current` rows. `historyByManager` maps manager id → array of
 * FPL history rows (`{ event, points, total_points, overall_rank,
 * event_transfers, event_transfers_cost, points_on_bench }`).
 *
 * `liveBenchByManager` (optional) maps manager id → recomputed live bench
 * points for the current gameweek (league-complete.js recomputes this from
 * picks + live stats while the GW isn't final — see its comments for why
 * /history/'s snapshot can't be trusted for the live GW row).
 */
export function buildGameweekTable(
  standings,
  historyByManager,
  { currentGameweek, currentGwIsFinal, liveBenchByManager } = {}
) {
  // The longest per-manager history decides how many gameweek rows exist.
  let maxGameweek = 0;
  historyByManager.forEach((rows) => {
    if (rows?.length > maxGameweek) maxGameweek = rows.length;
  });

  const table = [];
  for (let gw = 1; gw <= maxGameweek; gw++) {
    const managers = [];

    standings.forEach((entry) => {
      const gwHistory = historyByManager.get(entry.entry)?.find((h) => h.event === gw);
      if (!gwHistory) return;

      // This row is the live, in-progress gameweek — prefer the live
      // standings figures (and the caller's recomputed bench points)
      // over the /history/ snapshot for it.
      const isLiveCurrentGw = gw === currentGameweek && !currentGwIsFinal;
      const liveRow = isLiveCurrentGw ? entry : null;

      managers.push({
        id: entry.entry,
        name: entry.entry_name || entry.player_name,
        managerName: entry.player_name || entry.entry_name,
        teamName: entry.entry_name,
        points: liveRow ? (liveRow.event_total ?? gwHistory.points) : gwHistory.points,
        totalPoints: liveRow ? (liveRow.total ?? gwHistory.total_points) : gwHistory.total_points,
        // FPL's GLOBAL overall rank, not the mini-league rank — kept under
        // the same key the old fan-out used, and deliberately never used
        // for prize ranking (see getInLeagueRanks in prizeConfig.js).
        // /history/ is its only source (the standings row doesn't carry an
        // overall rank), even for the live current gameweek.
        rank: gwHistory.overall_rank,
        transfers: gwHistory.event_transfers,
        transferCost: gwHistory.event_transfers_cost,
        benchPoints: isLiveCurrentGw && liveBenchByManager?.get(entry.entry) != null
          ? liveBenchByManager.get(entry.entry)
          : gwHistory.points_on_bench
      });
    });

    if (managers.length === 0) continue;

    managers.sort((a, b) => b.points - a.points);
    table.push({
      gameweek: gw,
      managers,
      winner: managers[0]?.name || 'N/A',
      highestScore: managers[0]?.points || 0,
      averageScore: Math.round(
        managers.reduce((sum, m) => sum + m.points, 0) / managers.length
      )
    });
  }

  return table;
}

/**
 * League-wide aggregates for the standings cards. `standings` is the
 * already-shaped manager array; `totalManagers` is the UNTRUNCATED count
 * from the standings page (the league can have more members than we fetch
 * detail for).
 */
export function buildLeagueStats(standings, totalManagers) {
  const managerCount = standings.length;
  if (managerCount === 0) {
    return {
      totalManagers,
      averageScore: 0,
      highestTotal: 0,
      lowestTotal: 0,
      averageGameweekScore: 0,
      highestGameweekScore: 0,
      totalChipsUsed: 0,
      averageTeamValue: 0
    };
  }

  return {
    totalManagers,
    averageScore: Math.round(
      standings.reduce((sum, m) => sum + m.totalPoints, 0) / managerCount
    ),
    highestTotal: Math.max(...standings.map((m) => m.totalPoints)),
    lowestTotal: Math.min(...standings.map((m) => m.totalPoints)),
    averageGameweekScore: Math.round(
      standings.reduce((sum, m) => sum + m.gameweekPoints, 0) / managerCount
    ),
    highestGameweekScore: Math.max(...standings.map((m) => m.gameweekPoints)),
    totalChipsUsed: standings.reduce((sum, m) => sum + (m.chips?.length || 0), 0),
    averageTeamValue: Math.round(
      standings.reduce((sum, m) => sum + m.teamValue, 0) / managerCount * 10
    ) / 10
  };
}