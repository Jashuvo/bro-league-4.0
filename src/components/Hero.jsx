// src/components/Hero.jsx - Enhanced Version
import { Trophy, Users, Calendar, Target, TrendingUp, Crown, Globe, Award, Zap } from 'lucide-react'

const Hero = ({ standings, gameweekInfo, authStatus, leagueStats, bootstrap }) => {
  // Calculate stats from API data only
  const totalManagers = standings.length || 0
  const gameweeksLeft = gameweekInfo?.total ? gameweekInfo.total - (gameweekInfo.current || 0) : 0
  const totalPrizePool = 2000
  
  // Get current leader from API data
  const currentLeader = standings.find(manager => manager.rank === 1)
  
  // Get current gameweek deadline info
  const currentGameweekData = bootstrap?.deadlines?.find(gw => gw.gameweek === gameweekInfo.current)
  const nextDeadline = currentGameweekData?.deadline ? new Date(currentGameweekData.deadline) : null
  
  // Get top performers this gameweek
  const topPerformers = standings
    .filter(m => m.gameweekPoints > 0)
    .sort((a, b) => b.gameweekPoints - a.gameweekPoints)
    .slice(0, 3)
  
  return (
    <div className="relative bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 overflow-hidden">
      {/* Simple Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 1px, transparent 1px), radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }}></div>
      </div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-yellow-400/20 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-blue-400/20 rounded-full blur-xl"></div>
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-purple-400/20 rounded-full blur-xl"></div>
      
      <div className="relative container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          {/* Main Title */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl">
                <Crown className="text-white" size={40} />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <Trophy size={14} className="text-white" />
              </div>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            BRO League{' '}
            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">4.0</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-blue-100 mb-6 max-w-2xl mx-auto leading-relaxed">
            Fantasy Premier League Championship
          </p>

          {/* Deadline Alert */}
          {nextDeadline && authStatus?.authenticated && (
            <div className="bg-red-500/20 backdrop-blur-md border border-red-300/30 rounded-2xl p-4 max-w-md mx-auto mb-6">
              <div className="flex items-center gap-3 text-white">
                <Calendar className="text-red-300" size={20} />
                <div className="text-left">
                  <p className="text-red-200 text-sm font-semibold">Next Deadline</p>
                  <p className="font-bold">
                    {nextDeadline.toLocaleDateString('en-GB', { 
                      weekday: 'short', 
                      day: 'numeric', 
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Current Leader Spotlight */}
          {currentLeader && authStatus?.authenticated && (
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 max-w-md mx-auto mb-8">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {currentLeader.avatar || currentLeader.managerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                    <Crown size={12} className="text-yellow-800" />
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-yellow-300 text-sm font-semibold">Current Leader</p>
                  <h3 className="text-white font-bold text-lg">{currentLeader.managerName}</h3>
                  <div className="flex items-center gap-4 text-sm">
                    <p className="text-blue-200">{currentLeader.totalPoints?.toLocaleString()} points</p>
                    {currentLeader.region && (
                      <div className="flex items-center gap-1 text-blue-200">
                        <Globe size={12} />
                        <span>{currentLeader.region}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Top Performers This Gameweek */}
          {topPerformers.length > 0 && authStatus?.authenticated && (
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 max-w-2xl mx-auto mb-8">
              <h3 className="text-white font-semibold text-lg mb-4 flex items-center justify-center gap-2">
                <Zap className="text-yellow-400" size={20} />
                Top Performers This Gameweek
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {topPerformers.map((performer, index) => (
                  <div key={performer.id} className="text-center">
                    <div className="relative mb-2">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm mx-auto">
                        {performer.avatar}
                      </div>
                      {index === 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                          <Award size={8} className="text-yellow-800" />
                        </div>
                      )}
                    </div>
                    <p className="text-white font-semibold text-sm">{performer.managerName.split(' ')[0]}</p>
                    <p className="text-green-300 font-bold">{performer.gameweekPoints}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="text-blue-100 text-lg italic font-medium">
            "Assalamualaikum Everyone! 🤝 May the best manager win! 🏆"
          </div>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-center hover:bg-white/15 transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Users className="text-white" size={24} />
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {totalManagers}
            </div>
            <div className="text-blue-100 text-sm font-medium">Managers</div>
            {leagueStats.veteranManagers > 0 && (
              <div className="text-xs text-blue-200 mt-1">
                {leagueStats.veteranManagers} veterans
              </div>
            )}
          </div>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-center hover:bg-white/15 transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Target className="text-white" size={24} />
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              ৳{totalPrizePool}
            </div>
            <div className="text-blue-100 text-sm font-medium">Prize Pool</div>
            <div className="text-xs text-blue-200 mt-1">Winner: ৳800</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-center hover:bg-white/15 transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="text-white" size={24} />
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {gameweekInfo?.current || '--'}
            </div>
            <div className="text-blue-100 text-sm font-medium">Current GW</div>
            {currentGameweekData?.averageScore && (
              <div className="text-xs text-blue-200 mt-1">
                Avg: {currentGameweekData.averageScore}
              </div>
            )}
          </div>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-center hover:bg-white/15 transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-red-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="text-white" size={24} />
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {gameweeksLeft}
            </div>
            <div className="text-blue-100 text-sm font-medium">GWs Left</div>
            <div className="text-xs text-blue-200 mt-1">
              Season ends May 2026
            </div>
          </div>
        </div>

        {/* Enhanced League Info */}
        <div className="mt-12 text-center">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 max-w-3xl mx-auto">
            <h3 className="text-white font-semibold text-lg mb-4">League Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-blue-200">Entry Fee</p>
                <p className="text-white font-semibold">৳50</p>
              </div>
              <div>
                <p className="text-blue-200">Winner Prize</p>
                <p className="text-white font-semibold">৳800</p>
              </div>
              <div>
                <p className="text-blue-200">League ID</p>
                <p className="text-white font-semibold">1858389</p>
              </div>
              <div>
                <p className="text-blue-200">League Type</p>
                <p className="text-white font-semibold">Classic</p>
              </div>
            </div>
            
            {/* Top Regions */}
            {leagueStats.topRegions && leagueStats.topRegions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-blue-200 text-sm mb-2">Top Regions</p>
                <div className="flex justify-center gap-4 text-xs">
                  {leagueStats.topRegions.slice(0, 3).map((region, index) => (
                    <div key={index} className="text-white">
                      <span className="font-semibold">{region.region}</span>
                      <span className="text-blue-200 ml-1">({region.count})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Hero