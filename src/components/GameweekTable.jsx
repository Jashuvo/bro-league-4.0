import React, { useState, useMemo } from 'react';
import {
  Calendar, Trophy, Crown, Medal, Award, ChevronRight,
  ChevronLeft, Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from './ui/Card';
import Badge from './ui/Badge';
import LivePointsTable from './LivePointsTable';

const GameweekTable = ({ gameweekTable = [], currentGameweek = 3, loading = false, bootstrap = {} }) => {
  const [selectedGameweek, setSelectedGameweek] = useState(currentGameweek);
  const [expandedRow, setExpandedRow] = useState(null);
  const [showLivePoints, setShowLivePoints] = useState(false);

  const toggleRowExpansion = (managerId) => {
    setExpandedRow(expandedRow === managerId ? null : managerId);
  };

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

  const gameweekData = useMemo(() => {
    const gw = gameweekTable.find(g => g.gameweek === selectedGameweek);
    if (!gw?.managers) return [];

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
          overallRank: manager.rank || manager.overall_rank || 0
        };
      })
      .sort((a, b) => b.netPoints - a.netPoints);

    return managersWithNetPoints.map((manager, index) => ({
      ...manager,
      currentGWRank: index + 1
    }));
  }, [gameweekTable, selectedGameweek]);

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

  const weeklyStats = useMemo(() => {
    if (!gameweekTable.length) return {};

    // Calculate stats across all gameweeks
    const completedWeeks = gameweekTable.filter(gw => {
      const gwData = bootstrap?.gameweeks?.find(g => g.id === gw.gameweek);
      return gwData?.finished;
    });

    const totalPrizesAwarded = completedWeeks.length * 30;

    // Find highest score across all weeks
    let highestScore = 0;
    let highestScorer = '';

    gameweekTable.forEach(gw => {
      if (gw.managers) {
        gw.managers.forEach(m => {
          const net = (m.gameweekPoints || m.points || 0) - (m.transfersCost || 0);
          if (net > highestScore) {
            highestScore = net;
            highestScorer = m.managerName || m.name;
          }
        });
      }
    });

    return {
      completedWeeks: completedWeeks.length,
      totalPrizesAwarded,
      highestScore,
      highestScorer
    };
  }, [gameweekTable, bootstrap]);

  const getPositionIcon = (position) => {
    if (position === 1) return <Crown className="text-yellow-400 fill-yellow-400" size={20} />;
    if (position === 2) return <Medal className="text-gray-300 fill-gray-300" size={20} />;
    if (position === 3) return <Award className="text-orange-400 fill-orange-400" size={20} />;
    return <span className="font-bold text-bro-muted w-5 text-center">{position}</span>;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-bro-card/50 rounded-xl animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-purple-600 to-blue-600 border-none">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-lg">
              <Calendar size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-display font-bold">Gameweek History</h2>
              <p className="text-white/80 text-lg">
                GW {selectedGameweek} • {gameweekData.length} Managers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {selectedGameweekStatus === 'current' && (
              <button
                onClick={() => setShowLivePoints(!showLivePoints)}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${showLivePoints
                  ? 'bg-white text-purple-600 shadow-lg'
                  : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
              >
                <Target size={16} />
                {showLivePoints ? 'Show Normal' : 'Live Points'}
              </button>
            )}

            <Badge
              variant={selectedGameweekStatus === 'completed' ? 'success' : selectedGameweekStatus === 'current' ? 'primary' : 'warning'}
              className="px-4 py-2 text-sm bg-white/20 border-white/20 text-white backdrop-blur-md"
            >
              {selectedGameweekStatus === 'completed' ? 'Completed' : selectedGameweekStatus === 'current' ? 'Live' : 'Upcoming'}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {/* Current GW Stats */}
          {gameweekStats.highest && (
            <>
              <StatBox value={gameweekStats.highest} label="GW Highest" />
              <StatBox value={gameweekStats.average} label="GW Average" />
            </>
          )}

          {/* Overall Weekly Stats */}
          {weeklyStats.totalPrizesAwarded !== undefined && (
            <>
              <StatBox value={`৳${weeklyStats.totalPrizesAwarded}`} label="Total Prizes" />
              <StatBox value={weeklyStats.completedWeeks} label="Weeks Done" />
            </>
          )}
        </div>
      </Card>

      {/* Gameweek Navigation */}
      <div className="flex items-center justify-between bg-base-200 p-4 rounded-xl border border-base-content/5">
        <button
          onClick={() => setSelectedGameweek(Math.max(1, selectedGameweek - 1))}
          disabled={selectedGameweek <= 1}
          className="p-2 rounded-lg hover:bg-base-content/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base-content"
        >
          <ChevronLeft size={24} />
        </button>

        <div className="text-center">
          <div className="font-bold text-xl text-base-content">Gameweek {selectedGameweek}</div>
          <div className="text-sm text-bro-muted">
            {selectedGameweekStatus === 'completed' && '✅ Completed'}
            {selectedGameweekStatus === 'current' && '🔄 Current'}
            {selectedGameweekStatus === 'upcoming' && '⏳ Upcoming'}
          </div>
        </div>

        <button
          onClick={() => setSelectedGameweek(Math.min(38, selectedGameweek + 1))}
          disabled={selectedGameweek >= 38}
          className="p-2 rounded-lg hover:bg-base-content/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base-content"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Main Table Content */}
      <div className="space-y-3">
        {showLivePoints && selectedGameweekStatus === 'current' ? (
          <LivePointsTable gameweek={selectedGameweek} />
        ) : (
          <>
            {!gameweekData || gameweekData.length === 0 ? (
              <div className="p-12 text-center text-bro-muted">
                <Calendar className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg">No data available for Gameweek {selectedGameweek}</p>
              </div>
            ) : (
              gameweekData.map((manager, index) => {
                const position = manager.currentGWRank;
                const prize = position === 1 && selectedGameweekStatus === 'completed' ? 30 : 0;

                return (
                  <motion.div
                    key={manager.id || manager.entry}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className={`p-0 overflow-hidden transition-all duration-300 ${expandedRow === (manager.id || manager.entry) ? 'ring-2 ring-bro-primary' : 'hover:bg-base-content/5'}`}
                    >
                      <div
                        className="p-4 flex items-center gap-4 cursor-pointer"
                        onClick={() => toggleRowExpansion(manager.id || manager.entry)}
                      >
                        <div className="flex-shrink-0 w-8 flex justify-center">
                          {getPositionIcon(position)}
                        </div>

                        <div className="flex-grow min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className={`font-bold text-lg truncate ${position === 1 ? 'text-yellow-400' : 'text-base-content'}`}>
                              {manager.managerName || manager.name}
                            </h3>
                            {position <= 3 && getPositionIcon(position)}
                          </div>
                          <p className="text-bro-muted text-sm truncate">{manager.teamName || manager.entry_name}</p>
                        </div>

                        <div className="text-right">
                          <div className="font-bold text-xl text-bro-primary">{manager.netPoints}</div>
                          <div className="text-xs text-bro-muted">Net</div>
                        </div>

                        <ChevronRight
                          className={`text-bro-muted transition-transform duration-300 ${expandedRow === (manager.id || manager.entry) ? 'rotate-90' : ''}`}
                          size={20}
                        />
                      </div>

                      <AnimatePresence>
                        {expandedRow === (manager.id || manager.entry) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-base-300/50 border-t border-base-content/5 p-4"
                          >
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                              <div className="bg-base-content/5 rounded-lg p-2 text-center border border-base-content/5">
                                <div className="text-xs text-bro-muted">Raw Points</div>
                                <div className="font-bold text-base-content">{manager.rawPoints}</div>
                              </div>
                              <div className="bg-base-content/5 rounded-lg p-2 text-center border border-base-content/5">
                                <div className="text-xs text-bro-muted">Penalty</div>
                                <div className="font-bold text-red-400">-{manager.transfersCost}</div>
                              </div>
                              <div className="bg-base-content/5 rounded-lg p-2 text-center border border-base-content/5">
                                <div className="text-xs text-bro-muted">GW Rank</div>
                                <div className="font-bold text-purple-400">#{position}</div>
                              </div>
                              <div className="bg-base-content/5 rounded-lg p-2 text-center border border-base-content/5">
                                <div className="text-xs text-bro-muted">Overall Rank</div>
                                <div className="font-bold text-blue-400">#{manager.overallRank?.toLocaleString() || 'N/A'}</div>
                              </div>
                            </div>

                            {prize > 0 && (
                              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2 text-green-400">
                                <Trophy size={18} />
                                <span className="font-bold">Weekly Winner - ৳{prize} Prize!</span>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

const StatBox = ({ value, label }) => (
  <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm border border-white/10">
    <div className="text-xl font-bold text-white">{value}</div>
    <div className="text-xs font-medium text-white/80">{label}</div>
  </div>
);

export default GameweekTable;