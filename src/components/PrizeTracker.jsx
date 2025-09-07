// src/components/PrizeTracker.jsx - Visual Prize Distribution Dashboard
import { Trophy, DollarSign, Calendar, Zap, Target, Gift, Award, Crown, Medal, TrendingUp, Users, Clock } from 'lucide-react'

const PrizeTracker = ({ gameweekInfo = {}, standings = [], gameweekTable = [] }) => {
  const currentGW = gameweekInfo.current || 3
  const totalGWs = gameweekInfo.total || 38
  
  // Prize structure
  const prizeStructure = {
    season: {
      total: 1800,
      prizes: [
        { position: 1, amount: 800, emoji: '🥇', color: 'text-yellow-600' },
        { position: 2, amount: 600, emoji: '🥈', color: 'text-gray-600' },
        { position: 3, amount: 400, emoji: '🥉', color: 'text-orange-600' }
      ]
    },
    weekly: {
      perWeek: 30,
      totalWeeks: 38,
      total: 1140 // 38 * 30
    },
    monthly: {
      regularMonths: 8,
      regularPrizes: [350, 250, 150], // per month
      finalMonth: [500, 400, 250],
      total: 7150 // (8 * 750) + 1150
    },
    souvenirs: {
      total: 1910,
      items: ['BRO League Jerseys', 'Certificates', 'Digital Badges']
    }
  }

  const grandTotal = 12000 // Total entry fees

  // Calculate distributed prizes
  const weeklyDistributed = Math.max(0, currentGW - 1) * prizeStructure.weekly.perWeek
  const monthsCompleted = Math.floor(Math.max(0, currentGW - 1) / 4)
  const monthlyDistributed = monthsCompleted * 750 // Regular months only
  
  const totalDistributed = weeklyDistributed + monthlyDistributed
  const remainingPrizes = grandTotal - prizeStructure.season.total - prizeStructure.souvenirs.total - totalDistributed

  // Calculate progress percentages
  const weeklyProgress = Math.min(100, (currentGW / totalGWs) * 100)
  const monthlyProgress = Math.min(100, (monthsCompleted / 9) * 100)

  // Get current top 3 for season preview
  const currentTop3 = standings.slice(0, 3)

  // Get recent weekly winners
  const recentWinners = gameweekTable
    .filter(gw => gw.gameweek < currentGW && gw.managers && gw.managers.length > 0)
    .slice(-3)
    .map(gw => {
      const sortedManagers = gw.managers
        .filter(m => m.points > 0)
        .sort((a, b) => (b.points - (b.transferCost || 0)) - (a.points - (a.transferCost || 0)))
      
      return {
        gameweek: gw.gameweek,
        winner: sortedManagers[0],
        prize: 30
      }
    })
    .reverse()

  return (
    <div className="space-y-6">
      {/* Header Overview */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <DollarSign size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">BRO League 4.0 Prize Pool</h2>
            <p className="text-purple-100">Complete prize distribution tracker</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">৳{grandTotal.toLocaleString()}</div>
            <div className="text-sm opacity-80">Total Pool</div>
          </div>
          <div className="bg-green-500/20 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-300">৳{totalDistributed.toLocaleString()}</div>
            <div className="text-sm opacity-80">Distributed</div>
          </div>
          <div className="bg-yellow-500/20 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-300">৳{remainingPrizes.toLocaleString()}</div>
            <div className="text-sm opacity-80">Remaining</div>
          </div>
          <div className="bg-blue-500/20 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-300">{Math.round((totalDistributed / (grandTotal - prizeStructure.season.total - prizeStructure.souvenirs.total)) * 100)}%</div>
            <div className="text-sm opacity-80">Progress</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Season Championship */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-4">
            <div className="flex items-center gap-2 text-white">
              <Crown size={24} />
              <div>
                <h3 className="text-lg font-bold">Season Championship</h3>
                <p className="text-yellow-100 text-sm">Final standings prizes</p>
              </div>
            </div>
          </div>
          
          <div className="p-4">
            <div className="space-y-3 mb-4">
              {prizeStructure.season.prizes.map((prize, index) => (
                <div key={prize.position} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{prize.emoji}</span>
                    <div>
                      <div className="font-semibold">{index === 0 ? 'Champion' : index === 1 ? 'Runner-up' : '3rd Place'}</div>
                      {currentTop3[index] && (
                        <div className="text-sm text-gray-600">{currentTop3[index].managerName}</div>
                      )}
                    </div>
                  </div>
                  <div className={`text-lg font-bold ${prize.color}`}>
                    ৳{prize.amount}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-gray-100 rounded-lg p-3 text-center">
              <div className="font-bold text-gray-900">Total: ৳{prizeStructure.season.total}</div>
              <div className="text-sm text-gray-600">Distributed at season end</div>
            </div>
          </div>
        </div>

        {/* Weekly Prizes */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-4">
            <div className="flex items-center gap-2 text-white">
              <Zap size={24} />
              <div>
                <h3 className="text-lg font-bold">Weekly Highest Points</h3>
                <p className="text-blue-100 text-sm">৳30 per gameweek</p>
              </div>
            </div>
          </div>
          
          <div className="p-4">
            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Progress</span>
                <span>{currentGW - 1} / {totalGWs} weeks</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${weeklyProgress}%` }}
                ></div>
              </div>
            </div>

            {/* Recent winners */}
            <div className="space-y-2 mb-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <Medal size={16} />
                Recent Winners
              </h4>
              {recentWinners.length > 0 ? (
                recentWinners.map((winner) => (
                  <div key={winner.gameweek} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                    <div>
                      <div className="font-medium">GW{winner.gameweek}</div>
                      <div className="text-sm text-gray-600">{winner.winner?.managerName || 'Unknown'}</div>
                    </div>
                    <div className="text-green-600 font-bold">৳{winner.prize}</div>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 text-sm">No winners yet</div>
              )}
            </div>
            
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="font-bold text-blue-900">Distributed: ৳{weeklyDistributed}</div>
              <div className="text-sm text-blue-700">Remaining: ৳{prizeStructure.weekly.total - weeklyDistributed}</div>
            </div>
          </div>
        </div>

        {/* Monthly Competition */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4">
            <div className="flex items-center gap-2 text-white">
              <Calendar size={24} />
              <div>
                <h3 className="text-lg font-bold">Monthly Competition</h3>
                <p className="text-green-100 text-sm">9 months of prizes</p>
              </div>
            </div>
          </div>
          
          <div className="p-4">
            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Months Completed</span>
                <span>{monthsCompleted} / 9</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${monthlyProgress}%` }}
                ></div>
              </div>
            </div>

            {/* Monthly breakdown */}
            <div className="space-y-3 mb-4">
              <div className="bg-green-50 rounded-lg p-3">
                <div className="font-semibold text-green-900 mb-2">Months 1-8 (Regular)</div>
                <div className="text-sm text-green-700">
                  ৳350 • ৳250 • ৳150 per month
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg p-3">
                <div className="font-semibold text-green-900 mb-2">Month 9 (Final)</div>
                <div className="text-sm text-green-700">
                  ৳500 • ৳400 • ৳250 (Grand Finale)
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="font-bold text-green-900">Distributed: ৳{monthlyDistributed}</div>
              <div className="text-sm text-green-700">Total Pool: ৳{prizeStructure.monthly.total}</div>
            </div>
          </div>
        </div>

        {/* Souvenirs & Extras */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-4">
            <div className="flex items-center gap-2 text-white">
              <Gift size={24} />
              <div>
                <h3 className="text-lg font-bold">Souvenirs & Extras</h3>
                <p className="text-pink-100 text-sm">For all participants</p>
              </div>
            </div>
          </div>
          
          <div className="p-4">
            <div className="space-y-3 mb-4">
              {prizeStructure.souvenirs.items.map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-2 bg-pink-50 rounded-lg">
                  <Award className="text-pink-500" size={16} />
                  <span className="text-gray-700">{item}</span>
                </div>
              ))}
            </div>
            
            <div className="bg-pink-50 rounded-lg p-3 text-center">
              <div className="font-bold text-pink-900">Total Value: ৳{prizeStructure.souvenirs.total}</div>
              <div className="text-sm text-pink-700">Jerseys + Awards for everyone!</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Summary */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-6 text-white">
        <div className="text-center">
          <h3 className="text-xl font-bold mb-2">Prize Distribution Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div>
              <div className="text-yellow-400 text-xl font-bold">৳{prizeStructure.season.total}</div>
              <div className="text-sm opacity-80">Season Prizes</div>
            </div>
            <div>
              <div className="text-blue-400 text-xl font-bold">৳{prizeStructure.weekly.total}</div>
              <div className="text-sm opacity-80">Weekly Prizes</div>
            </div>
            <div>
              <div className="text-green-400 text-xl font-bold">৳{prizeStructure.monthly.total}</div>
              <div className="text-sm opacity-80">Monthly Prizes</div>
            </div>
            <div>
              <div className="text-pink-400 text-xl font-bold">৳{prizeStructure.souvenirs.total}</div>
              <div className="text-sm opacity-80">Souvenirs</div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-600">
            <div className="text-2xl font-bold">৳{grandTotal.toLocaleString()}</div>
            <div className="text-gray-300">Total Prize Pool • 15 Bros • ৳800 each</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrizeTracker