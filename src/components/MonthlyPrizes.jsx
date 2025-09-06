// src/components/MonthlyPrizes.jsx - Real Monthly Calculations (Fixed)
import { Calendar, Trophy, Users, TrendingUp, Crown, Award, Target, Star, Medal } from 'lucide-react'
import { useState } from 'react'

const MonthlyPrizes = ({ standings = [], gameweekInfo = {}, gameweekTable = [] }) => {
  const currentGW = gameweekInfo.current || 3
  
  // Define monthly periods with correct prize structure
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

  const [selectedMonth, setSelectedMonth] = useState(() => {
    // Find current month based on current gameweek
    const currentMonth = months.find(month => 
      month.gameweeks.includes(currentGW)
    )
    return currentMonth?.id || 1
  })

  // Calculate monthly standings from real gameweek data with transfer costs deducted
  const calculateMonthlyStandings = (monthId) => {
    const month = months.find(m => m.id === monthId)
    if (!month) return []

    // Get all managers from standings
    const managers = standings.map(manager => ({
      id: manager.id,
      managerName: manager.managerName,
      teamName: manager.teamName,
      monthlyPoints: 0,
      gameweeksPlayed: 0,
      transfersCost: 0,
      averageGW: 0
    }))

    // Calculate points for each manager in this month (subtract transfer costs)
    managers.forEach(manager => {
      let totalPoints = 0
      let totalTransfersCost = 0
      let gameweeksWithData = 0

      month.gameweeks.forEach(gw => {
        const gameweekData = gameweekTable.find(gwData => gwData.gameweek === gw)
        if (gameweekData) {
          const managerGWData = gameweekData.managers.find(m => m.id === manager.id)
          if (managerGWData) {
            totalPoints += (managerGWData.points || 0)
            totalTransfersCost += (managerGWData.transfersCost || 0)
            gameweeksWithData++
          }
        }
      })

      // Subtract transfer costs from total points
      manager.monthlyPoints = totalPoints - totalTransfersCost
      manager.transfersCost = totalTransfersCost
      manager.gameweeksPlayed = gameweeksWithData
      manager.averageGW = gameweeksWithData > 0 ? Math.round((totalPoints - totalTransfersCost) / gameweeksWithData) : 0
    })

    // Sort by monthly points (after transfer costs) and add ranks
    return managers
      .filter(manager => manager.gameweeksPlayed > 0) // Only include managers with data
      .sort((a, b) => b.monthlyPoints - a.monthlyPoints)
      .map((manager, index) => ({
        ...manager,
        rank: index + 1
      }))
  }

  // Get current month's standings
  const currentMonthStandings = calculateMonthlyStandings(selectedMonth)
  const selectedMonthData = months.find(m => m.id === selectedMonth)
  
  // Calculate total prizes distributed and remaining
  const completedMonths = months.filter(month => month.status === 'completed')
  const totalDistributed = completedMonths.reduce((sum, month) => sum + month.prizes.reduce((prizeSum, prize) => prizeSum + prize, 0), 0)
  const totalPrizePool = months.reduce((sum, month) => sum + month.prizes.reduce((prizeSum, prize) => prizeSum + prize, 0), 0)
  const remainingPrizes = totalPrizePool - totalDistributed

  // Get month winner
  const monthWinner = currentMonthStandings[0]
  
  // Get progress percentage for active month
  const getMonthProgress = (month) => {
    if (month.status === 'completed') return 100
    if (month.status === 'upcoming') return 0
    const completedGWs = month.gameweeks.filter(gw => gw < currentGW).length
    return Math.round((completedGWs / month.gameweeks.length) * 100)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card bg-gradient-to-br from-green-600 to-blue-600 text-white shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-3xl mb-4 flex items-center gap-2">
            <Calendar className="text-yellow-300" size={32} />
            Monthly Competition
            <div className="badge badge-accent">{selectedMonthData?.name}</div>
          </h2>
          
          {/* Current Month Spotlight */}
          {monthWinner && (
            <div className="bg-white/10 backdrop-blur rounded-xl p-6 mb-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {selectedMonthData?.status === 'completed' ? (
                      <>
                        <Crown className="text-yellow-300" size={24} />
                        <span className="text-xl font-bold">Month Winner</span>
                      </>
                    ) : (
                      <>
                        <Star className="text-yellow-300" size={24} />
                        <span className="text-xl font-bold">Current Leader</span>
                      </>
                    )}
                    <span className="badge badge-accent">
                      {selectedMonthData?.name}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-yellow-300">{monthWinner.managerName}</h3>
                  <p className="text-white/80">{monthWinner.teamName}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="flex items-center gap-1">
                      <Target size={16} />
                      {monthWinner.gameweeksPlayed}/{selectedMonthData?.gameweeks.length} GWs
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp size={16} />
                      {monthWinner.averageGW} avg
                    </span>
                    {monthWinner.transfersCost > 0 && (
                      <span className="flex items-center gap-1 text-red-300">
                        <span>-{monthWinner.transfersCost} penalties</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-yellow-300">{monthWinner.monthlyPoints}</div>
                  <div className="text-white/80">net points</div>
                  {selectedMonthData?.status === 'active' && (
                    <div className="text-sm text-white/60">
                      {getMonthProgress(selectedMonthData)}% complete
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Prize Pool Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-300">৳{totalDistributed}</div>
              <div className="text-white/80 text-sm">Distributed</div>
              <div className="text-white/60 text-xs">{completedMonths.length} months</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-300">৳{remainingPrizes}</div>
              <div className="text-white/80 text-sm">Remaining</div>
              <div className="text-white/60 text-xs">{months.filter(m => m.status !== 'completed').length} months</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-300">
                ৳{selectedMonthData?.prizes.reduce((sum, prize) => sum + prize, 0) || 0}
              </div>
              <div className="text-white/80 text-sm">Current Pool</div>
              <div className="text-white/60 text-xs">{selectedMonthData?.name}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-300">
                {currentMonthStandings.length > 0 ? 
                  Math.max(...currentMonthStandings.map(m => m.monthlyPoints)) : 0}
              </div>
              <div className="text-white/80 text-sm">Top Score</div>
              <div className="text-white/60 text-xs">Net points</div>
            </div>
          </div>
        </div>
      </div>

      {/* Month Selection */}
      <div className="card bg-white shadow-xl">
        <div className="card-body">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Select Month</h3>
            <div className="text-sm text-gray-600">
              Current: GW {currentGW}
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {months.map(month => {
              const isSelected = selectedMonth === month.id
              
              return (
                <button
                  key={month.id}
                  onClick={() => setSelectedMonth(month.id)}
                  className={`p-3 rounded-lg text-center transition-all ${
                    isSelected
                      ? 'bg-purple-600 text-white'
                      : month.status === 'completed'
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : month.status === 'active'
                      ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <div className="font-semibold">{month.name}</div>
                  <div className="text-xs">
                    GW {month.gameweeks[0]}-{month.gameweeks[month.gameweeks.length - 1]}
                  </div>
                  <div className="text-xs font-medium">
                    ৳{month.prizes.reduce((sum, prize) => sum + prize, 0)}
                  </div>
                  {month.status === 'completed' && <div className="text-xs">✅ Complete</div>}
                  {month.status === 'active' && <div className="text-xs">🔄 {getMonthProgress(month)}%</div>}
                  {month.status === 'upcoming' && <div className="text-xs">⏳ Upcoming</div>}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Monthly Standings */}
      <div className="card bg-white shadow-xl">
        <div className="card-body">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Trophy className="text-purple-600" size={24} />
              {selectedMonthData?.name} Standings
              {selectedMonthData?.status === 'completed' && <span className="text-green-600">🏆 Final</span>}
              {selectedMonthData?.status === 'active' && <span className="text-blue-600">📊 Live</span>}
            </h3>
            
            <div className="text-right text-sm">
              <div className="font-semibold">
                Prizes: ৳{selectedMonthData?.prizes.join(', ৳') || '0'}
              </div>
              <div className="text-gray-600">
                Gameweeks: {selectedMonthData?.gameweeks.join(', ')}
              </div>
            </div>
          </div>

          {currentMonthStandings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="text-center p-4 font-semibold text-gray-700 text-sm">Pos</th>
                    <th className="text-left p-4 font-semibold text-gray-700 text-sm">Manager</th>
                    <th className="text-left p-4 font-semibold text-gray-700 text-sm hidden md:table-cell">Team</th>
                    <th className="text-center p-4 font-semibold text-gray-700 text-sm">Net Points</th>
                    <th className="text-center p-4 font-semibold text-gray-700 text-sm hidden lg:table-cell">GWs</th>
                    <th className="text-center p-4 font-semibold text-gray-700 text-sm hidden lg:table-cell">Average</th>
                    <th className="text-center p-4 font-semibold text-gray-700 text-sm hidden lg:table-cell">Penalties</th>
                    <th className="text-center p-4 font-semibold text-gray-700 text-sm">Prize</th>
                  </tr>
                </thead>
                <tbody>
                  {currentMonthStandings.map((manager, index) => {
                    const isWinner = manager.rank <= 3 && selectedMonthData?.status === 'completed'
                    const isLeader = manager.rank === 1 && selectedMonthData?.status === 'active'
                    const prizeAmount = selectedMonthData?.prizes[manager.rank - 1] || 0
                    
                    return (
                      <tr 
                        key={manager.id}
                        className={`
                          border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150
                          ${isWinner ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : ''}
                          ${isLeader ? 'bg-gradient-to-r from-blue-50 to-purple-50' : ''}
                          ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                        `}
                      >
                        {/* Position */}
                        <td className="p-4 text-center font-semibold">
                          <div className="flex items-center justify-center gap-1">
                            {manager.rank === 1 && selectedMonthData?.status === 'completed' && <Crown className="text-yellow-500" size={16} />}
                            {manager.rank === 1 && selectedMonthData?.status === 'active' && <Star className="text-blue-500" size={16} />}
                            {manager.rank === 2 && <Medal className="text-gray-500" size={16} />}
                            {manager.rank === 3 && <Award className="text-orange-500" size={16} />}
                            <span className={`
                              ${manager.rank === 1 ? 'text-purple-600 font-bold' : 'text-gray-800'}
                            `}>
                              {manager.rank}
                            </span>
                          </div>
                        </td>

                        {/* Manager Name */}
                        <td className="p-4">
                          <div className="font-semibold text-gray-800">{manager.managerName}</div>
                        </td>

                        {/* Team Name */}
                        <td className="p-4 hidden md:table-cell text-gray-600 text-sm">
                          {manager.teamName}
                        </td>

                        {/* Net Points (after transfer costs) */}
                        <td className="p-4 text-center">
                          <span className="font-bold text-lg text-green-600">
                            {manager.monthlyPoints}
                          </span>
                        </td>

                        {/* Gameweeks Played */}
                        <td className="p-4 hidden lg:table-cell text-center">
                          <span className="text-sm">
                            {manager.gameweeksPlayed}/{selectedMonthData?.gameweeks.length}
                          </span>
                        </td>

                        {/* Average */}
                        <td className="p-4 hidden lg:table-cell text-center">
                          <span className="text-sm font-medium text-blue-600">
                            {manager.averageGW}
                          </span>
                        </td>

                        {/* Penalties */}
                        <td className="p-4 hidden lg:table-cell text-center">
                          <span className={`text-sm ${
                            manager.transfersCost > 0 ? 'text-red-600 font-medium' : 'text-gray-400'
                          }`}>
                            {manager.transfersCost > 0 ? `-${manager.transfersCost}` : '0'}
                          </span>
                        </td>

                        {/* Prize */}
                        <td className="p-4 text-center">
                          <span className={`font-bold ${
                            prizeAmount > 0 ? 'text-purple-600' : 'text-gray-400'
                          }`}>
                            {prizeAmount > 0 ? `৳${prizeAmount}` : '--'}
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
                {selectedMonthData?.name} data will appear here once the gameweeks begin.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MonthlyPrizes