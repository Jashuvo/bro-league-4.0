// src/components/MonthlyPrizes.jsx - Updated to match League Table UI design
import React, { useState, useMemo } from 'react';
import { 
  Calendar, Trophy, Crown, Medal, Award, Zap, Target, TrendingUp, Clock, 
  DollarSign, ChevronRight, Users, Star, Gift
} from 'lucide-react';

const MonthlyPrizes = ({ gameweekTable = [], gameweekInfo = {}, bootstrap = {}, loading = false }) => {
  const currentGW = gameweekInfo.current || 3;
  const [expandedRow, setExpandedRow] = useState(null);
  
  const months = [
    { id: 1, name: "Month 1", gameweeks: [1, 2, 3, 4], prizes: [350, 250, 150] },
    { id: 2, name: "Month 2", gameweeks: [5, 6, 7, 8], prizes: [350, 250, 150] },
    { id: 3, name: "Month 3", gameweeks: [9, 10, 11, 12], prizes: [350, 250, 150] },
    { id: 4, name: "Month 4", gameweeks: [13, 14, 15, 16], prizes: [350, 250, 150] },
    { id: 5, name: "Month 5", gameweeks: [17, 18, 19, 20], prizes: [350, 250, 150] },
    { id: 6, name: "Month 6", gameweeks: [21, 22, 23, 24], prizes: [350, 250, 150] },
    { id: 7, name: "Month 7", gameweeks: [25, 26, 27, 28], prizes: [350, 250, 150] },
    { id: 8, name: "Month 8", gameweeks: [29, 30, 31, 32], prizes: [350, 250, 150] },
    { id: 9, name: "Final Month", gameweeks: [33, 34, 35, 36, 37, 38], prizes: [500, 400, 250] }
  ];

  const [selectedMonth, setSelectedMonth] = useState(() => {
    return months.find(m => currentGW >= m.gameweeks[0] && currentGW <= m.gameweeks[m.gameweeks.length - 1])?.id || 1;
  });

  // Toggle row expansion
  const toggleRowExpansion = (managerId) => {
    setExpandedRow(expandedRow === managerId ? null : managerId);
  };

  // Position styling (same as League Table)
  const getPositionStyling = (position) => {
    if (position === 1) return 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg';
    if (position === 2) return 'bg-gradient-to-br from-gray-400 to-gray-600 text-white shadow-md';
    if (position === 3) return 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md';
    if (position <= 5) return 'bg-gradient-to-br from-green-500 to-green-600 text-white';
    if (position <= 10) return 'bg-gradient-to-br from-blue-500 to-blue-600 text-white';
    return 'bg-gray-100 text-gray-700 border border-gray-300';
  };

  // Position icons (same as League Table)
  const getPositionIcon = (position) => {
    if (position === 1) return <Crown className="text-yellow-300" size={16} />;
    if (position === 2) return <Medal className="text-gray-300" size={16} />;
    if (position === 3) return <Award className="text-orange-300" size={16} />;
    return null;
  };

  // Calculate monthly standings
  const monthlyStandings = useMemo(() => {
    const selectedMonthData = months.find(m => m.id === selectedMonth);
    if (!selectedMonthData || !gameweekTable.length) return [];

    // Get gameweeks for this month
    const monthGameweeks = gameweekTable.filter(gw => 
      selectedMonthData.gameweeks.includes(gw.gameweek)
    );

    if (monthGameweeks.length === 0) return [];

    // Calculate total points for each manager across the month
    const managerTotals = {};
    
    monthGameweeks.forEach(gw => {
      if (gw.managers) {
        gw.managers.forEach(manager => {
          const managerId = manager.id || manager.entry;
          if (!managerTotals[managerId]) {
            managerTotals[managerId] = {
              id: managerId,
              name: manager.managerName || manager.name,
              teamName: manager.teamName || manager.entry_name,
              totalPoints: 0,
              gameweeksPlayed: 0,
              details: []
            };
          }
          
          const netPoints = (manager.gameweekPoints || manager.points || 0) - 
                           (manager.transfersCost || manager.event_transfers_cost || 0);
          
          managerTotals[managerId].totalPoints += netPoints;
          managerTotals[managerId].gameweeksPlayed++;
          managerTotals[managerId].details.push({
            gameweek: gw.gameweek,
            points: netPoints,
            rawPoints: manager.gameweekPoints || manager.points || 0,
            transfersCost: manager.transfersCost || manager.event_transfers_cost || 0
          });
        });
      }
    });

    // Convert to array and sort by total points
    return Object.values(managerTotals)
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((manager, index) => ({
        ...manager,
        position: index + 1,
        averagePoints: Math.round(manager.totalPoints / (manager.gameweeksPlayed || 1)),
        prize: index < selectedMonthData.prizes.length ? selectedMonthData.prizes[index] : 0
      }));
  }, [gameweekTable, selectedMonth, months]);

  // Calculate month stats
  const monthStats = useMemo(() => {
    if (monthlyStandings.length === 0) return {};
    
    const allPoints = monthlyStandings.map(m => m.totalPoints);
    const totalPrizes = months.find(m => m.id === selectedMonth)?.prizes.reduce((sum, prize) => sum + prize, 0) || 0;
    
    return {
      highest: Math.max(...allPoints),
      average: Math.round(allPoints.reduce((sum, points) => sum + points, 0) / allPoints.length),
      totalPrizes,
      participants: monthlyStandings.length
    };
  }, [monthlyStandings, selectedMonth, months]);

  // Get month status
  const getMonthStatus = (month) => {
    const completedGWs = month.gameweeks.filter(gw => gw < currentGW).length;
    const totalGWs = month.gameweeks.length;
    
    if (completedGWs === totalGWs) return 'completed';
    if (completedGWs > 0) return 'active';
    return 'upcoming';
  };

  const selectedMonthData = months.find(m => m.id === selectedMonth);
  const monthStatus = getMonthStatus(selectedMonthData);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-8">
          <div className="animate-pulse space-y-4">
            {Array(5).map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header - Same style as League Table */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Calendar size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Monthly Competitions</h2>
              <p className="text-purple-100">
                {selectedMonthData?.name} • GW {selectedMonthData?.gameweeks[0]}-{selectedMonthData?.gameweeks[selectedMonthData.gameweeks.length - 1]}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-full">
            <Gift size={16} />
            <span className="text-sm">
              {monthStatus === 'completed' ? 'Complete' : 
               monthStatus === 'active' ? 'Active' : 'Upcoming'}
            </span>
          </div>
        </div>

        {/* Quick Stats - Same as League Table */}
        {monthStats.highest && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-xl font-bold">{monthStats.highest}</div>
              <div className="text-sm opacity-80">Highest Total</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-xl font-bold">{monthStats.average}</div>
              <div className="text-sm opacity-80">Average</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-xl font-bold">৳{monthStats.totalPrizes}</div>
              <div className="text-sm opacity-80">Total Prizes</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-xl font-bold">{monthStats.participants}</div>
              <div className="text-sm opacity-80">Participants</div>
            </div>
          </div>
        )}
      </div>

      {/* Month Navigation */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-3 md:grid-cols-9 gap-2">
          {months.map(month => {
            const status = getMonthStatus(month);
            return (
              <button
                key={month.id}
                onClick={() => setSelectedMonth(month.id)}
                className={`
                  p-2 rounded-lg text-xs font-medium transition-all text-center
                  ${selectedMonth === month.id
                    ? 'bg-purple-600 text-white shadow-lg scale-105'
                    : status === 'completed'
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : status === 'active'
                    ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                `}
              >
                <div className="font-semibold">{month.name.replace(' ', '\n')}</div>
                <div className="text-xs mt-1">GW {month.gameweeks[0]}-{month.gameweeks[month.gameweeks.length - 1]}</div>
                {status === 'completed' && <div className="text-xs mt-1">✅</div>}
                {status === 'active' && <div className="text-xs mt-1">🔄</div>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Table Content - Same style as League Table */}
      <div className="overflow-x-auto">
        {!monthlyStandings || monthlyStandings.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No data available for {selectedMonthData?.name}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {monthlyStandings.map((manager) => {
              const position = manager.position;

              return (
                <div key={manager.id} className="hover:bg-gray-50 transition-colors">
                  {/* Main Row - Same layout as League Table */}
                  <div 
                    className="p-4 cursor-pointer flex items-center justify-between"
                    onClick={() => toggleRowExpansion(manager.id)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {/* Position - Same styling as League Table */}
                      <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm
                        ${getPositionStyling(position)}
                      `}>
                        {getPositionIcon(position) || position}
                      </div>

                      {/* Manager Info - Same layout as League Table */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900 text-lg">
                            {manager.name}
                          </h3>
                          {position <= 3 && (
                            <div className="flex">
                              {getPositionIcon(position)}
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {manager.teamName}
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          <span>Avg: {manager.averagePoints} pts</span>
                          <span>•</span>
                          <span>GWs Played: {manager.gameweeksPlayed}</span>
                          {manager.prize > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-green-600 font-semibold">৳{manager.prize} Prize!</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Points Display - Same layout as League Table */}
                      <div className="text-right">
                        <div className="flex items-center gap-4">
                          {/* Total Points */}
                          <div className="text-center">
                            <div className="text-xl font-bold text-purple-600">
                              {manager.totalPoints}
                            </div>
                            <div className="text-xs text-gray-500">Total</div>
                          </div>

                          {/* Average */}
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">
                              {manager.averagePoints}
                            </div>
                            <div className="text-xs text-gray-500">Avg</div>
                          </div>

                          {/* Expand Arrow */}
                          <div className="ml-2">
                            <ChevronRight 
                              className={`text-gray-400 transition-transform ${
                                expandedRow === manager.id ? 'rotate-90' : ''
                              }`} 
                              size={20} 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Row - Same style as League Table */}
                  {expandedRow === manager.id && (
                    <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100 animate-fade-in-up">
                      <div className="mt-4">
                        <h4 className="font-semibold text-gray-900 mb-3">Gameweek Breakdown</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {manager.details.map((detail, index) => (
                            <div key={index} className="bg-white rounded-lg p-3 shadow-sm">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-900">GW {detail.gameweek}</span>
                                <span className="font-bold text-purple-600">{detail.points}</span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {detail.rawPoints} raw - {detail.transfersCost} penalty
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {manager.prize > 0 && (
                        <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2 text-green-800">
                            <Trophy size={16} />
                            <span className="font-semibold">
                              {position === 1 ? '🥇' : position === 2 ? '🥈' : '🥉'} 
                              {position === 1 ? ' Monthly Champion' : position === 2 ? ' Runner-up' : ' Third Place'} - ৳{manager.prize} Prize!
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer - Same style as League Table */}
      <div className="bg-gray-50 border-t border-gray-200 p-4">
        <div className="text-center text-sm text-gray-600">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>
              Monthly rankings based on cumulative net points across all gameweeks • Last updated: {new Date().toLocaleString('en-US', { 
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

export default MonthlyPrizes;