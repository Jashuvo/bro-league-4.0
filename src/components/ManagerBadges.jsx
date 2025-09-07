// src/components/ManagerBadges.jsx - Manager Achievement Badges System
import { Trophy, Zap, Target, Crown, Award, Star, TrendingUp, Shield, Flame, Medal, DollarSign, Clock } from 'lucide-react'

const ManagerBadges = ({ manager, gameweekTable = [], gameweekInfo = {}, allManagers = [] }) => {
  if (!manager) return null

  const currentGW = gameweekInfo.current || 3
  
  // Calculate badges based on manager performance
  const calculateBadges = () => {
    const badges = []
    
    // Get manager's gameweek history
    const managerHistory = gameweekTable
      .map(gw => gw.managers?.find(m => m.id === manager.id))
      .filter(Boolean)
      .slice(0, currentGW) // Only completed gameweeks
    
    if (managerHistory.length === 0) return badges

    // 1. CENTURY MAKER - 100+ points in a gameweek
    const centuryGWs = managerHistory.filter(gw => gw.points >= 100)
    if (centuryGWs.length > 0) {
      badges.push({
        id: 'century_maker',
        name: 'Century Maker',
        description: `Scored 100+ points in ${centuryGWs.length} gameweek${centuryGWs.length > 1 ? 's' : ''}`,
        icon: Trophy,
        color: 'from-yellow-400 to-orange-500',
        textColor: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        rarity: centuryGWs.length >= 3 ? 'legendary' : 'rare',
        count: centuryGWs.length
      })
    }

    // 2. WEEKLY CHAMPION - Most gameweek wins
    let weeklyWins = 0
    gameweekTable.forEach(gw => {
      if (gw.gameweek <= currentGW && gw.managers && gw.managers.length > 0) {
        const sortedManagers = gw.managers
          .filter(m => m.points > 0)
          .sort((a, b) => (b.points - (b.transferCost || 0)) - (a.points - (a.transferCost || 0)))
        
        if (sortedManagers[0]?.id === manager.id) {
          weeklyWins++
        }
      }
    })
    
    if (weeklyWins > 0) {
      badges.push({
        id: 'weekly_champion',
        name: 'Weekly Champion',
        description: `Won ${weeklyWins} gameweek${weeklyWins > 1 ? 's' : ''}`,
        icon: Crown,
        color: 'from-purple-400 to-pink-500',
        textColor: 'text-purple-600',
        bgColor: 'bg-purple-100',
        rarity: weeklyWins >= 3 ? 'legendary' : weeklyWins >= 2 ? 'epic' : 'rare',
        count: weeklyWins
      })
    }

    // 3. TRANSFER MASTER - No hits taken
    const totalTransferCost = managerHistory.reduce((sum, gw) => sum + (gw.transferCost || 0), 0)
    if (totalTransferCost === 0 && managerHistory.length >= 3) {
      badges.push({
        id: 'transfer_master',
        name: 'Transfer Master',
        description: 'No transfer penalties taken',
        icon: Shield,
        color: 'from-green-400 to-emerald-500',
        textColor: 'text-green-600',
        bgColor: 'bg-green-100',
        rarity: 'epic'
      })
    }

    // 4. CONSISTENT PERFORMER - Top 5 in multiple gameweeks
    let top5Finishes = 0
    gameweekTable.forEach(gw => {
      if (gw.gameweek <= currentGW && gw.managers && gw.managers.length >= 5) {
        const sortedManagers = gw.managers
          .filter(m => m.points > 0)
          .sort((a, b) => (b.points - (b.transferCost || 0)) - (a.points - (a.transferCost || 0)))
        
        const managerRank = sortedManagers.findIndex(m => m.id === manager.id) + 1
        if (managerRank > 0 && managerRank <= 5) {
          top5Finishes++
        }
      }
    })
    
    if (top5Finishes >= Math.ceil(currentGW * 0.6)) { // 60% of gameweeks in top 5
      badges.push({
        id: 'consistent_performer',
        name: 'Consistent Performer',
        description: `Top 5 finish in ${top5Finishes} gameweeks`,
        icon: TrendingUp,
        color: 'from-blue-400 to-cyan-500',
        textColor: 'text-blue-600',
        bgColor: 'bg-blue-100',
        rarity: 'epic',
        count: top5Finishes
      })
    }

    // 5. HIGH ROLLER - Highest single gameweek score
    const highestGW = Math.max(...managerHistory.map(gw => gw.points))
    const leagueHighestGW = Math.max(...gameweekTable.flatMap(gw => 
      gw.managers?.map(m => m.points) || []
    ))
    
    if (highestGW === leagueHighestGW && highestGW > 0) {
      badges.push({
        id: 'high_roller',
        name: 'High Roller',
        description: `League's highest gameweek score: ${highestGW} pts`,
        icon: Flame,
        color: 'from-red-400 to-orange-500',
        textColor: 'text-red-600',
        bgColor: 'bg-red-100',
        rarity: 'legendary',
        score: highestGW
      })
    }

    // 6. VETERAN PLAYER - Playing since GW1
    if (manager.startedEvent === 1) {
      badges.push({
        id: 'veteran_player',
        name: 'Veteran Player',
        description: 'Been here since Day 1',
        icon: Medal,
        color: 'from-gray-600 to-gray-800',
        textColor: 'text-gray-700',
        bgColor: 'bg-gray-100',
        rarity: 'common'
      })
    }

    // 7. TOP RANK - Currently in top 3
    if (manager.rank <= 3) {
      const positions = ['Champion', 'Runner-up', 'Third Place']
      badges.push({
        id: 'top_rank',
        name: positions[manager.rank - 1],
        description: `Currently ranked #${manager.rank}`,
        icon: manager.rank === 1 ? Crown : manager.rank === 2 ? Trophy : Award,
        color: manager.rank === 1 ? 'from-yellow-400 to-yellow-600' : 
               manager.rank === 2 ? 'from-gray-400 to-gray-600' : 
               'from-orange-400 to-orange-600',
        textColor: manager.rank === 1 ? 'text-yellow-700' : 
                   manager.rank === 2 ? 'text-gray-700' : 
                   'text-orange-700',
        bgColor: manager.rank === 1 ? 'bg-yellow-100' : 
                 manager.rank === 2 ? 'bg-gray-100' : 
                 'bg-orange-100',
        rarity: 'legendary'
      })
    }

    // 8. EFFICIENCY EXPERT - High points per transfer
    const totalTransfers = managerHistory.reduce((sum, gw) => sum + (gw.transfers || 0), 0)
    const totalPoints = managerHistory.reduce((sum, gw) => sum + (gw.points || 0), 0)
    const efficiency = totalTransfers > 0 ? (totalPoints / totalTransfers) : 0
    
    if (efficiency > 50 && totalTransfers > 5) { // More than 50 points per transfer
      badges.push({
        id: 'efficiency_expert',
        name: 'Efficiency Expert',
        description: `${Math.round(efficiency)} points per transfer`,
        icon: Target,
        color: 'from-indigo-400 to-purple-500',
        textColor: 'text-indigo-600',
        bgColor: 'bg-indigo-100',
        rarity: 'rare',
        efficiency: Math.round(efficiency)
      })
    }

    return badges.sort((a, b) => {
      const rarityOrder = { legendary: 4, epic: 3, rare: 2, common: 1 }
      return rarityOrder[b.rarity] - rarityOrder[a.rarity]
    })
  }

  const badges = calculateBadges()

  if (badges.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1">
      {badges.slice(0, 3).map((badge) => { // Show max 3 badges to avoid clutter
        const IconComponent = badge.icon
        
        return (
          <div
            key={badge.id}
            className={`
              group relative inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
              ${badge.bgColor} ${badge.textColor} border border-current/20
              hover:scale-110 transition-all duration-200 cursor-help
            `}
            title={badge.description}
          >
            <IconComponent size={12} />
            <span className="hidden sm:inline">{badge.name}</span>
            {badge.count && <span className="text-xs opacity-75">×{badge.count}</span>}
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
              {badge.description}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        )
      })}
      
      {/* Show badge count if more than 3 */}
      {badges.length > 3 && (
        <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          +{badges.length - 3}
        </div>
      )}
    </div>
  )
}

