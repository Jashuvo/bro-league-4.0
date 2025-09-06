// src/components/WeeklyPrizes.jsx
import { Zap, Phone, Trophy } from 'lucide-react'

const WeeklyPrizes = ({ standings = [], gameweekInfo = {} }) => {
  const currentGW = gameweekInfo.current || 15
  const totalGWs = gameweekInfo.total || 38
  const completedGWs = currentGW - 1
  const remainingGWs = totalGWs - currentGW + 1

  // Find current week's highest scorer from real data
  const currentWeekWinner = standings.length > 0 
    ? standings.reduce((prev, current) => 
        (current.gameweekPoints > prev.gameweekPoints) ? current : prev
      )
    : { 
        managerName: "No Data", 
        teamName: "Loading...", 
        gameweekPoints: 0 
      }

  // Generate recent winners (mock data for past weeks since we don't have historical data)
  const recentWinners = [
    { 
      gw: currentGW, 
      manager: currentWeekWinner.managerName, 
      points: currentWeekWinner.gameweekPoints, 
      team: currentWeekWinner.teamName 
    },
    { gw: currentGW - 1, manager: "Previous Winner", points: 88, team: "Previous Team" },
    { gw: currentGW - 2, manager: "Winner Before", points: 92, team: "Another Team" },
    { gw: currentGW - 3, manager: "Earlier Winner", points: 85, team: "Some Team" },
    { gw: currentGW - 4, manager: "Past Winner", points: 87, team: "Old Team" }
  ]

  return (
    <div id="weekly" className="space-y-8">
      
      {/* Current Week Winner */}
      <div className="card bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white shadow-2xl">
        <div className="card-body text-center">
          <h2 className="card-title text-3xl justify-center mb-4">
            <Zap size={36} />
            GW {currentGW} Highest Scorer
          </h2>
          
          <div className="text-6xl mb-4">🏆</div>
          <div className="text-3xl font-bold mb-2">{currentWeekWinner.managerName}</div>
          <div className="text-lg opacity-90 mb-4">{currentWeekWinner.teamName}</div>
          
          <div className="bg-white/20 backdrop-blur rounded-lg p-6 inline-block">
            <div className="text-5xl font-bold mb-2">{currentWeekWinner.gameweekPoints}</div>
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

      {/* Weekly Prize Structure */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="card bg-white/10 backdrop-blur shadow-2xl">
          <div className="card-body">
            <h3 className="card-title text-xl text-white mb-4">
              ⚡ Weekly Prize Structure
            </h3>
            
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-6 rounded-lg border border-blue-400/30 text-center">
              <div className="text-4xl mb-4">📱</div>
              <div className="text-2xl font-bold text-blue-400 mb-2">৳30</div>
              <div className="text-white mb-2">Mobile Recharge</div>
              <div className="text-sm text-gray-400">
                Every gameweek's highest point scorer
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="text-center">
                  <div className="text-sm text-gray-400">Total Gameweeks</div>
                  <div className="text-xl font-bold text-white">{totalGWs}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-400">Total Prize Pool</div>
                  <div className="text-xl font-bold text-green-400">৳1,140</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-white/10 backdrop-blur shadow-2xl">
          <div className="card-body">
            <h3 className="card-title text-xl text-white mb-4">
              📊 Weekly Prize Progress
            </h3>
            
            <div className="space-y-4">
              <div className="bg-green-600/20 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-green-400 font-bold">Distributed</span>
                  <span className="text-white font-bold">৳{completedGWs * 30}</span>
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
                  <span className="text-white font-bold">৳{remainingGWs * 30}</span>
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
                  className="bg-gradient-to-r from-yellow-400 to-orange-400 h-3 rounded-full"
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
                {recentWinners.map((winner, index) => (
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
                      <div className="badge badge-success">৳30</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WeeklyPrizes