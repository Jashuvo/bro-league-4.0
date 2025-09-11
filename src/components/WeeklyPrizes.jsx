import React, { useMemo } from 'react';
import { Zap, Trophy, TrendingUp, Calendar, Award, Target, Users, ArrowUp, ArrowDown, Crown, Star, ExternalLink } from 'lucide-react';

const WeeklyPrizes = ({ standings = [], gameweekInfo = {}, gameweekTable = [], loading = false }) => {
  const currentGW = gameweekInfo.current || 3;
  
  const realWeeklyWinners = useMemo(() => {
    return gameweekTable
      .filter(gw => gw.gameweek <= currentGW && gw.managers && gw.managers.length > 0)
      .map(gw => {
        const managersWithNetPoints = gw.managers
          .filter(m => m.gameweekPoints > 0)
          .map(manager => {
            const rawPoints = manager.gameweekPoints || 0;
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
              rawPoints: rawPoints,
              transfersCost: transfersCost,
              netPoints: netPoints,
              points: netPoints
            };
          })
          .sort((a, b) => b.netPoints - a.netPoints);
        
        const winner = managersWithNetPoints[0];
        const runnerUp = managersWithNetPoints[1];
        const third = managersWithNetPoints[2];
        
        return {
          gameweek: gw.gameweek,
          winner: winner ? {
            id: winner.id,
            name: winner.managerName,
            teamName: winner.teamName,
            points: winner.netPoints,
            rawPoints: winner.rawPoints,
            transfers: winner.transfers || 0,
            transfersCost: winner.transfersCost,
            totalPoints: winner.totalPoints
          } : null,
          runnerUp: runnerUp ? {
            id: runnerUp.id,
            name: runnerUp.managerName,
            teamName: runnerUp.teamName,
            points: runnerUp.netPoints,
            rawPoints: runnerUp.rawPoints,
            transfers: runnerUp.transfers || 0,
            transfersCost: runnerUp.transfersCost
          } : null,
          third: third ? {
            id: third.id,
            name: third.managerName,
            teamName: third.teamName,
            points: third.netPoints,
            rawPoints: third.rawPoints,
            transfers: third.transfers || 0,
            transfersCost: third.transfersCost
          } : null
        };
      })
      .sort((a, b) => b.gameweek - a.gameweek);
  }, [gameweekTable, currentGW]);

  const weeklyStats = useMemo(() => {
    if (realWeeklyWinners.length === 0) return { totalDistributed: 0, averageWinner: 0, highestWeekly: 0 };

    const totalDistributed = realWeeklyWinners.length * 30;
    const averageWinner = realWeeklyWinners.reduce((sum, gw) => sum + (gw.winner?.points || 0), 0) / realWeeklyWinners.length;
    const highestWeekly = Math.max(...realWeeklyWinners.map(gw => gw.winner?.points || 0));

    return { totalDistributed, averageWinner: Math.round(averageWinner), highestWeekly };
  }, [realWeeklyWinners]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading weekly prizes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mobile-Optimized Stats Overview */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-yellow-600 to-orange-600 p-4">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <Zap size={20} />
            Weekly Champions
          </h2>
          <p className="text-yellow-100 text-sm">৳30 prize per gameweek winner</p>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-green-50 rounded-lg p-3">
              <div className="font-bold text-xl text-green-600">৳{weeklyStats.totalDistributed}</div>
              <div className="text-sm text-gray-600">Distributed</div>
              <div className="text-xs text-gray-500">{realWeeklyWinners.length} gameweeks</div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="font-bold text-xl text-blue-600">{weeklyStats.averageWinner}</div>
              <div className="text-sm text-gray-600">Avg Winner</div>
              <div className="text-xs text-gray-500">Net points</div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="font-bold text-xl text-purple-600">{weeklyStats.highestWeekly}</div>
              <div className="text-sm text-gray-600">Highest Score</div>
              <div className="text-xs text-gray-500">Single GW</div>
            </div>
            
            <div className="bg-orange-50 rounded-lg p-3">
              <div className="font-bold text-xl text-orange-600">৳{(38 - realWeeklyWinners.length) * 30}</div>
              <div className="text-sm text-gray-600">Remaining</div>
              <div className="text-xs text-gray-500">{38 - realWeeklyWinners.length} GWs left</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-Optimized Winners List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              <Trophy size={20} />
              Weekly Winners History
            </h3>
            <div className="text-purple-100 text-sm">
              {realWeeklyWinners.length} winners
            </div>
          </div>
        </div>

        <div className="overflow-hidden">
          {realWeeklyWinners.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              {realWeeklyWinners.map((gw, index) => {
                const isRecent = gw.gameweek >= currentGW - 2;
                
                return (
                  <div
                    key={gw.gameweek}
                    className={`
                      border-b border-gray-100 last:border-b-0 p-4
                      ${isRecent ? 'bg-gradient-to-r from-blue-50 to-purple-50' : ''}
                      ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                      hover:bg-gray-50 transition-colors
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg text-blue-600">
                              {gw.gameweek}
                            </span>
                            {isRecent && (
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            )}
                          </div>
                          <Trophy className="text-yellow-500 hidden sm:block" size={16} />
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-gray-900 truncate">
                            {gw.winner?.name}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {gw.winner?.teamName}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-bold text-lg text-green-600">
                            {gw.winner?.points}
                          </div>
                          <div className="text-xs text-gray-500">net pts</div>
                        </div>
                        
                        <div className="text-right">
                          <div className="font-bold text-lg text-purple-600">
                            ৳30
                          </div>
                          <div className="text-xs text-gray-500">prize</div>
                        </div>

                        <a
                          href={`https://fantasy.premierleague.com/entry/${gw.winner?.id}/event/${gw.gameweek}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-400 hover:text-purple-600 transition-colors hidden sm:block"
                        >
                          <ExternalLink size={16} />
                        </a>
                      </div>
                    </div>

                    {/* Mobile Transfer Cost Display */}
                    {gw.winner?.transfersCost > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">
                            {gw.winner.rawPoints} pts - {gw.winner.transfersCost} penalty = {gw.winner.points} pts
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Mobile Podium Display */}
                    <div className="sm:hidden mt-3 pt-3 border-t border-gray-100">
                      <div className="text-xs text-gray-500 mb-2">Top 3 this week:</div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <div className="font-medium text-yellow-600">🥇 {gw.winner?.points}pts</div>
                          <div className="text-gray-500 truncate">{gw.winner?.name}</div>
                        </div>
                        {gw.runnerUp && (
                          <div className="text-center">
                            <div className="font-medium text-gray-600">🥈 {gw.runnerUp.points}pts</div>
                            <div className="text-gray-500 truncate">{gw.runnerUp.name}</div>
                          </div>
                        )}
                        {gw.third && (
                          <div className="text-center">
                            <div className="font-medium text-orange-600">🥉 {gw.third.points}pts</div>
                            <div className="text-gray-500 truncate">{gw.third.name}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No Winners Yet</h3>
              <p className="text-gray-500">
                Weekly winners will appear here as gameweeks complete.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-4">
          <div className="text-center text-sm text-gray-600">
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>
                Live weekly data • Transfer penalties deducted • Last updated: {new Date().toLocaleString('en-US', { 
                  timeZone: 'Asia/Dhaka',
                  dateStyle: 'medium',
                  timeStyle: 'short'
                })} (BD)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyPrizes;