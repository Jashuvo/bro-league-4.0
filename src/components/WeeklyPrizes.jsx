// src/components/WeeklyPrizes.jsx
import { Zap, Phone, Trophy, Target } from 'lucide-react'
import { weeklyHighest, gameweekInfo, prizeDistribution } from '../data/leagueData'

const WeeklyPrizes = () => {
  const currentGW = gameweekInfo.current
  const totalGWs = gameweekInfo.total
  const completedGWs = currentGW - 1
  const remainingGWs = totalGWs - currentGW + 1

  // Mock data for recent weeks (you can replace with real data)
  const recentWeeklyWinners = [
    { gw: 15, manager: "Tarik Islam", points: 91, team: "Barisal Bulls" },
    { gw: 14, manager: "Fahim Khan", points: 88, team: "Khulna Kings" },
    { gw: 13, manager: "Arif Rahman", points: 92, team: "Dhaka Dragons" },
    { gw: 12, manager: "Sakib Hassan", points: 85, team: "Chittagong Champions" },
    { gw: 11, manager: "Nasir Ahmed", points: 87, team: "Sylhet Stars" }
  ]

  return (
    <div id="weekly" className="space-y-8">
      
      {/* Current Week Winner */}
      <div className="card bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white shadow-2xl">
        <div className="card-body">
          <h2 className="card-title text-3xl justify-center mb-4">
            <Zap size={36} />
            GW {weeklyHighest.currentGW} Highest Scorer
          </h2>
          
          <div className="text-center">
            <div className="text-6xl mb-4">🏆</div>
            <div className="text-3xl font-bold mb-2">{weeklyHighest.winner}</div>
            <div className="text-lg opacity-90 mb-4">{weeklyHighest.team}</div>
            
            <div className="bg-white/20 backdrop-blur rounded-lg p-6 inline-block">
              <div className="text-5xl font-bold mb-2">{weeklyHighest.points}</div>
              <div className="text-lg">Points Scored</div>
            </div>
            
            <div className="mt-6">
              <div className="badge badge-warning badge-lg text-lg p-4">
                <Phone className="mr-2" size={20} />
                ৳30 Mobile Recharge Won!
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Prize Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Prize Structure */}
        <div className="card bg-white/10 backdrop-blur shadow-2xl">
          <div className="card-body">
            <h3 className="card-title text-xl text-white mb-4">
              ⚡ Weekly Prize Structure
            </h3>
            
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-6 rounded-lg border border-blue-400/30">
              <div className="text-center">
                <div className="text-4xl mb-4">📱</div>
                <div className="text-2xl font-bold text-blue-400 mb-2">
                  ৳{prizeDistribution.weekly.perGameweek}
                </div>
                <div className="text-white mb-2">Mobile Recharge</div>
                <div className="text-sm text-gray-400">
                  Every gameweek's highest point scorer
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="text-center">
                  <div className="text-sm text-gray-400">Total Gameweeks</div>
                  <div className="text-xl font-bold text-white">{totalGWs}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-400">Total Prize Pool</div>
                  <div className="text-xl font-bold text-green-400">
                    ৳{prizeDistribution.weekly.total}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Stats */}
        <div className="card bg-white/10 backdrop-blur shadow-2xl">
          <div className="card-body">
            <h3 className="card-title text-xl text-white mb-4">
              📊 Weekly Prize Progress
            </h3>
            
            <div className="space-y-4">
              <div className="bg-green-600/20 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-green-400 font-bold">Distributed</span>
                  <span className="text-white font-bold">
                    ৳{completedGWs * prizeDistribution.weekly.perGameweek}
                  </span>
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  {completedGWs} gameweeks completed
                </div>
              </div>
              
              <div className="bg-blue-600/20 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-blue-400 font-bold">This Week</span>
                  <span className="text-white font-bold">৳30</span>
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  GW {currentGW} prize
                </div>
              </div>
              
              <div className="bg-purple-600/20 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-purple-400 font-bold">Remaining</span>
                  <span className="text-white font-bold">
                    ৳{remainingGWs * prizeDistribution.weekly.perGameweek}
                  </span>
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  {remainingGWs} gameweeks left
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-bold">Season Progress</span>
                <span className="text-gray-400">{completedGWs}/{totalGWs} GWs</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-yellow-400 to-orange-400 h-3 rounded-full transition-all duration-1000"
                  style={{width: `${(completedGWs / totalGWs) * 100}%`}}
                ></div>
              </div>
              <div className="mt-2 text-sm text-gray-400 text-center">
                {((completedGWs / totalGWs) * 100).toFixed(1)}% complete
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Winners */}
      <div className="card bg-white/10 backdrop-blur shadow-2xl">
        <div className="card-body">
          <h3 className="card-title text-2xl text-white mb-6">
            🏆 Recent Weekly Winners
          </h3>
          
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr className="bg-purple-600 text-white border-none">
                  <th className="text-center">GW</th>
                  <th>Winner</th>
                  <th className="hidden md:table-cell">Team</th>
                  <th className="text-center">Points</th>
                  <th className="text-center">Prize</th>
                </tr>
              </thead>
              <tbody>
                {recentWeeklyWinners.map((winner, index) => (
                  <tr 
                    key={winner.gw}
                    className={`
                      ${index === 0 ? 'bg-yellow-50/10 border-yellow-300/30' : 'bg-white/5'}
                      hover:bg-white/10 transition-all duration-200
                    `}
                  >
                    <td className="text-center">
                      <div className={`
                        badge font-bold
                        ${index === 0 ? 'badge-warning' : 'badge-accent'}
                      `}>
                        {winner.gw}
                      </div>
                    </td>
                    
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar placeholder">
                          <div className="bg-primary text-primary-content rounded-full w-10 h-10">
                            <span className="text-sm font-bold">
                              {winner.manager.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="font-bold text-white">{winner.manager}</div>
                          <div className="text-sm opacity-70 text-gray-300 md:hidden">
                            {winner.team}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="hidden md:table-cell text-gray-300">
                      {winner.team}
                    </td>
                    
                    <td className="text-center">
                      <span className="font-bold text-lg text-green-400">
                        {winner.points}
                      </span>
                    </td>
                    
                    <td className="text-center">
                      <div className="badge badge-success">
                        ৳30
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Weekly Prize Calendar */}
      <div className="card bg-white/10 backdrop-blur shadow-2xl">
        <div className="card-body">
          <h3 className="card-title text-2xl text-white mb-6">
            📅 Weekly Prize Calendar
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="stat bg-green-600/20 rounded-lg">
              <div className="stat-figure text-green-400">
                <Trophy size={32} />
              </div>
              <div className="stat-title text-gray-300">Total Winners</div>
              <div className="stat-value text-green-400 text-2xl">{completedGWs}</div>
              <div className="stat-desc text-gray-400">So far</div>
            </div>
            
            <div className="stat bg-blue-600/20 rounded-lg">
              <div className="stat-figure text-blue-400">
                <Target size={32} />
              </div>
              <div className="stat-title text-gray-300">Highest Score</div>
              <div className="stat-value text-blue-400 text-2xl">92</div>
              <div className="stat-desc text-gray-400">This season</div>
            </div>
            
            <div className="stat bg-yellow-600/20 rounded-lg">
              <div className="stat-figure text-yellow-400">
                <Phone size={32} />
              </div>
              <div className="stat-title text-gray-300">Average Winner</div>
              <div className="stat-value text-yellow-400 text-2xl">
                {Math.round(recentWeeklyWinners.reduce((sum, w) => sum + w.points, 0) / recentWeeklyWinners.length)}
              </div>
              <div className="stat-desc text-gray-400">Points</div>
            </div>
            
            <div className="stat bg-purple-600/20 rounded-lg">
              <div className="stat-figure text-purple-400">
                <Zap size={32} />
              </div>
              <div className="stat-title text-gray-300">Weeks Left</div>
              <div className="stat-value text-purple-400 text-2xl">{remainingGWs}</div>
              <div className="stat-desc text-gray-400">To win</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WeeklyPrizes