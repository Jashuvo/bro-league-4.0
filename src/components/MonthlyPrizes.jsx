import React, { useState, useMemo } from 'react';
import { Calendar, Trophy, Crown, Medal, Award, Zap, Target, TrendingUp, Clock, DollarSign } from 'lucide-react';

const MonthlyPrizes = ({ gameweekTable = [], gameweekInfo = {}, loading = false }) => {
  const currentGW = gameweekInfo.current || 3;
  
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

  const getMonthStatus = (month) => {
    const lastGW = month.gameweeks[month.gameweeks.length - 1];
    if (currentGW > lastGW) return 'completed';
    if (currentGW >= month.gameweeks[0]) return 'active';
    return 'upcoming';
  };

  const calculateMonthStandings = useMemo(() => {
    const selectedMonthData = months.find(m => m.id === selectedMonth);
    if (!selectedMonthData || !gameweekTable.length) return [];

    const managerTotals = {};

    selectedMonthData.gameweeks.forEach(gw => {
      const gameweekData = gameweekTable.find(g => g.gameweek === gw);
      if (!gameweekData?.managers) return;

      gameweekData.managers.forEach(manager => {
        const managerId = manager.id || manager.entry;
        const gwPoints = manager.gameweekPoints || manager.points || 0;
        const penalties = manager.transfersCost || 0;
        const netPoints = gwPoints - penalties;

        if (!managerTotals[managerId]) {
          managerTotals[managerId] = {
            id: managerId,
            name: manager.managerName || `Manager ${managerId}`,
            teamName: manager.teamName || 'Unknown Team',
            totalPoints: 0,
            rawPoints: 0,
            totalPenalties: 0,
            gameweeksPlayed: 0
          };
        }

        managerTotals[managerId].totalPoints += netPoints;
        managerTotals[managerId].rawPoints += gwPoints;
        managerTotals[managerId].totalPenalties += penalties;
        managerTotals[managerId].gameweeksPlayed += 1;
      });
    });

    return Object.values(managerTotals)
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((manager, index) => ({
        ...manager,
        rank: index + 1,
        prize: selectedMonthData.prizes[index] || 0
      }));
  }, [selectedMonth, gameweekTable, months]);

  const selectedMonthData = months.find(m => m.id === selectedMonth);
  const monthStatus = getMonthStatus(selectedMonthData);
  const completedGWs = selectedMonthData?.gameweeks.filter(gw => gw < currentGW).length || 0;
  const totalGWs = selectedMonthData?.gameweeks.length || 0;
  const progress = Math.round((completedGWs / totalGWs) * 100);

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="text-yellow-500" size={18} />;
    if (rank === 2) return <Medal className="text-gray-400" size={18} />;
    if (rank === 3) return <Award className="text-orange-400" size={18} />;
    return <span className="text-gray-600 font-bold text-sm">{rank}</span>;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <div className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">✅ Completed</div>;
      case 'active':
        return <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">🔄 Active</div>;
      default:
        return <div className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">⏳ Upcoming</div>;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-8 text-center">
          <Calendar className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Loading Monthly Data...</h3>
          <p className="text-gray-500">Calculating monthly standings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <Calendar size={20} />
            Monthly Competitions
          </h2>
          <div className="text-green-100 text-sm">
            ৳750 per month
          </div>
        </div>
      </div>

      {/* Month Selector */}
      <div className="bg-gray-50 border-b border-gray-200 p-4">
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
          {months.map((month) => {
            const status = getMonthStatus(month);
            return (
              <button
                key={month.id}
                onClick={() => setSelectedMonth(month.id)}
                className={`
                  p-2 rounded-lg text-xs font-medium transition-all duration-200
                  ${selectedMonth === month.id
                    ? 'bg-green-600 text-white shadow-lg scale-105'
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

      {/* Month Overview */}
      <div className="bg-gradient-to-r from-green-50 to-teal-50 p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{selectedMonthData?.name}</h3>
            <p className="text-sm text-gray-600">
              Gameweeks {selectedMonthData?.gameweeks[0]} - {selectedMonthData?.gameweeks[selectedMonthData.gameweeks.length - 1]}
            </p>
          </div>
          <div className="text-right">
            {getStatusBadge(monthStatus)}
            <div className="text-sm text-gray-600 mt-1">
              ৳{selectedMonthData?.prizes.reduce((sum, prize) => sum + prize, 0)} total
            </div>
          </div>
        </div>

        {monthStatus === 'active' && (
          <div className="bg-white/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm font-bold text-blue-600">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-teal-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {completedGWs} of {totalGWs} gameweeks completed
            </div>
          </div>
        )}

        {/* Prize Structure */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          {selectedMonthData?.prizes.map((prize, index) => (
            <div key={index} className="bg-white/50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-green-600">৳{prize}</div>
              <div className="text-xs text-gray-600">
                {index === 0 ? '1st Place' : index === 1 ? '2nd Place' : '3rd Place'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Standings Table */}
      <div className="overflow-hidden">
        {calculateMonthStandings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="text-left p-4 font-semibold text-gray-700">Rank</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Manager</th>
                  <th className="text-center p-4 font-semibold text-gray-700">Net Points</th>
                  <th className="text-center p-4 font-semibold text-gray-700 hidden sm:table-cell">Raw Points</th>
                  <th className="text-center p-4 font-semibold text-gray-700 hidden md:table-cell">Penalties</th>
                  <th className="text-center p-4 font-semibold text-gray-700">Prize</th>
                </tr>
              </thead>
              <tbody>
                {calculateMonthStandings.map((manager) => {
                  const isWinner = manager.rank <= 3 && manager.prize > 0;
                  return (
                    <tr
                      key={manager.id}
                      className={`
                        border-b border-gray-100 hover:bg-gray-50 transition-colors
                        ${manager.rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : ''}
                      `}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getRankIcon(manager.rank)}
                        </div>
                      </td>
                      
                      <td className="p-4">
                        <div className="font-semibold text-gray-900">{manager.name}</div>
                        <div className="text-sm text-gray-500">{manager.teamName}</div>
                        <div className="text-xs text-gray-400">{manager.gameweeksPlayed} GWs played</div>
                      </td>

                      <td className="p-4 text-center">
                        <div className={`
                          inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-bold
                          ${isWinner ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                        `}>
                          <Zap size={12} />
                          {manager.totalPoints}
                        </div>
                      </td>

                      <td className="p-4 text-center hidden sm:table-cell">
                        <span className="font-semibold text-blue-600">{manager.rawPoints}</span>
                      </td>

                      <td className="p-4 text-center hidden md:table-cell">
                        <span className={`font-semibold ${manager.totalPenalties > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                          {manager.totalPenalties > 0 ? `-${manager.totalPenalties}` : '0'}
                        </span>
                      </td>

                      <td className="p-4 text-center">
                        <span className={`font-bold text-lg ${manager.prize > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                          {manager.prize > 0 ? `৳${manager.prize}` : '--'}
                        </span>
                        {manager.prize > 0 && monthStatus === 'completed' && (
                          <div className="text-xs text-green-600 mt-1">✅ Won</div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No Data Available</h3>
            <p className="text-gray-500">
              {selectedMonthData?.name} data will appear here once gameweeks begin.
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
              Monthly net points competition • Transfer penalties deducted • 
              Updated: {new Date().toLocaleString('en-US', { 
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