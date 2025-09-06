// src/components/PrizeDistribution.jsx - Modern UI Version
import { Trophy, Award, Calendar, Zap, Target, Gift } from 'lucide-react'

const PrizeDistribution = () => {
  const prizeDistribution = {
    season: {
      total: 2000,
      breakdown: [
        { position: 1, amount: 800, emoji: '🥇' },
        { position: 2, amount: 600, emoji: '🥈' },
        { position: 3, amount: 400, emoji: '🥉' },
        { position: 4, amount: 200, emoji: '🏅' }
      ]
    },
    monthly: {
      total: 6650,
      months: 9,
      regular: { first: 350, second: 250, third: 150 },
      final: { first: 500, second: 400, third: 250 }
    },
    weekly: {
      total: 1140,
      perWeek: 30,
      weeks: 38
    },
    souvenirs: {
      total: 210,
      items: ['Certificates', 'Badges', 'Trophies']
    }
  }

  const grandTotal = prizeDistribution.season.total + 
                    prizeDistribution.monthly.total + 
                    prizeDistribution.weekly.total + 
                    prizeDistribution.souvenirs.total

  return (
    <div className="space-y-8">
      {/* Grand Total Overview */}
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-8 text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="text-white" size={32} />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">BRO League 4.0</h1>
            <p className="text-purple-100 text-lg">Complete Prize Distribution</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
            <div className="text-6xl font-bold text-white mb-2">৳{grandTotal.toLocaleString()}</div>
            <div className="text-purple-100 text-xl">Total Prize Pool</div>
            <div className="text-purple-200 text-sm mt-2">
              Distributed across Season, Monthly, Weekly & Souvenirs
            </div>
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
                <h2 className="text-2xl font-bold text-white">Season Winners</h2>
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
                      prize.position === 3 ? 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-300' :
                      'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-300'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{prize.emoji}</div>
                    <div>
                      <div className="font-bold text-gray-900">
                        {prize.position === 1 ? '1st Place' :
                         prize.position === 2 ? '2nd Place' :
                         prize.position === 3 ? '3rd Place' : '4th Place'}
                      </div>
                      <div className="text-sm text-gray-600">Final league position</div>
                    </div>
                  </div>
                  <div className={`
                    text-2xl font-bold
                    ${prize.position === 1 ? 'text-yellow-600' :
                      prize.position === 2 ? 'text-gray-600' :
                      prize.position === 3 ? 'text-orange-600' : 'text-purple-600'}
                  `}>
                    ৳{prize.amount}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-600 mb-1">Season Prize Pool</div>
              <div className="text-2xl font-bold text-gray-900">৳{prizeDistribution.season.total}</div>
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
                <div className="text-center mt-3">
                  <div className="text-sm text-gray-600">৳750 per month × 8 months = ৳6,000</div>
                </div>
              </div>
            </div>

            {/* Final Month */}
            <div className="mb-6">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Trophy className="text-orange-500" size={18} />
                Month 9 - Final (GW 33-38)
              </h3>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
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
                <div className="text-center mt-3">
                  <div className="text-sm text-gray-600">Enhanced prizes for final month</div>
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
                <h2 className="text-2xl font-bold text-white">Weekly Winners</h2>
                <p className="text-blue-100 text-sm">{prizeDistribution.weekly.weeks} weeks • ৳{prizeDistribution.weekly.total}</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="text-white" size={32} />
              </div>
              <div className="text-4xl font-bold text-blue-600 mb-2">৳{prizeDistribution.weekly.perWeek}</div>
              <div className="text-gray-600 mb-4">Every Gameweek Winner</div>
              <div className="text-sm text-gray-500">
                Highest scoring manager each gameweek wins ৳30
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex justify-between items-center">
                <span className="font-medium text-gray-700">Gameweeks 1-38</span>
                <span className="font-bold text-blue-600">৳30 each</span>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-sm text-gray-600 mb-1">Total Weekly Pool</div>
                <div className="text-2xl font-bold text-gray-900">৳{prizeDistribution.weekly.total}</div>
                <div className="text-xs text-gray-500 mt-1">
                  ৳30 × 38 gameweeks
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
                <h2 className="text-2xl font-bold text-white">Souvenirs & Extras</h2>
                <p className="text-pink-100 text-sm">Special recognition • ৳{prizeDistribution.souvenirs.total}</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="text-white" size={32} />
              </div>
              <div className="text-4xl font-bold text-pink-600 mb-2">৳{prizeDistribution.souvenirs.total}</div>
              <div className="text-gray-600 mb-4">Special Items & Recognition</div>
            </div>

            <div className="space-y-3">
              {prizeDistribution.souvenirs.items.map((item, index) => (
                <div key={index} className="bg-pink-50 border border-pink-200 rounded-lg p-3 text-center">
                  <div className="font-medium text-gray-700">{item}</div>
                </div>
              ))}
              
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-sm text-gray-600 mb-1">Additional Recognition</div>
                <div className="text-lg font-bold text-gray-900">Digital Awards & Memories</div>
                <div className="text-xs text-gray-500 mt-1">
                  Personalized certificates and trophies
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6">
          <h2 className="text-2xl font-bold text-white text-center mb-4">Prize Pool Summary</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">৳{prizeDistribution.season.total}</div>
              <div className="text-gray-300 text-sm">Season</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">৳{prizeDistribution.monthly.total}</div>
              <div className="text-gray-300 text-sm">Monthly</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">৳{prizeDistribution.weekly.total}</div>
              <div className="text-gray-300 text-sm">Weekly</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-pink-400">৳{prizeDistribution.souvenirs.total}</div>
              <div className="text-gray-300 text-sm">Souvenirs</div>
            </div>
          </div>
        </div>
        
        <div className="p-6 text-center">
          <div className="text-4xl font-bold text-gray-900 mb-2">৳{grandTotal.toLocaleString()}</div>
          <div className="text-gray-600">Total Prize Pool</div>
          <div className="text-sm text-gray-500 mt-2">
            The most rewarding BRO League season ever! 🎉
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrizeDistribution