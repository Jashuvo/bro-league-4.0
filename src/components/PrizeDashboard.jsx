// src/components/PrizeDashboard.jsx - Prize Money Tracker Dashboard
import React, { useState } from 'react';
import { 
  Trophy, 
  DollarSign, 
  TrendingUp, 
  Award, 
  Target, 
  Crown, 
  Medal,
  Star,
  Calendar,
  Users,
  Banknote,
  PiggyBank,
  Zap
} from 'lucide-react';

const PrizeDashboard = ({ 
  standings = [], 
  gameweekInfo = {}, 
  gameweekTable = [] 
}) => {
  const currentGW = gameweekInfo.current || 3;
  const totalPrizePool = parseInt(import.meta.env.VITE_TOTAL_PRIZE_POOL) || 12000;
  const entryFee = parseInt(import.meta.env.VITE_ENTRY_FEE) || 800;
  const totalManagers = standings.length || 15;

  // Prize structure
  const weeklyPrize = 30;
  const monthlyPrizes = [350, 250, 150]; // 1st, 2nd, 3rd
  const finalPrizes = [4000, 2500, 1500, 800, 600]; // Top 5

  // Calculate weekly winners and their prizes
  const calculateWeeklyWinners = () => {
    return gameweekTable
      .filter(gw => gw.gameweek <= currentGW && gw.managers && gw.managers.length > 0)
      .map(gw => {
        // Apply transfer cost deduction before determining winner
        const managersWithNetPoints = gw.managers
          .filter(m => m.points > 0)
          .map(manager => {
            const rawPoints = manager.points || 0;
            const transfersCost = manager.transfersCost || 
                                 manager.event_transfers_cost || 
                                 manager.transferCost || 
                                 manager.transfers_cost ||
                                 0;
            const netPoints = rawPoints - transfersCost;
            return { ...manager, netPoints, rawPoints, transfersCost };
          })
          .sort((a, b) => b.netPoints - a.netPoints);
        
        const winner = managersWithNetPoints[0];
        return {
          gameweek: gw.gameweek,
          winner: winner ? {
            id: winner.id,
            name: winner.managerName,
            teamName: winner.teamName,
            points: winner.netPoints,
            prize: weeklyPrize
          } : null
        };
      })
      .filter(gw => gw.winner !== null);
  };

  // Calculate monthly winners (simplified - just showing concept)
  const calculateMonthlyWinners = () => {
    // This is a simplified version - you'd want to implement proper monthly calculation
    const months = [
      { id: 1, name: "Month 1", gameweeks: [1, 2, 3, 4], status: currentGW > 4 ? 'completed' : 'active' },
      { id: 2, name: "Month 2", gameweeks: [5, 6, 7, 8], status: currentGW > 8 ? 'completed' : currentGW >= 5 ? 'active' : 'upcoming' },
      // Add more months...
    ];
    
    return months.filter(month => month.status === 'completed').map(month => ({
      month: month.name,
      winners: [
        { position: 1, manager: 'TBD', prize: monthlyPrizes[0] },
        { position: 2, manager: 'TBD', prize: monthlyPrizes[1] },
        { position: 3, manager: 'TBD', prize: monthlyPrizes[2] }
      ]
    }));
  };

  // Calculate total prizes won per manager
  const calculatePrizesWon = () => {
    const weeklyWinners = calculateWeeklyWinners();
    const prizesByManager = {};

    // Initialize all managers
    standings.forEach(manager => {
      prizesByManager[manager.id] = {
        manager: manager,
        weeklyWins: 0,
        weeklyPrizes: 0,
        monthlyPrizes: 0,
        totalWon: 0
      };
    });

    // Add weekly prizes
    weeklyWinners.forEach(gw => {
      if (gw.winner && prizesByManager[gw.winner.id]) {
        prizesByManager[gw.winner.id].weeklyWins++;
        prizesByManager[gw.winner.id].weeklyPrizes += weeklyPrize;
        prizesByManager[gw.winner.id].totalWon += weeklyPrize;
      }
    });

    return Object.values(prizesByManager).sort((a, b) => b.totalWon - a.totalWon);
  };

  const weeklyWinners = calculateWeeklyWinners();
  const monthlyWinners = calculateMonthlyWinners();
  const managerPrizes = calculatePrizesWon();

  // Prize pool breakdown
  const totalWeeklyPrizes = 38 * weeklyPrize; // 1140
  const totalMonthlyPrizes = 9 * (monthlyPrizes[0] + monthlyPrizes[1] + monthlyPrizes[2]); // 6750
  const totalFinalPrizes = finalPrizes.reduce((sum, prize) => sum + prize, 0); // 9400
  
  const distributedWeekly = weeklyWinners.length * weeklyPrize;
  const distributedMonthly = monthlyWinners.reduce((sum, month) => 
    sum + month.winners.reduce((monthSum, winner) => monthSum + winner.prize, 0), 0
  );
  const totalDistributed = distributedWeekly + distributedMonthly;
  const remainingPrizePool = totalPrizePool - totalDistributed;

  return (
    <div className="space-y-6">
      {/* Prize Pool Overview */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <PiggyBank size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Prize Pool</h2>
              <p className="text-green-100">Total fund distribution</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">£{totalPrizePool.toLocaleString()}</p>
            <p className="text-green-100">Total available</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={16} />
              <span className="font-semibold">Weekly</span>
            </div>
            <p className="text-2xl font-bold">£{distributedWeekly}</p>
            <p className="text-green-100 text-sm">£{totalWeeklyPrizes} total</p>
          </div>

          <div className="bg-white/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={16} />
              <span className="font-semibold">Monthly</span>
            </div>
            <p className="text-2xl font-bold">£{distributedMonthly}</p>
            <p className="text-green-100 text-sm">£{totalMonthlyPrizes} total</p>
          </div>

          <div className="bg-white/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy size={16} />
              <span className="font-semibold">Final</span>
            </div>
            <p className="text-2xl font-bold">£{totalFinalPrizes}</p>
            <p className="text-green-100 text-sm">Top 5 prizes</p>
          </div>

          <div className="bg-white/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Banknote size={16} />
              <span className="font-semibold">Remaining</span>
            </div>
            <p className="text-2xl font-bold">£{remainingPrizePool}</p>
            <p className="text-green-100 text-sm">To be won</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Distribution Progress</span>
            <span>{((totalDistributed / totalPrizePool) * 100).toFixed(1)}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3">
            <div 
              className="bg-white rounded-full h-3 transition-all duration-1000"
              style={{ width: `${(totalDistributed / totalPrizePool) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Manager Prize Leaderboard */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Award className="text-yellow-500" size={24} />
          <div>
            <h3 className="text-xl font-bold text-gray-900">Prize Leaderboard</h3>
            <p className="text-gray-600">Money won so far this season</p>
          </div>
        </div>

        <div className="space-y-3">
          {managerPrizes.slice(0, 10).map((managerPrize, index) => (
            <div 
              key={managerPrize.manager.id}
              className={`flex items-center justify-between p-4 rounded-lg border transition-all hover:shadow-md ${
                managerPrize.totalWon > 0 
                  ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' 
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  index === 0 && managerPrize.totalWon > 0 ? 'bg-yellow-500 text-white' :
                  index === 1 && managerPrize.totalWon > 0 ? 'bg-gray-400 text-white' :
                  index === 2 && managerPrize.totalWon > 0 ? 'bg-orange-500 text-white' :
                  'bg-gray-200 text-gray-600'
                }`}>
                  {index < 3 && managerPrize.totalWon > 0 ? (
                    index === 0 ? <Crown size={16} /> :
                    index === 1 ? <Medal size={16} /> :
                    <Award size={16} />
                  ) : (
                    index + 1
                  )}
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900">{managerPrize.manager.teamName}</h4>
                  <p className="text-gray-600 text-sm">{managerPrize.manager.managerName}</p>
                </div>
              </div>

              <div className="text-right">
                <p className={`font-bold text-lg ${
                  managerPrize.totalWon > 0 ? 'text-green-600' : 'text-gray-400'
                }`}>
                  £{managerPrize.totalWon}
                </p>
                {managerPrize.weeklyWins > 0 && (
                  <p className="text-xs text-gray-500">
                    {managerPrize.weeklyWins} weekly win{managerPrize.weeklyWins !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {managerPrizes.filter(mp => mp.totalWon === 0).length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-blue-700 text-sm">
              💡 <strong>{managerPrizes.filter(mp => mp.totalWon === 0).length} managers</strong> haven't won prizes yet - weekly prizes are still up for grabs!
            </p>
          </div>
        )}
      </div>

      {/* Recent Weekly Winners */}
      {weeklyWinners.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <Zap className="text-purple-500" size={24} />
            <div>
              <h3 className="text-xl font-bold text-gray-900">Recent Weekly Winners</h3>
              <p className="text-gray-600">£{weeklyPrize} prize each gameweek</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {weeklyWinners.slice(-6).reverse().map((gw) => (
              <div key={gw.gameweek} className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-purple-600 font-semibold text-sm">GW{gw.gameweek}</span>
                  <span className="text-green-600 font-bold">£{gw.winner.prize}</span>
                </div>
                <h4 className="font-semibold text-gray-900">{gw.winner.teamName}</h4>
                <p className="text-gray-600 text-sm">{gw.winner.name}</p>
                <p className="text-purple-600 font-bold mt-1">{gw.winner.points} pts</p>
              </div>
            ))}
          </div>

          {weeklyWinners.length < currentGW && (
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-yellow-700 text-sm">
                ⏳ Some weekly winners are still being calculated...
              </p>
            </div>
          )}
        </div>
      )}

      {/* Prize Structure Info */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Target className="text-blue-500" size={24} />
          <div>
            <h3 className="text-xl font-bold text-gray-900">Prize Structure</h3>
            <p className="text-gray-600">How the £{totalPrizePool.toLocaleString()} is distributed</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Weekly Prizes */}
          <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
            <Zap className="mx-auto text-purple-500 mb-3" size={32} />
            <h4 className="font-bold text-gray-900 mb-2">Weekly Prizes</h4>
            <p className="text-2xl font-bold text-purple-600 mb-2">£{weeklyPrize}</p>
            <p className="text-gray-600 text-sm">Every gameweek winner</p>
            <p className="text-gray-500 text-xs mt-1">38 weeks × £{weeklyPrize} = £{totalWeeklyPrizes}</p>
          </div>

          {/* Monthly Prizes */}
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <Calendar className="mx-auto text-blue-500 mb-3" size={32} />
            <h4 className="font-bold text-gray-900 mb-2">Monthly Prizes</h4>
            <div className="space-y-1 mb-2">
              <p className="text-blue-600 font-bold">1st: £{monthlyPrizes[0]}</p>
              <p className="text-blue-600 font-bold">2nd: £{monthlyPrizes[1]}</p>
              <p className="text-blue-600 font-bold">3rd: £{monthlyPrizes[2]}</p>
            </div>
            <p className="text-gray-600 text-sm">Top 3 each month</p>
            <p className="text-gray-500 text-xs mt-1">9 months × £{monthlyPrizes.reduce((sum, p) => sum + p, 0)} = £{totalMonthlyPrizes}</p>
          </div>

          {/* Final Prizes */}
          <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <Trophy className="mx-auto text-yellow-500 mb-3" size={32} />
            <h4 className="font-bold text-gray-900 mb-2">Final Prizes</h4>
            <div className="space-y-1 mb-2">
              <p className="text-yellow-600 font-bold">1st: £{finalPrizes[0]}</p>
              <p className="text-yellow-600 font-bold">2nd: £{finalPrizes[1]}</p>
              <p className="text-yellow-600 font-bold">3rd: £{finalPrizes[2]}</p>
            </div>
            <p className="text-gray-600 text-sm">Season final standings</p>
            <p className="text-gray-500 text-xs mt-1">Top 5 total: £{totalFinalPrizes}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrizeDashboard;