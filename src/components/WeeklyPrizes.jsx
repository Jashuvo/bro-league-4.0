import React, { useState, useMemo } from 'react';
import { Trophy, Zap, Target, Calendar, Crown, TrendingUp, Clock, Filter, ChevronDown } from 'lucide-react';

const WeeklyPrizes = ({ gameweekTable = [], gameweekInfo = {}, loading = false }) => {
  const currentGW = gameweekInfo.current || 3;
  const [showCompleted, setShowCompleted] = useState(true);
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [sortOrder, setSortOrder] = useState('desc'); // desc = newest first

  const weeklyWinners = useMemo(() => {
    if (!gameweekTable.length) return [];

    return gameweekTable
      .map(gw => {
        if (!gw.managers || gw.managers.length === 0) return null;

        // Find winner (highest net score)
        let winner = null;
        let highestNet = -999;

        gw.managers.forEach(manager => {
          const gwPoints = manager.gameweekPoints || manager.points || 0;
          const penalties = manager.transfersCost || 0;
          const netScore = gwPoints - penalties;

          if (netScore > highestNet) {
            highestNet = netScore;
            winner = {
              id: manager.id || manager.entry,
              name: manager.managerName || `Manager ${manager.id || manager.entry}`,
              teamName: manager.teamName || 'Unknown Team',
              points: netScore,
              rawPoints: gwPoints,
              penalties: penalties
            };
          }
        });

        if (!winner) return null;

        return {
          gameweek: gw.gameweek,
          winner,
          status: gw.gameweek < currentGW ? 'completed' : 
                 gw.gameweek === currentGW ? 'current' : 'upcoming',
          prize: 30
        };
      })
      .filter(Boolean)
      .sort((a, b) => sortOrder === 'desc' ? b.gameweek - a.gameweek : a.gameweek - b.gameweek);
  }, [gameweekTable, currentGW, sortOrder]);

  const filteredWinners = useMemo(() => {
    return weeklyWinners.filter(gw => {
      if (gw.status === 'completed' && !showCompleted) return false;
      if (gw.status === 'upcoming' && !showUpcoming) return false;
      return true;
    });
  }, [weeklyWinners, showCompleted, showUpcoming]);

  const weeklyStats = useMemo(() => {
    const completed = weeklyWinners.filter(gw => gw.status === 'completed');
    const totalDistributed = completed.length * 30;
    const remaining = (38 - completed.length) * 30;
    
    // Winner frequency
    const winnerCounts = {};
    completed.forEach(gw => {
      const name = gw.winner.name;
      winnerCounts[name] = (winnerCounts[name] || 0) + 1;
    });
    
    const mostWins = Object.entries(winnerCounts)
      .sort(([,a], [,b]) => b - a)[0];

    return {
      totalDistributed,
      remaining,
      gamesCompleted: completed.length,
      gamesRemaining: 38 - completed.length,
      mostSuccessful: mostWins ? { name: mostWins[0], wins: mostWins[1] } : null,
      averageWinningScore: completed.length > 0 
        ? Math.round(completed.reduce((sum, gw) => sum + gw.winner.points, 0) / completed.length)
        : 0
    };
  }, [weeklyWinners]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-8 text-center">
          <Trophy className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Loading Weekly Data...</h3>
          <p className="text-gray-500">Fetching weekly winners and prizes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <Trophy size={20} />
            Weekly Champions
          </h2>
          <div className="text-purple-100 text-sm">
            ৳30 each gameweek
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 border-b border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="font-bold text-xl text-purple-600">৳{weeklyStats.totalDistributed}</div>
            <div className="text-xs text-gray-600">Distributed</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-xl text-pink-600">৳{weeklyStats.remaining}</div>
            <div className="text-xs text-gray-600">Remaining</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-xl text-blue-600">{weeklyStats.averageWinningScore}</div>
            <div className="text-xs text-gray-600">Avg Win Score</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-xl text-green-600">{weeklyStats.gamesCompleted}</div>
            <div className="text-xs text-gray-600">GWs Complete</div>
          </div>
        </div>

        {weeklyStats.mostSuccessful && (
          <div className="mt-4 bg-white/60 rounded-lg p-3 text-center">
            <div className="text-sm font-medium text-gray-700">Most Successful</div>
            <div className="font-bold text-purple-600">{weeklyStats.mostSuccessful.name}</div>
            <div className="text-xs text-gray-600">{weeklyStats.mostSuccessful.wins} wins</div>
          </div>
        )}
      </div>

      {/* Filters & Controls */}
      <div className="bg-gray-50 border-b border-gray-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Show:</span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Completed ({weeklyStats.gamesCompleted})</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showUpcoming}
                onChange={(e) => setShowUpcoming(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Upcoming ({weeklyStats.gamesRemaining})</span>
            </label>
          </div>

          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <span>GW {sortOrder === 'desc' ? 'Latest' : 'Oldest'}</span>
            <ChevronDown size={14} className={`transform transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Winners Table */}
      <div className="overflow-hidden">
        {filteredWinners.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="text-left p-4 font-semibold text-gray-700">GW</th>
                  <th className="text-center p-4 font-semibold text-gray-700 hidden sm:table-cell">🏆</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Champion</th>
                  <th className="text-center p-4 font-semibold text-gray-700">Net Score</th>
                  <th className="text-center p-4 font-semibold text-gray-700 hidden md:table-cell">Penalties</th>
                  <th className="text-center p-4 font-semibold text-gray-700">Prize</th>
                  <th className="text-center p-4 font-semibold text-gray-700 hidden lg:table-cell">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredWinners.map((gw) => {
                  const isRecent = gw.gameweek >= currentGW - 2;
                  const isCurrent = gw.status === 'current';
                  const isCompleted = gw.status === 'completed';

                  return (
                    <tr
                      key={gw.gameweek}
                      className={`
                        border-b border-gray-100 hover:bg-gray-50 transition-colors
                        ${isCurrent ? 'bg-gradient-to-r from-blue-50 to-purple-50' : ''}
                        ${isRecent && isCompleted ? 'bg-gradient-to-r from-green-50 to-teal-50' : ''}
                      `}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg text-purple-600">{gw.gameweek}</span>
                          {isRecent && <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>}
                        </div>
                      </td>

                      <td className="p-4 text-center hidden sm:table-cell">
                        {isCompleted && <Crown className="text-yellow-500 mx-auto" size={18} />}
                        {isCurrent && <Clock className="text-blue-500 mx-auto" size={18} />}
                        {gw.status === 'upcoming' && <Target className="text-gray-400 mx-auto" size={18} />}
                      </td>

                      <td className="p-4">
                        <div className="font-semibold text-gray-900">{gw.winner.name}</div>
                        <div className="text-sm text-gray-500">{gw.winner.teamName}</div>
                      </td>

                      <td className="p-4 text-center">
                        <div className={`
                          inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-bold
                          ${isCompleted ? 'bg-green-100 text-green-800' : 
                            isCurrent ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}
                        `}>
                          <Zap size={12} />
                          {gw.winner.points}
                        </div>
                        {gw.winner.penalties > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {gw.winner.rawPoints} - {gw.winner.penalties} = {gw.winner.points}
                          </div>
                        )}
                      </td>

                      <td className="p-4 text-center hidden md:table-cell">
                        <span className={`font-semibold ${gw.winner.penalties > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                          {gw.winner.penalties > 0 ? `-${gw.winner.penalties}` : '0'}
                        </span>
                      </td>

                      <td className="p-4 text-center">
                        <span className={`font-bold text-lg ${isCompleted ? 'text-purple-600' : 'text-gray-400'}`}>
                          {isCompleted ? '৳30' : '--'}
                        </span>
                        {isCompleted && (
                          <div className="text-xs text-green-600 mt-1">✅ Paid</div>
                        )}
                      </td>

                      <td className="p-4 text-center hidden lg:table-cell">
                        <div className={`
                          px-2 py-1 rounded-full text-xs font-medium
                          ${isCompleted ? 'bg-green-100 text-green-800' :
                            isCurrent ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}
                        `}>
                          {isCompleted ? 'Complete' : isCurrent ? 'Current' : 'Upcoming'}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Trophy size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No Winners to Show</h3>
            <p className="text-gray-500">
              Adjust your filters to see weekly champions
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t border-gray-200 p-4">
        <div className="text-center text-sm text-gray-600">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span>
              Weekly gameweek champions • ৳30 per win • Net points after penalties • 
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

export default WeeklyPrizes;