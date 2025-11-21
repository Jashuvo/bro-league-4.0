// src/components/LeagueTable.jsx - UPDATED VERSION (Removed "View on FPL" button)
import React, { useState, useMemo } from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus, Crown, Medal, Award, ChevronRight, Users } from 'lucide-react';
import TeamView from './TeamView'; // Team view component

const LeagueTable = ({ standings = [], loading = false, authStatus = {}, gameweekInfo = {}, leagueStats = {}, gameweekTable = [] }) => {
  const [expandedRow, setExpandedRow] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null); // For team modal

  // Calculate total prizes won
  const calculateTotalPrizesWon = (managerId) => {
    let totalWon = 0;
    const currentGW = gameweekInfo.current || 3;

    if (gameweekTable.length === 0) return 0;

    // Helper to get net points safely
    const getNetPoints = (manager) => {
      const rawPoints = manager.gameweekPoints || manager.points || 0;
      const transfersCost = manager.transfersCost ||
        manager.event_transfers_cost ||
        manager.transferCost ||
        manager.transfers_cost ||
        manager.penalty ||
        manager.hit ||
        0;
      return rawPoints - transfersCost;
    };

    // Calculate weekly prizes
    for (let gw = 1; gw <= currentGW; gw++) {
      const gameweekData = gameweekTable.find(g => g.gameweek === gw);
      if (!gameweekData?.managers) continue;

      // Filter for positive points (matching WeeklyPrizes logic) and sort
      const sortedManagers = [...gameweekData.managers]
        .filter(m => (m.gameweekPoints || m.points || 0) > 0)
        .sort((a, b) => getNetPoints(b) - getNetPoints(a));

      const managerRank = sortedManagers.findIndex(m => m.id === managerId) + 1;

      if (managerRank === 1) totalWon += 30;
    }

    // Calculate monthly prizes - Ranges matched to MonthlyPrizes.jsx
    const monthlyGameweeks = {
      1: { start: 1, end: 4 },
      2: { start: 5, end: 8 },
      3: { start: 9, end: 12 },
      4: { start: 13, end: 16 },
      5: { start: 17, end: 20 },
      6: { start: 21, end: 24 },
      7: { start: 25, end: 28 },
      8: { start: 29, end: 32 },
      9: { start: 33, end: 38 } // Final month
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

        const sortedMonthly = Object.entries(allMonthlyScores)
          .sort((a, b) => b[1] - a[1]);

        const monthlyRank = sortedMonthly.findIndex(([id]) => id == managerId) + 1;

        // Award prizes for top 3
        if (monthlyRank >= 1 && monthlyRank <= 3) {
          const isFinalMonth = parseInt(monthNum) === 9;
          const prizes = isFinalMonth ? finalMonthPrizes : regularPrizes;
          totalWon += prizes[monthlyRank - 1];
        }
      }
    });

    return totalWon;
  };

  // Enhanced standings with prizes
  const enhancedStandings = useMemo(() => {
    return standings.map(manager => ({
      ...manager,
      totalPrizesWon: calculateTotalPrizesWon(manager.id || manager.entry)
    }));
  }, [standings, gameweekTable, gameweekInfo]);

  // Toggle row expansion
  const toggleRowExpansion = (managerId) => {
    setExpandedRow(expandedRow === managerId ? null : managerId);
  };

  // Handle team view
  const handleViewTeam = (manager) => {
    setSelectedTeam(manager);
  };

  // Close team view
  const handleCloseTeamView = () => {
    setSelectedTeam(null);
  };

  // Get position styling
  const getPositionStyling = (rank) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800';
    if (rank === 3) return 'bg-gradient-to-r from-orange-400 to-orange-500 text-orange-900';
    if (rank <= 5) return 'bg-gradient-to-r from-green-400 to-green-500 text-green-900';
    if (rank <= 10) return 'bg-gradient-to-r from-blue-400 to-blue-500 text-blue-900';
    return 'bg-gradient-to-r from-gray-500 to-gray-700 text-white';
  };

  const getPositionIcon = (rank) => {
    if (rank === 1) return <Crown size={18} />;
    if (rank === 2) return <Medal size={18} />;
    if (rank === 3) return <Award size={18} />;
    return null;
  };

  if (loading && (!standings || standings.length === 0)) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Trophy size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">League Standings</h2>
                <p className="text-purple-100">
                  Gameweek {gameweekInfo?.current || 3} • {enhancedStandings.length} Managers
                </p>
              </div>
            </div>

            {authStatus?.authenticated && (
              <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm">Live Data</span>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          {leagueStats && Object.keys(leagueStats).length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <div className="text-xl font-bold">{leagueStats.averageScore || '--'}</div>
                <div className="text-sm opacity-80">Avg Total</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <div className="text-xl font-bold">{leagueStats.highestTotal || '--'}</div>
                <div className="text-sm opacity-80">Highest Total</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <div className="text-xl font-bold">{leagueStats.averageGameweek || '--'}</div>
                <div className="text-sm opacity-80">Avg GW</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <div className="text-xl font-bold">{leagueStats.highestGameweek || '--'}</div>
                <div className="text-sm opacity-80">Highest GW</div>
              </div>
            </div>
          )}
        </div>

        {/* Main Table Content */}
        <div className="overflow-x-auto">
          {!enhancedStandings || enhancedStandings.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="text-gray-400" size={32} />
              </div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Data Available</h3>
              <p className="text-gray-500">
                {authStatus?.authenticated
                  ? "Standings will appear here once data loads."
                  : "Connect to FPL API to see live standings."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {enhancedStandings.map((manager, index) => {
                const position = index + 1;
                const gameweekPoints = manager.gameweekPoints || manager.event_total || 0;
                const totalPoints = manager.totalPoints || manager.total || 0;
                const overallRank = manager.overallRank || manager.overall_rank;

                return (
                  <div key={manager.id || manager.entry} className="hover:bg-gray-50 transition-colors">
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
                            <h3 className="font-bold text-gray-900 text-lg">
                              {manager.managerName || manager.player_name}
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
                            <span>Overall: #{overallRank?.toLocaleString() || 'N/A'}</span>
                            <span>•</span>
                            <span>Prizes Won: ৳{manager.totalPrizesWon}</span>
                          </div>
                        </div>

                        {/* Points Display */}
                        <div className="text-right">
                          <div className="flex items-center gap-4">
                            {/* GW Points */}
                            <div className="text-center">
                              <div className={`text-lg font-bold ${gameweekPoints >= (leagueStats?.highestGameweek || 0)
                                ? 'text-green-600 bg-green-100 px-2 py-1 rounded-lg'
                                : 'text-gray-900'
                                }`}>
                                {gameweekPoints}
                              </div>
                              <div className="text-xs text-gray-500">GW</div>
                            </div>

                            {/* Total Points */}
                            <div className="text-center">
                              <div className="text-xl font-bold text-purple-600">
                                {totalPoints?.toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-500">Total</div>
                            </div>

                            {/* Trend */}
                            <div className="text-center w-8">
                              {manager.lastRank && manager.lastRank !== position ? (
                                manager.lastRank > position ? (
                                  <TrendingUp className="text-green-600 mx-auto" size={20} />
                                ) : (
                                  <TrendingDown className="text-red-600 mx-auto" size={20} />
                                )
                              ) : (
                                <Minus className="text-gray-400 mx-auto" size={20} />
                              )}
                            </div>

                            {/* Expand Arrow */}
                            <div className="ml-2">
                              <ChevronRight
                                className={`text-gray-400 transition-transform ${expandedRow === (manager.id || manager.entry) ? 'rotate-90' : ''
                                  }`}
                                size={16}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* UPDATED: Expanded row content - REMOVED "View on FPL" button */}
                    {expandedRow === (manager.id || manager.entry) && (
                      <div className="bg-gray-50 px-4 pb-4 border-t border-gray-100 animate-fade-in-up">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                          {/* GW Points */}
                          <div className="text-center">
                            <div className="font-bold text-lg text-blue-600">
                              {manager.gameweekPoints || 0}
                            </div>
                            <div className="text-xs text-gray-500">GW Points</div>
                          </div>

                          {/* Total Points */}
                          <div className="text-center">
                            <div className="font-bold text-lg text-purple-600">
                              {manager.totalPoints}
                            </div>
                            <div className="text-xs text-gray-500">Total Points</div>
                          </div>

                          {/* Prizes Won */}
                          <div className="text-center">
                            <div className="font-bold text-lg text-green-600">
                              ৳{manager.totalPrizesWon}
                            </div>
                            <div className="text-xs text-gray-500">Prizes Won</div>
                          </div>

                          {/* UPDATED: Only In-App Team View Button (removed External FPL Link) */}
                          <div className="text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewTeam(manager);
                              }}
                              className="flex items-center justify-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs w-full"
                            >
                              <Users size={12} />
                              View Team Here
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-4">
          <div className="text-center text-sm text-gray-600">
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>
                Live data from FPL API • Last updated: {new Date().toLocaleString('en-US', {
                  timeZone: 'Asia/Dhaka',
                  dateStyle: 'medium',
                  timeStyle: 'short'
                })} (BD)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Team View Modal */}
      {selectedTeam && (
        <TeamView
          managerId={selectedTeam.id || selectedTeam.entry}
          managerName={selectedTeam.managerName}
          teamName={selectedTeam.teamName}
          gameweekInfo={gameweekInfo}
          onClose={handleCloseTeamView}
        />
      )}
    </>
  );
};

export default LeagueTable;