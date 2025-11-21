// src/components/GameweekTable.jsx - Updated to match League Table UI design + Current GW Rank
import React, { useState, useMemo } from 'react';
import {
  Trophy, TrendingUp, TrendingDown, Minus, Crown, Medal, Award, ChevronRight,
  ChevronLeft, Calendar, Target, Zap, Users, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GameweekTable = ({ gameweekTable = [], currentGameweek = 3, loading = false, bootstrap = {} }) => {
  const [selectedGameweek, setSelectedGameweek] = useState(currentGameweek);
  const [expandedRow, setExpandedRow] = useState(null);

  // Toggle row expansion
  const toggleRowExpansion = (managerId) => {
    setExpandedRow(expandedRow === managerId ? null : managerId);
  };

  // Enhanced gameweek status determination
  const getGameweekStatus = (gameweekId) => {
    const gameweekData = bootstrap?.gameweeks?.find(gw => gw.id === gameweekId);

    if (gameweekData?.finished) return 'completed';
    if (gameweekData?.is_current) return 'current';
    if (gameweekData?.is_next) return 'next';
    if (gameweekId < currentGameweek) return 'completed';
    if (gameweekId === currentGameweek) return 'current';
    return 'upcoming';
  };

  const selectedGameweekStatus = getGameweekStatus(selectedGameweek);

  // Calculate gameweek data and rankings
  const gameweekData = useMemo(() => {
    const gw = gameweekTable.find(g => g.gameweek === selectedGameweek);
    if (!gw?.managers) return [];

    // Calculate net points and rank managers for THIS gameweek
    const managersWithNetPoints = gw.managers
      .filter(m => m.points > 0)
      .map(manager => {
        const rawPoints = manager.gameweekPoints || manager.points || 0;
        const transfersCost = manager.transfersCost || manager.event_transfers_cost || manager.transferCost || 0;
        const netPoints = rawPoints - transfersCost;

        return {
          ...manager,
          rawPoints,
          transfersCost,
          netPoints,
          overallRank: manager.rank || manager.overall_rank || 0 // Overall rank for this gameweek
        };
      })
      .sort((a, b) => b.netPoints - a.netPoints);

    // Add current gameweek ranking
    return managersWithNetPoints.map((manager, index) => ({
      ...manager,
      currentGWRank: index + 1 // Current gameweek rank
    }));
  }, [gameweekTable, selectedGameweek]);

  // Calculate gameweek stats
  const gameweekStats = useMemo(() => {
    if (gameweekData.length === 0) return {};

    const netScores = gameweekData.map(m => m.netPoints);
    const rawScores = gameweekData.map(m => m.rawPoints);
    const penalties = gameweekData.map(m => m.transfersCost).filter(p => p > 0);

    return {
      highest: Math.max(...netScores),
      highestRaw: Math.max(...rawScores),
      average: Math.round(netScores.reduce((sum, score) => sum + score, 0) / netScores.length),
      totalPenalties: penalties.reduce((sum, penalty) => sum + penalty, 0),
      managersWithPenalties: penalties.length,
      totalManagers: gameweekData.length
    };
  }, [gameweekData]);

  // Position styling (same as League Table)
  const getPositionStyling = (position) => {
    if (position === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 shadow-lg shadow-yellow-500/20';
    if (position === 2) return 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800 shadow-lg shadow-gray-400/20';
    if (position === 3) return 'bg-gradient-to-r from-orange-400 to-orange-500 text-orange-900 shadow-lg shadow-orange-500/20';
    if (position <= 5) return 'bg-gradient-to-r from-green-400 to-green-500 text-green-900 shadow-md shadow-green-500/20';
    if (position <= 10) return 'bg-gradient-to-r from-blue-400 to-blue-500 text-blue-900 shadow-md shadow-blue-500/20';
    return 'bg-base-300 text-base-content border border-base-content/10';
  };

  // Position icons (same as League Table)
  const getPositionIcon = (position) => {
    if (position === 1) return <Crown size={16} />;
    if (position === 2) return <Medal size={16} />;
    if (position === 3) return <Award size={16} />;
    return null;
  };

  // Points color class
  const getPointsColorClass = (points) => {
    if (points >= 80) return 'text-green-500';
    if (points >= 60) return 'text-blue-500';
    if (points >= 40) return 'text-base-content';
    return 'text-red-500';
  };

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
      {/* Header - Same style as League Table */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pitch-pattern"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Calendar size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Gameweek History</h2>
                <p className="text-purple-100">
                  GW {selectedGameweek} • {gameweekData.length} Managers
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-full backdrop-blur-sm border border-white/10">
              <Target size={16} />
              <span className="text-sm font-medium">
                {selectedGameweekStatus === 'completed' ? 'Completed' :
                  selectedGameweekStatus === 'current' ? 'Live' : 'Upcoming'}
              </span>
            </div>
          </div>

          {/* Quick Stats - Same as League Table */}
          {gameweekStats.highest && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white/10 rounded-lg p-3 text-center backdrop-blur-sm border border-white/10">
                <div className="text-xl font-bold">{gameweekStats.highest}</div>
                <div className="text-sm opacity-80">Highest Net</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center backdrop-blur-sm border border-white/10">
                <div className="text-xl font-bold">{gameweekStats.average}</div>
                <div className="text-sm opacity-80">Average</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center backdrop-blur-sm border border-white/10">
                <div className="text-xl font-bold">-{gameweekStats.totalPenalties}</div>
                <div className="text-sm opacity-80">Penalties</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center backdrop-blur-sm border border-white/10">
                <div className="text-xl font-bold">{gameweekStats.totalManagers}</div>
                <div className="text-sm opacity-80">Managers</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Gameweek Navigation */}
      <div className="p-4 border-b border-base-content/10 bg-base-200/30">
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
              {selectedGameweekStatus === 'completed' && '✅ Completed'}
              {selectedGameweekStatus === 'current' && '🔄 Current'}
              {selectedGameweekStatus === 'upcoming' && '⏳ Upcoming'}
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

      {/* Main Table Content - Same style as League Table */}
      <div className="overflow-x-auto">
        {!gameweekData || gameweekData.length === 0 ? (
          <div className="p-8 text-center text-base-content/60">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-base-content/30" />
            <p>No data available for Gameweek {selectedGameweek}</p>
          </div>
        ) : (
          <div className="divide-y divide-base-content/5">
            {gameweekData.map((manager, index) => {
              const position = manager.currentGWRank; // Use current GW rank
              const prize = position === 1 && selectedGameweekStatus === 'completed' ? 30 : 0;

              return (
                <motion.div
                  key={manager.id || manager.entry}
                  className="hover:bg-base-200/50 transition-colors"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {/* Main Row - Same layout as League Table */}
                  <div
                    className="p-4 cursor-pointer flex items-center justify-between"
                    onClick={() => toggleRowExpansion(manager.id || manager.entry)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {/* Position - Same styling as League Table */}
                      <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shrink-0
                        ${getPositionStyling(position)}
                      `}>
                        {getPositionIcon(position) || position}
                      </div>

                      {/* Manager Info - Same layout as League Table */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base-content text-lg truncate">
                            {manager.managerName || manager.name}
                          </h3>
                          {position <= 3 && (
                            <div className="flex shrink-0">
                              {getPositionIcon(position)}
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-base-content/70 truncate">
                          {manager.teamName || manager.entry_name}
                        </p>
                        <div className="flex items-center gap-2 sm:gap-4 mt-1 text-xs text-base-content/50 flex-wrap">
                          <span>GW Rank: #{position}</span>
                          <span className="hidden sm:inline">•</span>
                          <span className="hidden sm:inline">Overall: #{manager.overallRank?.toLocaleString() || 'N/A'}</span>
                          {prize > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-green-500 font-semibold">৳{prize} Won!</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Points Display - Same layout as League Table */}
                      <div className="text-right pl-2">
                        <div className="flex items-center gap-2 sm:gap-4">
                          {/* Raw Points */}
                          <div className="text-center hidden sm:block">
                            <div className="text-lg font-bold text-blue-500">
                              {manager.rawPoints}
                            </div>
                            <div className="text-xs text-base-content/50">Raw</div>
                          </div>

                          {/* Penalties */}
                          <div className="text-center hidden sm:block">
                            <div className={`text-lg font-bold ${manager.transfersCost > 0 ? 'text-red-500' : 'text-base-content/30'
                              }`}>
                              -{manager.transfersCost}
                            </div>
                            <div className="text-xs text-base-content/50">Penalty</div>
                          </div>

                          {/* Net Points */}
                          <div className="text-center min-w-[60px]">
                            <div className={`text-xl font-bold ${getPointsColorClass(manager.netPoints)}`}>
                              {manager.netPoints}
                            </div>
                            <div className="text-xs text-base-content/50">Net</div>
                          </div>

                          {/* Expand Arrow */}
                          <div className="ml-2">
                            <ChevronRight
                              className={`text-base-content/40 transition-transform duration-300 ${expandedRow === (manager.id || manager.entry) ? 'rotate-90' : ''
                                }`}
                              size={20}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Row - Same style as League Table */}
                  <AnimatePresence>
                    {expandedRow === (manager.id || manager.entry) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-base-200/50 px-4 overflow-hidden"
                      >
                        <div className="pb-4 pt-2 border-t border-base-content/5">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {/* Mobile Stats */}
                            <div className="bg-base-100 rounded-lg p-3 text-center shadow-sm border border-base-content/5 sm:hidden">
                              <div className="text-lg font-bold text-blue-500">{manager.rawPoints}</div>
                              <div className="text-xs text-base-content/60">Raw Points</div>
                            </div>
                            <div className="bg-base-100 rounded-lg p-3 text-center shadow-sm border border-base-content/5 sm:hidden">
                              <div className="text-lg font-bold text-red-500">-{manager.transfersCost}</div>
                              <div className="text-xs text-base-content/60">Penalty</div>
                            </div>

                            <div className="bg-base-100 rounded-lg p-3 text-center shadow-sm border border-base-content/5">
                              <div className="text-lg font-bold text-purple-500">#{position}</div>
                              <div className="text-xs text-base-content/60">GW Rank</div>
                            </div>
                            <div className="bg-base-100 rounded-lg p-3 text-center shadow-sm border border-base-content/5">
                              <div className="text-lg font-bold text-blue-500">#{manager.overallRank?.toLocaleString() || 'N/A'}</div>
                              <div className="text-xs text-base-content/60">Overall Rank</div>
                            </div>
                            <div className="bg-base-100 rounded-lg p-3 text-center shadow-sm border border-base-content/5">
                              <div className="text-lg font-bold text-green-500">{manager.transfers || 0}</div>
                              <div className="text-xs text-base-content/60">Transfers</div>
                            </div>
                            <div className="bg-base-100 rounded-lg p-3 text-center shadow-sm border border-base-content/5">
                              <div className="text-lg font-bold text-orange-500">{manager.benchPoints || 0}</div>
                              <div className="text-xs text-base-content/60">Bench Points</div>
                            </div>
                          </div>

                          {prize > 0 && (
                            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                <Trophy size={16} />
                                <span className="font-semibold">Weekly Winner - ৳{prize} Prize!</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer - Same style as League Table */}
      <div className="bg-base-200/50 border-t border-base-content/10 p-4">
        <div className="text-center text-sm text-base-content/60">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>
              Gameweek rankings based on net points (raw points - penalties) • Last updated: {new Date().toLocaleString('en-US', {
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

export default GameweekTable;