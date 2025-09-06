// src/components/MonthlyPrizes.jsx - Fixed Monthly Calculations with Proper Transfer Cost Deduction
import { Calendar, Trophy, Users, TrendingUp, Crown, Award, Target, Star, Medal, ExternalLink, Zap } from 'lucide-react'
import { useState } from 'react'

const MonthlyPrizes = ({ standings = [], gameweekInfo = {}, gameweekTable = [] }) => {
  const currentGW = gameweekInfo.current || 3
  
  // Log received data for debugging
  console.log('📊 MonthlyPrizes Debug:', {
    standings: standings.length,
    gameweekTable: gameweekTable.length,
    currentGW,
    sampleGWData: gameweekTable[0]
  })
  
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
    const currentMonth = months.find(month => month.gameweeks.includes(currentGW))
    return currentMonth?.id || 1
  })

  // Fixed monthly standings calculation with proper transfer cost deduction
  const calculateMonthlyStandings = (monthId) => {
    const month = months.find(m => m.id === monthId)
    if (!month) return []

    console.log(`🔍 Calculating Month ${monthId} (${month.name}):`, month.gameweeks)

    const managers = standings.map(manager => ({
      id: manager.id,
      managerName: manager.managerName,
      teamName: manager.teamName,
      monthlyPoints: 0,
      rawPoints: 0,
      gameweeksPlayed: 0,
      transfersCost: 0,
      averageGW: 0,
      gameweekBreakdown: []
    }))

    // Process each manager's monthly performance
    managers.forEach(manager => {
      let totalRawPoints = 0
      let totalTransfersCost = 0
      let gameweeksWithData = 0
      const gameweekBreakdown = []

      // Check each gameweek in this month
      month.gameweeks.forEach(gw => {
        const gameweekData = gameweekTable.find(gwData => gwData.gameweek === gw)
        
        if (gameweekData && gameweekData.managers) {
          const managerGWData = gameweekData.managers.find(m => m.id === manager.id)
          
          if (managerGWData) {
            const points = managerGWData.points || 0
            
            // Check ALL possible transfer cost field names
            const transfersCost = managerGWData.transfersCost || 
                                 managerGWData.event_transfers_cost || 
                                 managerGWData.transferCost || 
                                 managerGWData.transfers_cost ||
                                 managerGWData.penalty ||
                                 managerGWData.hit ||
                                 0

            totalRawPoints += points
            totalTransfersCost += transfersCost
            gameweeksWithData++
            
            gameweekBreakdown.push({
              gameweek: gw,
              points: points,
              transfersCost: transfersCost,
              netPoints: points - transfersCost
            })

            // Enhanced debugging
            if (transfersCost > 0) {
              console.log(`💰 ${manager.managerName} GW${gw}: ${points} pts - ${transfersCost} cost = ${points - transfersCost}`)
            }
            
            // Log first few managers data structure for debugging
            if (manager.id === standings[0]?.id && gw === month.gameweeks[0]) {
              console.log('🔍 Sample manager data fields:', Object.keys(managerGWData))
              console.log('🔍 Full data:', managerGWData)
            }
          }
        }
      })

      // Calculate final monthly points (MUST subtract transfer costs)
      const finalMonthlyPoints = totalRawPoints - totalTransfersCost
      
      manager.monthlyPoints = finalMonthlyPoints
      manager.rawPoints = totalRawPoints
      manager.transfersCost = totalTransfersCost
      manager.gameweeksPlayed = gameweeksWithData
      manager.averageGW = gameweeksWithData > 0 ? Math.round(finalMonthlyPoints / gameweeksWithData) : 0
      manager.gameweekBreakdown = gameweekBreakdown

      // Log final calculation for debugging
      if (totalTransfersCost > 0 || gameweeksWithData > 0) {
        console.log(`📊 ${manager.managerName}: ${totalRawPoints} raw - ${totalTransfersCost} penalties = ${finalMonthlyPoints} final`)
      }
    })

    // Sort by FINAL points (after transfer costs) and rank
    const sortedManagers = managers
      .filter(manager => manager.gameweeksPlayed > 0)
      .sort((a, b) => b.monthlyPoints - a.monthlyPoints)
      .map((manager, index) => ({
        ...manager,
        rank: index + 1
      }))

    console.log('🏆 Final monthly standings:', sortedManagers.slice(0, 3).map(m => ({
      name: m.managerName,
      raw: m.rawPoints,
      penalties: m.transfersCost,
      final: m.monthlyPoints
    })))

    return sortedManagers
  }

  // Get current month's standings
  const currentMonthStandings = calculateMonthlyStandings(selectedMonth)
  const selectedMonthData = months.find(m => m.id === selectedMonth)
  
  // Calculate prize pool stats
  const completedMonths = months.filter(month => month.status === 'completed')
  const totalDistributed = completedMonths.reduce((sum, month) => sum + month.prizes.reduce((prizeSum, prize) => prizeSum + prize, 0), 0)
  const totalPrizePool = months.reduce((sum, month) => sum + month.prizes.reduce((prizeSum, prize) => prizeSum + prize, 0), 0)
  const remainingPrizes = totalPrizePool - totalDistributed

  const monthWinner = currentMonthStandings[0]
  
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
          
          {/* Current Month Winner Spotlight */}
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
                  </div>
                  <h3 className="text-2xl font-bold text-yellow-300">{monthWinner.managerName}</h3>
                  <p className="text-white/80">{monthWinner.teamName}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span>Raw: {monthWinner.rawPoints}</span>
                    {monthWinner.transfersCost > 0 && (
                      <span className="text-red-300">Penalties: -{monthWinner.transfersCost}</span>
                    )}
                    <span className="text-yellow-300 font-bold">Net: {monthWinner.monthlyPoints}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-yellow-300">{monthWinner.monthlyPoints}</div>
                  <div className="text-white/80">net points</div>
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
              <div className="text-2xl font-bold text-blue-300">
                ৳{selectedMonthData?.prizes.reduce((sum, prize) => sum + prize, 0) || 0}
              </div>
              <div className="text-white/80 text-sm">Current Pool</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-300">
                {currentMonthStandings.length > 0 ? Math.max(...currentMonthStandings.map(m => m.monthlyPoints)) : 0}
              </div>
              <div className="text-white/80 text-sm">Top Net Score</div>
            </div>
          </div>
        </div>
      </div>

      {/* Month Selection */}
      <div className="card bg-white shadow-xl">
        <div className="card-body">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Select Month</h3>
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-600">Current: GW {currentGW}</div>
              <button 
                className="btn btn-xs btn-outline"
                onClick={() => {
                  console.log('🔍 FULL DEBUG DATA:')
                  console.log('gameweekTable:', gameweekTable)
                  console.log('Sample GW1 manager:', gameweekTable.find(gw => gw.gameweek === 1)?.managers?.[0])
                  console.log('Sample GW2 manager:', gameweekTable.find(gw => gw.gameweek === 2)?.managers?.[0])
                  alert('Check browser console for full debug data!')
                }}
              >
                Debug Transfer Costs
              </button>
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
                  <div className="text-xs">GW {month.gameweeks[0]}-{month.gameweeks[month.gameweeks.length - 1]}</div>
                  <div className="text-xs font-medium">৳{month.prizes.reduce((sum, prize) => sum + prize, 0)}</div>
                  {month.status === 'completed' && <div className="text-xs">✅</div>}
                  {month.status === 'active' && <div className="text-xs">🔄 {getMonthProgress(month)}%</div>}
                  {month.status === 'upcoming' && <div className="text-xs">⏳</div>}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Monthly Standings Table - EXACT COPY of LeagueTable Structure */}
      <div className="card bg-white shadow-xl">
        <div className="card-body">
          {/* Header matching LeagueTable */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Trophy className="text-purple-600" size={24} />
              {selectedMonthData?.name} Standings
              {selectedMonthData?.status === 'completed' && <span className="text-green-600">🏆</span>}
              {selectedMonthData?.status === 'active' && <span className="text-blue-600">📊</span>}
              <div className="badge badge-primary">Net Points</div>
            </h3>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-green-500/20 text-gray-700 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Live Data</span>
              </div>
            </div>
          </div>

          {/* Stats Bar matching LeagueTable */}
          <div className="bg-gray-50 border-b border-gray-200 p-4 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {currentMonthStandings.length > 0 ? Math.max(...currentMonthStandings.map(m => m.rawPoints)) : 0}
                </div>
                <div className="text-sm text-gray-600">Highest Raw</div>
                <div className="text-xs text-gray-500">Before penalties</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {currentMonthStandings.length > 0 ? Math.max(...currentMonthStandings.map(m => m.monthlyPoints)) : 0}
                </div>
                <div className="text-sm text-gray-600">Highest Net</div>
                <div className="text-xs text-gray-500">After penalties</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {currentMonthStandings.reduce((sum, m) => sum + m.transfersCost, 0)}
                </div>
                <div className="text-sm text-gray-600">Total Penalties</div>
                <div className="text-xs text-gray-500">Transfer costs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  ৳{selectedMonthData?.prizes[0] || 0}
                </div>
                <div className="text-sm text-gray-600">Winner Prize</div>
                <div className="text-xs text-gray-500">1st place</div>
              </div>
            </div>
          </div>

          {/* Monthly Standings Table - EXACT COPY of LeagueTable structure */}
          {currentMonthStandings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="text-left p-4 font-semibold text-gray-700 text-sm">#</th>
                    <th className="text-center p-4 font-semibold text-gray-700 text-sm hidden sm:table-cell">
                      <TrendingUp size={16} className="mx-auto" />
                    </th>
                    <th className="text-left p-4 font-semibold text-gray-700 text-sm">Manager</th>
                    <th className="text-left p-4 font-semibold text-gray-700 text-sm hidden md:table-cell">Team</th>
                    <th className="text-center p-4 font-semibold text-gray-700 text-sm">Net Points</th>
                    <th className="text-center p-4 font-semibold text-gray-700 text-sm">Prize</th>
                    <th className="text-center p-4 font-semibold text-gray-700 text-sm hidden lg:table-cell">Penalties</th>
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
                          ${isWinner || isLeader ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : ''}
                          ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                        `}
                      >
                        {/* Position - EXACT COPY of LeagueTable */}
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className={`
                              font-bold text-lg
                              ${manager.rank === 1 ? 'text-yellow-600' : 
                                manager.rank === 2 ? 'text-gray-600' : 
                                manager.rank === 3 ? 'text-orange-600' : 'text-gray-700'}
                            `}>
                              {manager.rank}
                            </span>
                            {manager.rank === 1 && <Crown className="text-yellow-500" size={16} />}
                            {manager.rank === 2 && <Medal className="text-gray-500" size={16} />}
                            {manager.rank === 3 && <Award className="text-orange-500" size={16} />}
                          </div>
                        </td>

                        {/* Trophy Icon - EXACT COPY of LeagueTable */}
                        <td className="p-4 text-center hidden sm:table-cell">
                          <div className="flex justify-center">
                            {manager.rank <= 3 && <Trophy className="text-yellow-500" size={16} />}
                          </div>
                        </td>

                        {/* Manager Info - EXACT COPY of LeagueTable */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                {manager.managerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </div>
                              {manager.rank <= 3 && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                                  <Award size={10} className="text-yellow-800" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{manager.managerName}</div>
                              <div className="text-sm text-gray-500 md:hidden">
                                {manager.teamName}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Team Name - EXACT COPY of LeagueTable */}
                        <td className="p-4 hidden md:table-cell">
                          <span className="text-gray-700">{manager.teamName}</span>
                        </td>

                        {/* Net Points - EXACT COPY of LeagueTable */}
                        <td className="p-4 text-center">
                          <div className={`
                            inline-flex items-center gap-1 px-3 py-1 rounded-full font-semibold text-sm
                            ${manager.rank <= 3 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}
                          `}>
                            <Zap size={12} />
                            {manager.monthlyPoints}
                          </div>
                          {(manager.transfersCost > 0 || manager.rawPoints !== manager.monthlyPoints) && (
                            <div className="text-xs text-gray-500 mt-1">
                              {manager.rawPoints} - {manager.transfersCost} = {manager.monthlyPoints}
                            </div>
                          )}
                        </td>

                        {/* Prize - EXACT COPY of LeagueTable */}
                        <td className="p-4 text-center">
                          <span className={`
                            font-bold text-lg
                            ${prizeAmount > 0 ? 'text-purple-600' : 'text-gray-400'}
                          `}>
                            {prizeAmount > 0 ? `৳${prizeAmount}` : '--'}
                          </span>
                        </td>

                        {/* Penalties - EXACT COPY of LeagueTable */}
                        <td className="p-4 text-center hidden lg:table-cell">
                          <span className={`
                            font-semibold
                            ${manager.transfersCost > 0 ? 'text-red-600' : 'text-gray-400'}
                          `}>
                            {manager.transfersCost > 0 ? `-${manager.transfersCost}` : '0'}
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

          {/* Footer - EXACT COPY of LeagueTable */}
          <div className="bg-gray-50 border-t border-gray-200 p-4 mt-6">
            <div className="text-center text-sm text-gray-600">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>
                  Live monthly data from FPL API • Transfer penalties deducted • 
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

export default MonthlyPrizes