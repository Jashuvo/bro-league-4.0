// src/components/WeeklyPrizes.jsx - Updated to match League Table UI design
import React, { useState, useMemo } from 'react';
import { 
  Zap, Trophy, Crown, Medal, Award, Calendar, Target, TrendingUp, Clock, 
  DollarSign, ChevronRight, Users, Star, Gift, ChevronLeft
} from 'lucide-react';

const WeeklyPrizes = ({ gameweekTable = [], gameweekInfo = {}, loading = false }) => {
  const currentGW = gameweekInfo.current || 3;
  const [selectedGameweek, setSelectedGameweek] = useState(currentGW);
  const [expandedRow, setExpandedRow] = useState(null);

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

  // Get gameweek status
  const getGameweekStatus = (gameweekId) => {
    if (gameweekId < currentGW) return 'completed';
    if (gameweekId === currentGW) return 'current';
    return 'upcoming';
  };

  // Calculate weekly winners with enhanced data
  const weeklyWinners = useMemo(() => {
    if (!gameweekTable.length) return [];

    return gameweekTable
      .map(gw => {
        if (!gw.managers || gw.managers.length === 0) return null;

        // Apply transfer cost deduction BEFORE sorting
        const managersWithNetPoints = gw.managers
          .filter(m => m.points > 0)
          .map(manager => {
            const rawPoints = manager.gameweekPoints || manager.points || 0;
            const transfersCost = manager.transfersCost || 
                                 manager.event_transfers_cost || 
                                 manager.transferCost || 
                                 manager.transfers_cost ||
                                 manager.penalty ||
                                 manager.hit ||
                                 0;
            const netPoints = rawPoints - transfersCost;

            return {
              ...manager,
              rawPoints,
              transfersCost,
              netPoints,
              gameweek: gw.gameweek
            };
          })
          .sort((a, b) => b.netPoints - a.netPoints);

        if (managersWithNetPoints.length === 0) return null;

        // Add rankings
        const rankedManagers = managersWithNetPoints.map((manager, index) => ({
          ...manager,
          position: index + 1,
          prize: index === 0 ? 30 : 0
        }));

        return {
          gameweek: gw.gameweek,
          status: getGameweekStatus(gw.gameweek),
          managers: rankedManagers,
          winner: rankedManagers[0],
          totalManagers: rankedManagers.length,
          averagePoints: Math.round(rankedManagers.reduce((sum, m) => sum + m.netPoints, 0) / rankedManagers.length),
          highestPoints: rankedManagers[0]?.netPoints || 0
        };
      })
      .filter(Boolean)
      .reverse(); // Show most recent first
  }, [gameweekTable, currentGW]);

  // Get selected gameweek data
  const selectedGameweekData = weeklyWinners.find(w => w.gameweek === selectedGameweek);

  // Calculate overall weekly stats
  const weeklyStats = useMemo(() => {
    const completedWeeks = weeklyWinners.filter(w => w.status === 'completed');
    if (completedWeeks.length === 0) return {};

    const totalPrizesAwarded = completedWeeks.length * 30;
    const allHighScores = completedWeeks.map(w => w.highestPoints);
    const averageWinningScore = Math.round(allHighScores.reduce((sum, score) => sum + score, 0) / allHighScores.length);

    return {
      completedWeeks: completedWeeks.length,
      totalPrizesAwarded,
      averageWinningScore,
      highestWinningScore: Math.max(...allHighScores),
      remainingWeeks: 38 - completedWeeks.length
    };
  }, [weeklyWinners]);

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
              <Zap size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Weekly Competitions</h2>
              <p className="text-purple-100">
                GW {selectedGameweek} • ৳30 Weekly Prize
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-full">
            <Trophy size={16} />
            <span className="text-sm">
              {selectedGameweekData?.status === 'completed' ? 'Winner Declared' : 
               selectedGameweekData?.status === 'current' ? 'Live Competition' : 'Upcoming'}
            </span>
          </div>
        </div>

        {/* Quick Stats - Same as League Table */}
        {weeklyStats.completedWeeks && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-xl font-bold">{weeklyStats.completedWeeks}</div>
              <div className="text-sm opacity-80">Completed</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-xl font-bold">৳{weeklyStats.totalPrizesAwarded}</div>
              <div className="text-sm opacity-80">Prizes Awarded</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-xl font-bold">{weeklyStats.averageWinningScore}</div>
              <div className="text-sm opacity-80">Avg Winning Score</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-xl font-bold">{weeklyStats.highestWinningScore}</div>
              <div className="text-sm opacity-80">Highest Win</div>
            </div>
          </div>
        )}
      </div>

      {/* Gameweek Navigation */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedGameweek(Math.max(1, selectedGameweek - 1))}
            disabled={selectedGameweek <= 1}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} />
            <span className="hidden sm:inline">Previous</span>
          </button>
          
          <div className="text-center">
            <div className="font-bold text-lg text-gray-900">Gameweek {selectedGameweek}</div>
            <div className="text-sm text-gray-600">
              {selectedGameweekData?.status === 'completed' && `✅ Winner: ${selectedGameweekData.winner?.managerName || selectedGameweekData.winner?.name}`}
              {selectedGameweekData?.status === 'current' && '🔄 Live Competition'}
              {selectedGameweekData?.status === 'upcoming' && '⏳ Upcoming Competition'}
            </div>
          </div>
          
          <button
            onClick={() => setSelectedGameweek(Math.min(38, selectedGameweek + 1))}
            disabled={selectedGameweek >= 38}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Weekly Overview Cards */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Winner Card */}
          {selectedGameweekData?.winner && (
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                  <Crown className="text-white" size={20} />
                </div>
                <div>
                  <div className="font-bold text-gray-900">{selectedGameweekData.winner.managerName || selectedGameweekData.winner.name}</div>
                  <div className="text-sm text-gray-600">{selectedGameweekData.winner.netPoints} points</div>
                  {selectedGameweekData.status === 'completed' && (
                    <div className="text-xs text-green-600 font-semibold">৳30 Prize Winner!</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Stats Card */}
          {selectedGameweekData && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{selectedGameweekData.totalManagers}</div>
                <div className="text-sm text-gray-600">Participants</div>
                <div className="text-xs text-gray-500 mt-1">Avg: {selectedGameweekData.averagePoints} pts</div>
              </div>
            </div>
          )}

          {/* Competition Info */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">৳30</div>
              <div className="text-sm text-gray-600">Weekly Prize</div>
              <div className="text-xs text-gray-500 mt-1">Highest net score wins</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Content - Same style as League Table */}
      <div className="overflow-x-auto">
        {!selectedGameweekData || !selectedGameweekData.managers.length ? (
          <div className="p-8 text-center text-gray-500">
            <Zap className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No data available for Gameweek {selectedGameweek}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {selectedGameweekData.managers.slice(0, 10).map((manager) => { // Show top 10
              const position = manager.position;

              return (
                <div key={manager.id || manager.entry} className="hover:bg-gray-50 transition-colors">
                  {/* Main Row - Same layout as League Table */}
                  <div 
                    className="p-4 cursor-pointer flex items-center justify-between"
                    onClick={() => toggleRowExpansion(manager.id || manager.entry)}
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
                            {manager.managerName || manager.name}
                          </h3>
                          {position <= 3 && (
                            <div className="flex">
                              {getPositionIcon(position)}
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {manager.teamName || manager.entry_name}
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          <span>Weekly Rank: #{position}</span>
                          {manager.prize > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-green-600 font-semibold">৳{manager.prize} Winner!</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Points Display - Same layout as League Table */}
                      <div className="text-right">
                        <div className="flex items-center gap-4">
                          {/* Raw Points */}
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">
                              {manager.rawPoints}
                            </div>
                            <div className="text-xs text-gray-500">Raw</div>
                          </div>

                          {/* Penalties */}
                          <div className="text-center">
                            <div className={`text-lg font-bold ${
                              manager.transfersCost > 0 ? 'text-red-600' : 'text-gray-400'
                            }`}>
                              -{manager.transfersCost}
                            </div>
                            <div className="text-xs text-gray-500">Penalty</div>
                          </div>

                          {/* Net Points */}
                          <div className="text-center">
                            <div className={`text-xl font-bold ${
                              position === 1 ? 'text-yellow-600' : 'text-purple-600'
                            }`}>
                              {manager.netPoints}
                            </div>
                            <div className="text-xs text-gray-500">Net</div>
                          </div>

                          {/* Expand Arrow */}
                          <div className="ml-2">
                            <ChevronRight 
                              className={`text-gray-400 transition-transform ${
                                expandedRow === (manager.id || manager.entry) ? 'rotate-90' : ''
                              }`} 
                              size={20} 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Row - Same style as League Table */}
                  {expandedRow === (manager.id || manager.entry) && (
                    <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100 animate-fade-in-up">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                          <div className="text-lg font-bold text-purple-600">#{position}</div>
                          <div className="text-xs text-gray-600">Weekly Rank</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                          <div className="text-lg font-bold text-blue-600">{manager.rawPoints}</div>
                          <div className="text-xs text-gray-600">Raw Points</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                          <div className="text-lg font-bold text-red-600">{manager.transfersCost}</div>
                          <div className="text-xs text-gray-600">Transfer Cost</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                          <div className="text-lg font-bold text-green-600">{manager.netPoints}</div>
                          <div className="text-xs text-gray-600">Final Score</div>
                        </div>
                      </div>

                      {manager.prize > 0 && (
                        <div className="mt-4 p-3 bg-yellow-100 border border-yellow-200 rounded-lg">
                          <div className="flex items-center gap-2 text-yellow-800">
                            <Crown size={16} />
                            <span className="font-semibold">🏆 Weekly Champion - ৳{manager.prize} Prize Winner!</span>
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
              Weekly winners determined by highest net score (raw points - transfer penalties) • Last updated: {new Date().toLocaleString('en-US', { 
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