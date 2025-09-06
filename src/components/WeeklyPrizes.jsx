// src/components/WeeklyPrizes.jsx - Real Weekly Winners with EXACT LeagueTable Styling
import { Zap, Trophy, TrendingUp, Calendar, Award, Target, Users, ArrowUp, ArrowDown, Crown, Star, ExternalLink } from 'lucide-react'

const WeeklyPrizes = ({ standings = [], gameweekInfo = {}, gameweekTable = [], weeklyWinners = [] }) => {
  const currentGW = gameweekInfo.current || 3
  
  // Get weekly winners from real API data
  const realWeeklyWinners = gameweekTable
    .filter(gw => gw.gameweek <= currentGW && gw.managers && gw.managers.length > 0)
    .map(gw => {
      const sortedManagers = gw.managers
        .filter(m => m.points > 0)
        .sort((a, b) => b.points - a.points)
      
      const winner = sortedManagers[0]
      const runnerUp = sortedManagers[1]
      const third = sortedManagers[2]
      
      return {
        gameweek: gw.gameweek,
        winner: winner ? {
          id: winner.id,
          name: winner.managerName,
          teamName: winner.teamName,
          points: winner.points,
          transfers: winner.transfers || 0,
          transfersCost: winner.transfersCost || 0,
          totalPoints: winner.totalPoints
        } : null,
        runnerUp: runnerUp ? {
          id: runnerUp.id,
          name: runnerUp.managerName,
          teamName: runnerUp.teamName,
          points: runnerUp.points,
          transfers: runnerUp.transfers || 0,
          transfersCost: runnerUp.transfersCost || 0
        } : null,
        third: third ? {
          id: third.id,
          name: third.managerName,
          teamName: third.teamName,
          points: third.points,
          transfers: third.transfers || 0,
          transfersCost: third.transfersCost || 0
        } : null,
        averageScore: gw.managers.length > 0 ? 
          Math.round(gw.managers.reduce((sum, m) => sum + m.points, 0) / gw.managers.length) : 0,
        totalManagers: gw.managers.length,
        info: gw.info
      }
    })
    .filter(gw => gw.winner !== null)
    .sort((a, b) => b.gameweek - a.gameweek) // Most recent first

  // Get current/latest week winner
  const latestWinner = realWeeklyWinners[0] // Most recent
  const completedGWs = realWeeklyWinners.length
  const totalDistributed = completedGWs * 30
  const remainingGWs = Math.max(0, 38 - currentGW)
  const remainingPrizes = remainingGWs * 30

  // Calculate weekly statistics from real data
  const allWinnerScores = realWeeklyWinners.map(gw => gw.winner.points).filter(score => score > 0)
  const overallAverageWeekly = allWinnerScores.length > 0 ?
    Math.round(allWinnerScores.reduce((sum, score) => sum + score, 0) / allWinnerScores.length) : 0
  const highestWeeklyScore = allWinnerScores.length > 0 ? Math.max(...allWinnerScores) : 0
  const lowestWeeklyScore = allWinnerScores.length > 0 ? Math.min(...allWinnerScores) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-3xl mb-4 flex items-center gap-2">
            <Trophy className="text-yellow-300" size={32} />
            Weekly Champions
            <div className="badge badge-accent">GW {currentGW}</div>
          </h2>
          
          {/* Latest Winner Spotlight */}
          {latestWinner && (
            <div className="bg-white/10 backdrop-blur rounded-xl p-6 mb-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="text-yellow-300" size={24} />
                    <span className="text-xl font-bold">Current Champion</span>
                    <span className="badge badge-accent">GW {latestWinner.gameweek}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-yellow-300">{latestWinner.winner.name}</h3>
                  <p className="text-white/80">{latestWinner.winner.teamName}</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-yellow-300">{latestWinner.winner.points}</div>
                  <div className="text-white/80">points</div>
                </div>
              </div>
            </div>
          )}

          {/* Prize Pool Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-300">৳{totalDistributed}</div>
              <div className="text-white/80 text-sm">Distributed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-300">৳{remainingPrizes}</div>
              <div className="text-white/80 text-sm">Remaining</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-300">{overallAverageWeekly}</div>
              <div className="text-white/80 text-sm">Avg Winner</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-300">{highestWeeklyScore}</div>
              <div className="text-white/80 text-sm">Highest Weekly</div>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Champions Table - EXACT COPY of LeagueTable Structure */}
      <div className="card bg-white shadow-xl">
        <div className="card-body">
          {/* Header matching LeagueTable */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Award className="text-purple-600" size={24} />
              Weekly Winners History
              <div className="badge badge-primary">Live Data</div>
            </h3>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-green-500/20 text-gray-700 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Real Data</span>
              </div>
            </div>
          </div>

          {/* Stats Bar matching LeagueTable */}
          <div className="bg-gray-50 border-b border-gray-200 p-4 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{highestWeeklyScore}</div>
                <div className="text-sm text-gray-600">Highest Score</div>
                <div className="text-xs text-gray-500">Season best</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{overallAverageWeekly}</div>
                <div className="text-sm text-gray-600">Average Winner</div>
                <div className="text-xs text-gray-500">{completedGWs} gameweeks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">৳{totalDistributed}</div>
                <div className="text-sm text-gray-600">Total Distributed</div>
                <div className="text-xs text-gray-500">{completedGWs} weeks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">৳30</div>
                <div className="text-sm text-gray-600">Weekly Prize</div>
                <div className="text-xs text-gray-500">Per gameweek</div>
              </div>
            </div>
          </div>

          {/* Table - EXACT COPY of LeagueTable structure */}
          {realWeeklyWinners.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="text-left p-4 font-semibold text-gray-700 text-sm">#</th>
                    <th className="text-center p-4 font-semibold text-gray-700 text-sm hidden sm:table-cell">
                      <TrendingUp size={16} className="mx-auto" />
                    </th>
                    <th className="text-left p-4 font-semibold text-gray-700 text-sm">Champion</th>
                    <th className="text-left p-4 font-semibold text-gray-700 text-sm hidden md:table-cell">Team</th>
                    <th className="text-center p-4 font-semibold text-gray-700 text-sm">Points</th>
                    <th className="text-center p-4 font-semibold text-gray-700 text-sm">Prize</th>
                    <th className="text-center p-4 font-semibold text-gray-700 text-sm hidden lg:table-cell">Runners-up</th>
                  </tr>
                </thead>
                <tbody>
                  {realWeeklyWinners.map((gw, index) => {
                    const isLatest = index === 0
                    
                    return (
                      <tr 
                        key={gw.gameweek}
                        className={`
                          border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150
                          ${isLatest ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : ''}
                          ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                        `}
                      >
                        {/* Position - EXACT COPY of LeagueTable */}
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className={`
                              font-bold text-lg
                              ${isLatest ? 'text-yellow-600' : 'text-gray-700'}
                            `}>
                              {gw.gameweek}
                            </span>
                            {isLatest && <Star className="text-yellow-500" size={16} />}
                          </div>
                        </td>

                        {/* Trend Icon - EXACT COPY of LeagueTable */}
                        <td className="p-4 text-center hidden sm:table-cell">
                          <div className="flex justify-center">
                            <Crown className="text-yellow-500" size={16} />
                          </div>
                        </td>

                        {/* Manager Info - EXACT COPY of LeagueTable */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                {gw.winner.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </div>
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                                <Award size={10} className="text-yellow-800" />
                              </div>
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{gw.winner.name}</div>
                              <div className="text-sm text-gray-500 md:hidden">
                                {gw.winner.teamName}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Team Name - EXACT COPY of LeagueTable */}
                        <td className="p-4 hidden md:table-cell">
                          <span className="text-gray-700">{gw.winner.teamName}</span>
                        </td>

                        {/* Gameweek Points - EXACT COPY of LeagueTable */}
                        <td className="p-4 text-center">
                          <div className={`
                            inline-flex items-center gap-1 px-3 py-1 rounded-full font-semibold text-sm
                            bg-green-100 text-green-800
                          `}>
                            <Zap size={12} />
                            {gw.winner.points}
                          </div>
                        </td>

                        {/* Prize - EXACT COPY of LeagueTable */}
                        <td className="p-4 text-center">
                          <span className="font-bold text-lg text-purple-600">৳30</span>
                        </td>

                        {/* Runners-up - EXACT COPY of LeagueTable */}
                        <td className="p-4 text-center hidden lg:table-cell">
                          <div className="space-y-1">
                            {gw.runnerUp && (
                              <div className="text-sm text-gray-600">
                                2nd: {gw.runnerUp.name} ({gw.runnerUp.points})
                              </div>
                            )}
                            {gw.third && (
                              <div className="text-sm text-gray-600">
                                3rd: {gw.third.name} ({gw.third.points})
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No Weekly Winners Yet</h3>
              <p className="text-gray-500">Complete gameweek data will appear here as the season progresses.</p>
            </div>
          )}

          {/* Footer - EXACT COPY of LeagueTable */}
          <div className="bg-gray-50 border-t border-gray-200 p-4 mt-6">
            <div className="text-center text-sm text-gray-600">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>
                  Live weekly winners from FPL API • {completedGWs} gameweeks completed • 
                  Last updated: {new Date().toLocaleString('en-US', { 
                    timeZone: 'Asia/Dhaka',
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })} (BD Time)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WeeklyPrizes