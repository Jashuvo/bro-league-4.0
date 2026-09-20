// src/utils/seasonCompare.js
//
// "Same gameweek, last season" — compares the CURRENT season's cumulative
// standings at the latest captured gameweek against the PREVIOUS archived
// season's standings at that same gameweek number. Data source is the
// season archive itself (season_archive.total_standing rows — one row per
// manager per gameweek, written daily by api/warm-cache.js), so both sides
// of the comparison are the same kind of number: FPL's official
// cumulative total_points, net of nothing extra (hits are already net in
// gameweekTable before the archive snapshots it).
//
// Pure functions, unit-tested in seasonCompare.test.js: no fetching, no
// component code.
//
// Reality check this is built around: the archive only captures per-GW
// detail from the moment it was switched on (last season's per-GW detail
// was lost before the archive existed — see api/warm-cache.js's comment).
// So this comparison is honestly unavailable until a SECOND season has
// been captured — `available: false` with a reason, never fake numbers.

/**
 * Build the comparison. `seasonArchive` is the raw season_archive row
 * array (any mix of categories/seasons — filtered internally). Returns:
 *
 *  - available: false, reason: 'no-previous-season' — nothing older than
 *    the live season has any total_standing rows yet
 *  - available: false, reason: 'previous-season-incomplete' — the previous
 *    season exists but has no standings snapshot at the gameweek number
 *    being compared (can't line up "same time last season")
 *  - available: true — `rows` sorted by current-season rank, each carrying
 *    both totals and the point delta (positive = ahead of last season)
 */
export function buildSeasonComparison({ seasonArchive = [], currentSeason, standings = [] }) {
  const standingRows = seasonArchive.filter((r) => r.category === 'total_standing');

  const seasons = [...new Set(standingRows.map((r) => r.season))].sort((a, b) => b.localeCompare(a));
  const previousSeason = seasons.find((s) => s !== currentSeason);

  if (!previousSeason) {
    return { available: false, reason: 'no-previous-season', rows: [] };
  }

  const currentByGw = groupByPeriod(standingRows.filter((r) => r.season === currentSeason));
  const previousByGw = groupByPeriod(standingRows.filter((r) => r.season === previousSeason));

  // Compare at the latest gameweek the CURRENT season has captured — the
  // point of the feature is "where we are now vs. the same point last time".
  const gameweek = Math.max(0, ...currentByGw.keys());
  const previousRows = previousByGw.get(gameweek);

  if (gameweek === 0 || !previousRows) {
    return { available: false, reason: 'previous-season-incomplete', gameweek, rows: [] };
  }

  // Current team name comes from the LIVE standings when the manager is
  // still in the league (names change — same overlay the archive sheet
  // already applies); archived names otherwise.
  const currentNameById = new Map(
    standings.map((m) => [Number(m.id ?? m.entry), m.managerName || m.player_name || `Manager ${m.id ?? m.entry}`])
  );
  const previousById = new Map(previousRows.map((r) => [Number(r.manager_id), r]));

  const rows = currentByGw.get(gameweek)
    .map((cur) => {
      const prev = previousById.get(Number(cur.manager_id));
      return {
        managerId: cur.manager_id,
        name: currentNameById.get(Number(cur.manager_id)) || cur.manager_name,
        teamName: cur.team_name,
        currentTotal: cur.total_points,
        currentRank: cur.final_rank,
        previousTotal: prev ? prev.total_points : null,
        previousRank: prev ? prev.final_rank : null,
        delta: prev && cur.total_points != null ? cur.total_points - prev.total_points : null,
        isNew: !prev, // joined (or rejoined) since last season
      };
    })
    // Managers present last season first, ranked by where they sit now;
    // new managers trail at the bottom rather than sorting as 0 points.
    .sort((a, b) => {
      if (a.isNew !== b.isNew) return a.isNew ? 1 : -1;
      return (a.currentRank ?? 999) - (b.currentRank ?? 999);
    });

  return { available: true, gameweek, currentSeason, previousSeason, rows };
}

/** season_archive.total_standing rows → Map(period → rows at that GW). */
function groupByPeriod(rows) {
  const map = new Map();
  rows.forEach((r) => {
    if (r.period == null) return;
    if (!map.has(r.period)) map.set(r.period, []);
    map.get(r.period).push(r);
  });
  return map;
}
