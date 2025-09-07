// src/components/WeeklyPrizes.jsx - Updated with Transfer Cost Deduction (Same as Monthly)
import { Zap, Trophy, TrendingUp, Calendar, Award, Target, Users, ArrowUp, ArrowDown, Crown, Star, ExternalLink } from 'lucide-react'

const WeeklyPrizes = ({ standings = [], gameweekInfo = {}, gameweekTable = [], weeklyWinners = [] }) => {
  const currentGW = gameweekInfo.current || 3
  
  // Get weekly winners from real API data WITH TRANSFER COST DEDUCTION
  const realWeeklyWinners = gameweekTable
    .filter(gw => gw.gameweek <= currentGW && gw.managers && gw.managers.length > 0)
    .map(gw => {
      // Apply transfer cost deduction BEFORE sorting (same logic as MonthlyPrizes)
      const managersWithNetPoints = gw.managers
        .filter(m => m.points > 0)
        .map(manager => {
          const rawPoints = manager.points || 0
          
          // Check ALL possible transfer cost field names (same as MonthlyPrizes)
          const transfersCost = manager.transfersCost || 
                               manager.event_transfers_cost || 
                               manager.transferCost || 
                               manager.transfers_cost ||
                               manager.penalty ||
                               manager.hit ||
                               0

          const netPoints = rawPoints - transfersCost

          // Enhanced debugging for transfer costs
          if (transfersCost > 0) {
            console.log(`💰 Weekly GW${gw.gameweek} ${manager.managerName}: ${rawPoints} pts - ${transfersCost} cost = ${netPoints}`)
          }

          return {
            ...manager,
            rawPoints: rawPoints,
            transfersCost: transfersCost,
            netPoints: netPoints, // This is what we sort by
            points: netPoints // Update points to be net points for consistency
          }
        })
        .sort((a, b) => b.netPoints - a.netPoints) // Sort by NET points after transfer costs
      
      const winner = managersWithNetPoints[0]
      const runnerUp = managersWithNetPoints[1]
      const third = managersWithNetPoints[2]
      
      return {
        gameweek: gw.gameweek,
        winner: winner ? {
          id: winner.id,
          name: winner.managerName,
          teamName: winner.teamName,
          points: winner.netPoints, // Show net points
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
        } : null,
        averageScore: managersWithNetPoints.length > 0 ? 
          Math.round(managersWithNetPoints.reduce((sum, m) => sum + m.netPoints, 0) / managersWithNetPoints.length) : 0,
        totalManagers: managersWithNetPoints.length,
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

  // Calculate weekly statistics from real data (using net points)
  const allWinnerScores = realWeeklyWinners.map(gw => gw.winner.points).filter(score => score > 0)
  const overallAverageWeekly = allWinnerScores.length > 0 ?
    Math.round(allWinnerScores.reduce((sum, score) => sum + score, 0) / allWinnerScores.length) : 0
  const highestWeeklyScore = allWinnerScores.length > 0 ? Math.max(...allWinnerScores) : 0
  const lowestWeeklyScore = allWinnerScores.length > 0 ? Math.min(...allWinnerScores) : 0

  return (
    <div className="space-y-6">
      {/* Header with Latest Winner */}
      <div className="card bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-3xl mb-4 flex items-center gap-2">
            <Zap className="text-yellow-300" size={32} />
            Weekly Champions
            <div className="badge badge-accent">₹30 Each</div>
          </h2>

          {latestWinner && (
            <div className="bg-white/10 backdrop-blur rounded-xl p-6 mb-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="text-yellow-300" size={20} />
                    <span className="text-lg font-semibold text-white">
                      Latest Winner - GW {latestWinner.gameweek}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-300 mb-1">
                    {latestWinner.winner.name}
                  </div>
                  <div className="text-blue-100 text-sm">
                    {latestWinner.winner.teamName}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-yellow-300">
                    {latestWinner.winner.points}
                  </div>
                  <div className="text-blue-100 text-sm">Net Points</div>
                  {latestWinner.winner.transfersCost > 0 && (
                    <div className="text-xs text-red-200 mt-1">
                      {latestWinner.winner.rawPoints} - {latestWinner.winner.transfersCost} = {latestWinner.winner.points}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
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

      {/* Weekly Champions Table */}
      <div className="card bg-white shadow-xl">
        <div className="card-body">
          {/* Header matching LeagueTable */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Award className="text-purple-600" size={24} />
              Weekly Winners History
              <div className="badge badge-primary">Net Points (After Penalties)</div>
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
                <div className="text-xs text-gray-500">Season best (net)</div>
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
                    <th className="text-left p-4 font-semibold text-gray-700 text-sm">GW</th>
                    <th className="text-center p-4 font-semibold text-gray-700 text-sm hidden sm:table-cell">
                      <Crown size={16} className="mx-auto" />
                    </th>
                    <th className="text-left p-4 font-semibold text-gray-700 text-sm">Winner</th>
                    <th className="text-left p-4 font-semibold text-gray-700 text-sm hidden md:table-cell">Team</th>
                    <th className="text-center p-4 font-semibold text-gray-700 text-sm">Net Points</th>
                    <th className="text-center p-4 font-semibold text-gray-700 text-sm">Prize</th>
                    <th className="text-center p-4 font-semibold text-gray-700 text-sm hidden lg:table-cell">Penalties</th>
                  </tr>
                </thead>
                <tbody>
                  {realWeeklyWinners.map((gw, index) => {
                    const isRecent = index < 3
                    
                    return (
                      <tr 
                        key={gw.gameweek}
                        className={`
                          border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150
                          ${isRecent ? 'bg-gradient-to-r from-blue-50 to-purple-50' : ''}
                          ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                        `}
                      >
                        {/* Gameweek */}
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg text-blue-600">
                              {gw.gameweek}
                            </span>
                            {isRecent && (
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            )}
                          </div>
                        </td>

                        {/* Trophy Icon */}
                        <td className="p-4 text-center hidden sm:table-cell">
                          <Trophy className="text-yellow-500 mx-auto" size={20} />
                        </td>

                        {/* Manager */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="font-medium text-gray-900">
                              {gw.winner.name}
                            </div>
                          </div>
                        </td>

                        {/* Team */}
                        <td className="p-4 hidden md:table-cell">
                          <div className="text-gray-600 text-sm">
                            {gw.winner.teamName}
                          </div>
                        </td>

                        {/* Net Points (same styling as MonthlyPrizes) */}
                        <td className="p-4 text-center">
                          <div className={`
                            inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-semibold
                            bg-green-100 text-green-800
                          `}>
                            <Zap size={12} />
                            {gw.winner.points}
                          </div>
                          {gw.winner.transfersCost > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                              {gw.winner.rawPoints} - {gw.winner.transfersCost} = {gw.winner.points}
                            </div>
                          )}
                        </td>

                        {/* Prize */}
                        <td className="p-4 text-center">
                          <span className="font-bold text-lg text-purple-600">
                            ৳30
                          </span>
                        </td>

                        {/* Penalties */}
                        <td className="p-4 text-center hidden lg:table-cell">
                          <span className={`
                            font-semibold
                            ${gw.winner.transfersCost > 0 ? 'text-red-600' : 'text-gray-400'}
                          `}>
                            {gw.winner.transfersCost > 0 ? `-${gw.winner.transfersCost}` : '0'}
                          </span>
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
              <h3 className="text-lg font-medium text-gray-600 mb-2">No Data Available</h3>
              <p className="text-gray-500">
                Weekly winners will appear here as gameweeks complete.
              </p>
            </div>
          )}

          {/* Footer - EXACT COPY of LeagueTable */}
          <div className="bg-gray-50 border-t border-gray-200 p-4 mt-6">
            <div className="text-center text-sm text-gray-600">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>
                  Live weekly data from FPL API • Transfer penalties deducted • 
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