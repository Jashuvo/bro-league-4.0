import React, { useState, useMemo } from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus, Crown, Medal, Award, ChevronRight, Users, ArrowRight, Target, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TeamView from './TeamView';
import Card from './ui/Card';
import Badge from './ui/Badge';
import Button from './ui/Button';
import LiveTotalPointsTable from './LiveTotalPointsTable';
import PrizeBreakdown from './PrizeBreakdown';

const LeagueTable = ({ standings = [], loading = false, authStatus = {}, gameweekInfo = {}, leagueStats = {}, gameweekTable = [] }) => {
  const [expandedRow, setExpandedRow] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showLivePoints, setShowLivePoints] = useState(false);
  const [selectedPrizeManager, setSelectedPrizeManager] = useState(null);

  // Calculate total prizes won (Logic preserved)
  const calculateTotalPrizesWon = (managerId) => {
    let totalWon = 0;
    const currentGW = gameweekInfo.current || 3;

    if (gameweekTable.length === 0) return 0;

    const getNetPoints = (manager) => {
      const rawPoints = manager.gameweekPoints || manager.points || 0;
      const transfersCost = manager.transfersCost || manager.event_transfers_cost || manager.transferCost || manager.transfers_cost || manager.penalty || manager.hit || manager.gameweekHits || 0;
      return rawPoints - transfersCost;
    };

    // Weekly Prizes - Only count FINISHED gameweeks (not current ongoing one)
    for (let gw = 1; gw < currentGW; gw++) {
      const gameweekData = gameweekTable.find(g => g.gameweek === gw);
      if (!gameweekData?.managers) continue;
      const sortedManagers = [...gameweekData.managers]
        .filter(m => (m.gameweekPoints || m.points || 0) > 0)
        .sort((a, b) => getNetPoints(b) - getNetPoints(a));
      const managerRank = sortedManagers.findIndex(m => m.id === managerId) + 1;
      if (managerRank === 1) totalWon += 30;
    }

    // Monthly Prizes
    const monthlyGameweeks = {
      1: { start: 1, end: 4 }, 2: { start: 5, end: 8 }, 3: { start: 9, end: 12 },
      4: { start: 13, end: 16 }, 5: { start: 17, end: 20 }, 6: { start: 21, end: 24 },
      7: { start: 25, end: 28 }, 8: { start: 29, end: 32 }, 9: { start: 33, end: 38 }
    };
    const regularPrizes = [350, 250, 150];
    const finalMonthPrizes = [500, 400, 250];

    Object.entries(monthlyGameweeks).forEach(([monthNum, month]) => {
      if (currentGW >= month.end) {
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
          const isFinalMonth = parseInt(monthNum) === 9;
          const prizes = isFinalMonth ? finalMonthPrizes : regularPrizes;
          totalWon += prizes[monthlyRank - 1];
        }
      }
    });
    return totalWon;
  };

  // Calculate detailed prize breakdown for a manager
  const calculatePrizeBreakdown = (managerId) => {
    const currentGW = gameweekInfo.current || 3;
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
    for (let gw = 1; gw < currentGW; gw++) {
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
          prize: 30
        });
      }
    }

    // Monthly Prizes
    const monthlyGameweeks = {
      1: { start: 1, end: 4 }, 2: { start: 5, end: 8 }, 3: { start: 9, end: 12 },
      4: { start: 13, end: 16 }, 5: { start: 17, end: 20 }, 6: { start: 21, end: 24 },
      7: { start: 25, end: 28 }, 8: { start: 29, end: 32 }, 9: { start: 33, end: 38 }
    };
    const regularPrizes = [350, 250, 150];
    const finalMonthPrizes = [500, 400, 250];

    Object.entries(monthlyGameweeks).forEach(([monthNum, month]) => {
      if (currentGW >= month.end) {
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
          const isFinalMonth = parseInt(monthNum) === 9;
          const prizes = isFinalMonth ? finalMonthPrizes : regularPrizes;
          monthlyWins.push({
            month: parseInt(monthNum),
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

  const toggleRowExpansion = (managerId) => {
    setExpandedRow(expandedRow === managerId ? null : managerId);
  };

  const getPositionIcon = (rank) => {
    if (rank === 1) return <Crown size={20} className="text-yellow-400 fill-yellow-400" />;
    if (rank === 2) return <Medal size={20} className="text-gray-300 fill-gray-300" />;
    if (rank === 3) return <Award size={20} className="text-orange-400 fill-orange-400" />;
    return <span className="text-bro-muted font-bold w-6 text-center">{rank}</span>;
  };

  if (loading && (!standings || standings.length === 0)) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-bro-card/50 rounded-xl animate-pulse"></div>
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
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-bro-primary to-bro-secondary flex items-center justify-center shadow-lg shadow-bro-primary/20">
              <Trophy className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold text-base-content">League Standings</h2>
              <p className="text-bro-muted text-sm">Gameweek {gameweekInfo?.current || 3} • {enhancedStandings.length} Managers</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            {gameweekInfo?.current && (
              <button
                onClick={() => setShowLivePoints(!showLivePoints)}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${showLivePoints
                  ? 'bg-bro-primary text-white shadow-lg'
                  : 'bg-base-content/10 text-base-content hover:bg-base-content/20'
                  }`}
              >
                <Target size={16} />
                {showLivePoints ? 'Show Normal' : 'Live Points'}
              </button>
            )}

            {leagueStats && (
              <div className="flex gap-4 overflow-x-auto pb-2 md:pb-0">
                <div className="px-4 py-2 rounded-xl bg-base-content/5 border border-base-content/10 backdrop-blur-sm whitespace-nowrap">
                  <div className="text-xs text-bro-muted uppercase tracking-wider">Avg Total</div>
                  <div className="text-lg font-bold text-base-content">{leagueStats.averageScore || '--'}</div>
                </div>
                <div className="px-4 py-2 rounded-xl bg-base-content/5 border border-base-content/10 backdrop-blur-sm whitespace-nowrap">
                  <div className="text-xs text-bro-muted uppercase tracking-wider">Highest</div>
                  <div className="text-lg font-bold text-bro-secondary">{leagueStats.highestTotal || '--'}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Table/List */}
        <div className="space-y-3">
          {showLivePoints ? (
            <LiveTotalPointsTable
              standings={enhancedStandings}
              gameweek={gameweekInfo?.current || 3}
            />
          ) : (
            enhancedStandings.map((manager, index) => {
              const position = index + 1;
              const isExpanded = expandedRow === (manager.id || manager.entry);

              return (
                <motion.div
                  key={manager.id || manager.entry}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className={`
                    p-0 overflow-hidden transition-all duration-300
                    ${isExpanded ? 'ring-2 ring-bro-primary bg-base-200' : 'hover:bg-base-content/5'}
                  `}
                  >
                    <div
                      className="p-4 flex items-center gap-4 cursor-pointer"
                      onClick={() => toggleRowExpansion(manager.id || manager.entry)}
                    >
                      {/* Rank */}
                      <div className="flex-shrink-0 w-8 flex justify-center">
                        {getPositionIcon(position)}
                      </div>

                      {/* Manager Details */}
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className={`font-bold text-lg truncate ${position === 1 ? 'text-yellow-400' : 'text-base-content'}`}>
                            {manager.managerName || manager.player_name}
                          </h3>
                          {manager.lastRank && manager.lastRank !== position && (
                            manager.lastRank > position
                              ? <TrendingUp size={16} className="text-green-500" />
                              : <TrendingDown size={16} className="text-red-500" />
                          )}
                        </div>
                        <p className="text-bro-muted text-sm truncate">{manager.teamName || manager.entry_name}</p>
                      </div>

                      {/* Points (Desktop) */}
                      <div className="hidden md:flex items-center gap-8 text-right">
                        {manager.totalPrizesWon > 0 && (
                          <div className="flex flex-col items-end">
                            <div className="text-xs text-bro-muted uppercase">Won</div>
                            <div className="font-bold text-green-400 text-lg flex items-center gap-1">
                              <Trophy size={14} /> ৳{manager.totalPrizesWon}
                            </div>
                          </div>
                        )}
                        <div>
                          <div className="text-xs text-bro-muted uppercase">GW</div>
                          <div className="font-bold text-base-content text-lg">
                            {(manager.gameweekPoints || manager.event_total || 0) - (manager.gameweekHits || 0)}
                            {(manager.gameweekHits || 0) > 0 && (
                              <span className="text-xs text-red-400 ml-1">(-{manager.gameweekHits})</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-bro-muted uppercase">Total</div>
                          <div className="font-bold text-bro-primary text-xl">{manager.totalPoints || manager.total || 0}</div>
                        </div>
                      </div>

                      {/* Points (Mobile) */}
                      <div className="md:hidden text-right">
                        <div className="font-bold text-bro-primary text-lg">{manager.totalPoints || manager.total || 0}</div>
                        <div className="text-xs font-bold text-bro-muted">
                          {(manager.gameweekPoints || manager.event_total || 0) - (manager.gameweekHits || 0)}
                          {(manager.gameweekHits || 0) > 0 && (
                            <span className="text-red-400 ml-1">(-{manager.gameweekHits})</span>
                          )}
                          <span className="ml-1">GW</span>
                        </div>
                        {manager.totalPrizesWon > 0 && (
                          <div className="text-xs font-bold text-green-400 flex items-center justify-end gap-1 mt-0.5">
                            <Trophy size={10} /> ৳{manager.totalPrizesWon}
                          </div>
                        )}
                      </div>

                      <ChevronRight
                        className={`text-bro-muted transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}
                        size={20}
                      />
                    </div>

                    {/* Expanded Content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="bg-base-300/50 border-t border-base-content/5"
                        >
                          <div className="p-4 space-y-4">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              <div className="p-3 rounded-lg bg-base-content/5 text-center">
                                <div className="text-xs text-bro-muted mb-1">GW Points</div>
                                <div className="font-bold text-base-content text-lg">{manager.gameweekPoints || 0}</div>
                              </div>
                              <div className="p-3 rounded-lg bg-base-content/5 text-center">
                                <div className="text-xs text-bro-muted mb-1">Overall Rank</div>
                                <div className="font-bold text-base-content text-lg">#{manager.overallRank?.toLocaleString() || '-'}</div>
                              </div>
                              <div className="p-3 rounded-lg bg-base-content/5 text-center">
                                <div className="text-xs text-bro-muted mb-1">Prizes Won</div>
                                <div className="font-bold text-green-400 text-lg">৳{manager.totalPrizesWon}</div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className={`grid gap-3 ${manager.totalPrizesWon > 0 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                              {manager.totalPrizesWon > 0 && (
                                <Button
                                  variant="secondary"
                                  className="w-full justify-center"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedPrizeManager({
                                      ...manager,
                                      prizeData: calculatePrizeBreakdown(manager.id || manager.entry)
                                    });
                                  }}
                                >
                                  <DollarSign size={16} className="mr-2" /> Prize Breakdown
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
                                View Team <ArrowRight size={16} className="ml-2" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              );
            }))
          }
        </div>
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