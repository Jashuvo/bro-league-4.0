import React, { useState, useMemo } from 'react';
import { Calendar, Trophy, Users, TrendingUp, Crown, Award, Target, Star, Medal, ExternalLink, Zap } from 'lucide-react';

const MonthlyPrizes = ({ standings = [], gameweekInfo = {}, gameweekTable = [], loading = false }) => {
  const currentGW = gameweekInfo.current || 3;
  
  const months = [
    { id: 1, name: "Month 1", gameweeks: [1, 2, 3, 4], prizes: [350, 250, 150], status: currentGW > 4 ? 'completed' : currentGW >= 1 ? 'active' : 'upcoming' },
    { id: 2, name: "Month 2", gameweeks: [5, 6, 7, 8], prizes: [350, 250, 150], status: currentGW > 8 ? 'completed' : currentGW >= 5 ? 'active' : 'upcoming' },
    { id: 3, name: "Month 3", gameweeks: [9, 10, 11, 12], prizes: [350, 250, 150], status: currentGW > 12 ? 'completed' : currentGW >= 9 ? 'active' : 'upcoming' },
    { id: 4, name: "Month 4", gameweeks: [13, 14, 15, 16], prizes: [350, 250, 150], status: currentGW > 16 ? 'completed' : currentGW >= 13 ? 'active' : 'upcoming' },
    { id: 5, name: "Month 5", gameweeks: [17, 18, 19, 20], prizes: [350, 250, 150], status: currentGW > 20 ? 'completed' : currentGW >= 17 ? 'active' : 'upcoming' },
    { id: 6, name: "Month 6", gameweeks: [21, 22, 23, 24], prizes: [350, 250, 150], status: currentGW > 24 ? 'completed' : currentGW >= 21 ? 'active' : 'upcoming' },
    { id: 7, name: "Month 7", gameweeks: [25, 26, 27, 28], prizes: [350, 250, 150], status: currentGW > 28 ? 'completed' : currentGW >= 25 ? 'active' : 'upcoming' },
    { id: 8, name: "Month 8", gameweeks: [29, 30, 31, 32], prizes: [350, 250, 150], status: currentGW > 32 ? 'completed' : currentGW >= 29 ? 'active' : 'upcoming' },
    { id: 9, name: "Month 9 (Final)", gameweeks: [33, 34, 35, 36, 37, 38], prizes: [500, 400, 250], status: currentGW > 38 ? 'completed' : currentGW >= 33 ? 'active' : 'upcoming' }
  ];

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const activeMonth = months.find(m => m.status === 'active');
    return activeMonth ? activeMonth.id : Math.max(1, Math.floor((currentGW - 1) / 4) + 1);
  });

  const selectedMonthData = months.find(m => m.id === selectedMonth);

  const getMonthProgress = (month) => {
    if (month.status === 'completed') return 100;
    if (month.status === 'upcoming') return 0;
    
    const completedGWs = month.gameweeks.filter(gw => gw <= currentGW).length;
    return Math.round((completedGWs / month.gameweeks.length) * 100);
  };

  const currentMonthStandings = useMemo(() => {
    if (!selectedMonthData || !gameweekTable.length) return [];

    const relevantGameweeks = gameweekTable.filter(gw => 
      selectedMonthData.gameweeks.includes(gw.gameweek) && 
      gw.managers && 
      gw.managers.length > 0
    );

    if (relevantGameweeks.length === 0) return [];

    const managerTotals = {};

    relevantGameweeks.forEach(gw => {
      gw.managers.forEach(manager => {
        if (!managerTotals[manager.id]) {
          managerTotals[manager.id] = {
            id: manager.id,
            managerName: manager.managerName,
            teamName: manager.teamName,
            rawPoints: 0,
            transfersCost: 0,
            monthlyPoints: 0,
            gameweeksPlayed: 0
          };
        }

        const rawPoints = manager.gameweekPoints || 0;
        const transfersCost = manager.transfersCost || 
                             manager.event_transfers_cost || 
                             manager.transferCost || 
                             manager.transfers_cost ||
                             manager.penalty ||
                             manager.hit ||
                             0;

        managerTotals[manager.id].rawPoints += rawPoints;
        managerTotals[manager.id].transfersCost += transfersCost;
        managerTotals[manager.id].monthlyPoints += (rawPoints - transfersCost);
        managerTotals[manager.id].gameweeksPlayed += 1;
      });
    });

    return Object.values(managerTotals)
      .sort((a, b) => b.monthlyPoints - a.monthlyPoints)
      .map((manager, index) => ({ ...manager, rank: index + 1 }));
  }, [selectedMonthData, gameweekTable]);

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="text-yellow-500" size={18} />;
    if (rank === 2) return <Medal className="text-gray-400" size={18} />;
    if (rank === 3) return <Award className="text-orange-400" size={18} />;
    return <span className="text-gray-600 font-bold text-sm">{rank}</span>;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading monthly prizes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mobile-Optimized Month Selector */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <Calendar size={20} />
            Monthly Competitions
          </h2>
          <p className="text-purple-100 text-sm">Track progress and winnings across all months</p>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {months.map((month) => (
              <button
                key={month.id}
                onClick={() => setSelectedMonth(month.id)}
                className={`
                  p-3 rounded-xl text-left transition-all duration-200 border-2
                  ${selectedMonth === month.id
                    ? 'bg-purple-600 text-white border-purple-600 shadow-lg'
                    : month.status === 'completed'
                    ? 'bg-green-50 text-green-800 border-green-200 hover:bg-green-100'
                    : month.status === 'active'
                    ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }
                `}
              >
                <div className="font-semibold text-sm">{month.name}</div>
                <div className="text-xs opacity-75">
                  GW {month.gameweeks[0]}-{month.gameweeks[month.gameweeks.length - 1]}
                </div>
                <div className="text-xs font-medium mt-1">
                  ৳{month.prizes.reduce((sum, prize) => sum + prize, 0)}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="text-xs">
                    {month.status === 'completed' && '✅ Completed'}
                    {month.status === 'active' && `🔄 ${getMonthProgress(month)}%`}
                    {month.status === 'upcoming' && '⏳ Upcoming'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile-Optimized Monthly Standings */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-blue-600 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              <Trophy size={20} />
              {selectedMonthData?.name} Standings
            </h3>
            <div className="text-green-100 text-sm">
              ৳{selectedMonthData?.prizes.reduce((sum, prize) => sum + prize, 0)}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-green-50 border-b border-gray-200 p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="font-bold text-lg text-green-600">
                {currentMonthStandings.length > 0 ? Math.max(...currentMonthStandings.map(m => m.monthlyPoints)) : 0}
              </div>
              <div className="text-xs text-gray-500">Highest Total</div>
            </div>
            <div>
              <div className="font-bold text-lg text-blue-600">
                {currentMonthStandings.length > 0 ? 
                  Math.round(currentMonthStandings.reduce((sum, m) => sum + m.monthlyPoints, 0) / currentMonthStandings.length) : 0}
              </div>
              <div className="text-xs text-gray-500">Average</div>
            </div>
            <div>
              <div className="font-bold text-lg text-orange-600">
                {selectedMonthData?.gameweeks.filter(gw => gw <= currentGW).length || 0}
              </div>
              <div className="text-xs text-gray-500">GWs Played</div>
            </div>
            <div>
              <div className="font-bold text-lg text-purple-600">
                {selectedMonthData?.gameweeks.length || 0}
              </div>
              <div className="text-xs text-gray-500">Total GWs</div>
            </div>
          </div>
        </div>

        {/* Mobile-Optimized Standings */}
        <div className="overflow-hidden">
          {currentMonthStandings.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              {currentMonthStandings.map((manager, index) => {
                const prizeAmount = selectedMonthData?.prizes[index] || 0;
                
                return (
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
                          {getRankIcon(manager.rank)}
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-gray-900 truncate">
                            {manager.managerName}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {manager.teamName}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-bold text-lg text-green-600">
                            {manager.monthlyPoints}
                          </div>
                          <div className="text-xs text-gray-500">net pts</div>
                        </div>
                        
                        <div className="text-right hidden sm:block">
                          <div className="font-bold text-lg text-purple-600">
                            {prizeAmount > 0 ? `৳${prizeAmount}` : '--'}
                          </div>
                          <div className="text-xs text-gray-500">prize</div>
                        </div>

                        {manager.transfersCost > 0 && (
                          <div className="text-right hidden md:block">
                            <div className="text-sm text-red-600">
                              -{manager.transfersCost}
                            </div>
                            <div className="text-xs text-gray-500">penalties</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Mobile Prize Display */}
                    <div className="sm:hidden mt-2 pt-2 border-t border-gray-100">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Prize:</span>
                        <span className="font-bold text-purple-600">
                          {prizeAmount > 0 ? `৳${prizeAmount}` : 'No prize'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No Data Available</h3>
              <p className="text-gray-500">
                {selectedMonthData?.name} data will appear here once the gameweeks begin.
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
                Live monthly data • Transfer penalties deducted • Last updated: {new Date().toLocaleString('en-US', { 
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

export default MonthlyPrizes;