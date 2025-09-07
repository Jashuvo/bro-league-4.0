// src/components/Hero.jsx - Enhanced with Better Visual Polish
import { Trophy, Users, Calendar, Target, TrendingUp, Crown, Globe, Award, Zap, Clock, DollarSign, Star, Medal } from 'lucide-react'

const Hero = ({ standings, gameweekInfo, authStatus, leagueStats, bootstrap }) => {
  // Get environment variables with fallbacks
  const totalPrizePool = import.meta.env.VITE_TOTAL_PRIZE_POOL || 12000
  const entryFee = import.meta.env.VITE_ENTRY_FEE || 800
  const leagueName = import.meta.env.VITE_LEAGUE_NAME || "BRO League 4.0"
  const leagueId = import.meta.env.VITE_FPL_LEAGUE_ID || "1858389"
  
  // Calculate stats from API data
  const totalManagers = standings.length || 0
  const gameweeksLeft = gameweekInfo?.total ? gameweekInfo.total - (gameweekInfo.current || 0) : 0
  
  // Get current leader from API data
  const currentLeader = standings.find(manager => manager.rank === 1)
  
  // Get NEXT gameweek deadline info from bootstrap
  const nextGameweekData = bootstrap?.gameweeks?.find(gw => gw.id === (gameweekInfo.current + 1))
  const nextDeadline = nextGameweekData?.deadline_time ? new Date(nextGameweekData.deadline_time) : null
  
  // Get top performers this gameweek
  const topPerformers = standings
    .filter(m => m.gameweekPoints > 0)
    .sort((a, b) => b.gameweekPoints - a.gameweekPoints)
    .slice(0, 3)

  // Calculate time remaining for next deadline
  const getTimeRemaining = () => {
    if (!nextDeadline) return null
    const now = new Date()
    const timeDiff = nextDeadline.getTime() - now.getTime()
    
    if (timeDiff <= 0) return null
    
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const timeRemaining = getTimeRemaining()
  
  return (
    <div className="relative bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 overflow-hidden">
      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 1px, transparent 1px),
            radial-gradient(circle at 75% 75%, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px, 40px 40px'
        }}></div>
      </div>
      
      {/* Floating Elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-400/20 rounded-full blur-2xl animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-24 h-24 bg-blue-400/20 rounded-full blur-2xl animate-pulse delay-700"></div>
      <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-purple-400/15 rounded-full blur-xl animate-pulse delay-1000"></div>
      
      <div className="relative container mx-auto px-4 py-12">
        <div className="text-center mb-8">
          {/* Enhanced Logo Section */}
          <div className="flex justify-center mb-6">
            <div className="relative group">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-2xl ring-4 ring-white/20 group-hover:ring-white/40 transition-all duration-300">
                <Crown className="text-white" size={40} />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center ring-2 ring-white/30">
                <Trophy size={16} className="text-white" />
              </div>
              {/* Pulse animation */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400 to-red-500 opacity-20 animate-ping"></div>
            </div>
          </div>
          
          {/* Enhanced Title */}
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight">
            {leagueName.split(' ').slice(0, 2).join(' ')}{' '}
            <span className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent animate-pulse">
              {leagueName.split(' ').slice(2).join(' ')}
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-blue-100 mb-6 max-w-2xl mx-auto font-light">
            Fantasy Premier League Championship
          </p>

          {/* Prize Pool Highlight */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 max-w-md mx-auto mb-8">
            <div className="flex items-center justify-center gap-3">
              <DollarSign className="text-green-400" size={24} />
              <div>
                <div className="text-green-400 font-bold text-2xl">৳{totalPrizePool.toLocaleString()}</div>
                <div className="text-white text-sm">Total Prize Pool</div>
              </div>
            </div>
          </div>

          {/* Enhanced Current Leader Spotlight */}
          {currentLeader && authStatus?.authenticated && (
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 max-w-lg mx-auto mb-6 hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg ring-4 ring-yellow-400/30">
                    {currentLeader.avatar || currentLeader.managerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center ring-2 ring-white/50">
                    <Crown size={12} className="text-yellow-800" />
                  </div>
                  {/* Crown animation */}
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full opacity-40 animate-ping"></div>
                </div>
                <div className="text-left flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-yellow-300 text-sm font-semibold">👑 Current Leader</span>
                    <Medal className="text-yellow-400" size={16} />
                  </div>
                  <h3 className="text-white font-bold text-xl">{currentLeader.managerName}</h3>
                  <p className="text-blue-200 text-lg">{currentLeader.totalPoints?.toLocaleString()} pts</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Enhanced Deadline Counter */}
          {nextDeadline && authStatus?.authenticated && timeRemaining && (
            <div className="bg-red-500/20 backdrop-blur-md border border-red-300/30 rounded-2xl p-4 max-w-sm mx-auto mb-6 hover:bg-red-500/25 transition-all duration-300">
              <div className="flex items-center justify-center gap-3">
                <Clock className="text-red-400 animate-pulse" size={20} />
                <div>
                  <div className="text-red-400 font-bold text-lg">{timeRemaining}</div>
                  <div className="text-white text-sm">Until GW{gameweekInfo.current + 1} Deadline</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {/* Total Managers */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 text-center hover:bg-white/15 transition-all duration-300">
            <div className="flex justify-center mb-2">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Users className="text-green-400" size={20} />
              </div>
            </div>
            <div className="text-green-400 text-xl font-bold">{totalManagers}</div>
            <div className="text-white text-sm">Active Bros</div>
          </div>

          {/* Current Gameweek */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 text-center hover:bg-white/15 transition-all duration-300">
            <div className="flex justify-center mb-2">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Calendar className="text-blue-400" size={20} />
              </div>
            </div>
            <div className="text-blue-400 text-xl font-bold">GW {gameweekInfo?.current || 3}</div>
            <div className="text-white text-sm">Current Week</div>
          </div>

          {/* Gameweeks Left */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 text-center hover:bg-white/15 transition-all duration-300">
            <div className="flex justify-center mb-2">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Target className="text-purple-400" size={20} />
              </div>
            </div>
            <div className="text-purple-400 text-xl font-bold">{gameweeksLeft}</div>
            <div className="text-white text-sm">Weeks Left</div>
          </div>

          {/* League Average */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 text-center hover:bg-white/15 transition-all duration-300">
            <div className="flex justify-center mb-2">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-yellow-400" size={20} />
              </div>
            </div>
            <div className="text-yellow-400 text-xl font-bold">{leagueStats?.averageScore || '--'}</div>
            <div className="text-white text-sm">Avg Score</div>
          </div>
        </div>

        {/* Enhanced League Stats */}
        {authStatus?.authenticated && leagueStats && (
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-8">
            <h3 className="text-white font-bold text-center mb-4 flex items-center justify-center gap-2">
              <Star className="text-yellow-400" size={20} />
              League Performance Stats
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="hover:scale-105 transition-transform duration-200">
                <div className="text-white text-2xl font-bold">{leagueStats.averageScore || '--'}</div>
                <div className="text-gray-300 text-sm">Average Total</div>
              </div>
              <div className="hover:scale-105 transition-transform duration-200">
                <div className="text-yellow-400 text-2xl font-bold">{leagueStats.highestTotal || '--'}</div>
                <div className="text-gray-300 text-sm">Highest Total</div>
              </div>
              <div className="hover:scale-105 transition-transform duration-200">
                <div className="text-blue-400 text-2xl font-bold">{leagueStats.averageGameweek || '--'}</div>
                <div className="text-gray-300 text-sm">Avg GW Score</div>
              </div>
              <div className="hover:scale-105 transition-transform duration-200">
                <div className="text-green-400 text-2xl font-bold">{leagueStats.highestGameweek || '--'}</div>
                <div className="text-gray-300 text-sm">Highest GW</div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Top Performers This Week */}
        {topPerformers.length > 0 && authStatus?.authenticated && (
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
            <h3 className="text-white font-bold text-center mb-6 flex items-center justify-center gap-2">
              <Zap className="text-yellow-400" size={22} />
              Gameweek {gameweekInfo?.current} Heroes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topPerformers.map((manager, index) => (
                <div key={manager.id} className="bg-white/10 rounded-xl p-4 text-center hover:bg-white/15 transition-all duration-300 hover:scale-105">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {manager.avatar || manager.managerName.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      {index === 0 && <Crown className="text-yellow-400 mx-auto" size={16} />}
                      {index === 1 && <Medal className="text-gray-400 mx-auto" size={16} />}
                      {index === 2 && <Award className="text-orange-400 mx-auto" size={16} />}
                    </div>
                  </div>
                  <div className="text-white font-semibold text-sm mb-1">{manager.managerName}</div>
                  <div className="text-yellow-400 font-bold text-lg">{manager.gameweekPoints} pts</div>
                  <div className="text-gray-300 text-xs">#{index + 1} This Week</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Hero