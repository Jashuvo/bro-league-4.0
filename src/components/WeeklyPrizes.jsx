import React, { useState, useMemo } from 'react';
import {
  Zap, Trophy, Crown, Medal, Award, ChevronRight, ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from './ui/Card';
import Badge from './ui/Badge';

const WeeklyPrizes = ({ gameweekTable = [], gameweekInfo = {}, loading = false }) => {
  const currentGW = gameweekInfo.current || 3;
  const [selectedGameweek, setSelectedGameweek] = useState(currentGW);
  const [expandedRow, setExpandedRow] = useState(null);

  const toggleRowExpansion = (managerId) => {
    setExpandedRow(expandedRow === managerId ? null : managerId);
  };

  const getPositionIcon = (position) => {
    if (position === 1) return <Crown className="text-yellow-400 fill-yellow-400" size={20} />;
    if (position === 2) return <Medal className="text-gray-300 fill-gray-300" size={20} />;
    if (position === 3) return <Award className="text-orange-400 fill-orange-400" size={20} />;
    return <span className="font-bold text-bro-muted w-5 text-center">{position}</span>;
  };

  const getGameweekStatus = (gameweekId) => {
    if (gameweekId < currentGW) return 'completed';
    if (gameweekId === currentGW) return 'current';
    return 'upcoming';
  };

  const weeklyWinners = useMemo(() => {
    if (!gameweekTable.length) return [];

    return gameweekTable
      .map(gw => {
        if (!gw.managers || gw.managers.length === 0) return null;

        const managersWithNetPoints = gw.managers
          .filter(m => m.points > 0)
          .map(manager => {
            const rawPoints = manager.gameweekPoints || manager.points || 0;
            const transfersCost = manager.transfersCost || manager.event_transfers_cost || manager.transferCost || manager.transfers_cost || manager.penalty || manager.hit || 0;
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
      .reverse();
  }, [gameweekTable, currentGW]);

  const selectedGameweekData = weeklyWinners.find(w => w.gameweek === selectedGameweek);

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
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 border-none">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-lg">
              <Zap size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-display font-bold">Weekly Competitions</h2>
              <p className="text-white/80 text-lg">
                GW {selectedGameweek} • ৳30 Weekly Prize
              </p>
            </div>
          </div>

          <Badge
            variant={selectedGameweekData?.status === 'completed' ? 'success' : selectedGameweekData?.status === 'current' ? 'primary' : 'warning'}
            className="px-4 py-2 text-sm bg-white/20 border-white/20 text-white backdrop-blur-md"
          >
            <Trophy size={16} className="mr-2" />
            {selectedGameweekData?.status === 'completed' ? 'Winner Declared' : selectedGameweekData?.status === 'current' ? 'Live Competition' : 'Upcoming'}
          </Badge>
        </div>

        {weeklyStats.completedWeeks && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <StatBox value={weeklyStats.completedWeeks} label="Completed" />
            <StatBox value={`৳${weeklyStats.totalPrizesAwarded}`} label="Prizes Awarded" />
            <StatBox value={weeklyStats.averageWinningScore} label="Avg Winning Score" />
            <StatBox value={weeklyStats.highestWinningScore} label="Highest Win" />
          </div>
        )}
      </Card>

      {/* Gameweek Navigation */}
      <div className="flex items-center justify-between bg-bro-card p-4 rounded-xl border border-white/5">
        <button
          onClick={() => setSelectedGameweek(Math.max(1, selectedGameweek - 1))}
          disabled={selectedGameweek <= 1}
          className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white"
        >
          <ChevronLeft size={24} />
        </button>

        <div className="text-center">
          <div className="font-bold text-xl text-white">Gameweek {selectedGameweek}</div>
          <div className="text-sm text-bro-muted">
            {selectedGameweekData?.status === 'completed' && `✅ Winner: ${selectedGameweekData.winner?.managerName || selectedGameweekData.winner?.name}`}
            {selectedGameweekData?.status === 'current' && '🔄 Live Competition'}
            {selectedGameweekData?.status === 'upcoming' && '⏳ Upcoming Competition'}
          </div>
        </div>

        <button
          onClick={() => setSelectedGameweek(Math.min(38, selectedGameweek + 1))}
          disabled={selectedGameweek >= 38}
          className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Standings List */}
      <div className="space-y-3">
        {!selectedGameweekData || !selectedGameweekData.managers.length ? (
          <div className="p-12 text-center text-bro-muted">
            <Zap className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg">No data available for Gameweek {selectedGameweek}</p>
          </div>
        ) : (
          selectedGameweekData.managers.slice(0, 10).map((manager, index) => (
            <motion.div
              key={manager.id || manager.entry}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className={`p-0 overflow-hidden transition-all duration-300 ${expandedRow === (manager.id || manager.entry) ? 'ring-2 ring-bro-primary' : 'hover:bg-white/5'}`}
              >
                <div
                  className="p-4 flex items-center gap-4 cursor-pointer"
                  onClick={() => toggleRowExpansion(manager.id || manager.entry)}
                >
                  <div className="flex-shrink-0 w-8 flex justify-center">
                    {getPositionIcon(manager.position)}
                  </div>

                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-bold text-lg truncate ${manager.position === 1 ? 'text-yellow-400' : 'text-white'}`}>
                        {manager.managerName || manager.name}
                      </h3>
                      {manager.position <= 3 && getPositionIcon(manager.position)}
                    </div>
                    <p className="text-bro-muted text-sm truncate">{manager.teamName || manager.entry_name}</p>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-xl text-bro-primary">{manager.netPoints}</div>
                    <div className="text-xs text-bro-muted">Net Points</div>
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
                      className="bg-black/20 border-t border-white/5 p-4"
                    >
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
                          <div className="text-xs text-bro-muted">Raw Points</div>
                          <div className="font-bold text-white">{manager.rawPoints}</div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
                          <div className="text-xs text-bro-muted">Penalty</div>
                          <div className="font-bold text-red-400">-{manager.transfersCost}</div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
                          <div className="text-xs text-bro-muted">Net Score</div>
                          <div className="font-bold text-green-400">{manager.netPoints}</div>
                        </div>
                      </div>

                      {manager.prize > 0 && (
                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center gap-2 text-yellow-400">
                          <Crown size={18} />
                          <span className="font-bold">Weekly Champion - ৳{manager.prize} Prize Winner!</span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          ))
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

export default WeeklyPrizes;