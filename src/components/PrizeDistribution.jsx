// src/components/PrizeDistribution.jsx - Updated to match League Table UI design
import React, { useMemo } from 'react';
import { 
  DollarSign, Trophy, Calendar, Zap, Target, Gift, Award, Crown, Medal, 
  TrendingUp, Users, Clock, Star, PieChart
} from 'lucide-react';

const PrizeDistribution = ({ gameweekInfo = {}, standings = [], gameweekTable = [] }) => {
  const currentGW = gameweekInfo.current || 3;
  const totalGWs = gameweekInfo.total || 38;

  // Prize structure
  const prizeStructure = {
    season: {
      total: 1800,
      prizes: [
        { position: 1, amount: 800, emoji: '🥇', color: 'text-yellow-600', label: 'Champion' },
        { position: 2, amount: 600, emoji: '🥈', color: 'text-gray-600', label: 'Runner-up' },
        { position: 3, amount: 400, emoji: '🥉', color: 'text-orange-600', label: 'Third Place' }
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

  // Position styling (same as League Table)
  const getPositionStyling = (position) => {
    if (position === 1) return 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg';
    if (position === 2) return 'bg-gradient-to-br from-gray-400 to-gray-600 text-white shadow-md';
    if (position === 3) return 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md';
    return 'bg-gray-100 text-gray-700 border border-gray-300';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header - Same style as League Table */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <PieChart size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Prize Distribution</h2>
              <p className="text-purple-100">
                ৳{grandTotal.toLocaleString()} Total Prize Pool • GW {currentGW} of {totalGWs}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-full">
            <DollarSign size={16} />
            <span className="text-sm">৳{distributionStats.totalDistributed.toLocaleString()} Distributed</span>
          </div>
        </div>

        {/* Quick Stats - Same as League Table */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-xl font-bold">৳{distributionStats.weeklyDistributed}</div>
            <div className="text-sm opacity-80">Weekly Prizes</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-xl font-bold">৳{distributionStats.monthlyDistributed}</div>
            <div className="text-sm opacity-80">Monthly Prizes</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-xl font-bold">৳{distributionStats.remainingPrizes}</div>
            <div className="text-sm opacity-80">Remaining</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-xl font-bold">{Math.round((distributionStats.totalDistributed / grandTotal) * 100)}%</div>
            <div className="text-sm opacity-80">Completed</div>
          </div>
        </div>
      </div>

      {/* Prize Breakdown Sections */}
      <div className="p-6 space-y-6">
        
        {/* Season End Prizes */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Trophy className="text-yellow-600" size={24} />
              Season End Championships
            </h3>
            <div className="text-yellow-600 font-bold text-lg">৳{prizeStructure.season.total}</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {prizeStructure.season.prizes.map((prize, index) => (
              <div key={index} className="bg-white rounded-lg p-4 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm
                      ${getPositionStyling(prize.position)}
                    `}>
                      <span className="text-xl">{prize.emoji}</span>
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{prize.label}</div>
                      <div className="text-sm text-gray-600">Final Position #{prize.position}</div>
                    </div>
                  </div>
                  <div className={`text-2xl font-bold ${prize.color}`}>
                    ৳{prize.amount}
                  </div>
                </div>
                
                {/* Current leader for this position */}
                {standings[index] && (
                  <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">Current Leader:</div>
                    <div className="font-semibold text-gray-900">
                      {standings[index].managerName || standings[index].player_name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {(standings[index].totalPoints || standings[index].total)?.toLocaleString()} points
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Prizes Progress */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Zap className="text-blue-600" size={24} />
              Weekly Competitions
            </h3>
            <div className="text-blue-600 font-bold text-lg">৳{prizeStructure.weekly.total} Total</div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white rounded-lg p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-green-600">৳{distributionStats.weeklyDistributed}</div>
              <div className="text-sm text-gray-600">Distributed</div>
              <div className="text-xs text-gray-500">{distributionStats.completedGameweeks} gameweeks</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-blue-600">৳{prizeStructure.weekly.total - distributionStats.weeklyDistributed}</div>
              <div className="text-sm text-gray-600">Remaining</div>
              <div className="text-xs text-gray-500">{totalGWs - distributionStats.completedGameweeks} gameweeks</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-purple-600">৳30</div>
              <div className="text-sm text-gray-600">Per Week</div>
              <div className="text-xs text-gray-500">Winner takes all</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-orange-600">{Math.round(distributionStats.weeklyProgress)}%</div>
              <div className="text-sm text-gray-600">Progress</div>
              <div className="text-xs text-gray-500">Season completion</div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Weekly Prize Progress</span>
              <span className="text-sm font-bold text-purple-600">{Math.round(distributionStats.weeklyProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${distributionStats.weeklyProgress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Monthly Prizes Progress */}
        <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="text-green-600" size={24} />
              Monthly Competitions
            </h3>
            <div className="text-green-600 font-bold text-lg">৳{prizeStructure.monthly.total} Total</div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white rounded-lg p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-green-600">৳{distributionStats.monthlyDistributed}</div>
              <div className="text-sm text-gray-600">Distributed</div>
              <div className="text-xs text-gray-500">{Math.floor(distributionStats.completedGameweeks / 4)} months</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-blue-600">৳{prizeStructure.monthly.total - distributionStats.monthlyDistributed}</div>
              <div className="text-sm text-gray-600">Remaining</div>
              <div className="text-xs text-gray-500">{9 - Math.floor(distributionStats.completedGameweeks / 4)} months</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-purple-600">৳750</div>
              <div className="text-sm text-gray-600">Per Month</div>
              <div className="text-xs text-gray-500">Top 3 winners</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-orange-600">{Math.round(distributionStats.monthlyProgress)}%</div>
              <div className="text-sm text-gray-600">Progress</div>
              <div className="text-xs text-gray-500">Season completion</div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Monthly Prize Progress</span>
              <span className="text-sm font-bold text-green-600">{Math.round(distributionStats.monthlyProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-green-500 to-teal-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${distributionStats.monthlyProgress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Top Weekly Winners */}
        {distributionStats.topWeeklyWinners.length > 0 && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
              <Star className="text-purple-600" size={24} />
              Top Weekly Winners
            </h3>

            <div className="space-y-3">
              {distributionStats.topWeeklyWinners.map((winner, index) => (
                <div key={index} className="bg-white rounded-lg p-4 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                      ${getPositionStyling(index + 1)}
                    `}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{winner.name}</div>
                      <div className="text-sm text-gray-600">{winner.wins} weekly wins</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-600">৳{winner.totalWon}</div>
                    <div className="text-xs text-gray-500">Total earned</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Souvenirs & Miscellaneous */}
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Gift className="text-gray-600" size={24} />
              Souvenirs & Miscellaneous
            </h3>
            <div className="text-gray-600 font-bold text-lg">৳{prizeStructure.souvenirs.total}</div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {prizeStructure.souvenirs.items.map((item, index) => (
              <div key={index} className="bg-white rounded-lg p-4 text-center shadow-sm">
                <div className="text-2xl mb-2">
                  {index === 0 ? '👕' : index === 1 ? '📜' : index === 2 ? '🏅' : '🏆'}
                </div>
                <div className="font-semibold text-gray-900 text-sm">{item}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer - Same style as League Table */}
      <div className="bg-gray-50 border-t border-gray-200 p-4">
        <div className="text-center text-sm text-gray-600">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
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
    </div>
  );
};

export default PrizeDistribution;