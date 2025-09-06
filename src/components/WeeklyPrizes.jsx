// src/components/WeeklyPrizes.jsx - Real Weekly Winners Data
import { Zap, Trophy, TrendingUp, Calendar, Award, Target, Users, ArrowUp, ArrowDown, Crown, Star } from 'lucide-react'

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

  // Find who has won most weeks
  const winnerCount = {}
  realWeeklyWinners.forEach(gw => {
    const winnerId = gw.winner.id
    winnerCount[winnerId] = (winnerCount[winnerId] || 0) + 1
  })
  
  const mostWinsManagerId = Object.keys(winnerCount).reduce((a, b) => 
    winnerCount[a] > winnerCount[b] ? a : b, Object.keys(winnerCount)[0])
  const mostWinsManager = realWeeklyWinners.find(gw => gw.winner.id === mostWinsManagerId)?.winner
  const mostWinsCount = winnerCount[mostWinsManagerId] || 0

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
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="flex items-center gap-1">
                      <Target size={16} />
                      {latestWinner.winner.transfers} transfers
                    </span>
                    {latestWinner.winner.transfersCost > 0 && (
                      <span className="flex items-center gap-1 text-red-300">
                        <ArrowDown size={16} />
                        -{latestWinner.winner.transfersCost} penalty
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-yellow-300">{latestWinner.winner.points}</div>
                  <div className="text-white/80">points</div>
                  <div className="text-sm text-white/60">vs {latestWinner.averageScore} avg</div>
                </div>
              </div>
            </div>
          )}

          {/* Prize Pool Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-300">৳{totalDistributed}</div>
              <div className="text-white/80 text-sm">Distributed</div>
              <div className="text-white/60 text-xs">{completedGWs} gameweeks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-300">৳{remainingPrizes}</div>
              <div className="text-white/80 text-sm">Remaining</div>
              <div className="text-white/60 text-xs">{remainingGWs} gameweeks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-300">{overallAverageWeekly}</div>
              <div className="text-white/80 text-sm">Avg Winner Score</div>
              <div className="text-white/60 text-xs">{completedGWs} gameweeks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-300">{highestWeeklyScore}</div>
              <div className="text-white/80 text-sm">Highest Weekly</div>
              <div className="text-white/60 text-xs">Season record</div>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Champions Table */}
      <div className="card bg-white shadow-xl">
        <div className="card-body">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Award className="text-purple-600" size={24} />
              Weekly Winners History
            </h3>
            
            {/* Most Successful Manager */}
            {mostWinsManager && mostWinsCount > 1 && (
              <div className="text-right">
                <div className="text-sm text-gray-600">Most Wins</div>
                <div className="font-bold text-purple-600">{mostWinsManager.name}</div>
                <div className="text-sm text-gray-500">{mostWinsCount} victories</div>
              </div>
            )}
          </div>

          {realWeeklyWinners.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-center">GW</th>
                    <th>Champion</th>
                    <th className="hidden md:table-cell">Team</th>
                    <th className="text-center">Points</th>
                    <th className="text-center hidden lg:table-cell">vs Avg</th>
                    <th className="text-center hidden lg:table-cell">Transfers</th>
                    <th className="text-center">Prize</th>
                    <th className="hidden sm:table-cell">Runners-up</th>
                  </tr>
                </thead>
                <tbody>
                  {realWeeklyWinners.map((gw, index) => {
                    const isLatest = index === 0
                    const pointsAboveAvg = gw.winner.points - gw.averageScore
                    
                    return (
                      <tr 
                        key={gw.gameweek}
                        className={`
                          border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150
                          ${isLatest ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : ''}
                          ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                        `}
                      >
                        {/* Gameweek */}
                        <td className="p-4 text-center font-semibold">
                          <div className="flex items-center justify-center gap-1">
                            {isLatest && <Star className="text-yellow-500" size={16} />}
                            <span className={isLatest ? 'text-purple-600' : 'text-gray-800'}>
                              {gw.gameweek}
                            </span>
                          </div>
                        </td>

                        {/* Champion */}
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Crown className="text-yellow-500" size={16} />
                            <div>
                              <div className="font-semibold text-gray-800">{gw.winner.name}</div>
                              <div className="text-xs text-gray-500">
                                Total: {gw.winner.totalPoints?.toLocaleString() || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Team Name */}
                        <td className="p-4 hidden md:table-cell text-gray-600 text-sm">
                          {gw.winner.teamName}
                        </td>

                        {/* Points */}
                        <td className="p-4 text-center">
                          <span className="font-bold text-green-600 text-lg">
                            {gw.winner.points}
                          </span>
                          {gw.winner.transfersCost > 0 && (
                            <div className="text-xs text-red-500">
                              (-{gw.winner.transfersCost})
                            </div>
                          )}
                        </td>

                        {/* Points vs Average */}
                        <td className="p-4 hidden lg:table-cell text-center">
                          <span className={`text-sm font-medium ${
                            pointsAboveAvg > 0 ? 'text-green-600' : 'text-gray-600'
                          }`}>
                            +{pointsAboveAvg}
                          </span>
                          <div className="text-xs text-gray-500">
                            (avg: {gw.averageScore})
                          </div>
                        </td>

                        {/* Transfers */}
                        <td className="p-4 hidden lg:table-cell text-center">
                          <span className="text-sm">
                            {gw.winner.transfers}
                          </span>
                          {gw.winner.transfersCost > 0 && (
                            <div className="text-xs text-red-500">
                              -{gw.winner.transfersCost}pt
                            </div>
                          )}
                        </td>

                        {/* Prize */}
                        <td className="p-4 text-center">
                          <span className="font-bold text-purple-600">৳30</span>
                        </td>

                        {/* Runners-up */}
                        <td className="p-4 hidden sm:table-cell">
                          <div className="space-y-1">
                            {gw.runnerUp && (
                              <div className="flex items-center gap-1 text-sm">
                                <span className="text-gray-400">2nd:</span>
                                <span className="text-gray-600">{gw.runnerUp.name}</span>
                                <span className="text-gray-500">({gw.runnerUp.points})</span>
                              </div>
                            )}
                            {gw.third && (
                              <div className="flex items-center gap-1 text-sm">
                                <span className="text-gray-400">3rd:</span>
                                <span className="text-gray-600">{gw.third.name}</span>
                                <span className="text-gray-500">({gw.third.points})</span>
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
        </div>
      </div>

      {/* Weekly Performance Stats */}
      {realWeeklyWinners.length > 0 && (
        <div className="card bg-white shadow-xl">
          <div className="card-body">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="text-blue-600" size={24} />
              Weekly Performance Analysis
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{highestWeeklyScore}</div>
                <div className="text-sm text-gray-600">Highest Score</div>
                <div className="text-xs text-gray-500">Season best</div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{overallAverageWeekly}</div>
                <div className="text-sm text-gray-600">Winner Average</div>
                <div className="text-xs text-gray-500">{completedGWs} gameweeks</div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{lowestWeeklyScore}</div>
                <div className="text-sm text-gray-600">Lowest Winner</div>
                <div className="text-xs text-gray-500">Season low</div>
              </div>
              
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {Object.keys(winnerCount).length}
                </div>
                <div className="text-sm text-gray-600">Different Winners</div>
                <div className="text-xs text-gray-500">Unique champions</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WeeklyPrizes