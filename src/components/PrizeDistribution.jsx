// src/components/PrizeDistribution.jsx - Updated with Theme Support & Animations
import React, { useMemo } from 'react';
import {
  DollarSign, Trophy, Calendar, Zap, Target, Gift, Award, Crown, Medal,
  TrendingUp, Users, Clock, Star, PieChart
} from 'lucide-react';
import { motion } from 'framer-motion';

const PrizeDistribution = ({ gameweekInfo = {}, standings = [], gameweekTable = [] }) => {
  const currentGW = gameweekInfo.current || 3;
  const totalGWs = gameweekInfo.total || 38;

  // Prize structure
  const prizeStructure = {
    season: {
      total: 1800,
      prizes: [
        { position: 1, amount: 800, emoji: '🥇', color: 'text-yellow-500', label: 'Champion' },
        { position: 2, amount: 600, emoji: '🥈', color: 'text-gray-400', label: 'Runner-up' },
        { position: 3, amount: 400, emoji: '🥉', color: 'text-orange-500', label: 'Third Place' }
      ]
    },
    weekly: {
      perWeek: 30,
      totalWeeks: 38,
      total: 1140 // 38 * 30
    },
    monthly: {
      regularMonths: 8,
      regularPrizes: [350, 250, 150], // per month
      finalMonth: [500, 400, 250],
      total: 7150 // (8 * 750) + 1150
    },
    souvenirs: {
      total: 1910,
      items: ['BRO League Jerseys', 'Certificates', 'Digital Badges', 'Trophy for Champion']
    }
  };

  const grandTotal = 12000; // Total entry fees

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

    return {
      weeklyDistributed,
      weeklyProgress,
      monthlyDistributed,
      monthlyProgress,
      totalDistributed,
      remainingPrizes,
      completedGameweeks,
      topWeeklyWinners
    };
  }, [gameweekTable, currentGW, totalGWs, grandTotal, prizeStructure]);

  // Position styling
  const getPositionStyling = (position) => {
    if (position === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 shadow-lg shadow-yellow-500/20';
    if (position === 2) return 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-900 shadow-lg shadow-gray-500/20';
    if (position === 3) return 'bg-gradient-to-r from-orange-400 to-orange-500 text-orange-900 shadow-lg shadow-orange-500/20';
    return 'bg-base-300 text-base-content border border-base-content/10';
  };

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
      className="bg-base-100 rounded-xl shadow-lg border border-base-content/10 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <PieChart size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Prize Distribution</h2>
              <p className="text-purple-100">
                ৳{grandTotal.toLocaleString()} Total Prize Pool • GW {currentGW} of {totalGWs}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-full backdrop-blur-sm">
            <DollarSign size={16} />
            <span className="text-sm">৳{distributionStats.totalDistributed.toLocaleString()} Distributed</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm border border-white/10">
            <div className="text-2xl font-bold">৳{distributionStats.weeklyDistributed}</div>
            <div className="text-sm opacity-80">Weekly Prizes</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm border border-white/10">
            <div className="text-2xl font-bold">৳{distributionStats.monthlyDistributed}</div>
            <div className="text-sm opacity-80">Monthly Prizes</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm border border-white/10">
            <div className="text-2xl font-bold">৳{distributionStats.remainingPrizes}</div>
            <div className="text-sm opacity-80">Remaining</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm border border-white/10">
            <div className="text-2xl font-bold">{Math.round((distributionStats.totalDistributed / grandTotal) * 100)}%</div>
            <div className="text-sm opacity-80">Completed</div>
          </div>
        </div>
      </div>

      {/* Prize Breakdown Sections */}
      <div className="p-6 space-y-6">

        {/* Season End Prizes */}
        <motion.div variants={itemVariants} className="bg-base-200/50 rounded-xl p-6 border border-base-content/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-base-content flex items-center gap-2">
              <Trophy className="text-yellow-500" size={24} />
              Season End Championships
            </h3>
            <div className="text-yellow-500 font-bold text-lg">৳{prizeStructure.season.total}</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {prizeStructure.season.prizes.map((prize, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02 }}
                className="bg-base-100 rounded-xl p-5 shadow-sm border border-base-content/5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm
                      ${getPositionStyling(prize.position)}
                    `}>
                      <span className="text-xl">{prize.emoji}</span>
                    </div>
                    <div>
                      <div className="font-bold text-base-content">{prize.label}</div>
                      <div className="text-sm text-base-content/60">Final Position #{prize.position}</div>
                    </div>
                  </div>
                  <div className={`text-2xl font-bold ${prize.color}`}>
                    ৳{prize.amount}
                  </div>
                </div>

                {/* Current leader for this position */}
                {standings[index] && (
                  <div className="mt-4 p-3 bg-base-200 rounded-lg border border-base-content/5">
                    <div className="text-xs text-base-content/60 mb-1">Current Leader:</div>
                    <div className="font-semibold text-base-content">
                      {standings[index].managerName || standings[index].player_name}
                    </div>
                    <div className="text-sm text-base-content/70">
                      {(standings[index].totalPoints || standings[index].total)?.toLocaleString()} points
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Weekly Prizes Progress */}
        <motion.div variants={itemVariants} className="bg-base-200/50 rounded-xl p-6 border border-base-content/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-base-content flex items-center gap-2">
              <Zap className="text-blue-500" size={24} />
              Weekly Competitions
            </h3>
            <div className="text-blue-500 font-bold text-lg">৳{prizeStructure.weekly.total} Total</div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-base-100 rounded-xl p-4 text-center shadow-sm border border-base-content/5">
              <div className="text-2xl font-bold text-green-500">৳{distributionStats.weeklyDistributed}</div>
              <div className="text-sm text-base-content/70">Distributed</div>
              <div className="text-xs text-base-content/50">{distributionStats.completedGameweeks} gameweeks</div>
            </div>
            <div className="bg-base-100 rounded-xl p-4 text-center shadow-sm border border-base-content/5">
              <div className="text-2xl font-bold text-blue-500">৳{prizeStructure.weekly.total - distributionStats.weeklyDistributed}</div>
              <div className="text-sm text-base-content/70">Remaining</div>
              <div className="text-xs text-base-content/50">{totalGWs - distributionStats.completedGameweeks} gameweeks</div>
            </div>
            <div className="bg-base-100 rounded-xl p-4 text-center shadow-sm border border-base-content/5">
              <div className="text-2xl font-bold text-purple-500">৳30</div>
              <div className="text-sm text-base-content/70">Per Week</div>
              <div className="text-xs text-base-content/50">Winner takes all</div>
            </div>
            <div className="bg-base-100 rounded-xl p-4 text-center shadow-sm border border-base-content/5">
              <div className="text-2xl font-bold text-orange-500">{Math.round(distributionStats.weeklyProgress)}%</div>
              <div className="text-sm text-base-content/70">Progress</div>
              <div className="text-xs text-base-content/50">Season completion</div>
            </div>
          </div>

          <div className="bg-base-100 rounded-xl p-4 border border-base-content/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-base-content/70">Weekly Prize Progress</span>
              <span className="text-sm font-bold text-purple-500">{Math.round(distributionStats.weeklyProgress)}%</span>
            </div>
            <div className="w-full bg-base-200 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${distributionStats.weeklyProgress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full"
              ></motion.div>
            </div>
          </div>
        </motion.div>

        {/* Monthly Prizes Progress */}
        <motion.div variants={itemVariants} className="bg-base-200/50 rounded-xl p-6 border border-base-content/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-base-content flex items-center gap-2">
              <Calendar className="text-green-500" size={24} />
              Monthly Competitions
            </h3>
            <div className="text-green-500 font-bold text-lg">৳{prizeStructure.monthly.total} Total</div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-base-100 rounded-xl p-4 text-center shadow-sm border border-base-content/5">
              <div className="text-2xl font-bold text-green-500">৳{distributionStats.monthlyDistributed}</div>
              <div className="text-sm text-base-content/70">Distributed</div>
              <div className="text-xs text-base-content/50">{Math.floor(distributionStats.completedGameweeks / 4)} months</div>
            </div>
            <div className="bg-base-100 rounded-xl p-4 text-center shadow-sm border border-base-content/5">
              <div className="text-2xl font-bold text-blue-500">৳{prizeStructure.monthly.total - distributionStats.monthlyDistributed}</div>
              <div className="text-sm text-base-content/70">Remaining</div>
              <div className="text-xs text-base-content/50">{9 - Math.floor(distributionStats.completedGameweeks / 4)} months</div>
            </div>
            <div className="bg-base-100 rounded-xl p-4 text-center shadow-sm border border-base-content/5">
              <div className="text-2xl font-bold text-purple-500">৳750</div>
              <div className="text-sm text-base-content/70">Per Month</div>
              <div className="text-xs text-base-content/50">Top 3 winners</div>
            </div>
            <div className="bg-base-100 rounded-xl p-4 text-center shadow-sm border border-base-content/5">
              <div className="text-2xl font-bold text-orange-500">{Math.round(distributionStats.monthlyProgress)}%</div>
              <div className="text-sm text-base-content/70">Progress</div>
              <div className="text-xs text-base-content/50">Season completion</div>
            </div>
          </div>

          <div className="bg-base-100 rounded-xl p-4 border border-base-content/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-base-content/70">Monthly Prize Progress</span>
              <span className="text-sm font-bold text-green-500">{Math.round(distributionStats.monthlyProgress)}%</span>
            </div>
            <div className="w-full bg-base-200 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${distributionStats.monthlyProgress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="bg-gradient-to-r from-green-500 to-teal-500 h-3 rounded-full"
              ></motion.div>
            </div>
          </div>
        </motion.div>

        {/* Top Weekly Winners */}
        {distributionStats.topWeeklyWinners.length > 0 && (
          <motion.div variants={itemVariants} className="bg-base-200/50 rounded-xl p-6 border border-base-content/10">
            <h3 className="text-xl font-bold text-base-content flex items-center gap-2 mb-6">
              <Star className="text-purple-500" size={24} />
              Top Weekly Winners
            </h3>

            <div className="space-y-3">
              {distributionStats.topWeeklyWinners.map((winner, index) => (
                <div key={index} className="bg-base-100 rounded-xl p-4 shadow-sm border border-base-content/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                      ${getPositionStyling(index + 1)}
                    `}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-bold text-base-content">{winner.name}</div>
                      <div className="text-sm text-base-content/60">{winner.wins} weekly wins</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-500">৳{winner.totalWon}</div>
                    <div className="text-xs text-base-content/50">Total earned</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Souvenirs & Miscellaneous */}
        <motion.div variants={itemVariants} className="bg-base-200/50 rounded-xl p-6 border border-base-content/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-base-content flex items-center gap-2">
              <Gift className="text-pink-500" size={24} />
              Souvenirs & Miscellaneous
            </h3>
            <div className="text-pink-500 font-bold text-lg">৳{prizeStructure.souvenirs.total}</div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {prizeStructure.souvenirs.items.map((item, index) => (
              <div key={index} className="bg-base-100 rounded-xl p-4 text-center shadow-sm border border-base-content/5">
                <div className="text-3xl mb-3">
                  {index === 0 ? '👕' : index === 1 ? '📜' : index === 2 ? '🏅' : '🏆'}
                </div>
                <div className="font-semibold text-base-content text-sm">{item}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="bg-base-200 border-t border-base-content/10 p-4">
        <div className="text-center text-sm text-base-content/60">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>
              Prize distribution updates in real-time as competitions conclude • Last updated: {new Date().toLocaleString('en-US', {
                timeZone: 'Asia/Dhaka',
                dateStyle: 'medium',
                timeStyle: 'short'
              })} (BD)
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PrizeDistribution;