// Helper component to show all badges for a manager (for modal/detail view)
export const ManagerBadgesList = ({ manager, gameweekTable = [], gameweekInfo = {}, allManagers = [] }) => {
  if (!manager) return null

  const currentGW = gameweekInfo.current || 3
  
  // Same calculation logic as above but return all badges
  const calculateAllBadges = () => {
    const badges = []
    
    const managerHistory = gameweekTable
      .map(gw => gw.managers?.find(m => m.id === manager.id))
      .filter(Boolean)
      .slice(0, currentGW)
    
    if (managerHistory.length === 0) return badges

    // All badge calculations (same as above)
    // ... (copy all badge calculation logic from above)
    
    return badges
  }

  const allBadges = calculateAllBadges()

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg flex items-center gap-2">
        <Star className="text-yellow-500" size={20} />
        Achievements ({allBadges.length})
      </h3>
      
      {allBadges.length === 0 ? (
        <p className="text-gray-500">No achievements yet. Keep playing to unlock badges!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {allBadges.map((badge) => {
            const IconComponent = badge.icon
            
            return (
              <div
                key={badge.id}
                className={`
                  flex items-center gap-3 p-3 rounded-lg border
                  ${badge.bgColor} border-current/20
                `}
              >
                <div className={`p-2 rounded-full bg-gradient-to-br ${badge.color}`}>
                  <IconComponent className="text-white" size={20} />
                </div>
                <div>
                  <div className={`font-semibold ${badge.textColor}`}>{badge.name}</div>
                  <div className="text-sm text-gray-600">{badge.description}</div>
                  {badge.rarity && (
                    <div className={`
                      text-xs px-2 py-1 rounded-full mt-1 inline-block
                      ${badge.rarity === 'legendary' ? 'bg-yellow-200 text-yellow-800' :
                        badge.rarity === 'epic' ? 'bg-purple-200 text-purple-800' :
                        badge.rarity === 'rare' ? 'bg-blue-200 text-blue-800' :
                        'bg-gray-200 text-gray-800'}
                    `}>
                      {badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1)}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ManagerBadges