// src/utils/prizeMath.js
//
// The league's prize arithmetic — "which weeks did this manager win, which
// months did they place in, and how much is that worth" — pulled out of
// LeagueTable.jsx verbatim so it can be unit-tested. It used to be two
// near-identical loops (one totalling a manager's winnings, one building the
// breakdown modal) that had to be kept in agreement by eye; a divergence
// between them would show the wrong ৳ total in the standings while the
// breakdown modal disagreed. Now there is one implementation, and
// calculateTotalPrizesWon is literally defined as the sum of the breakdown.
//
// Everything here is pure: the league's config (current gameweek, whether it
// has finished, the monthly windows, the prize amounts) is passed in as
// `ctx` rather than imported, so the tests can drive the exact edge cases —
// unfinished gameweek, month boundary, final month — without touching
// leagueData.js or mocking import.meta.env.

/**
 * A manager's gameweek points with transfer hits deducted — the number the
 * prizes are actually decided on, same as FPL's own "GW points after hits".
 *
 * The fallback chain is deliberately long and uses `||`, not `??`: it was
 * written to survive every shape this data has arrived in over the seasons
 * (`points`/`transferCost` from gameweekTable, `gameweekPoints`/`gameweekHits`
 * from standings, `event_transfers_cost` from FPL's own history rows). Keep
 * it. For the shapes the API emits today it always resolves to
 * `points - transferCost` on the first alternative of each chain.
 */
export const getNetPoints = (manager) => {
  const rawPoints = manager.gameweekPoints || manager.points || 0;
  const transfersCost = manager.transfersCost || manager.event_transfers_cost || manager.transferCost || manager.transfers_cost || manager.penalty || manager.hit || manager.gameweekHits || 0;
  return rawPoints - transfersCost;
};

/**
 * One gameweek's managers, ranked for the weekly prize: only managers who
 * actually scored are eligible (a 0-point gameweek can't be "won"), highest
 * net points first.
 */
const rankGameweek = (gameweekData) => [...(gameweekData?.managers || [])]
  .filter((m) => (m.gameweekPoints || m.points || 0) > 0)
  .sort((a, b) => getNetPoints(b) - getNetPoints(a));

/**
 * Which gameweeks `managerId` won, oldest first.
 *
 * The current gameweek only counts once FPL has finished it (`gwFinished`) —
 * bonus points keep moving until then, so mid-gameweek the leader is not yet
 * a winner and the prize is not yet real.
 */
export function collectWeeklyWins(gameweekTable, managerId, { currentGW, gwFinished, perWeekPrize }) {
  const wins = [];
  if (!gameweekTable?.length) return wins;

  const lastCompletedGW = gwFinished ? currentGW : currentGW - 1;
  for (let gw = 1; gw <= lastCompletedGW; gw++) {
    const gameweekData = gameweekTable.find((g) => g.gameweek === gw);
    if (!gameweekData?.managers) continue;

    const ranked = rankGameweek(gameweekData);
    const rank = ranked.findIndex((m) => m.id === managerId) + 1;
    if (rank === 1) {
      wins.push({ gameweek: gw, points: getNetPoints(ranked[0]), prize: perWeekPrize });
    }
  }
  return wins;
}

/**
 * Which monthly windows `managerId` placed in the top 3 of, in window order.
 *
 * A month only counts once its LAST gameweek has actually finished — not
 * merely once we've reached it. `currentGW === month.end` mid-gameweek is
 * still in play, so its monthly prize is not yet won (this is the same
 * "bonus points are still moving" rule as the weekly prizes, and it matches
 * the ৳0-with-a-reason state the prize tiles show).
 */
export function collectMonthlyWins(gameweekTable, managerId, { currentGW, gwFinished, monthlyWindows, prizeStructure }) {
  const wins = [];
  if (!gameweekTable?.length) return [];

  monthlyWindows.forEach((month) => {
    const isMonthFinished = currentGW > month.end || (currentGW === month.end && gwFinished);
    if (!isMonthFinished) return;

    const scores = {};
    gameweekTable
      .filter((gw) => gw.gameweek >= month.start && gw.gameweek <= month.end)
      .forEach((gw) => {
        gw.managers?.forEach((manager) => {
          if (!scores[manager.id]) scores[manager.id] = 0;
          scores[manager.id] += getNetPoints(manager);
        });
      });

    // `id == managerId` (loose) on purpose: the score map is keyed by
    // whatever the API used (string ids), while the caller may pass a number.
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const rank = sorted.findIndex(([id]) => id == managerId) + 1;
    if (rank >= 1 && rank <= 3) {
      const prizes = month.isFinal ? prizeStructure.monthly.finalMonth : prizeStructure.monthly.regularPrizes;
      wins.push({ month: month.id, position: rank, points: scores[managerId], prize: prizes[rank - 1] });
    }
  });
  return wins;
}

/**
 * A manager's full prize breakdown: which gameweeks they won, which months
 * they placed in, and the ৳ total. Shape is what the Prize breakdown modal
 * (LeagueTable's `selectedPrizeManager`) renders.
 */
export function calculatePrizeBreakdown(gameweekTable, managerId, ctx) {
  if (!gameweekTable?.length) return { weeklyWins: [], monthlyWins: [], totalPrizes: 0 };

  const weeklyWins = collectWeeklyWins(gameweekTable, managerId, ctx);
  const monthlyWins = collectMonthlyWins(gameweekTable, managerId, ctx);
  const totalPrizes = weeklyWins.reduce((sum, w) => sum + w.prize, 0) +
    monthlyWins.reduce((sum, w) => sum + w.prize, 0);

  return { weeklyWins, monthlyWins, totalPrizes };
}

/**
 * The ৳ figure shown next to a manager in the standings — by definition the
 * total of their breakdown above, so the two can never drift apart.
 */
export function calculateTotalPrizesWon(gameweekTable, managerId, ctx) {
  return calculatePrizeBreakdown(gameweekTable, managerId, ctx).totalPrizes;
}
