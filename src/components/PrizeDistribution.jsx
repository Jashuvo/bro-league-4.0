import React, { useMemo } from 'react';
import { DollarSign, Trophy, TrendingUp, Calendar, Award, Target, Users, Crown, Star, Zap, Medal, PieChart } from 'lucide-react';

const PrizeDistribution = ({ standings = [], gameweekInfo = {}, gameweekTable = [], loading = false }) => {
  const currentGW = gameweekInfo.current || 3;
  const totalPrizePool = import.meta.env.VITE_TOTAL_PRIZE_POOL || 12000;
  
  // Prize structure definition
  const prizeStructure = {
    overall: {
      first: 800,
      second: 600,
      third: 400,
      total: 1800
    },
    monthly: {
      months1to8: { first: 350, second: 250, third: 150, total: 750 },
      month9: { first: 500, second: 400, third: 250, total: 1150 },
      totalMonths: 8 * 750 + 1150
    },
    weekly: {
      perWeek: 30,
      totalWeeks: 38,
      total: 38 * 30
    }
  };

  // Calculate individual manager earnings
  const managerEarnings = useMemo(() => {
    const earnings = {};
    
    // Initialize all managers
    standings.forEach(manager => {
      earnings[manager.id] = {
        id: manager.id,
        name: manager.managerName,
        teamName: manager.teamName,
        weeklyWon: 0,
        monthlyWon: 0,
        overallPosition: manager.rank,
        overallWon: 0,
        totalEarnings: 0
      };
    });

    // Calculate weekly earnings
    if (gameweekTable.length > 0) {
      gameweekTable
        .filter(gw => gw.gameweek <= currentGW && gw.managers && gw.managers.length > 0)
        .forEach(gw => {
          const managersWithNetPoints = gw.managers
            .filter(m => m.gameweekPoints > 0)
            .map(manager => {
              const rawPoints = manager.gameweekPoints || 0;
              const transfersCost = manager.transfersCost || 
                                   manager.event_transfers_cost || 
                                   manager.transferCost || 
                                   manager.transfers_cost ||
                                   manager.penalty ||
                                   manager.hit ||
                                   0;
              return {
                ...manager,
                netPoints: rawPoints - transfersCost
              };
            })
            .sort((a, b) => b.netPoints - a.netPoints);
          
          if (managersWithNetPoints[0] && earnings[managersWithNetPoints[0].id]) {
            earnings[managersWithNetPoints[0].id].weeklyWon += 30;
          }
        });
    }

    // Calculate monthly earnings (simplified for current implementation)
    const months = [
      { gameweeks: [1, 2, 3, 4], prizes: [350, 250, 150] },
      { gameweeks: [5, 6, 7, 8], prizes: [350, 250, 150] },
      { gameweeks: [9, 10, 11, 12], prizes: [350, 250, 150] },
      { gameweeks: [13, 14, 15, 16], prizes: [350, 250, 150] },
      { gameweeks: [17, 18, 19, 20], prizes: [350, 250, 150] },
      { gameweeks: [21, 22, 23, 24], prizes: [350, 250, 150] },
      { gameweeks: [25, 26, 27, 28], prizes: [350, 250, 150] },
      { gameweeks: [29, 30, 31, 32], prizes: [350, 250, 150] },
      { gameweeks: [33, 34, 35, 36, 37, 38], prizes: [500, 400, 250] }
    ];

    months.forEach(month => {
      if (currentGW > Math.max(...month.gameweeks)) {
        // Month completed - calculate actual winners
        const monthlyData = gameweekTable
          .filter(gw => month.gameweeks.includes(gw.gameweek) && gw.managers)
          .reduce((acc, gw) => {
            gw.managers.forEach(manager => {
              if (!acc[manager.id]) acc[manager.id] = 0;
              const rawPoints = manager.gameweekPoints || 0;
              const transfersCost = manager.transfersCost || 0;
              acc[manager.id] += (rawPoints - transfersCost);
            });
            return acc;
          }, {});

        const sortedManagers = Object.entries(monthlyData)
          .sort(([,a], [,b]) => b - a)
          .map(([id]) => parseInt(id));

        month.prizes.forEach((prize, index) => {
          const managerId = sortedManagers[index];
          if (managerId && earnings[managerId]) {
            earnings[managerId].monthlyWon += prize;
          }
        });
      }
    });

    // Calculate overall prizes (only at season end)
    if (currentGW >= 38) {
      if (earnings[standings[0]?.id]) earnings[standings[0].id].overallWon = prizeStructure.overall.first;
      if (earnings[standings[1]?.id]) earnings[standings[1].id].overallWon = prizeStructure.overall.second;
      if (earnings[standings[2]?.id]) earnings[standings[2].id].overallWon = prizeStructure.overall.third;
    }

    // Calculate total earnings
    Object.values(earnings).forEach(manager => {
      manager.totalEarnings = manager.weeklyWon + manager.monthlyWon + manager.overallWon;
    });

    return Object.values(earnings)
      .sort((a, b) => b.totalEarnings - a.totalEarnings)
      .map((manager, index) => ({ ...manager, earningsRank: index + 1 }));
  }, [standings, gameweekTable, currentGW]);

  // Calculate distribution stats
  const distributionStats = useMemo(() => {
    const weeklyDistributed = Math.min(currentGW - 1, 0) * 30;
    const monthlyDistributed = managerEarnings.reduce((sum, m) => sum + m.monthlyWon, 0);
    const overallDistributed = managerEarnings.reduce((sum, m) => sum + m.overallWon, 0);
    const totalDistributed = weeklyDistributed + monthlyDistributed + overallDistributed;
    const remaining = totalPrizePool - totalDistributed;

    return {
      weeklyDistributed,
      monthlyDistributed,
      overallDistributed,
      totalDistributed,
      remaining,
      percentageDistributed: Math.round((totalDistributed / totalPrizePool) * 100)
    };
  }, [managerEarnings, currentGW, totalPrizePool]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading prize distribution...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Prize Pool Overview */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-blue-600 p-4">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <DollarSign size={20} />
            Prize Pool Overview
          </h2>
          <p className="text-green-100 text-sm">Total: ৳{totalPrizePool.toLocaleString()}</p>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">৳{distributionStats.totalDistributed}</div>
              <div className="text-sm text-gray-600">Distributed</div>
              <div className="text-xs text-gray-500">{distributionStats.percentageDistributed}% of total</div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">৳{distributionStats.remaining}</div>
              <div className="text-sm text-gray-600">Remaining</div>
              <div className="text-xs text-gray-500">{100 - distributionStats.percentageDistributed}% left</div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">৳{distributionStats.weeklyDistributed}</div>
              <div className="text-sm text-gray-600">Weekly Prizes</div>
              <div className="text-xs text-gray-500">{Math.max(currentGW - 1, 0)} gameweeks</div>
            </div>
            
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">৳{distributionStats.monthlyDistributed}</div>
              <div className="text-sm text-gray-600">Monthly Prizes</div>
              <div className="text-xs text-gray-500">Completed months</div>
            </div>
          </div>
        </div>
      </div>

      {/* Prize Structure Breakdown */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <PieChart size={20} />
            Prize Structure
          </h3>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Overall Prizes */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
              <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-3">
                <Crown className="text-yellow-600" size={20} />
                Overall Season
              </h4>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">🥇 1st Place</span>
                  <span className="font-bold text-yellow-600">৳{prizeStructure.overall.first}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">🥈 2nd Place</span>
                  <span className="font-bold text-gray-600">৳{prizeStructure.overall.second}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">🥉 3rd Place</span>
                  <span className="font-bold text-orange-600">৳{prizeStructure.overall.third}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-purple-600">৳{prizeStructure.overall.total}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly Prizes */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
              <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-3">
                <Calendar className="text-blue-600" size={20} />
                Monthly Competitions
              </h4>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Months 1-8 (each)</span>
                  <span className="font-bold text-blue-600">৳750</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Month 9 (Final)</span>
                  <span className="font-bold text-purple-600">৳1,150</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-purple-600">৳{prizeStructure.monthly.totalMonths}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly Prizes */}
            <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-4 border border-green-200">
              <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-3">
                <Zap className="text-green-600" size={20} />
                Weekly Champions
              </h4>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Per Gameweek</span>
                  <span className="font-bold text-green-600">৳30</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">38 Gameweeks</span>
                  <span className="font-bold text-teal-600">৳{prizeStructure.weekly.total}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-purple-600">৳{prizeStructure.weekly.total}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Individual Manager Earnings */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              <Trophy size={20} />
              Manager Earnings
            </h3>
            <div className="text-indigo-100 text-sm">
              Current standings
            </div>
          </div>
        </div>

        <div className="overflow-hidden">
          {managerEarnings.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              {managerEarnings.map((manager, index) => (
                <div
                  key={manager.id}
                  className={`
                    border-b border-gray-100 last:border-b-0 p-4
                    ${index < 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : 'bg-white'}
                    hover:bg-gray-50 transition-colors
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {index === 0 && <Crown className="text-yellow-500" size={18} />}
                        {index === 1 && <Medal className="text-gray-400" size={18} />}
                        {index === 2 && <Award className="text-orange-400" size={18} />}
                        {index > 2 && <span className="text-gray-600 font-bold text-sm">{index + 1}</span>}
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-gray-900 truncate">
                          {manager.name}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          Overall Rank: #{manager.overallPosition}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right hidden md:block">
                        <div className="text-sm text-green-600">
                          ৳{manager.weeklyWon}
                        </div>
                        <div className="text-xs text-gray-500">weekly</div>
                      </div>
                      
                      <div className="text-right hidden md:block">
                        <div className="text-sm text-blue-600">
                          ৳{manager.monthlyWon}
                        </div>
                        <div className="text-xs text-gray-500">monthly</div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-bold text-lg text-purple-600">
                          ৳{manager.totalEarnings}
                        </div>
                        <div className="text-xs text-gray-500">total</div>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Breakdown */}
                  <div className="md:hidden mt-3 pt-3 border-t border-gray-100">
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-center">
                        <div className="font-medium text-green-600">৳{manager.weeklyWon}</div>
                        <div className="text-xs text-gray-500">Weekly</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-blue-600">৳{manager.monthlyWon}</div>
                        <div className="text-xs text-gray-500">Monthly</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-orange-600">৳{manager.overallWon}</div>
                        <div className="text-xs text-gray-500">Overall</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Trophy size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No Earnings Data</h3>
              <p className="text-gray-500">
                Individual earnings will appear here as prizes are distributed.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-4">
          <div className="text-center text-sm text-gray-600">
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>
                Live prize tracking • All transfer penalties included • Last updated: {new Date().toLocaleString('en-US', { 
                  timeZone: 'Asia/Dhaka',
                  dateStyle: 'medium',
                  timeStyle: 'short'
                })} (BD)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrizeDistribution;