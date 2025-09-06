// src/components/MonthlyPrizes.jsx
import { Calendar, TrendingUp, Award } from 'lucide-react'
import { prizeDistribution, monthlyStandings } from '../data/leagueData'

const MonthlyPrizes = () => {
  const currentMonth = monthlyStandings.currentMonth

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
              Gameweeks {(currentMonth - 1) * 4 + 1}-{currentMonth * 4}
            </div>
            <div className="text-sm opacity-75">
              Current monthly standings
            </div>
          </div>

          {/* Current Month Standings */}
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {monthlyStandings.month4.map((standing, index) => (
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
                  <div className="text-2xl font-bold my-2">{standing.points} pts</div>
                  <div className={`
                    badge 
                    ${index === 0 ? 'badge-warning' : 
                      index === 1 ? 'badge-accent' : 
                      'badge-secondary'}
                  `}>
                    {currentMonth <= 8 ? 
                      (index === 0 ? '৳350' : index === 1 ? '৳250' : '৳150') :
                      (index === 0 ? '৳500' : index === 1 ? '৳400' : '৳250')
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Prize Structure */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Regular Months (1-8) */}
        <div className="card bg-white/10 backdrop-blur shadow-2xl">
          <div className="card-body">
            <h3 className="card-title text-xl text-white mb-4">
              📅 Months 1-8 (Regular)
              <div className="badge badge-primary">4 GWs each</div>
            </h3>
            
            <div className="space-y-4">
              {prizeDistribution.monthly.months.slice(0, 8).map((month) => (
                <div 
                  key={month.id}
                  className={`
                    p-4 rounded-lg transition-all duration-300
                    ${month.id === currentMonth ? 
                      'bg-gradient-to-r from-blue-600/30 to-purple-600/30 border border-blue-400' : 
                      'bg-white/5 hover:bg-white/10'}
                  `}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-bold text-white">
                      {month.name}
                      {month.id === currentMonth && (
                        <span className="ml-2 badge badge-accent badge-sm">Current</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-400">{month.gameweeks}</div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {month.prizes.map((prize, index) => (
                      <div key={prize.position} className="text-center">
                        <div className={`
                          text-sm font-bold
                          ${index === 0 ? 'text-yellow-400' : 
                            index === 1 ? 'text-gray-300' : 
                            'text-orange-400'}
                        `}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'} ৳{prize.amount}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Final Month (9) */}
        <div className="card bg-white/10 backdrop-blur shadow-2xl">
          <div className="card-body">
            <h3 className="card-title text-xl text-white mb-4">
              🏁 Month 9 (Final Sprint)
              <div className="badge badge-error">6 GWs</div>
            </h3>
            
            <div className="bg-gradient-to-r from-red-600/20 to-pink-600/20 p-6 rounded-lg border border-red-400/30">
              <div className="text-center mb-4">
                <div className="text-lg font-bold text-red-400">FINAL MONTH</div>
                <div className="text-sm text-gray-400">GW 33-38 • Higher Stakes!</div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-yellow-400/20 rounded-lg">
                  <div className="text-3xl mb-2">🥇</div>
                  <div className="font-bold text-yellow-400">1st Place</div>
                  <div className="text-2xl font-bold text-white">৳500</div>
                </div>
                
                <div className="text-center p-3 bg-gray-300/20 rounded-lg">
                  <div className="text-3xl mb-2">🥈</div>
                  <div className="font-bold text-gray-300">2nd Place</div>
                  <div className="text-2xl font-bold text-white">৳400</div>
                </div>
                
                <div className="text-center p-3 bg-orange-400/20 rounded-lg">
                  <div className="text-3xl mb-2">🥉</div>
                  <div className="font-bold text-orange-400">3rd Place</div>
                  <div className="text-2xl font-bold text-white">৳250</div>
                </div>
              </div>
              
              <div className="mt-4 text-center text-sm text-gray-400">
                Total Final Month Pool: ৳1,150
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Timeline */}
      <div className="card bg-white/10 backdrop-blur shadow-2xl">
        <div className="card-body">
          <h3 className="card-title text-2xl text-white mb-6">
            📈 Monthly Timeline & Status
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Completed Months */}
              <div className="bg-green-600/20 p-4 rounded-lg border border-green-400/30">
                <h4 className="font-bold text-green-400 mb-2 flex items-center gap-2">
                  <Award size={20} />
                  Completed Months
                </h4>
                <div className="text-2xl font-bold text-white mb-2">
                  {currentMonth - 1}
                </div>
                <div className="text-sm text-gray-400">
                  ৳{(currentMonth - 1) * 750} distributed
                </div>
              </div>

              {/* Current Month */}
              <div className="bg-blue-600/20 p-4 rounded-lg border border-blue-400/30">
                <h4 className="font-bold text-blue-400 mb-2 flex items-center gap-2">
                  <TrendingUp size={20} />
                  Current Month
                </h4>
                <div className="text-2xl font-bold text-white mb-2">
                  Month {currentMonth}
                </div>
                <div className="text-sm text-gray-400">
                  ৳750 at stake
                </div>
              </div>

              {/* Remaining Months */}
              <div className="bg-purple-600/20 p-4 rounded-lg border border-purple-400/30">
                <h4 className="font-bold text-purple-400 mb-2 flex items-center gap-2">
                  <Calendar size={20} />
                  Remaining Months
                </h4>
                <div className="text-2xl font-bold text-white mb-2">
                  {9 - currentMonth}
                </div>
                <div className="text-sm text-gray-400">
                  ৳{((8 - currentMonth) * 750) + 1150} remaining
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white font-bold">Season Progress</span>
              <span className="text-gray-400">{currentMonth}/9 months</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-green-400 to-blue-400 h-3 rounded-full transition-all duration-1000"
                style={{width: `${(currentMonth / 9) * 100}%`}}
              ></div>
            </div>
            <div className="mt-2 text-sm text-gray-400 text-center">
              {((currentMonth / 9) * 100).toFixed(1)}% complete
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MonthlyPrizes