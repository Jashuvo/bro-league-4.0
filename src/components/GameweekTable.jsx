import React, { useState, useMemo } from 'react';
import {
  Calendar, ChevronRight, ChevronLeft, ChevronDown, ArrowRight, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from './ui/Card';
import Badge from './ui/Badge';
import Button from './ui/Button';
import SectionBanner from './ui/SectionBanner';
import { Whistle, RankBadge, Coins } from './ui/Doodles';
import TeamView from './TeamView';
import InsightsPanel from './InsightsPanel';

const GameweekTable = ({ gameweekTable = [], currentGameweek = 1, currentGameweekFinished = false, loading = false, bootstrap = {}, standings = [] }) => {
  const [selectedGameweek, setSelectedGameweek] = useState(currentGameweek);
  const [expandedRow, setExpandedRow] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  // Secondary reading (story / captains / differentials / transfers) starts
  // folded so the leaderboard is reachable without scrolling past it.
  const [showInsights, setShowInsights] = useState(false);

  const toggleRowExpansion = (managerId) => {
    setExpandedRow(expandedRow === managerId ? null : managerId);
  };

  const getGameweekStatus = (gameweekId) => {
    const gameweekData = bootstrap?.gameweeks?.find(gw => gw.id === gameweekId);
    // FPL's own `finished` flag on the current gameweek only flips once
    // bonus points are officially locked in, hours after the last whistle
    // — `currentGameweekFinished` (App.jsx) corrects that lag using each
    // fixture's `finishedProvisional` instead, so a gameweek that's
    // plainly over doesn't sit on "In progress" waiting for FPL to catch up.
    if (gameweekData?.finished || (gameweekId === currentGameweek && currentGameweekFinished)) return 'completed';
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
          art={<Whistle size={20} />}
          eyebrow={
            selectedGameweekStatus === 'completed' ? 'Final result'
              : selectedGameweekStatus === 'current' ? 'Matches in play'
                : 'Not played yet'
          }
          title={`Gameweek ${selectedGameweek}`}
          subtitle={
            gameweekData.length > 0
              ? `${gameweekData.length} managers • net points after hits`
              : 'No scores in yet'
          }
          stats={bannerStats}
          actions={
            <Badge
              variant={selectedGameweekStatus === 'completed' ? 'success' : selectedGameweekStatus === 'current' ? 'gold' : 'default'}
              className="px-3 py-1.5 text-sm"
            >
              {selectedGameweekStatus === 'completed' ? 'Completed' : selectedGameweekStatus === 'current' ? 'In progress' : 'Upcoming'}
            </Badge>
          }
        />

        {/* Gameweek Navigation — the FusionGameweeks switcher: a prev/next pair
            either side of the week's name, its state, and how far into the
            season it sits. */}
        <div className="flex items-center gap-2 sm:gap-4 bg-surface-alt p-2.5 sm:p-3 rounded-3xl border-2 border-ink/85">
          <button
            onClick={() => setSelectedGameweek(Math.max(1, selectedGameweek - 1))}
            disabled={selectedGameweek <= 1}
            aria-label="Previous gameweek"
            className="w-11 h-11 shrink-0 rounded-2xl bg-surface-sunk text-ink-soft flex items-center justify-center btn-pop disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="flex items-center gap-2.5 flex-grow min-w-0">
            <Whistle size={24} className="shrink-0 hidden sm:block" />
            <div className="min-w-0">
              <div className="font-display font-bold text-base sm:text-lg text-ink leading-tight truncate">
                Gameweek {selectedGameweek}
              </div>
              <div className="text-[11px] sm:text-xs font-bold text-ink-soft mt-0.5 truncate">
                {selectedGameweekStatus === 'completed' && 'Final — points are settled'}
                {selectedGameweekStatus === 'current' && 'In progress — scores can still move'}
                {selectedGameweekStatus === 'upcoming' && 'Not played yet'}
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2.5 shrink-0">
            <span className="text-[11px] font-bold text-ink-soft tabular-nums">{selectedGameweek} of 38</span>
            <span className="block w-[120px] h-1.5 rounded-full bg-surface-sunk overflow-hidden">
              <span
                className="block h-full rounded-full bg-pitch"
                style={{ width: `${(selectedGameweek / 38) * 100}%` }}
              />
            </span>
          </div>
          <span className="sm:hidden shrink-0 text-[11px] font-bold text-ink-soft tabular-nums">
            {selectedGameweek}/38
          </span>

          <button
            onClick={() => setSelectedGameweek(Math.min(38, selectedGameweek + 1))}
            disabled={selectedGameweek >= 38}
            aria-label="Next gameweek"
            className="w-11 h-11 shrink-0 rounded-2xl bg-violet/15 text-violet-ink flex items-center justify-center btn-pop disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* ── Insights ────────────────────────────────────────────────────────
            The story, the captain split, the differentials and the transfer
            board used to sit here OPEN, stacked, at full length — a fifteen-row
            captain table and an eight-name differential list among them. On a
            phone that put the gameweek leaderboard, which is what people open
            this tab for, roughly 2,600px down the page: three full screens of
            scrolling past commentary to reach the scores.

            They are still one tap away and they are still here, in place — but
            folded, so the leaderboard is the next thing under the switcher. */}
        <div className="rounded-3xl bg-surface-alt overflow-hidden">
          <button
            type="button"
            onClick={() => setShowInsights((open) => !open)}
            aria-expanded={showInsights}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left min-h-[52px]"
          >
            <span className="w-9 h-9 shrink-0 rounded-full bg-tangerine/40 flex items-center justify-center">
              <Sparkles size={16} className="text-tangerine-ink" />
            </span>
            <span className="min-w-0 flex-grow">
              <span className="block font-display font-bold text-ink leading-tight">Insights</span>
              <span className="block text-[11px] font-bold text-ink-soft truncate">
                This week&rsquo;s story, the armband split and the differentials
              </span>
            </span>
            <ChevronDown
              size={20}
              className={`shrink-0 text-ink-soft transition-transform duration-300 ${showInsights ? 'rotate-180' : ''}`}
            />
          </button>

          <AnimatePresence initial={false}>
            {showInsights && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="px-3 pb-3">
                  <InsightsPanel
                    gameweekTable={gameweekTable}
                    gameweek={selectedGameweek}
                    standings={standings}
                    status={selectedGameweekStatus}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Main Table Content — the reason people open this tab, now directly
            under the switcher instead of below every insight. */}
        <div className="space-y-3">
          <div className="flex items-baseline justify-between gap-3 px-1">
            <h3 className="font-display font-bold text-lg sm:text-xl text-ink">
              Gameweek {selectedGameweek} leaderboard
            </h3>
            <span className="text-[11px] font-bold text-ink-soft text-right shrink-0">
              Net points · tap a row
            </span>
          </div>
          {(
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
                            <div className="font-display font-bold text-xl text-violet-ink leading-tight">
                              {manager.netPoints}
                              {manager.transfersCost > 0 && (
                                <span className="text-xs text-coral-ink ml-1">(-{manager.transfersCost})</span>
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
                                  <div className="font-display font-bold text-coral-ink">-{manager.transfersCost}</div>
                                </div>
                                <div className="bg-surface-alt rounded-2xl p-2 text-center border-2 border-ink/15">
                                  <div className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">GW Rank</div>
                                  <div className="font-display font-bold text-violet-ink">#{position}</div>
                                </div>
                                <div className="bg-surface-alt rounded-2xl p-2 text-center border-2 border-ink/15">
                                  <div className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">Overall Rank</div>
                                  <div className="font-display font-bold text-sky-ink">#{manager.overallRank?.toLocaleString() || 'N/A'}</div>
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