// src/components/MonthlyPrizes.jsx - Updated with Real Data
import { Calendar, TrendingUp, Award, Trophy, Users, Target } from 'lucide-react'

const MonthlyPrizes = ({ standings = [], gameweekInfo = {}, gameweekTable = [] }) => {
  const currentGW = gameweekInfo.current || 3
  
  // Calculate current month based on gameweek (every 4 GWs = 1 month)
  const currentMonth = Math.ceil(currentGW / 4)

  const months = [
    { id: 1, name: "Month 1", gameweeks: [1, 2, 3, 4], prizes: [350, 250, 150], status: currentGW > 4 ? 'completed' : currentGW >= 1 ? 'active' : 'upcoming' },
    { id: 2, name: "Month 2", gameweeks: [5, 6, 7, 8], prizes: [350, 250, 150], status: currentGW > 8 ? 'completed' : currentGW >= 5 ? 'active' : 'upcoming' },
    { id: 3, name: "Month 3", gameweeks: [9, 10, 11, 12], prizes: [350, 250, 150], status: currentGW > 12 ? 'completed' : currentGW >= 9 ? 'active' : 'upcoming' },
    { id: 4, name: "Month 4", gameweeks: [13, 14, 15, 16], prizes: [350, 250, 150], status: currentGW > 16 ? 'completed' : currentGW >= 13 ? 'active' : 'upcoming' },
    { id: 5, name: "Month 5", gameweeks: [17, 18, 19, 20], prizes: [350, 250, 150], status: currentGW > 20 ? 'completed' : currentGW >= 17 ? 'active' : 'upcoming' },
    { id: 6, name: "Month 6", gameweeks: [21, 22, 23, 24], prizes: [350, 250, 150], status: currentGW > 24 ? 'completed' : currentGW >= 21 ? 'active' : 'upcoming' },
    { id: 7, name: "Month 7", gameweeks: [25, 26, 27, 28], prizes: [350, 250, 150], status: currentGW > 28 ? 'completed' : currentGW >= 25 ? 'active' : 'upcoming' },
    { id: 8, name: "Month 8", gameweeks: [29, 30, 31, 32], prizes: [350, 250, 150], status: currentGW > 32 ? 'completed' : currentGW >= 29 ? 'active' : 'upcoming' },
    { id: 9, name: "Month 9 (Final)", gameweeks: [33, 34, 35, 36, 37, 38], prizes: [500, 400, 250], status: currentGW > 38 ? 'completed' : currentGW >= 33 ? 'active' : 'upcoming' }
  ]

  // Calculate monthly standings from real gameweek data
  const calculateMonthlyStandings = (monthGameweeks) => {
    if (!gameweekTable || gameweekTable.length === 0) {
      // Fallback to current standings if no gameweek data
      return standings.slice(0, 10).map((manager, index) => ({
        rank: index + 1,
        id: manager.id,
        managerName: manager.managerName,
        teamName: manager.teamName,
        monthlyPoints: Math.floor(manager.totalPoints / Math.max(1, Math.ceil(currentGW / 4))), // Estimate
        gameweeksPlayed: monthGameweeks.filter(gw => gw <= currentGW).length,
        avatar: manager.avatar
      }))
    }

    // Calculate from real gameweek data
    const monthlyScores = standings.map(manager => {
      let monthlyPoints = 0
      let gameweeksPlayed = 0

      monthGameweeks.forEach(gwNumber => {
        const gwData = gameweekTable.find(gw => gw.gameweek === gwNumber)
        if (gwData) {
          const managerGwData = gwData.managers.find(m => m.id === manager.id)
          if (managerGwData) {
            monthlyPoints += managerGwData.points
            gameweeksPlayed++
          }
        }
      })

      return {
        id: manager.id,
        managerName: manager.managerName,
        teamName: manager.teamName,
        monthlyPoints,
        gameweeksPlayed,
        average: gameweeksPlayed > 0 ? (monthlyPoints / gameweeksPlayed).toFixed(1) : 0,
        avatar: manager.avatar
      }
    })

    // Sort by monthly points and assign ranks
    return monthlyScores
      .sort((a, b) => b.monthlyPoints - a.monthlyPoints)
      .map((manager, index) => ({
        ...manager,
        rank: index + 1
      }))
      .slice(0, 10) // Top 10
  }

  const currentMonthData = months.find(m => m.status === 'active') || months[currentMonth - 1]
  const currentMonthStandings = calculateMonthlyStandings(currentMonthData?.gameweeks || [])

  const completedMonths = months.filter(m => m.status === 'completed').length
  const totalPrizesDistributed = completedMonths * 750 // 350+250+150 per month
  const remainingMonths = months.filter(m => m.status === 'upcoming').length

  return (
    <div className="space-y-8">
      {/* Current Month Progress */}
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Calendar className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{currentMonthData?.name} Progress</h2>
                <p className="text-green-100 text-sm">
                  Gameweeks {currentMonthData?.gameweeks[0]}-{currentMonthData?.gameweeks[currentMonthData.gameweeks.length - 1]} • 
                  Prize Pool: ৳{currentMonthData?.prizes.reduce((a, b) => a + b, 0)}
                </p>
              </div>
            </div>
            
            <div className={`
              px-4 py-2 rounded-full text-sm font-medium
              ${currentMonthData?.status === 'active' ? 'bg-yellow-400/20 text-yellow-100' :
                currentMonthData?.status === 'completed' ? 'bg-green-400/20 text-green-100' :
                'bg-gray-400/20 text-gray-100'}
            `}>
              {currentMonthData?.status === 'active' ? 'In Progress' :
               currentMonthData?.status === 'completed' ? 'Completed' : 'Upcoming'}
            </div>
          </div>
        </div>

        {/* Current Month Leaderboard */}
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Trophy className="text-yellow-500" size={20} />
              Current Month Leaderboard
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Top 3 Podium */}
              {currentMonthStandings.slice(0, 3).map((manager, index) => (
                <div 
                  key={manager.id}
                  className={`
                    p-4 rounded-xl text-center border-2
                    ${index === 0 ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300' :
                      index === 1 ? 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300' :
                      'bg-gradient-to-br from-orange-50 to-red-50 border-orange-300'}
                  `}
                >
                  <div className="relative mb-3">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto">
                      {manager.avatar || manager.managerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-2xl">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </span>
                    </div>
                  </div>
                  
                  <h4 className="font-bold text-gray-900 mb-1">{manager.managerName}</h4>
                  <p className="text-sm text-gray-600 mb-2">{manager.teamName}</p>
                  
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-purple-600">{manager.monthlyPoints}</div>
                    <div className="text-xs text-gray-500">
                      {manager.gameweeksPlayed} GWs • Avg: {manager.average}
                    </div>
                    <div className={`
                      text-sm font-semibold
                      ${index === 0 ? 'text-yellow-600' : index === 1 ? 'text-gray-600' : 'text-orange-600'}
                    `}>
                      ৳{currentMonthData?.prizes[index]}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Extended Leaderboard */}
            {currentMonthStandings.length > 3 && (
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="text-left p-3 font-semibold text-gray-700 text-sm">Rank</th>
                      <th className="text-left p-3 font-semibold text-gray-700 text-sm">Manager</th>
                      <th className="text-center p-3 font-semibold text-gray-700 text-sm hidden sm:table-cell">GWs</th>
                      <th className="text-center p-3 font-semibold text-gray-700 text-sm">Points</th>
                      <th className="text-center p-3 font-semibold text-gray-700 text-sm hidden md:table-cell">Average</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentMonthStandings.slice(3, 10).map((manager) => (
                      <tr key={manager.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="p-3">
                          <span className="font-bold text-gray-700">{manager.rank}</span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {manager.avatar}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 text-sm">{manager.managerName}</div>
                              <div className="text-xs text-gray-500 sm:hidden">{manager.teamName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-center hidden sm:table-cell">
                          <span className="text-gray-600">{manager.gameweeksPlayed}</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-bold text-purple-600">{manager.monthlyPoints}</span>
                        </td>
                        <td className="p-3 text-center hidden md:table-cell">
                          <span className="text-gray-600">{manager.average}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* All Months Overview */}
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Award className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Monthly Prize Schedule</h2>
              <p className="text-purple-100 text-sm">9 months • ৳6,650 total monthly prizes</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Progress Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-green-600">{completedMonths}</div>
              <div className="text-sm text-green-700 font-medium">Completed</div>
              <div className="text-xs text-green-600 mt-1">৳{totalPrizesDistributed} distributed</div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-blue-600">1</div>
              <div className="text-sm text-blue-700 font-medium">Active</div>
              <div className="text-xs text-blue-600 mt-1">{currentMonthData?.name}</div>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-purple-600">{remainingMonths}</div>
              <div className="text-sm text-purple-700 font-medium">Remaining</div>
              <div className="text-xs text-purple-600 mt-1">৳{remainingMonths * 750} pending</div>
            </div>
            
            <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-orange-600">৳6,650</div>
              <div className="text-sm text-orange-700 font-medium">Total Pool</div>
              <div className="text-xs text-orange-600 mt-1">Monthly prizes</div>
            </div>
          </div>

          {/* Months Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {months.map((month) => (
              <div 
                key={month.id}
                className={`
                  p-4 rounded-lg border-2 transition-all duration-200
                  ${month.status === 'completed' ? 'bg-green-50 border-green-300' :
                    month.status === 'active' ? 'bg-blue-50 border-blue-300' :
                    'bg-gray-50 border-gray-200'}
                `}
              >
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-bold text-gray-900">{month.name}</h4>
                  <div className={`
                    px-2 py-1 rounded-full text-xs font-medium
                    ${month.status === 'completed' ? 'bg-green-100 text-green-800' :
                      month.status === 'active' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-600'}
                  `}>
                    {month.status === 'completed' ? '✅ Done' :
                     month.status === 'active' ? '🔄 Active' : '⏳ Upcoming'}
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 mb-3">
                  GW {month.gameweeks[0]}-{month.gameweeks[month.gameweeks.length - 1]}
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  {month.prizes.map((prize, index) => (
                    <div key={index} className="text-center">
                      <div className="text-lg font-bold text-gray-800">৳{prize}</div>
                      <div className="text-xs text-gray-500">
                        {index === 0 ? '🥇 1st' : index === 1 ? '🥈 2nd' : '🥉 3rd'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MonthlyPrizes