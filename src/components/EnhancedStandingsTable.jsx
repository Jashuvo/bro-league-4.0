// src/components/EnhancedStandingsTable.jsx - FIXED VERSION - Properly Renders Table

import React from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown, Crown, Medal, Award, ExternalLink, Star, Zap } from 'lucide-react'

const EnhancedStandingsTable = ({ standings = [], loading = false, authStatus = {}, gameweekInfo = {}, leagueStats = {}, gameweekTable = [] }) => {
  console.log('🔍 EnhancedStandingsTable render:', {
    standingsCount: standings.length,
    loading,
    authStatus: authStatus.authenticated,
    gameweekInfo,
    leagueStatsKeys: Object.keys(leagueStats)
  });

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-purple-100 text-purple-700 rounded-full">
            <div className="w-5 h-5 border-2 border-purple-700 border-t-transparent rounded-full animate-spin"></div>
            Loading league standings...
          </div>
        </div>
      </div>
    )
  }

  const getRankBadgeColor = (rank) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white'
    if (rank === 2) return 'bg-gradient-to-r from-gray-400 to-gray-600 text-white'
    if (rank === 3) return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white'
    if (rank <= 5) return 'bg-gradient-to-r from-green-400 to-green-600 text-white'
    if (rank <= 10) return 'bg-gradient-to-r from-blue-400 to-blue-600 text-white'
    return 'bg-gradient-to-r from-gray-500 to-gray-700 text-white'
  }

  const getPositionIcon = (rank) => {
    if (rank === 1) return <Crown size={18} />
    if (rank === 2) return <Medal size={18} />
    if (rank === 3) return <Award size={18} />
    return null
  }

  return (
    <div className="space-y-6">
      {/* Debug Info (for development) */}
      {import.meta.env.VITE_DEV_MODE === 'true' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
          <strong>Debug:</strong> Standings: {standings.length}, Loading: {loading.toString()}, Auth: {authStatus.authenticated.toString()}
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Trophy size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">League Standings</h2>
                <p className="text-purple-100">Gameweek {gameweekInfo?.current || 3} • {standings.length} Managers</p>
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

        {/* FIXED: Main Table Content - Always show if we have data */}
        <div className="overflow-x-auto">
          {!standings || standings.length === 0 ? (
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
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left p-4 font-semibold text-gray-700">Position</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Manager</th>
                  <th className="text-left p-4 font-semibold text-gray-700 hidden sm:table-cell">Team</th>
                  <th className="text-center p-4 font-semibold text-gray-700">GW Pts</th>
                  <th className="text-center p-4 font-semibold text-gray-700">Total</th>
                  <th className="text-center p-4 font-semibold text-gray-700 hidden md:table-cell">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {standings.map((manager, index) => {
                  // FIXED: Better data handling with fallbacks
                  const position = manager.rank || manager.position || (index + 1);
                  const managerName = manager.managerName || manager.player_name || manager.entry_name || 'Unknown';
                  const teamName = manager.teamName || manager.team_name || manager.entry_name || 'Unknown Team';
                  const gameweekPoints = manager.gameweekPoints || manager.event_total || 0;
                  const totalPoints = manager.totalPoints || manager.total || 0;
                  const overallRank = manager.overallRank || manager.overall_rank || null;

                  return (
                    <tr 
                      key={manager.id || index} 
                      className={`
                        hover:bg-gray-50 transition-colors duration-200
                        ${position <= 3 ? 'bg-gradient-to-r from-yellow-50 to-transparent' : ''}
                      `}
                    >
                      {/* Position */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`
                            w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                            ${getRankBadgeColor(position)}
                          `}>
                            {getPositionIcon(position) || position}
                          </div>
                          <div className="hidden md:flex items-center">
                            {position <= 3 && (
                              <Star className="text-yellow-500 ml-2" size={16} />
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Manager */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {manager.avatar || managerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-gray-900 truncate">
                              {managerName}
                            </div>
                            <div className="text-sm text-gray-600 truncate">
                              ID: {manager.id || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Team */}
                      <td className="p-4 hidden sm:table-cell">
                        <div className="font-medium text-gray-900 truncate">
                          {teamName}
                        </div>
                      </td>

                      {/* Gameweek Points */}
                      <td className="p-4 text-center">
                        <div className={`
                          inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold
                          ${gameweekPoints >= (leagueStats?.averageGameweek || 50)
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-700'}
                        `}>
                          {gameweekPoints >= (leagueStats?.highestGameweek || 0) && (
                            <Zap className="text-yellow-500" size={14} />
                          )}
                          {gameweekPoints}
                        </div>
                      </td>

                      {/* Total Points */}
                      <td className="p-4 text-center">
                        <div className="font-bold text-lg text-gray-900">
                          {totalPoints?.toLocaleString()}
                        </div>
                        {overallRank && overallRank > 0 && (
                          <div className="text-xs text-gray-500">
                            #{overallRank?.toLocaleString()} overall
                          </div>
                        )}
                      </td>

                      {/* Trend */}
                      <td className="p-4 text-center hidden md:table-cell">
                        <div className="flex items-center justify-center gap-1">
                          {manager.lastRank && manager.lastRank !== position ? (
                            manager.lastRank > position ? (
                              <div className="flex items-center gap-1 text-green-600 text-sm">
                                <TrendingUp size={14} />
                                <span>+{manager.lastRank - position}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-red-600 text-sm">
                                <TrendingDown size={14} />
                                <span>-{position - manager.lastRank}</span>
                              </div>
                            )
                          ) : (
                            <Minus className="text-gray-400" size={16} />
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <span>🏆 BRO League 4.0</span>
              <span>•</span>
              <span>15 Participants</span>
              <span>•</span>
              <span>৳12,000 Prize Pool</span>
            </div>
            
            <div className="flex items-center gap-2">
              <ExternalLink size={14} />
              <span>FPL League ID: {import.meta.env.VITE_FPL_LEAGUE_ID || '1858389'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnhancedStandingsTable