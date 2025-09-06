// src/components/MonthlyPrizes.jsx
import { Calendar, TrendingUp, Award } from 'lucide-react'

const MonthlyPrizes = ({ standings = [], gameweekInfo = {} }) => {
  const currentGW = gameweekInfo.current || 15
  
  // Calculate current month based on gameweek (every 4 GWs = 1 month)
  const currentMonth = Math.ceil(currentGW / 4)

  const months = [
    { id: 1, name: "Month 1", gameweeks: "GW 1-4", prizes: [350, 250, 150] },
    { id: 2, name: "Month 2", gameweeks: "GW 5-8", prizes: [350, 250, 150] },
    { id: 3, name: "Month 3", gameweeks: "GW 9-12", prizes: [350, 250, 150] },
    { id: 4, name: "Month 4", gameweeks: "GW 13-16", prizes: [350, 250, 150] },
    { id: 5, name: "Month 5", gameweeks: "GW 17-20", prizes: [350, 250, 150] },
    { id: 6, name: "Month 6", gameweeks: "GW 21-24", prizes: [350, 250, 150] },
    { id: 7, name: "Month 7", gameweeks: "GW 25-28", prizes: [350, 250, 150] },
    { id: 8, name: "Month 8", gameweeks: "GW 29-32", prizes: [350, 250, 150] },
    { id: 9, name: "Month 9 (Final)", gameweeks: "GW 33-38", prizes: [500, 400, 250] }
  ]

  // Generate current month standings from real data (simplified - in reality you'd need historical data)
  const currentStandings = standings.slice(0, 3).map((manager, index) => ({
    rank: index + 1,
    manager: manager.managerName || 'Loading...',
    points: manager.totalPoints ? Math.floor(manager.totalPoints / 4) : 0 // Rough estimate
  }))

  return (
    <div id="monthly" className="space-y-8">
      
      {/* Current Month Progress */}
      <div className="card bg-gradient-to-r from-green-600 to-blue-600 text-white shadow-2xl">
        <div className="card-body">
          <h2 className="card-title text-3xl justify-center mb-4">
            <Calendar size={36} />
            Month {currentMonth} Progress
          </h2>
          
          <div className="text-center mb-6">
            <div className="text-lg opacity-90 mb-2">
              Gameweeks {(currentMonth - 1) * 4 + 1}-{Math.min(currentMonth * 4, 38)}
            </div>
            <div className="text-sm opacity-75">
              Current leaders (estimated from total points)
            </div>
          </div>

          {/* Current Month Standings */}
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {currentStandings.map((standing, index) => (
                <div 
                  key={standing.rank}
                  className={`
                    p-4 rounded-lg text-center
                    ${index === 0 ? 'bg-yellow-400/20 border border-yellow-400' :
                      index === 1 ? 'bg-gray-300/20 border border-gray-300' :
                      'bg-orange-400/20 border border-orange-400'}
                  `}
                >
                  <div className="text-3xl mb-2">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </div>
                  <div className="font-bold text-lg">{standing.manager}</div>
                  <div className="text-2xl font-bold my-2">{standing.points} pts*</div>
                  <div className={`
                    badge 
                    ${index === 0 ? 'badge-warning' : 
                      index === 1 ? 'badge-accent' : 
                      'badge-secondary'}
                  `}>
                    ৳{currentMonth <= 8 ? [350, 250, 150][index] : [500, 400, 250][index]}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-xs text-center mt-4 opacity-75">
              * Estimated monthly points from current season total
            </div>
          </div>
        </div>
      </div>

      {/* All Months Overview */}
      <div className="card bg-white/10 backdrop-blur shadow-2xl">
        <div className="card-body">
          <h3 className="card-title text-2xl text-white mb-6">
            📅 All Monthly Competitions
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {months.map((month) => (
              <div 
                key={month.id}
                className={`
                  p-4 rounded-lg transition-all duration-300
                  ${month.id === currentMonth ? 
                    'bg-gradient-to-r from-blue-600/30 to-purple-600/30 border border-blue-400' : 
                    month.id < currentMonth ?
                    'bg-green-600/20 border border-green-400/30' :
                    'bg-white/5 hover:bg-white/10'}
                `}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="font-bold text-white">
                    {month.name}
                    {month.id === currentMonth && (
                      <span className="ml-2 badge badge-accent badge-sm">Current</span>
                    )}
                    {month.id < currentMonth && (
                      <span className="ml-2 badge badge-success badge-sm">Complete</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-400">{month.gameweeks}</div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-center">
                  {month.prizes.map((prize, index) => (
                    <div key={index}>
                      <div className={`
                        text-sm font-bold
                        ${index === 0 ? 'text-yellow-400' : 
                          index === 1 ? 'text-gray-300' : 
                          'text-orange-400'}
                      `}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </div>
                      <div className="text-xs text-white">৳{prize}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Progress Summary */}
          <div className="mt-6 grid grid-cols-3 gap-4 text-center">
            <div className="bg-green-600/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-400">{Math.max(0, currentMonth - 1)}</div>
              <div className="text-sm text-gray-400">Completed</div>
            </div>
            <div className="bg-blue-600/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">{currentMonth}</div>
              <div className="text-sm text-gray-400">Current</div>
            </div>
            <div className="bg-purple-600/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-400">{9 - currentMonth}</div>
              <div className="text-sm text-gray-400">Remaining</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MonthlyPrizes