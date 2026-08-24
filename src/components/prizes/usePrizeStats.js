import { useMemo } from 'react';
import { prizeStructure, grandTotal } from '../../data/leagueData';

// Every prize figure the Prizes destination shows, computed once from data
// the app already has in state (`gameweekTable` + `standings`) and shared by
// all three segmented views.
//
// This is the distribution math that used to live inside PrizeDistribution's
// own `distributionStats` memo. It moved out unchanged when Monthly Prizes
// and Prize Distribution merged into one destination — the Weekly and Season
// views both need slices of it, and neither should recompute its own.

const netPoints = (manager) => {
  const raw = manager?.gameweekPoints ?? manager?.points ?? 0;
  const cost = manager?.transfersCost ?? manager?.event_transfers_cost ?? manager?.transferCost ?? 0;
  return raw - cost;
};

export const usePrizeStats = ({ gameweekTable = [], standings = [], gameweekInfo = {} }) => {
  const currentGW = gameweekInfo.current || 1;
  const totalGWs = gameweekInfo.total || 38;
  // A weekly prize is only real once FPL marks the gameweek finished — bonus
  // points are still moving before that. `completedGameweeks` has always
  // reflected this; the views just had no way to SAY so, which is how a
  // correct "৳0 paid out" during a live GW1 came to read as a bug.
  const currentGWFinished = !!gameweekInfo.isFinished;

  return useMemo(() => {
    // Weekly prizes distributed
    const completedGameweeks = Math.max(0, currentGW - 1);
    const weeklyDistributed = completedGameweeks * prizeStructure.weekly.perWeek;
    const weeklyProgress = (completedGameweeks / totalGWs) * 100;

    // Monthly prizes distributed
    const monthsCompleted = Math.floor(completedGameweeks / 4);
    const monthlyDistributed = monthsCompleted * 750; // Regular months only
    const monthlyProgress = (monthsCompleted / 9) * 100;

    // Total distribution
    const totalDistributed = weeklyDistributed + monthlyDistributed;
    const remainingPrizes = grandTotal - prizeStructure.season.total - prizeStructure.souvenirs.total - totalDistributed;

    // One pass over gameweekTable produces both the per-gameweek winner list
    // (the Weekly view's roll of honour) and the aggregate wins-per-manager
    // leaderboard — they used to be two separate derivations.
    const weeklyWinners = {};
    const winnersByGameweek = [];

    gameweekTable.forEach((gw) => {
      if (gw.managers && gw.managers.length > 0) {
        const sortedManagers = [...gw.managers].sort((a, b) => netPoints(b) - netPoints(a));

        if (sortedManagers[0]) {
          const winner = sortedManagers[0];
          const winnerId = winner.id || winner.entry;
          const winnerName = winner.managerName || winner.name;
          if (!weeklyWinners[winnerId]) {
            weeklyWinners[winnerId] = { name: winnerName, wins: 0, totalWon: 0 };
          }
          weeklyWinners[winnerId].wins++;
          weeklyWinners[winnerId].totalWon += prizeStructure.weekly.perWeek;

          winnersByGameweek.push({
            gameweek: gw.gameweek,
            name: winnerName,
            teamName: winner.teamName || winner.entry_name,
            points: netPoints(winner),
            runnerUp: sortedManagers[1]
              ? {
                name: sortedManagers[1].managerName || sortedManagers[1].name,
                points: netPoints(sortedManagers[1])
              }
              : null,
            prize: prizeStructure.weekly.perWeek
          });
        }
      }
    });

    const topWeeklyWinners = Object.values(weeklyWinners)
      .sort((a, b) => b.wins - a.wins)
      .slice(0, 5);

    // Season awards — reshaped from data already sitting in `standings`
    // (no extra fetching): who's climbed the most since last gameweek, and
    // who has the best points-per-gameweek average so far.
    const biggestRiser = standings.length > 0
      ? [...standings].sort((a, b) => (b.rankChange || 0) - (a.rankChange || 0))[0]
      : null;

    const bestAverage = completedGameweeks > 0 && standings.length > 0
      ? [...standings].sort((a, b) =>
        (b.totalPoints || 0) / completedGameweeks - (a.totalPoints || 0) / completedGameweeks
      )[0]
      : null;

    return {
      currentGameweek: currentGW,
      currentGameweekFinished: currentGWFinished,
      weeklyDistributed,
      weeklyProgress,
      monthlyDistributed,
      monthlyProgress,
      monthsCompleted,
      totalDistributed,
      remainingPrizes,
      completedGameweeks,
      topWeeklyWinners,
      winnersByGameweek: winnersByGameweek.sort((a, b) => b.gameweek - a.gameweek),
      biggestRiser: biggestRiser?.rankChange > 0 ? biggestRiser : null,
      bestAverage: bestAverage
        ? { ...bestAverage, average: Math.round((bestAverage.totalPoints || 0) / completedGameweeks) }
        : null
    };
  }, [gameweekTable, standings, currentGW, totalGWs, currentGWFinished]);
};

export default usePrizeStats;
