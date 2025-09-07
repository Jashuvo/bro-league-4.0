// src/components/LeagueTable.jsx - COMPLETELY REWRITTEN with Working Prize Calculation
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

  // COMPLETELY NEW PRIZE CALCULATION - WORKING VERSION
  const calculateTotalPrizesWon = (managerId) => {
    let totalWon = 0
    let debugInfo = []
    const currentGW = gameweekInfo.current || 3

    console.log(`💰 === CALCULATING PRIZES FOR MANAGER ${managerId} ===`)
    console.log(`📊 Current GW: ${currentGW}`)
    console.log(`📊 GameweekTable length: ${gameweekTable.length}`)

    // CRITICAL: Check if gameweekTable is actually empty or if there's a data loading issue
    if (gameweekTable.length === 0) {
      console.log(`❌ CRITICAL: gameweekTable is empty!`)
      console.log(`🔍 This means either:`)
      console.log(`   1. Data hasn't loaded yet`)
      console.log(`   2. gameweekTable prop isn't being passed correctly`)
      console.log(`   3. API didn't return gameweek data`)
      console.log(`📊 Available props:`, { hasStandings: standings.length > 0, currentGW, authStatus: authStatus.authenticated })
      
      // For now, return 0 but show the issue clearly
      return 0
    }

    // STEP 1: WEEKLY PRIZES
    console.log(`\n🔍 === WEEKLY PRIZE CALCULATION ===`)
    console.log(`✅ Found ${gameweekTable.length} gameweeks in table`)
    
    // Show structure of first gameweek
    const firstGW = gameweekTable[0]
    console.log(`🔍 First gameweek structure:`, {
      gameweek: firstGW?.gameweek,
      hasManagers: !!firstGW?.managers,
      managersCount: firstGW?.managers?.length || 0,
      sampleManager: firstGW?.managers?.[0] ? {
        id: firstGW.managers[0].id,
        entry: firstGW.managers[0].entry,
        points: firstGW.managers[0].points,
        managerName: firstGW.managers[0].managerName,
        allFields: Object.keys(firstGW.managers[0])
      } : 'No managers'
    })

    let weeklyWins = 0
    
    gameweekTable.forEach(gwData => {
      if (gwData.gameweek <= currentGW && gwData.managers && gwData.managers.length > 0) {
        console.log(`\n🔍 Processing GW${gwData.gameweek} with ${gwData.managers.length} managers`)
        
        // Find winner by highest net points (after transfer costs)
        let bestNetPoints = -999
        let weekWinner = null
        
        gwData.managers.forEach(manager => {
          // Get manager ID (try multiple fields)
          const mgrId = manager.id || manager.entry || manager.manager_id
          const rawPoints = manager.points || 0
          
          // Get transfer cost (try multiple field names)
          const transferCost = manager.transfersCost || 
                             manager.event_transfers_cost || 
                             manager.transferCost || 
                             manager.transfers_cost ||
                             manager.penalty ||
                             manager.hit ||
                             0
          
          const netPoints = rawPoints - transferCost
          
          // Track if this is our manager
          if (mgrId == managerId) { // Use == to handle string/number comparison
            console.log(`🔍 Found our manager in GW${gwData.gameweek}: ${rawPoints} - ${transferCost} = ${netPoints}`)
          }
          
          // Check if this is the best score so far
          if (netPoints > bestNetPoints) {
            bestNetPoints = netPoints
            weekWinner = {
              id: mgrId,
              name: manager.managerName,
              netPoints: netPoints,
              rawPoints: rawPoints,
              transferCost: transferCost
            }
          }
        })
        
        console.log(`🏆 GW${gwData.gameweek} winner: ${weekWinner?.name} (ID: ${weekWinner?.id}) with ${weekWinner?.netPoints} net points`)
        
        // Check if our manager won this week
        if (weekWinner && weekWinner.id == managerId) { // Use == for flexible comparison
          totalWon += 30
          weeklyWins++
          debugInfo.push(`🎉 Won GW${gwData.gameweek}: +৳30`)
          console.log(`🎉 Manager ${managerId} WON GW${gwData.gameweek}! +৳30 (Total now: ৳${totalWon})`)
        }
      } else {
        console.log(`⏭️ Skipping GW${gwData.gameweek}: ${gwData.gameweek > currentGW ? 'future' : 'no data'}`)
      }
    })
    
    console.log(`📊 Weekly summary: ${weeklyWins} wins = ৳${weeklyWins * 30}`)

    // STEP 2: MONTHLY PRIZES
    console.log(`\n🔍 === MONTHLY PRIZE CALCULATION ===`)
    
    const months = [
      { id: 1, name: "Month 1", gameweeks: [1, 2, 3, 4], prizes: [350, 250, 150] },
      { id: 2, name: "Month 2", gameweeks: [5, 6, 7, 8], prizes: [350, 250, 150] },
      { id: 3, name: "Month 3", gameweeks: [9, 10, 11, 12], prizes: [350, 250, 150] },
      { id: 4, name: "Month 4", gameweeks: [13, 14, 15, 16], prizes: [350, 250, 150] },
      { id: 5, name: "Month 5", gameweeks: [17, 18, 19, 20], prizes: [350, 250, 150] },
      { id: 6, name: "Month 6", gameweeks: [21, 22, 23, 24], prizes: [350, 250, 150] },
      { id: 7, name: "Month 7", gameweeks: [25, 26, 27, 28], prizes: [350, 250, 150] },
      { id: 8, name: "Month 8", gameweeks: [29, 30, 31, 32], prizes: [350, 250, 150] },
      { id: 9, name: "Month 9", gameweeks: [33, 34, 35, 36, 37, 38], prizes: [500, 400, 250] }
    ]

    let monthlyWins = 0
    
    months.forEach(month => {
      const isCompleted = currentGW > Math.max(...month.gameweeks)
      console.log(`📅 ${month.name} (GW ${month.gameweeks.join(',')}): ${isCompleted ? 'COMPLETED' : 'ACTIVE/UPCOMING'}`)
      
      if (isCompleted) {
        // Calculate monthly standings
        const monthlyStandings = []
        
        standings.forEach(standing => {
          let totalMonthlyPoints = 0
          let totalTransferCosts = 0
          let gamesPlayed = 0
          
          month.gameweeks.forEach(gw => {
            const gwData = gameweekTable.find(g => g.gameweek === gw)
            if (gwData && gwData.managers) {
              const managerData = gwData.managers.find(m => 
                (m.id == standing.id) || (m.entry == standing.id) ||
                (m.id == standing.entry) || (m.entry == standing.entry)
              )
              
              if (managerData) {
                const points = managerData.points || 0
                const transferCost = managerData.transfersCost || 
                                   managerData.event_transfers_cost || 
                                   managerData.transferCost || 
                                   managerData.transfers_cost ||
                                   managerData.penalty ||
                                   managerData.hit ||
                                   0
                
                totalMonthlyPoints += points
                totalTransferCosts += transferCost
                gamesPlayed++
              }
            }
          })
          
          if (gamesPlayed > 0) {
            monthlyStandings.push({
              id: standing.id,
              name: standing.managerName,
              netPoints: totalMonthlyPoints - totalTransferCosts,
              rawPoints: totalMonthlyPoints,
              transferCosts: totalTransferCosts
            })
          }
        })
        
        // Sort and rank
        monthlyStandings.sort((a, b) => b.netPoints - a.netPoints)
        
        const managerRank = monthlyStandings.findIndex(m => m.id == managerId) + 1
        
        if (managerRank > 0 && managerRank <= 3) {
          const prizeAmount = month.prizes[managerRank - 1]
          totalWon += prizeAmount
          monthlyWins++
          debugInfo.push(`🏆 ${month.name} ${managerRank}${managerRank === 1 ? 'st' : managerRank === 2 ? 'nd' : 'rd'}: +৳${prizeAmount}`)
          console.log(`🏆 Manager ${managerId} finished ${managerRank} in ${month.name}! +৳${prizeAmount}`)
        }
      }
    })

    console.log(`📊 Monthly summary: ${monthlyWins} prizes`)
    console.log(`💰 FINAL TOTAL for Manager ${managerId}: ৳${totalWon}`)
    console.log(`🎯 Prize breakdown:`, debugInfo)
    console.log(`💰 === END CALCULATION ===\n`)

    return totalWon
  }

  // Season prize calculation
  const getSeasonPrize = (rank) => {
    const seasonPrizes = { 1: 800, 2: 600, 3: 400 }
    const prize = seasonPrizes[rank]
    const isSeasonComplete = gameweekInfo.current >= 38
    
    if (isSeasonComplete) {
      return prize ? `৳${prize}` : '--'
    } else {
      return prize ? `(৳${prize})` : '--'
    }
  }

  // Calculate stats
  const allTotalWon = standings.map(manager => calculateTotalPrizesWon(manager.id || manager.entry))
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
                const totalWon = calculateTotalPrizesWon(manager.id || manager.entry)
                
                return (
                  <tr 
                    key={manager.id || manager.entry} 
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

                    {/* Total Prizes Won */}
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
                  Live data from FPL API • League ID: 1858389 • Transfer penalties deducted • 
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