import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, ChevronRight, ArrowRight, DollarSign, UserX, UserCheck, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TeamView from './TeamView';
import Card from './ui/Card';
import Badge from './ui/Badge';
import Button from './ui/Button';
import { RankBadge, Standings as StandingsDoodle, Coins } from './ui/Doodles';
import PrizeBreakdown from './PrizeBreakdown';
import { useExclusion } from '../context/ExclusionContext';
import RankTrendSparkline from './RankTrendSparkline';
import { monthlyWindows, prizeStructure } from '../data/leagueData';
import { computeRankHistory } from '../utils/rankHistory';

const LeagueTable = ({ standings = [], loading = false, gameweekInfo = {}, leagueStats = {}, gameweekTable = [] }) => {
  const [expandedRow, setExpandedRow] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedPrizeManager, setSelectedPrizeManager] = useState(null);
  const [showExclusionSettings, setShowExclusionSettings] = useState(false);
  const { excludeTeam, includeTeam, excludedTeamIds, clearExclusions } = useExclusion();

  // Calculate total prizes won (Logic preserved)
  const calculateTotalPrizesWon = (managerId) => {
    let totalWon = 0;
    const currentGW = gameweekInfo.current || 1;

    if (gameweekTable.length === 0) return 0;

    const getNetPoints = (manager) => {
      const rawPoints = manager.gameweekPoints || manager.points || 0;
      const transfersCost = manager.transfersCost || manager.event_transfers_cost || manager.transferCost || manager.transfers_cost || manager.penalty || manager.hit || manager.gameweekHits || 0;
      return rawPoints - transfersCost;
    };

    // Weekly Prizes - Only count FINISHED gameweeks
    const lastCompletedGW = gameweekInfo.isFinished ? currentGW : currentGW - 1;
    for (let gw = 1; gw <= lastCompletedGW; gw++) {
      const gameweekData = gameweekTable.find(g => g.gameweek === gw);
      if (!gameweekData?.managers) continue;
      const sortedManagers = [...gameweekData.managers]
        .filter(m => (m.gameweekPoints || m.points || 0) > 0)
        .sort((a, b) => getNetPoints(b) - getNetPoints(a));
      const managerRank = sortedManagers.findIndex(m => m.id === managerId) + 1;
      if (managerRank === 1) totalWon += prizeStructure.weekly.perWeek;
    }

    // Monthly Prizes - a month only "counts" once its last gameweek has
    // actually finished, not merely once we've reached it (matches the
    // weekly-prize gating above).
    monthlyWindows.forEach((month) => {
      const isMonthFinished = currentGW > month.end || (currentGW === month.end && gameweekInfo.isFinished);
      if (isMonthFinished) {
        const allMonthlyScores = gameweekTable
          .filter(gw => gw.gameweek >= month.start && gw.gameweek <= month.end)
          .reduce((scores, gw) => {
            gw.managers?.forEach(manager => {
              if (!scores[manager.id]) scores[manager.id] = 0;
              scores[manager.id] += getNetPoints(manager);
            });
            return scores;
          }, {});
        const sortedMonthly = Object.entries(allMonthlyScores).sort((a, b) => b[1] - a[1]);
        const monthlyRank = sortedMonthly.findIndex(([id]) => id == managerId) + 1;
        if (monthlyRank >= 1 && monthlyRank <= 3) {
          const prizes = month.isFinal ? prizeStructure.monthly.finalMonth : prizeStructure.monthly.regularPrizes;
          totalWon += prizes[monthlyRank - 1];
        }
      }
    });
    return totalWon;
  };

  // Calculate detailed prize breakdown for a manager
  const calculatePrizeBreakdown = (managerId) => {
    const currentGW = gameweekInfo.current || 1;
    const weeklyWins = [];
    const monthlyWins = [];

    if (gameweekTable.length === 0) {
      return { weeklyWins, monthlyWins, totalPrizes: 0 };
    }

    const getNetPoints = (manager) => {
      const rawPoints = manager.gameweekPoints || manager.points || 0;
      const transfersCost = manager.transfersCost || manager.event_transfers_cost || manager.transferCost || manager.transfers_cost || manager.penalty || manager.hit || 0;
      return rawPoints - transfersCost;
    };

    // Weekly Prizes - Only count FINISHED gameweeks
    const lastCompletedGW = gameweekInfo.isFinished ? currentGW : currentGW - 1;
    for (let gw = 1; gw <= lastCompletedGW; gw++) {
      const gameweekData = gameweekTable.find(g => g.gameweek === gw);
      if (!gameweekData?.managers) continue;
      const sortedManagers = [...gameweekData.managers]
        .filter(m => (m.gameweekPoints || m.points || 0) > 0)
        .sort((a, b) => getNetPoints(b) - getNetPoints(a));
      const managerRank = sortedManagers.findIndex(m => m.id === managerId) + 1;
      if (managerRank === 1) {
        const winnerData = sortedManagers[0];
        weeklyWins.push({
          gameweek: gw,
          points: getNetPoints(winnerData),
          prize: prizeStructure.weekly.perWeek
        });
      }
    }

    // Monthly Prizes - same "actually finished" gating as calculateTotalPrizesWon above
    monthlyWindows.forEach((month) => {
      const isMonthFinished = currentGW > month.end || (currentGW === month.end && gameweekInfo.isFinished);
      if (isMonthFinished) {
        const allMonthlyScores = gameweekTable
          .filter(gw => gw.gameweek >= month.start && gw.gameweek <= month.end)
          .reduce((scores, gw) => {
            gw.managers?.forEach(manager => {
              if (!scores[manager.id]) scores[manager.id] = 0;
              scores[manager.id] += getNetPoints(manager);
            });
            return scores;
          }, {});
        const sortedMonthly = Object.entries(allMonthlyScores).sort((a, b) => b[1] - a[1]);
        const monthlyRank = sortedMonthly.findIndex(([id]) => id == managerId) + 1;
        if (monthlyRank >= 1 && monthlyRank <= 3) {
          const prizes = month.isFinal ? prizeStructure.monthly.finalMonth : prizeStructure.monthly.regularPrizes;
          monthlyWins.push({
            month: month.id,
            position: monthlyRank,
            points: allMonthlyScores[managerId],
            prize: prizes[monthlyRank - 1]
          });
        }
      }
    });

    const totalPrizes = weeklyWins.reduce((sum, w) => sum + w.prize, 0) +
      monthlyWins.reduce((sum, w) => sum + w.prize, 0);

    return { weeklyWins, monthlyWins, totalPrizes };
  };

  const enhancedStandings = useMemo(() => {
    return standings.map(manager => ({
      ...manager,
      totalPrizesWon: calculateTotalPrizesWon(manager.id || manager.entry)
    }));
  }, [standings, gameweekTable, gameweekInfo]);

  // Cumulative league-position history per manager, derived from
  // gameweekTable — powers the "Rank Trend" sparkline in each expanded row.
  const rankHistoryByManager = useMemo(() => computeRankHistory(gameweekTable), [gameweekTable]);

  const toggleRowExpansion = (managerId) => {
    setExpandedRow(expandedRow === managerId ? null : managerId);
  };

  if (loading && (!standings || standings.length === 0)) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-surface-sunk rounded-3xl border-2 border-ink/10 animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {/* Header row. The destination's name, headcount and gameweek are
            already in the CommandBar directly above, so this carries only what
            that strip doesn't: the two league-wide totals and the exclusion
            control. */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-ink-soft">
            <StandingsDoodle size={20} />
            Gameweek {gameweekInfo?.current || 1} • {enhancedStandings.length} managers
          </span>

          <div className="flex items-center gap-2.5">
            {excludedTeamIds.length > 0 && (
              <button
                onClick={() => setShowExclusionSettings(!showExclusionSettings)}
                className={`h-10 px-3 text-sm font-bold rounded-2xl border-2 border-ink/85 btn-pop flex items-center justify-center gap-2 ${showExclusionSettings
                  ? 'bg-coral text-ink'
                  : 'bg-coral/15 text-coral-ink'
                  }`}
              >
                <Settings size={16} />
                {excludedTeamIds.length} Excluded
              </button>
            )}

            {leagueStats && (
              <>
                <span className="h-10 px-3 rounded-2xl bg-surface-alt border-2 border-ink/85 shadow-card flex flex-col justify-center whitespace-nowrap">
                  <span className="text-[9px] text-ink-soft font-bold uppercase tracking-[0.14em] leading-none">Avg Total</span>
                  <span className="font-display font-bold text-ink leading-none mt-0.5 tabular-nums">{leagueStats.averageScore || '--'}</span>
                </span>
                <span className="h-10 px-3 rounded-2xl bg-mint/20 border-2 border-ink/85 shadow-card flex flex-col justify-center whitespace-nowrap">
                  <span className="text-[9px] text-ink-soft font-bold uppercase tracking-[0.14em] leading-none">Highest</span>
                  <span className="font-display font-bold text-pitch-ink leading-none mt-0.5 tabular-nums">{leagueStats.highestTotal || '--'}</span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Exclusion Settings Panel */}
        <AnimatePresence>
          {showExclusionSettings && excludedTeamIds.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-6 overflow-hidden"
            >
              <Card tone="coral" className="bg-coral/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-display font-bold text-coral-ink flex items-center gap-2">
                    <UserX size={20} /> Excluded Teams
                  </h3>
                  <button
                    onClick={clearExclusions}
                    className="text-xs font-bold text-coral-ink hover:underline"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {excludedTeamIds.map(id => (
                    <div
                      key={id}
                      className="px-3 py-1.5 bg-surface-alt border-2 border-coral rounded-xl flex items-center gap-2 text-sm font-bold text-coral-ink"
                    >
                      <span>ID: {id}</span>
                      <button
                        onClick={() => includeTeam(id)}
                        className="p-1 hover:bg-coral/20 rounded-full transition-colors"
                        title="Restore Team"
                      >
                        <UserCheck size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs text-ink-soft font-medium">
                  These teams are completely excluded from all rankings, statistics, and prize calculations.
                </p>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table/List — one card holding one tight row per manager, rather
            than one full card per manager separated by gaps. A twenty-manager
            league now fits a screen instead of scrolling for three. */}
        <Card className="p-0 overflow-hidden">
          {/* Column headings, desktop only — the mobile row is self-evident. */}
          <div className="hidden md:flex items-center gap-3 px-3 py-2 bg-surface-sunk border-b-2 border-ink/85 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-soft">
            <span className="w-8 shrink-0 text-center">#</span>
            <span className="flex-grow">Manager</span>
            <span className="w-16 text-right shrink-0">Won</span>
            <span className="w-14 text-right shrink-0">GW</span>
            <span className="w-16 text-right shrink-0">Total</span>
            <span className="w-5 shrink-0" />
          </div>

          <div className="divide-y-2 divide-dashed divide-ink/10">
            {
              enhancedStandings.map((manager, index) => {
                const position = index + 1;
                const isExpanded = expandedRow === (manager.id || manager.entry);
                const gwNet = (manager.gameweekPoints || manager.event_total || 0) - (manager.gameweekHits || 0);

                return (
                  <div
                    key={manager.id || manager.entry}
                    className={`transition-colors duration-200 ${isExpanded
                      ? 'bg-surface-sunk'
                      : position === 1
                        ? 'bg-sunflower/25 hover:bg-sunflower/35'
                        : position === 2
                          ? 'bg-mint/20 hover:bg-mint/30'
                          : position === 3
                            ? 'bg-coral/15 hover:bg-coral/25'
                            : 'hover:bg-surface-sunk/60'
                      }`}
                  >
                    <div
                      className="px-3 py-2 flex items-center gap-3 cursor-pointer"
                      onClick={() => toggleRowExpansion(manager.id || manager.entry)}
                    >
                      {/* Rank — shirt-number badge */}
                      <RankBadge rank={position} size={32} className="shrink-0" />

                      {/* Manager + team, stacked tight on one line's worth of space */}
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-display font-bold text-[15px] leading-tight truncate text-ink">
                            {manager.managerName || manager.player_name}
                          </h3>
                          {manager.lastRank && manager.lastRank !== position && (
                            manager.lastRank > position
                              ? <TrendingUp size={14} className="text-pitch-ink shrink-0" />
                              : <TrendingDown size={14} className="text-coral-ink shrink-0" />
                          )}
                        </div>
                        <p className="text-ink-soft text-[11px] font-medium leading-tight truncate">
                          {manager.teamName || manager.entry_name}
                        </p>
                      </div>

                      {/* Prizes won — desktop column, folded into the mobile
                          stack below to keep the row to one line there. */}
                      <div className="hidden md:flex w-16 shrink-0 items-center justify-end gap-1 font-display font-bold text-pitch-ink text-sm tabular-nums">
                        {manager.totalPrizesWon > 0 && (
                          <>
                            <Coins size={14} />৳{manager.totalPrizesWon}
                          </>
                        )}
                      </div>

                      {/* GW points */}
                      <div className="hidden md:block w-14 shrink-0 text-right font-display font-bold text-ink text-sm tabular-nums">
                        {gwNet}
                        {(manager.gameweekHits || 0) > 0 && (
                          <span className="text-[11px] text-coral-ink ml-0.5">(-{manager.gameweekHits})</span>
                        )}
                      </div>

                      {/* Total points */}
                      <div className="hidden md:block w-16 shrink-0 text-right font-display font-bold text-violet-ink text-lg leading-none tabular-nums">
                        {manager.totalPoints || manager.total || 0}
                      </div>

                      {/* Mobile: GW / total / winnings share one right-hand column */}
                      <div className="md:hidden text-right shrink-0 leading-tight">
                        <div className="font-display font-bold text-violet-ink text-base leading-none tabular-nums">
                          {manager.totalPoints || manager.total || 0}
                        </div>
                        <div className="text-[11px] font-bold text-ink-soft tabular-nums">
                          {gwNet}
                          {(manager.gameweekHits || 0) > 0 && (
                            <span className="text-coral-ink ml-0.5">(-{manager.gameweekHits})</span>
                          )}
                          <span className="ml-1">GW</span>
                          {manager.totalPrizesWon > 0 && (
                            <span className="text-pitch-ink ml-1.5">৳{manager.totalPrizesWon}</span>
                          )}
                        </div>
                      </div>

                      <ChevronRight
                        className={`text-ink-soft shrink-0 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}
                        size={18}
                      />
                    </div>

                    {/* Expanded Content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="bg-surface-sunk border-t-2 border-dashed border-ink/15"
                        >
                          <div className="p-4 space-y-4">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              <div className="p-3 rounded-2xl bg-surface-alt border-2 border-ink/15 text-center">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-ink-soft mb-1">GW Points</div>
                                <div className="font-display font-bold text-ink text-lg">
                                  {(manager.gameweekPoints || manager.event_total || 0) - (manager.gameweekHits || 0)}
                                  {(manager.gameweekHits || 0) > 0 && (
                                    <span className="text-xs text-coral-ink ml-1">(-{manager.gameweekHits})</span>
                                  )}
                                </div>
                              </div>
                              <div className="p-3 rounded-2xl bg-surface-alt border-2 border-ink/15 text-center">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-ink-soft mb-1">Overall Rank</div>
                                <div className="font-display font-bold text-ink text-lg">#{manager.overallRank?.toLocaleString() || '-'}</div>
                              </div>
                              <div className="p-3 rounded-2xl bg-pitch/12 border-2 border-pitch/50 text-center col-span-2 md:col-span-1">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-ink-soft mb-1">Prizes Won</div>
                                <div className="font-display font-bold text-pitch-ink text-lg">৳{manager.totalPrizesWon}</div>
                              </div>
                            </div>

                            {/* Rank Trend */}
                            <div className="p-3 rounded-2xl bg-surface-alt border-2 border-ink/15">
                              <div className="text-[10px] font-bold uppercase tracking-wider text-ink-soft mb-1 flex items-center gap-1">
                                <TrendingUp size={12} /> League Rank Trend
                              </div>
                              <RankTrendSparkline
                                data={rankHistoryByManager[String(manager.id || manager.entry)] || []}
                                maxRank={standings.length}
                              />
                            </div>

                            {/* Action Buttons */}
                            <div className={`grid gap-3 ${manager.totalPrizesWon > 0 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
                              <Button
                                variant="outline"
                                className="w-full justify-center text-coral-ink hover:bg-coral/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`Exclude ${manager.managerName || manager.player_name} from all calculations?`)) {
                                    excludeTeam(manager.id || manager.entry);
                                  }
                                }}
                              >
                                <UserX size={16} /> Exclude
                              </Button>

                              {manager.totalPrizesWon > 0 && (
                                <Button
                                  variant="sunny"
                                  className="w-full justify-center"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedPrizeManager({
                                      ...manager,
                                      prizeData: calculatePrizeBreakdown(manager.id || manager.entry)
                                    });
                                  }}
                                >
                                  <DollarSign size={16} /> Prize Breakdown
                                </Button>
                              )}
                              <Button
                                variant="primary"
                                className="w-full justify-center"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTeam(manager);
                                }}
                              >
                                View Team <ArrowRight size={16} />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            }
          </div>
        </Card>
      </motion.div>

      {selectedTeam && (
        <TeamView
          managerId={selectedTeam.id || selectedTeam.entry}
          managerName={selectedTeam.managerName}
          teamName={selectedTeam.teamName}
          gameweekInfo={gameweekInfo}
          onClose={() => setSelectedTeam(null)}
        />
      )}

      {selectedPrizeManager && (
        <PrizeBreakdown
          managerName={selectedPrizeManager.managerName || selectedPrizeManager.player_name}
          teamName={selectedPrizeManager.teamName || selectedPrizeManager.entry_name}
          prizeData={selectedPrizeManager.prizeData}
          onClose={() => setSelectedPrizeManager(null)}
        />
      )}
    </>
  );
};

export default LeagueTable;