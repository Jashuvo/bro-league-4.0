// src/components/PrizeDistribution.jsx - Fixed with Correct Prize Breakdown
import { Trophy, Award, Calendar, Zap, Target, Gift } from 'lucide-react'

const PrizeDistribution = ({ standings = [], gameweekInfo = {}, authStatus = {}, leagueStats = {} }) => {
  // Calculate real data based on actual league information
  const currentGameweek = gameweekInfo.current || 3
  const totalGameweeks = gameweekInfo.total || 38
  const completedGameweeks = currentGameweek - 1
  const remainingGameweeks = totalGameweeks - currentGameweek + 1
  
  // CORRECT PRIZE BREAKDOWN FROM BRO LEAGUE 4.0 ANNOUNCEMENT
  const totalParticipants = 15
  const entryFeePerPerson = 800
  const totalEntryFees = totalParticipants * entryFeePerPerson // 12,000 BDT
  
  // Calculate real weekly prizes distributed
  const weeklyPrizePerGameweek = 30
  const totalWeeklyDistributed = completedGameweeks * weeklyPrizePerGameweek
  const totalWeeklyPrizePool = totalGameweeks * weeklyPrizePerGameweek // 1,140 BDT
  const remainingWeeklyPrizes = remainingGameweeks * weeklyPrizePerGameweek
  
  // Calculate monthly data - 9 months total (August to April)
  const completedMonths = Math.floor((currentGameweek - 1) / 4)
  const currentMonth = Math.ceil(currentGameweek / 4)
  const totalMonths = 9
  
  // CORRECT Monthly prize breakdown
  const regularMonthPrizes = { first: 350, second: 250, third: 150 } // Months 1-8 (each = 750)
  const finalMonthPrizes = { first: 500, second: 400, third: 250 } // Month 9 (total = 1,150)
  
  // Calculate total monthly prizes: 8 × 750 + 1,150 = 7,150 BDT
  const regularMonthsTotal = 8 * (regularMonthPrizes.first + regularMonthPrizes.second + regularMonthPrizes.third) // 6,000
  const finalMonthTotal = finalMonthPrizes.first + finalMonthPrizes.second + finalMonthPrizes.third // 1,150
  const totalMonthlyPrizes = regularMonthsTotal + finalMonthTotal // 7,150 BDT
  
  // Calculate distributed monthly prizes
  const distributedMonthlyPrizes = Math.max(0, completedMonths) * (regularMonthPrizes.first + regularMonthPrizes.second + regularMonthPrizes.third)
  
  // CORRECT Prize distribution object
  const prizeDistribution = {
    season: {
      total: 1800, // CORRECTED: Only top 3 (800+600+400)
      breakdown: [
        { position: 1, amount: 800, emoji: '🥇' },
        { position: 2, amount: 600, emoji: '🥈' },
        { position: 3, amount: 400, emoji: '🥉' }
        // NO 4th place as per official announcement
      ]
    },
    monthly: {
      total: totalMonthlyPrizes, // 7,150 BDT
      distributed: distributedMonthlyPrizes,
      remaining: totalMonthlyPrizes - distributedMonthlyPrizes,
      months: totalMonths,
      completedMonths: completedMonths,
      currentMonth: currentMonth,
      regular: regularMonthPrizes,
      final: finalMonthPrizes
    },
    weekly: {
      total: totalWeeklyPrizePool, // 1,140 BDT
      distributed: totalWeeklyDistributed,
      remaining: remainingWeeklyPrizes,
      perWeek: weeklyPrizePerGameweek,
      weeks: totalGameweeks,
      completedWeeks: completedGameweeks,
      remainingWeeks: remainingGameweeks
    },
    souvenirs: {
      total: 1910, // CORRECTED: 1,910 BDT (includes jerseys for all)
      items: [
        'Official Bro League Jersey for every participant 👕',
        'Season Topper Awards & Certificates',
        'Monthly Winner Recognition',
        'Digital Badges & Memories'
      ]
    }
  }

  // CORRECT Grand Total = 1,800 + 7,150 + 1,140 + 1,910 = 12,000 BDT
  const grandTotal = prizeDistribution.season.total + 
                    prizeDistribution.monthly.total + 
                    prizeDistribution.weekly.total + 
                    prizeDistribution.souvenirs.total

  const totalDistributed = prizeDistribution.monthly.distributed + prizeDistribution.weekly.distributed
  const totalRemaining = grandTotal - totalDistributed - prizeDistribution.season.total // Season prizes are distributed at the end

  return (
    <div className="space-y-8">
      {/* Data Status Indicator */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
        <div className="flex items-center justify-center gap-2">
          {authStatus?.authenticated ? (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-600">Real-time Prize Distribution</span>
              <span className="text-xs text-gray-500">• Based on live FPL data</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm font-medium text-yellow-600">Demo Prize Distribution</span>
              <span className="text-xs text-gray-500">• Refresh to connect to FPL API</span>
            </>
          )}
        </div>
      </div>

      {/* Grand Total Overview */}
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-8 text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="text-white" size={32} />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">BRO League 4.0</h1>
            <p className="text-purple-100 text-lg">Complete Prize Distribution</p>
            <p className="text-purple-200 text-sm">Total Participants: {totalParticipants} • Entry Fee: ৳{entryFeePerPerson} each</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
            <div className="text-6xl font-bold text-white mb-2">৳{grandTotal.toLocaleString()}</div>
            <div className="text-purple-100 text-xl">Total Prize Pool</div>
            <div className="text-purple-200 text-sm mt-2">
              ৳{totalDistributed.toLocaleString()} distributed • ৳{totalRemaining.toLocaleString()} remaining
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl p-6 text-center">
          <div className="text-3xl font-bold">৳{totalDistributed.toLocaleString()}</div>
          <div className="text-green-100 text-sm">Total Distributed</div>
          <div className="text-green-200 text-xs mt-1">
            {completedGameweeks} weeks + {completedMonths} months
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl p-6 text-center">
          <div className="text-3xl font-bold">GW {currentGameweek}</div>
          <div className="text-blue-100 text-sm">Current Gameweek</div>
          <div className="text-blue-200 text-xs mt-1">
            {remainingGameweeks} weeks remaining
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-xl p-6 text-center">
          <div className="text-3xl font-bold">{totalParticipants}</div>
          <div className="text-orange-100 text-sm">Total Participants</div>
          <div className="text-orange-200 text-xs mt-1">
            Registered members
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-xl p-6 text-center">
          <div className="text-3xl font-bold">৳{entryFeePerPerson}</div>
          <div className="text-purple-100 text-sm">Entry Fee</div>
          <div className="text-purple-200 text-xs mt-1">
            Per participant
          </div>
        </div>
      </div>

      {/* Prize Categories Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Season Prizes */}
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Trophy className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Season Top 3</h2>
                <p className="text-yellow-100 text-sm">Final league positions • ৳{prizeDistribution.season.total}</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {prizeDistribution.season.breakdown.map((prize) => (
                <div 
                  key={prize.position}
                  className={`
                    p-4 rounded-lg border-2 flex items-center justify-between
                    ${prize.position === 1 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300' :
                      prize.position === 2 ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300' :
                      'bg-gradient-to-r from-orange-50 to-red-50 border-orange-300'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{prize.emoji}</div>
                    <div>
                      <div className="font-bold text-gray-900">
                        {prize.position === 1 ? '1st Place' :
                         prize.position === 2 ? '2nd Place' : '3rd Place'}
                      </div>
                      <div className="text-sm text-gray-600">Final league position</div>
                    </div>
                  </div>
                  <div className={`
                    text-2xl font-bold
                    ${prize.position === 1 ? 'text-yellow-600' :
                      prize.position === 2 ? 'text-gray-600' : 'text-orange-600'}
                  `}>
                    ৳{prize.amount}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-600 mb-1">Season Prize Pool</div>
              <div className="text-2xl font-bold text-gray-900">৳{prizeDistribution.season.total}</div>
              <div className="text-xs text-gray-500 mt-1">Distributed at season end</div>
            </div>
          </div>
        </div>

        {/* Monthly Prizes */}
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Calendar className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Monthly Prizes</h2>
                <p className="text-green-100 text-sm">{prizeDistribution.monthly.months} months • ৳{prizeDistribution.monthly.total}</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {/* Current Progress */}
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-700">Progress</span>
                <span className="text-green-600 font-bold">Month {currentMonth} of {totalMonths}</span>
              </div>
              <div className="text-sm text-gray-600">
                ৳{prizeDistribution.monthly.distributed.toLocaleString()} distributed • 
                ৳{prizeDistribution.monthly.remaining.toLocaleString()} remaining
              </div>
            </div>

            {/* Regular Months */}
            <div className="mb-6">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Award className="text-green-500" size={18} />
                Months 1-8 (Each 4 gameweeks)
              </h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-xl font-bold text-yellow-600">৳{prizeDistribution.monthly.regular.first}</div>
                    <div className="text-sm text-gray-600">🥇 1st</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-600">৳{prizeDistribution.monthly.regular.second}</div>
                    <div className="text-sm text-gray-600">🥈 2nd</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-orange-600">৳{prizeDistribution.monthly.regular.third}</div>
                    <div className="text-sm text-gray-600">🥉 3rd</div>
                  </div>
                </div>
                <div className="text-center mt-3 text-sm text-gray-600">
                  ৳{regularMonthPrizes.first + regularMonthPrizes.second + regularMonthPrizes.third} per month × 8 months = ৳{regularMonthsTotal}
                </div>
              </div>
            </div>

            {/* Final Month */}
            <div className="mb-6">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Award className="text-green-500" size={18} />
                Month 9 - April (GW 33-38)
              </h3>
              <div className="bg-gradient-to-r from-green-100 to-emerald-100 border border-green-300 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-xl font-bold text-yellow-600">৳{prizeDistribution.monthly.final.first}</div>
                    <div className="text-sm text-gray-600">🥇 1st</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-600">৳{prizeDistribution.monthly.final.second}</div>
                    <div className="text-sm text-gray-600">🥈 2nd</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-orange-600">৳{prizeDistribution.monthly.final.third}</div>
                    <div className="text-sm text-gray-600">🥉 3rd</div>
                  </div>
                </div>
                <div className="text-center mt-3 text-sm text-gray-600">
                  Final month total: ৳{finalMonthTotal}
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-600 mb-1">Total Monthly Prizes</div>
              <div className="text-2xl font-bold text-gray-900">৳{prizeDistribution.monthly.total}</div>
            </div>
          </div>
        </div>

        {/* Weekly Prizes */}
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Zap className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Weekly Highest Points</h2>
                <p className="text-blue-100 text-sm">{prizeDistribution.weekly.weeks} weeks • ৳{prizeDistribution.weekly.total}</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {/* Current Progress */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-700">Progress</span>
                <span className="text-blue-600 font-bold">GW {currentGameweek} of {totalGameweeks}</span>
              </div>
              <div className="text-sm text-gray-600">
                ৳{prizeDistribution.weekly.distributed.toLocaleString()} distributed • 
                ৳{prizeDistribution.weekly.remaining.toLocaleString()} remaining
              </div>
            </div>

            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="text-white" size={32} />
              </div>
              <div className="text-4xl font-bold text-blue-600 mb-2">৳{prizeDistribution.weekly.perWeek}</div>
              <div className="text-gray-600 mb-4">Mobile Recharge</div>
              <div className="text-sm text-gray-500">
                Each gameweek's highest point scorer wins ৳30 mobile recharge
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex justify-between items-center">
                <span className="font-medium text-gray-700">Gameweeks 1-{totalGameweeks}</span>
                <span className="font-bold text-blue-600">৳30 each</span>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-sm text-gray-600 mb-1">Total Weekly Pool</div>
                <div className="text-2xl font-bold text-gray-900">৳{prizeDistribution.weekly.total}</div>
                <div className="text-xs text-gray-500 mt-1">
                  ৳30 × {totalGameweeks} gameweeks
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Souvenirs & Extras */}
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Gift className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Souvenir Budget</h2>
                <p className="text-pink-100 text-sm">For all participants • ৳{prizeDistribution.souvenirs.total}</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="text-white" size={32} />
              </div>
              <div className="text-4xl font-bold text-pink-600 mb-2">৳{prizeDistribution.souvenirs.total}</div>
              <div className="text-gray-600 mb-4">Total Souvenir Budget</div>
            </div>

            <div className="space-y-3">
              {prizeDistribution.souvenirs.items.map((item, index) => (
                <div key={index} className="bg-pink-50 border border-pink-200 rounded-lg p-3 text-center">
                  <div className="font-medium text-gray-700">{item}</div>
                </div>
              ))}
              
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-sm text-gray-600 mb-1">Special Recognition</div>
                <div className="text-lg font-bold text-gray-900">Jersey + Awards + Memories</div>
                <div className="text-xs text-gray-500 mt-1">
                  Every participant gets an official Bro League jersey!
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6">
          <h2 className="text-2xl font-bold text-white text-center mb-4">Prize Pool Breakdown</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">৳{prizeDistribution.season.total}</div>
              <div className="text-gray-300 text-sm">Season Top 3</div>
              <div className="text-gray-400 text-xs">At season end</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">৳{prizeDistribution.monthly.total}</div>
              <div className="text-gray-300 text-sm">Monthly Prizes</div>
              <div className="text-gray-400 text-xs">৳{prizeDistribution.monthly.distributed} paid</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">৳{prizeDistribution.weekly.total}</div>
              <div className="text-gray-300 text-sm">Weekly Recharges</div>
              <div className="text-gray-400 text-xs">৳{prizeDistribution.weekly.distributed} paid</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-pink-400">৳{prizeDistribution.souvenirs.total}</div>
              <div className="text-gray-300 text-sm">Souvenir Budget</div>
              <div className="text-gray-400 text-xs">Jerseys & Awards</div>
            </div>
          </div>
        </div>
        
        <div className="p-6 text-center">
          <div className="text-4xl font-bold text-gray-900 mb-2">৳{grandTotal.toLocaleString()}</div>
          <div className="text-gray-600">Total Prize Pool</div>
          <div className="text-sm text-gray-500 mt-2">
            From {totalParticipants} participants × ৳{entryFeePerPerson} entry fee = ৳{totalEntryFees.toLocaleString()}
          </div>
          <div className="text-xs text-green-600 mt-1 font-medium">
            The most rewarding BRO League season ever! 🎉⚽
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrizeDistribution