import React, { useMemo } from 'react';
import {
  DollarSign, Trophy, Calendar, Zap, Target, Gift, Star, PieChart
} from 'lucide-react';
import { motion } from 'framer-motion';
import Card from './ui/Card';
import Badge from './ui/Badge';

const PrizeDistribution = ({ gameweekInfo = {}, standings = [], gameweekTable = [] }) => {
  const currentGW = gameweekInfo.current || 3;
  const totalGWs = gameweekInfo.total || 38;

  // Prize structure
  const prizeStructure = {
    season: {
      total: 1800,
      prizes: [
        { position: 1, amount: 800, emoji: '🥇', color: 'text-yellow-400', label: 'Champion' },
        { position: 2, amount: 600, emoji: '🥈', color: 'text-gray-300', label: 'Runner-up' },
        { position: 3, amount: 400, emoji: '🥉', color: 'text-orange-400', label: 'Third Place' }
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
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-bro-primary to-bro-secondary border-none">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-lg">
              <PieChart size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-display font-bold">Prize Distribution</h2>
              <p className="text-white/80 text-lg">
                ৳{grandTotal.toLocaleString()} Total Prize Pool
              </p>
            </div>
          </div>

          <Badge variant="success" className="px-4 py-2 text-sm bg-white/20 border-white/20 text-white backdrop-blur-md">
            <DollarSign size={16} className="mr-2" />
            ৳{distributionStats.totalDistributed.toLocaleString()} Distributed
          </Badge>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <StatBox
            value={`৳${distributionStats.weeklyDistributed}`}
            label="Weekly Prizes"
            sublabel="Distributed"
          />
          <StatBox
            value={`৳${distributionStats.monthlyDistributed}`}
            label="Monthly Prizes"
            sublabel="Distributed"
          />
          <StatBox
            value={`৳${distributionStats.remainingPrizes}`}
            label="Remaining"
            sublabel="To be won"
          />
          <StatBox
            value={`${Math.round((distributionStats.totalDistributed / grandTotal) * 100)}%`}
            label="Completed"
            sublabel="Season Progress"
          />
        </div>
      </Card>

      {/* Season End Prizes */}
      <motion.div variants={itemVariants}>
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Trophy className="text-yellow-400" size={24} />
              Season End Championships
            </h3>
            <Badge variant="warning">৳{prizeStructure.season.total}</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {prizeStructure.season.prizes.map((prize, index) => (
              <div
                key={index}
                className="bg-white/5 rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{prize.emoji}</span>
                    <div>
                      <div className="font-bold text-white">{prize.label}</div>
                      <div className="text-xs text-bro-muted">Position #{prize.position}</div>
                    </div>
                  </div>
                  <div className={`text-xl font-bold ${prize.color}`}>
                    ৳{prize.amount}
                  </div>
                </div>

                {/* Current leader for this position */}
                {standings[index] && (
                  <div className="p-3 bg-black/20 rounded-lg">
                    <div className="text-xs text-bro-muted mb-1">Current Leader</div>
                    <div className="font-medium text-white">
                      {standings[index].managerName || standings[index].player_name}
                    </div>
                    <div className="text-sm text-bro-primary">
                      {(standings[index].totalPoints || standings[index].total)?.toLocaleString()} pts
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
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Zap className="text-blue-400" size={24} />
                Weekly
              </h3>
              <Badge variant="primary">৳{prizeStructure.weekly.total}</Badge>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-blue-400">৳30</div>
                  <div className="text-xs text-bro-muted">Per Week</div>
                </div>
                <div className="bg-white/5 p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-white">{distributionStats.completedGameweeks}</div>
                  <div className="text-xs text-bro-muted">GWs Done</div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-bro-muted">Progress</span>
                  <span className="text-blue-400">{Math.round(distributionStats.weeklyProgress)}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${distributionStats.weeklyProgress}%` }}
                    className="h-full bg-blue-500 rounded-full"
                  />
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Monthly Prizes */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Calendar className="text-green-400" size={24} />
                Monthly
              </h3>
              <Badge variant="success">৳{prizeStructure.monthly.total}</Badge>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-green-400">৳750</div>
                  <div className="text-xs text-bro-muted">Per Month</div>
                </div>
                <div className="bg-white/5 p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-white">{Math.floor(distributionStats.completedGameweeks / 4)}</div>
                  <div className="text-xs text-bro-muted">Months Done</div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-bro-muted">Progress</span>
                  <span className="text-green-400">{Math.round(distributionStats.monthlyProgress)}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${distributionStats.monthlyProgress}%` }}
                    className="h-full bg-green-500 rounded-full"
                  />
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Top Weekly Winners */}
      {distributionStats.topWeeklyWinners.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card>
            <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
              <Star className="text-purple-400" size={24} />
              Top Weekly Winners
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {distributionStats.topWeeklyWinners.map((winner, index) => (
                <div key={index} className="bg-white/5 rounded-xl p-4 flex items-center justify-between border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-bold text-white">{winner.name}</div>
                      <div className="text-xs text-bro-muted">{winner.wins} wins</div>
                    </div>
                  </div>
                  <div className="text-green-400 font-bold">৳{winner.totalWon}</div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Souvenirs */}
      <motion.div variants={itemVariants}>
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Gift className="text-pink-400" size={24} />
              Souvenirs & Swag
            </h3>
            <Badge variant="accent">৳{prizeStructure.souvenirs.total}</Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {prizeStructure.souvenirs.items.map((item, index) => (
              <div key={index} className="bg-white/5 rounded-xl p-4 text-center hover:bg-white/10 transition-colors">
                <div className="text-3xl mb-2">
                  {index === 0 ? '👕' : index === 1 ? '📜' : index === 2 ? '🏅' : '🏆'}
                </div>
                <div className="text-sm font-medium text-white">{item}</div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};

const StatBox = ({ value, label, sublabel }) => (
  <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm border border-white/10">
    <div className="text-xl font-bold text-white">{value}</div>
    <div className="text-xs font-medium text-white/90">{label}</div>
    <div className="text-[10px] text-white/60 uppercase tracking-wider">{sublabel}</div>
  </div>
);

export default PrizeDistribution;