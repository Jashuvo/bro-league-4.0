// src/components/WeeklyPrizes.jsx - Updated with Theme Support & Animations
import React, { useState, useMemo } from 'react';
import {
  Zap, Trophy, Crown, Medal, Award, Calendar, Target, TrendingUp, Clock,
  DollarSign, ChevronRight, Users, Star, Gift, ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const WeeklyPrizes = ({ gameweekTable = [], gameweekInfo = {}, loading = false }) => {
  const currentGW = gameweekInfo.current || 3;
  const [selectedGameweek, setSelectedGameweek] = useState(currentGW);
  const [expandedRow, setExpandedRow] = useState(null);

  // Toggle row expansion
  const toggleRowExpansion = (managerId) => {
    setExpandedRow(expandedRow === managerId ? null : managerId);
  };

  // Position styling
  const getPositionStyling = (position) => {
    if (position === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 shadow-lg shadow-yellow-500/20';
    if (position === 2) return 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-900 shadow-lg shadow-gray-500/20';
    if (position === 3) return 'bg-gradient-to-r from-orange-400 to-orange-500 text-orange-900 shadow-lg shadow-orange-500/20';
    if (position <= 5) return 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md shadow-green-500/20';
    if (position <= 10) return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/20';
    return 'bg-base-300 text-base-content border border-base-content/10';
  };

  // Position icons
  const getPositionIcon = (position) => {
    if (position === 1) return <Crown className="text-yellow-900" size={16} />;
    if (position === 2) return <Medal className="text-gray-900" size={16} />;
    if (position === 3) return <Award className="text-orange-900" size={16} />;
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
      <div className="bg-base-100 rounded-xl shadow-lg border border-base-content/10 overflow-hidden">
        <div className="p-8">
          <div className="animate-pulse space-y-4">
            {Array(5).map((_, i) => (
              <div key={i} className="h-16 bg-base-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-base-100 rounded-xl shadow-lg border border-base-content/10 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Zap size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Weekly Competitions</h2>
              <p className="text-purple-100">
                GW {selectedGameweek} • ৳30 Weekly Prize
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-full backdrop-blur-sm">
            <Trophy size={16} />
            <span className="text-sm">
              {selectedGameweekData?.status === 'completed' ? 'Winner Declared' :
                selectedGameweekData?.status === 'current' ? 'Live Competition' : 'Upcoming'}
            </span>
          </div>
        </div>

        {/* Quick Stats */}
        {weeklyStats.completedWeeks && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm border border-white/10">
              <div className="text-xl font-bold">{weeklyStats.completedWeeks}</div>
              <div className="text-sm opacity-80">Completed</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm border border-white/10">
              <div className="text-xl font-bold">৳{weeklyStats.totalPrizesAwarded}</div>
              <div className="text-sm opacity-80">Prizes Awarded</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm border border-white/10">
              <div className="text-xl font-bold">{weeklyStats.averageWinningScore}</div>
              <div className="text-sm opacity-80">Avg Winning Score</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm border border-white/10">
              <div className="text-xl font-bold">{weeklyStats.highestWinningScore}</div>
              <div className="text-sm opacity-80">Highest Win</div>
            </div>
          </div>
        )}
      </div>

      {/* Gameweek Navigation */}
      <div className="p-4 border-b border-base-content/10 bg-base-200/50">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedGameweek(Math.max(1, selectedGameweek - 1))}
            disabled={selectedGameweek <= 1}
            className="flex items-center gap-2 px-3 py-2 bg-base-100 border border-base-content/10 rounded-lg hover:bg-base-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base-content"
          >
            <ChevronLeft size={16} />
            <span className="hidden sm:inline">Previous</span>
          </button>

          <div className="text-center">
            <div className="font-bold text-lg text-base-content">Gameweek {selectedGameweek}</div>
            <div className="text-sm text-base-content/60">
              {selectedGameweekData?.status === 'completed' && `✅ Winner: ${selectedGameweekData.winner?.managerName || selectedGameweekData.winner?.name}`}
              {selectedGameweekData?.status === 'current' && '🔄 Live Competition'}
              {selectedGameweekData?.status === 'upcoming' && '⏳ Upcoming Competition'}
            </div>
          </div>

          <button
            onClick={() => setSelectedGameweek(Math.min(38, selectedGameweek + 1))}
            disabled={selectedGameweek >= 38}
            className="flex items-center gap-2 px-3 py-2 bg-base-100 border border-base-content/10 rounded-lg hover:bg-base-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base-content"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Weekly Overview Cards */}
      <div className="p-4 border-b border-base-content/10 bg-base-200/30">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Winner Card */}
          {selectedGameweekData?.winner && (
            <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/20">
                  <Crown className="text-white" size={20} />
                </div>
                <div>
                  <div className="font-bold text-base-content">{selectedGameweekData.winner.managerName || selectedGameweekData.winner.name}</div>
                  <div className="text-sm text-base-content/60">{selectedGameweekData.winner.netPoints} points</div>
                  {selectedGameweekData.status === 'completed' && (
                    <div className="text-xs text-green-500 font-semibold">৳30 Prize Winner!</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Stats Card */}
          {selectedGameweekData && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">{selectedGameweekData.totalManagers}</div>
                <div className="text-sm text-base-content/70">Participants</div>
                <div className="text-xs text-base-content/50 mt-1">Avg: {selectedGameweekData.averagePoints} pts</div>
              </div>
            </div>
          )}

          {/* Competition Info */}
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-500">৳30</div>
              <div className="text-sm text-base-content/70">Weekly Prize</div>
              <div className="text-xs text-base-content/50 mt-1">Highest net score wins</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="overflow-x-auto">
        {!selectedGameweekData || !selectedGameweekData.managers.length ? (
          <div className="p-12 text-center text-base-content/50">
            <Zap className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg">No data available for Gameweek {selectedGameweek}</p>
          </div>
        ) : (
          <div className="divide-y divide-base-content/5">
            {selectedGameweekData.managers.slice(0, 10).map((manager, index) => { // Show top 10
              const position = manager.position;

              return (
                <motion.div
                  key={manager.id || manager.entry}
                  className="hover:bg-base-200/50 transition-colors"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {/* Main Row */}
                  <div
                    className="p-4 cursor-pointer flex items-center justify-between"
                    onClick={() => toggleRowExpansion(manager.id || manager.entry)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {/* Position */}
                      <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm
                        ${getPositionStyling(position)}
                      `}>
                        {getPositionIcon(position) || position}
                      </div>

                      {/* Manager Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base-content text-lg">
                            {manager.managerName || manager.name}
                          </h3>
                          {position <= 3 && (
                            <div className="flex">
                              {getPositionIcon(position)}
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-base-content/60">
                          {manager.teamName || manager.entry_name}
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-base-content/50">
                          <span>Weekly Rank: #{position}</span>
                          {manager.prize > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-green-500 font-semibold">৳{manager.prize} Winner!</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Points Display */}
                      <div className="text-right">
                        <div className="flex items-center gap-4">
                          {/* Raw Points */}
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-500">
                              {manager.rawPoints}
                            </div>
                            <div className="text-xs text-base-content/50">Raw</div>
                          </div>

                          {/* Penalties */}
                          <div className="text-center">
                            <div className={`text-lg font-bold ${manager.transfersCost > 0 ? 'text-red-500' : 'text-base-content/30'
                              }`}>
                              -{manager.transfersCost}
                            </div>
                            <div className="text-xs text-base-content/50">Penalty</div>
                          </div>

                          {/* Net Points */}
                          <div className="text-center">
                            <div className={`text-xl font-bold ${position === 1 ? 'text-yellow-500' : 'text-purple-500'
                              }`}>
                              {manager.netPoints}
                            </div>
                            <div className="text-xs text-base-content/50">Net</div>
                          </div>

                          {/* Expand Arrow */}
                          <div className="ml-2">
                            <ChevronRight
                              className={`text-base-content/30 transition-transform ${expandedRow === (manager.id || manager.entry) ? 'rotate-90' : ''
                                }`}
                              size={20}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Row */}
                  <AnimatePresence>
                    {expandedRow === (manager.id || manager.entry) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="px-4 overflow-hidden bg-base-200/30 border-t border-base-content/5"
                      >
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
                          <div className="bg-base-100 rounded-lg p-3 text-center shadow-sm border border-base-content/5">
                            <div className="text-lg font-bold text-purple-500">#{position}</div>
                            <div className="text-xs text-base-content/60">Weekly Rank</div>
                          </div>
                          <div className="bg-base-100 rounded-lg p-3 text-center shadow-sm border border-base-content/5">
                            <div className="text-lg font-bold text-blue-500">{manager.rawPoints}</div>
                            <div className="text-xs text-base-content/60">Raw Points</div>
                          </div>
                          <div className="bg-base-100 rounded-lg p-3 text-center shadow-sm border border-base-content/5">
                            <div className="text-lg font-bold text-red-500">{manager.transfersCost}</div>
                            <div className="text-xs text-base-content/60">Transfer Cost</div>
                          </div>
                          <div className="bg-base-100 rounded-lg p-3 text-center shadow-sm border border-base-content/5">
                            <div className="text-lg font-bold text-green-500">{manager.netPoints}</div>
                            <div className="text-xs text-base-content/60">Final Score</div>
                          </div>
                        </div>

                        {manager.prize > 0 && (
                          <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                            <div className="flex items-center gap-2 text-yellow-600">
                              <Crown size={16} />
                              <span className="font-semibold">🏆 Weekly Champion - ৳{manager.prize} Prize Winner!</span>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-base-200 border-t border-base-content/10 p-4">
        <div className="text-center text-sm text-base-content/60">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
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
    </motion.div>
  );
};

export default WeeklyPrizes;