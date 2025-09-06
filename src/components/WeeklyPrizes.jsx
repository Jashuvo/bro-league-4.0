// src/components/WeeklyPrizes.jsx - Updated with Real Data
import { Zap, Trophy, TrendingUp, Calendar, Award, Target, Users } from 'lucide-react'

const WeeklyPrizes = ({ standings = [], gameweekInfo = {}, gameweekTable = [] }) => {
  const currentGW = gameweekInfo.current || 3
  
  // Get real weekly winners from gameweek data
  const getWeeklyWinners = () => {
    if (!gameweekTable || gameweekTable.length === 0) {
      return []
    }
    
    return gameweekTable.map(gwData => {
      const sortedManagers = [...gwData.managers].sort((a, b) => b.points - a.points)
      const winner = sortedManagers[0]
      
      return {
        gameweek: gwData.gameweek,
        winner: {
          id: winner?.id,
          managerName: winner?.managerName || 'TBD',
          teamName: winner?.teamName || 'TBD',
          points: winner?.points || 0,
          prize: 30 // ৳30 per week
        },
        topThree: sortedManagers.slice(0, 3),
        averageScore: Math.round(gwData.managers.reduce((sum, m) => sum + m.points, 0) / gwData.managers.length),
        highestScore: Math.max(...gwData.managers.map(m => m.points)),
        lowestScore: Math.min(...gwData.managers.map(m => m.points))
      }
    }).sort((a, b) => b.gameweek - a.gameweek) // Most recent first
  }

  const weeklyWinners = getWeeklyWinners()
  const completedGWs = weeklyWinners.filter(gw => gw.gameweek <= currentGW).length
  const totalDistributed = completedGWs * 30
  const remainingGWs = 38 - currentGW
  const remainingPrizes = remainingGWs * 30

  // Get current/latest week winner
  const latestWinner = weeklyWinners.find(gw => gw.gameweek === currentGW) || 
                     weeklyWinners.find(gw => gw.gameweek === currentGW - 1)

  // Calculate weekly statistics
  const allScores = weeklyWinners.flatMap(gw => gw.topThree.map(m => m.points)).filter(score => score > 0)
  const overallAverageWeekly = allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0
  const highestWeeklyEver = Math.max(...allScores, 0)
  const weeklyWinnersCount = weeklyWinners.filter(gw => gw.gameweek <= currentGW).length

  return (
    <div className="space-y-8">
      {/* Current Week Spotlight */}
      {latestWinner && (
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Zap className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {latestWinner.gameweek === currentGW ? 'Current Week Winner' : 'Latest Week Winner'}
                  </h2>
                  <p className="text-yellow-100 text-sm">
                    Gameweek {latestWinner.gameweek} • Prize: ৳{latestWinner.winner.prize}
                  </p>
                </div>
              </div>
              
              <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-lg">
                <span className="text-white font-bold">GW {latestWinner.gameweek}</span>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Winner Spotlight */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {latestWinner.winner.managerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                    <Trophy size={16} className="text-yellow-800" />
                  </div>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{latestWinner.winner.managerName}</h3>
                  <p className="text-gray-600 mb-2">{latestWinner.winner.teamName}</p>
                  <div className="flex items-center gap-4">
                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-bold">
                      {latestWinner.winner.points} points
                    </div>
                    <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-bold">
                      ৳{latestWinner.winner.prize} won
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Week Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{latestWinner.highestScore}</div>
                <div className="text-sm text-blue-700">Highest Score</div>
              </div>
              
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{latestWinner.averageScore}</div>
                <div className="text-sm text-green-700">Average Score</div>
              </div>
              
              <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-orange-600">{latestWinner.lowestScore}</div>
                <div className="text-sm text-orange-700">Lowest Score</div>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">{latestWinner.topThree.filter(m => m.points >= 60).length}</div>
                <div className="text-sm text-purple-700">60+ Points</div>
              </div>
            </div>

            {/* Top 3 for the week */}
            <div className="mt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Top 3 This Week</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {latestWinner.topThree.map((manager, index) => (
                  <div 
                    key={manager.id}
                    className={`
                      p-4 rounded-lg border text-center
                      ${index === 0 ? 'bg-yellow-50 border-yellow-300' :
                        index === 1 ? 'bg-gray-50 border-gray-300' :
                        'bg-orange-50 border-orange-300'}
                    `}
                  >
                    <div className="text-2xl mb-2">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </div>
                    <h5 className="font-bold text-gray-900 mb-1">{manager.managerName}</h5>
                    <p className="text-sm text-gray-600 mb-2">{manager.teamName}</p>
                    <div className="text-lg font-bold text-purple-600">{manager.points} pts</div>
                    {index === 0 && (
                      <div className="text-sm font-semibold text-yellow-600 mt-1">+৳30</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Prize Progress */}
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Target className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Weekly Prize Progress</h2>
              <p className="text-blue-100 text-sm">৳30 per week • ৳1,140 total weekly prizes</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-green-600">৳{totalDistributed}</div>
              <div className="text-sm text-green-700 font-medium">Distributed</div>
              <div className="text-xs text-green-600 mt-1">{completedGWs} weeks</div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-blue-600">৳30</div>
              <div className="text-sm text-blue-700 font-medium">This Week</div>
              <div className="text-xs text-blue-600 mt-1">GW {currentGW}</div>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-purple-600">৳{remainingPrizes}</div>
              <div className="text-sm text-purple-700 font-medium">Remaining</div>
              <div className="text-xs text-purple-600 mt-1">{remainingGWs} weeks</div>
            </div>
            
            <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-orange-600">{overallAverageWeekly}</div>
              <div className="text-sm text-orange-700 font-medium">Avg Winner Score</div>
              <div className="text-xs text-orange-600 mt-1">All weeks</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Season Progress</span>
              <span className="text-sm text-gray-500">{Math.round((currentGW / 38) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${(currentGW / 38) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Winners History */}
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Calendar className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Recent Weekly Winners</h2>
              <p className="text-indigo-100 text-sm">Last 10 gameweeks • ৳30 each</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {weeklyWinners.length > 0 ? (
            <div className="space-y-4">
              {weeklyWinners.slice(0, 10).map((gwData) => (
                <div 
                  key={gwData.gameweek}
                  className={`
                    p-4 rounded-lg border transition-all duration-200
                    ${gwData.gameweek === currentGW ? 'bg-blue-50 border-blue-300 shadow-md' :
                      gwData.gameweek < currentGW ? 'bg-green-50 border-green-200' : 
                      'bg-gray-50 border-gray-200'}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center text-white font-bold
                        ${gwData.gameweek === currentGW ? 'bg-blue-500' :
                          gwData.gameweek < currentGW ? 'bg-green-500' : 'bg-gray-400'}
                      `}>
                        {gwData.gameweek}
                      </div>
                      
                      <div>
                        <h4 className="font-bold text-gray-900">{gwData.winner.managerName}</h4>
                        <p className="text-sm text-gray-600">{gwData.winner.teamName}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-bold text-sm">
                          {gwData.winner.points} pts
                        </div>
                        {gwData.gameweek <= currentGW && (
                          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-bold text-sm">
                            ৳30
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        Avg: {gwData.averageScore} • High: {gwData.highestScore}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="mx-auto mb-4 text-gray-400" size={48} />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Weekly Data Available</h3>
              <p className="text-gray-500">Weekly winners will appear as gameweek data loads.</p>
            </div>
          )}
        </div>
      </div>

      {/* Weekly Statistics */}
      {weeklyWinners.length > 0 && (
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <TrendingUp className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Weekly Statistics</h2>
                <p className="text-emerald-100 text-sm">Performance insights from all weeks</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600">{highestWeeklyEver}</div>
                <div className="text-sm text-gray-600">Highest Score Ever</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{overallAverageWeekly}</div>
                <div className="text-sm text-gray-600">Average Winner Score</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{weeklyWinnersCount}</div>
                <div className="text-sm text-gray-600">Weeks Completed</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">
                  {weeklyWinners.filter(gw => gw.winner.points >= 80).length}
                </div>
                <div className="text-sm text-gray-600">80+ Point Wins</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WeeklyPrizes