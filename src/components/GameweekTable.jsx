import React, { useState, useMemo } from 'react';
import {
  Calendar, ChevronRight, ChevronLeft, Target, ArrowRight, Repeat
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from './ui/Card';
import Badge from './ui/Badge';
import Button from './ui/Button';
import SectionBanner from './ui/SectionBanner';
import { Whistle, RankBadge, Coins } from './ui/Doodles';
import LivePointsTable from './LivePointsTable';
import TeamView from './TeamView';
import WeeklyStory from './WeeklyStory';
import CaptainWatch from './CaptainWatch';

const GameweekTable = ({ gameweekTable = [], currentGameweek = 1, loading = false, bootstrap = {}, standings = [] }) => {
  const [selectedGameweek, setSelectedGameweek] = useState(currentGameweek);
  const [expandedRow, setExpandedRow] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
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

  // Season-wide transfer activity — reshaped from the per-gameweek
  // `transfers` figure that's already in gameweekTable, no new fetching.
  const transferLeaderboard = useMemo(() => {
    const totals = {};
    gameweekTable.forEach((gw) => {
      gw.managers?.forEach((manager) => {
        const id = manager.id;
        if (!totals[id]) {
          totals[id] = {
            id,
            name: manager.managerName || manager.name,
            teamName: manager.teamName,
            totalTransfers: 0,
            totalHits: 0
          };
        }
        totals[id].totalTransfers += manager.transfers || 0;
        totals[id].totalHits += manager.transferCost || 0;
      });
    });

    return Object.values(totals)
      .filter((m) => m.totalTransfers > 0)
      .sort((a, b) => b.totalTransfers - a.totalTransfers)
      .slice(0, 5);
  }, [gameweekTable]);


  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-surface-sunk rounded-3xl border-2 border-ink/10 animate-pulse"></div>
        ))}
      </div>
    );
  }

  const bannerStats = [
    ...(gameweekStats.highest
      ? [
        { value: gameweekStats.highest, label: 'GW Highest' },
        { value: gameweekStats.average, label: 'GW Average' },
      ]
      : []),
    ...(weeklyStats.totalPrizesAwarded !== undefined
      ? [
        { value: `৳${weeklyStats.totalPrizesAwarded}`, label: 'Total Prizes' },
        { value: weeklyStats.completedWeeks, label: 'Weeks Done' },
      ]
      : []),
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {/* Header Banner */}
        <SectionBanner
          tone="sky"
          art={<Whistle size={34} />}
          title="Gameweek History"
          subtitle={`GW ${selectedGameweek} • ${gameweekData.length} Managers`}
          stats={bannerStats}
          actions={
            <>
              {selectedGameweekStatus === 'current' && (
                <button
                  onClick={() => setShowLivePoints(!showLivePoints)}
                  className={`px-4 py-2 text-sm font-bold rounded-2xl border-2 border-ink/85 btn-pop flex items-center gap-2 ${showLivePoints
                    ? 'bg-sunflower text-ink'
                    : 'bg-surface-alt text-ink'
                    }`}
                >
                  <Target size={16} />
                  {showLivePoints ? 'Show Normal' : 'Live Points'}
                </button>
              )}

              <Badge
                variant={selectedGameweekStatus === 'completed' ? 'success' : selectedGameweekStatus === 'current' ? 'gold' : 'default'}
                className="px-3 py-1.5 text-sm"
              >
                {selectedGameweekStatus === 'completed' ? 'Completed' : selectedGameweekStatus === 'current' ? 'Live' : 'Upcoming'}
              </Badge>
            </>
          }
        />

        {/* Gameweek Navigation */}
        <div className="flex items-center justify-between bg-surface-alt p-3 rounded-3xl border-2 border-ink/85 shadow-card">
          <button
            onClick={() => setSelectedGameweek(Math.max(1, selectedGameweek - 1))}
            disabled={selectedGameweek <= 1}
            aria-label="Previous gameweek"
            className="p-2 rounded-xl border-2 border-ink/85 bg-surface-sunk text-ink btn-pop disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={22} />
          </button>

          <div className="text-center">
            <div className="font-display font-bold text-xl text-ink">Gameweek {selectedGameweek}</div>
            <div className="text-xs font-bold uppercase tracking-wider text-ink-soft">
              {selectedGameweekStatus === 'completed' && 'Completed'}
              {selectedGameweekStatus === 'current' && 'In progress'}
              {selectedGameweekStatus === 'upcoming' && 'Upcoming'}
            </div>
          </div>

          <button
            onClick={() => setSelectedGameweek(Math.min(38, selectedGameweek + 1))}
            disabled={selectedGameweek >= 38}
            aria-label="Next gameweek"
            className="p-2 rounded-xl border-2 border-ink/85 bg-surface-sunk text-ink btn-pop disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight size={22} />
          </button>
        </div>

        {/* This Week's Story */}
        <WeeklyStory gameweekTable={gameweekTable} gameweek={selectedGameweek} />

        {/* Captain Watch + League Differentials — no picks exist yet for
            an upcoming gameweek, so only fetch once it's underway. */}
        <CaptainWatch
          standings={standings}
          gameweek={selectedGameweek}
          enabled={selectedGameweekStatus === 'current' || selectedGameweekStatus === 'completed'}
        />

        {/* Transfer Activity Leaderboard */}
        {transferLeaderboard.length > 0 && (
          <Card>
            <h3 className="text-lg font-display font-bold text-ink flex items-center gap-2 mb-4">
              <Repeat className="text-mint" size={20} />
              Most Active in the Transfer Market
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {transferLeaderboard.map((manager, index) => (
                <div key={manager.id} className="bg-mint/12 rounded-2xl p-3 flex items-center justify-between gap-2 border-2 border-ink/15">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-mint border-2 border-ink/85 text-ink flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-ink truncate">{manager.name}</div>
                      {manager.totalHits > 0 && (
                        <div className="text-xs font-semibold text-coral">-{manager.totalHits} pts in hits</div>
                      )}
                    </div>
                  </div>
                  <div className="text-lg font-display font-bold text-pitch flex-shrink-0">{manager.totalTransfers}</div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Main Table Content */}
        <div className="space-y-3">
          {showLivePoints && selectedGameweekStatus === 'current' ? (
            <LivePointsTable gameweek={selectedGameweek} />
          ) : (
            <>
              {!gameweekData || gameweekData.length === 0 ? (
                <div className="p-12 text-center">
                  <Calendar className="w-14 h-14 mx-auto mb-4 text-ink/20" />
                  <p className="text-lg font-bold text-ink-soft">No data available for Gameweek {selectedGameweek}</p>
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
                        tone={position === 1 ? 'sunflower' : position === 2 ? 'mint' : position === 3 ? 'coral' : 'paper'}
                        className={`p-0 overflow-hidden transition-colors duration-300 ${expandedRow === (manager.id || manager.entry) ? 'bg-surface-sunk' : 'hover:bg-surface-sunk/60'}`}
                      >
                        <div
                          className="p-3 md:p-4 flex items-center gap-3 md:gap-4 cursor-pointer"
                          onClick={() => toggleRowExpansion(manager.id || manager.entry)}
                        >
                          <RankBadge rank={position} size={position <= 3 ? 44 : 38} className="shrink-0" />

                          <div className="flex-grow min-w-0">
                            <h3 className="font-display font-bold text-lg truncate text-ink">
                              {manager.managerName || manager.name}
                            </h3>
                            <p className="text-ink-soft text-sm font-medium truncate">{manager.teamName || manager.entry_name}</p>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="font-display font-bold text-xl text-violet leading-tight">
                              {manager.netPoints}
                              {manager.transfersCost > 0 && (
                                <span className="text-xs text-coral ml-1">(-{manager.transfersCost})</span>
                              )}
                            </div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">Net</div>
                          </div>

                          <ChevronRight
                            className={`text-ink-soft shrink-0 transition-transform duration-300 ${expandedRow === (manager.id || manager.entry) ? 'rotate-90' : ''}`}
                            size={20}
                          />
                        </div>

                        <AnimatePresence>
                          {expandedRow === (manager.id || manager.entry) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="bg-surface-sunk border-t-2 border-dashed border-ink/15 p-4"
                            >
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                <div className="bg-surface-alt rounded-2xl p-2 text-center border-2 border-ink/15">
                                  <div className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">Raw Points</div>
                                  <div className="font-display font-bold text-ink">{manager.rawPoints}</div>
                                </div>
                                <div className="bg-surface-alt rounded-2xl p-2 text-center border-2 border-ink/15">
                                  <div className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">Penalty</div>
                                  <div className="font-display font-bold text-coral">-{manager.transfersCost}</div>
                                </div>
                                <div className="bg-surface-alt rounded-2xl p-2 text-center border-2 border-ink/15">
                                  <div className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">GW Rank</div>
                                  <div className="font-display font-bold text-violet">#{position}</div>
                                </div>
                                <div className="bg-surface-alt rounded-2xl p-2 text-center border-2 border-ink/15">
                                  <div className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">Overall Rank</div>
                                  <div className="font-display font-bold text-sky">#{manager.overallRank?.toLocaleString() || 'N/A'}</div>
                                </div>
                              </div>

                              {prize > 0 && (
                                <div className="p-3 bg-sunflower rounded-2xl border-2 border-ink/85 flex items-center gap-3 text-ink">
                                  <Coins size={24} />
                                  <span className="font-display font-bold">Weekly Winner — ৳{prize} Prize!</span>
                                </div>
                              )}

                              <div className="mt-3">
                                <Button
                                  variant="primary"
                                  className="w-full justify-center"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTeam({
                                      id: manager.id || manager.entry,
                                      managerName: manager.managerName || manager.name,
                                      teamName: manager.teamName || manager.entry_name
                                    });
                                  }}
                                >
                                  View Team <ArrowRight size={16} />
                                </Button>
                              </div>
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

      {
        selectedTeam && (
          <TeamView
            managerId={selectedTeam.id}
            managerName={selectedTeam.managerName}
            teamName={selectedTeam.teamName}
            gameweekInfo={{ current: selectedGameweek }}
            onClose={() => setSelectedTeam(null)}
          />
        )
      }
    </>
  );
};

export default GameweekTable;