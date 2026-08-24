import React, { useMemo } from 'react';
import { DollarSign, Star, TrendingUp, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import Card from './ui/Card';
import Badge from './ui/Badge';
import SectionBanner from './ui/SectionBanner';
import {
  Coins, TrophyCup, Whistle, CalendarDoodle, Jersey, Medal
} from './ui/Doodles';
import { prizeStructure, grandTotal } from '../data/leagueData';

const PrizeDistribution = ({ gameweekInfo = {}, standings = [], gameweekTable = [] }) => {
  const currentGW = gameweekInfo.current || 1;
  const totalGWs = gameweekInfo.total || 38;

  // Calculate distribution stats
  const distributionStats = useMemo(() => {
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

    // Calculate top weekly winners
    const weeklyWinners = {};
    gameweekTable.forEach(gw => {
      if (gw.managers && gw.managers.length > 0) {
        const sortedManagers = [...gw.managers]
          .sort((a, b) => {
            const aNet = (a.gameweekPoints || a.points || 0) - (a.transfersCost || a.event_transfers_cost || 0);
            const bNet = (b.gameweekPoints || b.points || 0) - (b.transfersCost || b.event_transfers_cost || 0);
            return bNet - aNet;
          });

        if (sortedManagers[0]) {
          const winnerId = sortedManagers[0].id || sortedManagers[0].entry;
          const winnerName = sortedManagers[0].managerName || sortedManagers[0].name;
          if (!weeklyWinners[winnerId]) {
            weeklyWinners[winnerId] = { name: winnerName, wins: 0, totalWon: 0 };
          }
          weeklyWinners[winnerId].wins++;
          weeklyWinners[winnerId].totalWon += 30;
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
      weeklyDistributed,
      weeklyProgress,
      monthlyDistributed,
      monthlyProgress,
      totalDistributed,
      remainingPrizes,
      completedGameweeks,
      topWeeklyWinners,
      biggestRiser: biggestRiser?.rankChange > 0 ? biggestRiser : null,
      bestAverage: bestAverage ? { ...bestAverage, average: Math.round((bestAverage.totalPoints || 0) / completedGameweeks) } : null
    };
  }, [gameweekTable, standings, currentGW, totalGWs, grandTotal, prizeStructure]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      {/* Header Banner */}
      <SectionBanner
        tone="violet"
        art={<Coins size={20} />}
        title="Prize Distribution"
        subtitle={`৳${grandTotal.toLocaleString()} total prize pool`}
        actions={
          <Badge variant="gold" className="px-3 py-1.5 text-sm">
            <DollarSign size={14} />
            ৳{distributionStats.totalDistributed.toLocaleString()} Distributed
          </Badge>
        }
        stats={[
          { value: `৳${distributionStats.weeklyDistributed}`, label: 'Weekly Prizes', sublabel: 'Distributed' },
          { value: `৳${distributionStats.monthlyDistributed}`, label: 'Monthly Prizes', sublabel: 'Distributed' },
          { value: `৳${distributionStats.remainingPrizes}`, label: 'Remaining', sublabel: 'To be won' },
          { value: `${Math.round((distributionStats.totalDistributed / grandTotal) * 100)}%`, label: 'Completed', sublabel: 'Season progress' },
        ]}
      />

      {/* Season End Prizes */}
      <motion.div variants={itemVariants}>
        <Card>
          <div className="flex items-center justify-between gap-3 mb-6">
            <h3 className="text-xl font-display font-bold text-ink flex items-center gap-2">
              <TrophyCup size={26} />
              Season End Championships
            </h3>
            <Badge variant="gold">৳{prizeStructure.season.total}</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {prizeStructure.season.prizes.map((prize) => (
              <div
                key={prize.position}
                className="rounded-2xl p-5 bg-surface-sunk border-2 border-ink/85 shadow-card"
              >
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Medal size={36} tone={prize.tone} className="shrink-0" />
                    <div className="min-w-0">
                      <div className="font-display font-bold text-ink truncate">{prize.label}</div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">Position #{prize.position}</div>
                    </div>
                  </div>
                  <div className={`text-xl font-display font-bold shrink-0 ${prize.color}`}>
                    ৳{prize.amount}
                  </div>
                </div>

                {/* Current leader for this position */}
                {standings[prize.position - 1] && (
                  <div className="p-3 rounded-xl bg-surface-alt border-2 border-ink/15">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-ink-soft mb-0.5">Current Leader</div>
                    <div className="font-bold text-ink truncate">
                      {standings[prize.position - 1].managerName || standings[prize.position - 1].player_name}
                    </div>
                    <div className="text-sm font-bold text-violet-ink">
                      {(standings[prize.position - 1].totalPoints || standings[prize.position - 1].total)?.toLocaleString()} pts
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Weekly & Monthly Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weekly Prizes */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <div className="flex items-center justify-between gap-3 mb-6">
              <h3 className="text-xl font-display font-bold text-ink flex items-center gap-2">
                <Whistle size={26} />
                Weekly
              </h3>
              <Badge variant="info">৳{prizeStructure.weekly.total}</Badge>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-sky/12 border-2 border-ink/15 p-4 rounded-2xl text-center">
                  <div className="text-2xl font-display font-bold text-sky-ink">৳{prizeStructure.weekly.perWeek}</div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">Per Week</div>
                </div>
                <div className="bg-surface-sunk border-2 border-ink/15 p-4 rounded-2xl text-center">
                  <div className="text-2xl font-display font-bold text-ink">{distributionStats.completedGameweeks}</div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">GWs Done</div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm font-bold mb-2">
                  <span className="text-ink-soft">Progress</span>
                  <span className="text-sky-ink">{Math.round(distributionStats.weeklyProgress)}%</span>
                </div>
                <div className="h-3 bg-surface-sunk rounded-full border-2 border-ink/85 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${distributionStats.weeklyProgress}%` }}
                    className="h-full bg-sky"
                  />
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Monthly Prizes */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <div className="flex items-center justify-between gap-3 mb-6">
              <h3 className="text-xl font-display font-bold text-ink flex items-center gap-2">
                <CalendarDoodle size={26} />
                Monthly
              </h3>
              <Badge variant="success">৳{prizeStructure.monthly.total}</Badge>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-pitch/12 border-2 border-ink/15 p-4 rounded-2xl text-center">
                  <div className="text-2xl font-display font-bold text-pitch-ink">৳750</div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">Per Month</div>
                </div>
                <div className="bg-surface-sunk border-2 border-ink/15 p-4 rounded-2xl text-center">
                  <div className="text-2xl font-display font-bold text-ink">{Math.floor(distributionStats.completedGameweeks / 4)}</div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">Months Done</div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm font-bold mb-2">
                  <span className="text-ink-soft">Progress</span>
                  <span className="text-pitch-ink">{Math.round(distributionStats.monthlyProgress)}%</span>
                </div>
                <div className="h-3 bg-surface-sunk rounded-full border-2 border-ink/85 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${distributionStats.monthlyProgress}%` }}
                    className="h-full bg-pitch"
                  />
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Season Awards */}
      {(distributionStats.topWeeklyWinners[0] || distributionStats.biggestRiser || distributionStats.bestAverage) && (
        <motion.div variants={itemVariants}>
          <Card>
            <h3 className="text-xl font-display font-bold text-ink flex items-center gap-2 mb-6">
              <TrophyCup size={26} />
              Season Awards
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {distributionStats.topWeeklyWinners[0] && (
                <AwardCard
                  icon={Star}
                  color="text-violet-ink"
                  bgColor="bg-violet/15"
                  title="Most Weekly Wins"
                  name={distributionStats.topWeeklyWinners[0].name}
                  detail={`${distributionStats.topWeeklyWinners[0].wins} gameweek win${distributionStats.topWeeklyWinners[0].wins !== 1 ? 's' : ''}`}
                />
              )}
              {distributionStats.biggestRiser && (
                <AwardCard
                  icon={TrendingUp}
                  color="text-pitch-ink"
                  bgColor="bg-pitch/15"
                  title="Biggest Riser"
                  name={distributionStats.biggestRiser.managerName || distributionStats.biggestRiser.player_name}
                  detail={`Up ${distributionStats.biggestRiser.rankChange} place${distributionStats.biggestRiser.rankChange !== 1 ? 's' : ''} since last GW`}
                />
              )}
              {distributionStats.bestAverage && (
                <AwardCard
                  icon={Activity}
                  color="text-sky-ink"
                  bgColor="bg-sky/15"
                  title="Best Average"
                  name={distributionStats.bestAverage.managerName || distributionStats.bestAverage.player_name}
                  detail={`${distributionStats.bestAverage.average} pts/GW`}
                />
              )}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Top Weekly Winners */}
      {distributionStats.topWeeklyWinners.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card>
            <h3 className="text-xl font-display font-bold text-ink flex items-center gap-2 mb-6">
              <Star className="text-violet-ink fill-violet" size={24} />
              Top Weekly Winners
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {distributionStats.topWeeklyWinners.map((winner, index) => (
                <div key={index} className="bg-surface-sunk rounded-2xl p-4 flex items-center justify-between gap-2 border-2 border-ink/15">
                  <div className="flex items-center gap-3 min-w-0">
                    <Jersey size={34} number={index + 1} tone={index === 0 ? 'fill-sunflower' : 'fill-violet'} className="shrink-0" />
                    <div className="min-w-0">
                      <div className="font-bold text-ink truncate">{winner.name}</div>
                      <div className="text-xs font-semibold text-ink-soft">{winner.wins} wins</div>
                    </div>
                  </div>
                  <div className="text-pitch-ink font-display font-bold shrink-0">৳{winner.totalWon}</div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Souvenirs */}
      <motion.div variants={itemVariants}>
        <Card>
          <div className="flex items-center justify-between gap-3 mb-6">
            <h3 className="text-xl font-display font-bold text-ink flex items-center gap-2">
              <Jersey size={26} tone="fill-bubblegum" />
              Souvenirs &amp; Swag
            </h3>
            <Badge variant="accent">৳{prizeStructure.souvenirs.total}</Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {prizeStructure.souvenirs.items.map((item, index) => (
              <div key={index} className="bg-surface-sunk rounded-2xl p-4 text-center border-2 border-ink/15">
                <div className="flex justify-center mb-2">
                  {index === 0 ? <Jersey size={38} tone="fill-coral" />
                    : index === 1 ? <Medal size={38} tone="fill-sky" />
                      : index === 2 ? <Medal size={38} tone="fill-mint" />
                        : <TrophyCup size={38} />}
                </div>
                <div className="text-sm font-bold text-ink">{item}</div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};

const AwardCard = ({ icon: Icon, color, bgColor, title, name, detail }) => (
  <div className="bg-surface-sunk rounded-2xl p-4 flex items-center gap-3 border-2 border-ink/15">
    <div className={`w-11 h-11 rounded-2xl ${bgColor} border-2 border-ink/85 flex items-center justify-center flex-shrink-0`}>
      <Icon className={color} size={20} />
    </div>
    <div className="min-w-0">
      <div className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">{title}</div>
      <div className="font-display font-bold text-ink truncate">{name}</div>
      <div className={`text-xs font-bold ${color}`}>{detail}</div>
    </div>
  </div>
);

export default PrizeDistribution;