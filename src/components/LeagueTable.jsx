// src/components/LeagueTable.jsx - Updated with FIXED Total Prizes Won Calculation
import { Trophy, TrendingUp, Users, Crown, Medal, Award, Zap, Star, ExternalLink } from 'lucide-react'

const LeagueTable = ({ standings = [], loading = false, authStatus = {}, gameweekInfo = {}, leagueStats = {}, gameweekTable = [] }) => {
  if (loading) {
    return (
      <div className="card bg-white shadow-xl">
        <div className="card-body text-center">
          <div className="loading loading-spinner loading-lg"></div>
          <p className="text-gray-500 mt-4">Loading league table...</p>
        </div>
      </div>
    )
  }

  // Calculate total prizes won for each manager - FIXED LOGIC
  const calculateTotalPrizesWon = (managerId) => {
    let totalWon = 0
    const currentGW = gameweekInfo.current || 3

    console.log(`💰 Calculating total prizes for manager ID: ${managerId}`)

    // 1. WEEKLY PRIZES - Check each completed gameweek for winners
    let weeklyWins = 0
    gameweekTable.forEach(gw => {
      if (gw.gameweek <= currentGW && gw.managers && gw.managers.length > 0) {
        // Apply transfer cost deduction to find ACTUAL winner
        const managersWithNetPoints = gw.managers
          .filter(m => m.points > 0)
          .map(manager => {
            const rawPoints = manager.points || 0
            const transfersCost = manager.transfersCost || 
                                 manager.event_transfers_cost || 
                                 manager.transferCost || 
                                 manager.transfers_cost ||
                                 manager.penalty ||
                                 manager.hit ||
                                 0
            return {
              ...manager,
              netPoints: rawPoints - transfersCost
            }
          })
          .sort((a, b) => b.netPoints - a.netPoints)
        
        const winner = managersWithNetPoints[0]
        if (winner && winner.id === managerId) {
          totalWon += 30
          weeklyWins++
          console.log(`🏆 Manager ${managerId} won GW${gw.gameweek} with ${winner.netPoints} net points → +৳30`)
        }
      }
    })

    // 2. MONTHLY PRIZES - Check each completed month for top 3
    const months = [
      { id: 1, name: "Month 1", gameweeks: [1, 2, 3, 4], prizes: [350, 250, 150], status: currentGW > 4 ? 'completed' : 'active' },
      { id: 2, name: "Month 2", gameweeks: [5, 6, 7, 8], prizes: [350, 250, 150], status: currentGW > 8 ? 'completed' : currentGW >= 5 ? 'active' : 'upcoming' },
      { id: 3, name: "Month 3", gameweeks: [9, 10, 11, 12], prizes: [350, 250, 150], status: currentGW > 12 ? 'completed' : currentGW >= 9 ? 'active' : 'upcoming' },
      { id: 4, name: "Month 4", gameweeks: [13, 14, 15, 16], prizes: [350, 250, 150], status: currentGW > 16 ? 'completed' : currentGW >= 13 ? 'active' : 'upcoming' },
      { id: 5, name: "Month 5", gameweeks: [17, 18, 19, 20], prizes: [350, 250, 150], status: currentGW > 20 ? 'completed' : currentGW >= 17 ? 'active' : 'upcoming' },
      { id: 6, name: "Month 6", gameweeks: [21, 22, 23, 24], prizes: [350, 250, 150], status: currentGW > 24 ? 'completed' : currentGW >= 21 ? 'active' : 'upcoming' },
      { id: 7, name: "Month 7", gameweeks: [25, 26, 27, 28], prizes: [350, 250, 150], status: currentGW > 28 ? 'completed' : currentGW >= 25 ? 'active' : 'upcoming' },
      { id: 8, name: "Month 8", gameweeks: [29, 30, 31, 32], prizes: [350, 250, 150], status: currentGW > 32 ? 'completed' : currentGW >= 29 ? 'active' : 'upcoming' },
      { id: 9, name: "Month 9 (Final)", gameweeks: [33, 34, 35, 36, 37, 38], prizes: [500, 400, 250], status: currentGW > 38 ? 'completed' : currentGW >= 33 ? 'active' : 'upcoming' }
    ]

    let monthlyWins = 0
    months.forEach(month => {
      if (month.status === 'completed') {
        console.log(`📅 Checking completed ${month.name} (GW ${month.gameweeks.join(',')})`)
        
        // Calculate monthly standings for this specific month
        const monthlyStandings = []
        
        standings.forEach(manager => {
          let totalRawPoints = 0
          let totalTransfersCost = 0
          let gameweeksWithData = 0

          // Sum points for this month's gameweeks
          month.gameweeks.forEach(gw => {
            const gameweekData = gameweekTable.find(gwData => gwData.gameweek === gw)
            
            if (gameweekData && gameweekData.managers) {
              // Check both possible ID fields
              const managerGWData = gameweekData.managers.find(m => 
                m.id === manager.id || m.entry === manager.id ||
                m.id === manager.entry || m.entry === manager.entry
              )
              
              if (managerGWData) {
                const points = managerGWData.points || 0
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
              }
            }
          })

          // Only include managers who played in this month
          if (gameweeksWithData > 0) {
            monthlyStandings.push({
              id: manager.id,
              name: manager.managerName,
              monthlyPoints: totalRawPoints - totalTransfersCost,
              rawPoints: totalRawPoints,
              transfersCost: totalTransfersCost
            })
          }
        })

        // Sort by monthly net points and assign ranks
        const sortedMonthlyStandings = monthlyStandings
          .sort((a, b) => b.monthlyPoints - a.monthlyPoints)
          .map((manager, index) => ({
            ...manager,
            rank: index + 1
          }))

        // Check if this manager won a monthly prize
        const managerMonthlyRank = sortedMonthlyStandings.find(m => m.id === managerId)
        if (managerMonthlyRank && managerMonthlyRank.rank <= 3) {
          const prizeAmount = month.prizes[managerMonthlyRank.rank - 1]
          totalWon += prizeAmount
          monthlyWins++
          console.log(`🏆 Manager ${managerId} finished ${managerMonthlyRank.rank} in ${month.name} with ${managerMonthlyRank.monthlyPoints} points → +৳${prizeAmount}`)
        }
      } else {
        console.log(`📅 ${month.name} is ${month.status} (not completed yet)`)
      }
    })

    console.log(`💰 Manager ${managerId} TOTAL: ৳${totalWon} (${weeklyWins} weekly wins, ${monthlyWins} monthly prizes)`)
    return totalWon
  }

  // Season prize calculation (only show at end of season)
  const getSeasonPrize = (rank) => {
    // Only show season prizes if season is completed (all 38 gameweeks done)
    const isSeasonComplete = gameweekInfo.current >= 38
    
    if (!isSeasonComplete) {
      // Show potential season prize during season
      const seasonPrizes = { 1: 800, 2: 600, 3: 400, 4: 200 }
      const prize = seasonPrizes[rank]
      return prize ? `(৳${prize})` : '--'
    }
    
    // Show actual season prize at end
    const seasonPrizes = { 1: 800, 2: 600, 3: 400, 4: 200 }
    const prize = seasonPrizes[rank]
    return prize ? `৳${prize}` : '--'
  }

  // Calculate all totals for stats
  const allTotalWon = standings.map(manager => calculateTotalPrizesWon(manager.id))
  const maxTotalWon = allTotalWon.length > 0 ? Math.max(...allTotalWon) : 0

  return (
    <div className="card bg-white shadow-xl">
      <div className="card-body">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="text-purple-600" size={24} />
            League Table
            <div className="badge badge-primary">Live</div>
          </h3>
          
          <div className="flex items-center gap-2">
            {authStatus?.authenticated ? (
              <div className="flex items-center gap-2 bg-green-500/20 text-gray-700 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Live Data</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-yellow-500/20 text-gray-700 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-sm font-medium">Demo Mode</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats Bar */}
        <div className="bg-gray-50 border-b border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {standings.length}
              </div>
              <div className="text-sm text-gray-600">Managers</div>
              <div className="text-xs text-gray-500">Total players</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {standings.length > 0 ? 
                  Math.max(...standings.map(s => s.totalPoints)).toLocaleString() : '--'}
              </div>
              <div className="text-sm text-gray-600">Top Score</div>
              <div className="text-xs text-gray-500">Season total</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {standings.length >= 2 ? 
                  (standings[0]?.totalPoints - standings[standings.length - 1]?.totalPoints).toLocaleString() : '--'}
              </div>
              <div className="text-sm text-gray-600">Points Gap</div>
              <div className="text-xs text-gray-500">First to last</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                ৳{maxTotalWon}
              </div>
              <div className="text-sm text-gray-600">Top Earner</div>
              <div className="text-xs text-gray-500">Total won</div>
            </div>
          </div>
        </div>
        
        {/* Table */}
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
                <th className="text-center p-4 font-semibold text-gray-700 text-sm">
                  GW{gameweekInfo?.current || ''}
                </th>
                <th className="text-center p-4 font-semibold text-gray-700 text-sm">Total</th>
                <th className="text-center p-4 font-semibold text-gray-700 text-sm">Total Won</th>
                <th className="text-center p-4 font-semibold text-gray-700 text-sm hidden lg:table-cell">Prize</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((manager, index) => {
                const totalWon = calculateTotalPrizesWon(manager.id)
                
                return (
                  <tr 
                    key={manager.id} 
                    className={`
                      border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150
                      ${manager.rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : ''}
                      ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                    `}
                  >
                    {/* Position */}
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

                    {/* Movement Indicator */}
                    <td className="p-4 text-center hidden sm:table-cell">
                      <div className="flex justify-center">
                        {manager.rank <= 3 && <Trophy className="text-yellow-500" size={16} />}
                      </div>
                    </td>

                    {/* Manager Info */}
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

                    {/* Team Name */}
                    <td className="p-4 hidden md:table-cell">
                      <span className="text-gray-700">{manager.teamName}</span>
                    </td>

                    {/* Current Gameweek Points */}
                    <td className="p-4 text-center">
                      <div className={`
                        inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-semibold
                        ${manager.gameweekPoints >= 80 ? 'bg-green-100 text-green-800' : 
                        manager.gameweekPoints >= 60 ? 'bg-yellow-100 text-yellow-800' : 
                        manager.gameweekPoints > 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'}
                      `}>
                        {manager.gameweekPoints >= 80 && <Zap size={12} />}
                        {manager.gameweekPoints || '--'}
                      </div>
                    </td>

                    {/* Total Points */}
                    <td className="p-4 text-center">
                      <span className="font-bold text-lg text-gray-900">
                        {manager.totalPoints?.toLocaleString() || '--'}
                      </span>
                    </td>

                    {/* NEW: Total Prizes Won */}
                    <td className="p-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`
                          font-bold text-lg
                          ${totalWon > 0 ? 'text-green-600' : 'text-gray-400'}
                        `}>
                          ৳{totalWon}
                        </span>
                        {totalWon > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            Won prizes
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Season Prize */}
                    <td className="p-4 text-center hidden lg:table-cell">
                      <span className={`
                        font-semibold
                        ${manager.rank <= 4 ? 'text-green-600' : 'text-gray-500'}
                      `}>
                        {getSeasonPrize(manager.rank)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-4">
          <div className="text-center text-sm text-gray-600">
            {authStatus?.authenticated ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>
                  Live data from FPL API • League ID: 1858389 • Transfer penalties deducted from all competitions • 
                  Last updated: {new Date().toLocaleString('en-US', { 
                    timeZone: 'Asia/Dhaka',
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })} (BD Time)
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>
                  Demo mode • 
                  <button 
                    className="text-blue-600 hover:text-blue-800 font-medium ml-1" 
                    onClick={() => window.location.reload()}
                  >
                    Refresh to connect to FPL API
                  </button>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LeagueTable