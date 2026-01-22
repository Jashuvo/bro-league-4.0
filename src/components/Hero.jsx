// src/components/Hero.jsx - Fixed Next Transfer Deadline
import { Trophy, Users, Calendar, Target, TrendingUp, Crown, Globe, Award, Zap } from 'lucide-react'

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
  
  // 🔥 FIXED: Get NEXT gameweek deadline info from bootstrap (not current)
  const nextGameweekData = bootstrap?.gameweeks?.find(gw => gw.id === (gameweekInfo.current + 1))
  const nextDeadline = nextGameweekData?.deadline_time ? new Date(nextGameweekData.deadline_time) : null
  
  // Get top performers this gameweek
  const topPerformers = standings
    .filter(m => (m.gameweekPoints || 0) - (m.gameweekHits || 0) > 0)
    .sort((a, b) => {
      const netA = (a.gameweekPoints || 0) - (a.gameweekHits || 0);
      const netB = (b.gameweekPoints || 0) - (b.gameweekHits || 0);
      return netB - netA;
    })
    .slice(0, 3)
  
  return (
    <div className="relative bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 overflow-hidden">
      {/* Simplified Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }}></div>
      </div>
      
      {/* Reduced Floating Elements */}
      <div className="absolute top-10 left-10 w-16 h-16 bg-yellow-400/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-10 right-10 w-20 h-20 bg-blue-400/10 rounded-full blur-xl"></div>
      
      {/* ✅ REDUCED PADDING: py-16 → py-8, mb-12 → mb-6 */}
      <div className="relative container mx-auto px-4 py-8">
        <div className="text-center mb-6">
          {/* Compact Title */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl">
                <Crown className="text-white" size={32} />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <Trophy size={10} className="text-white" />
              </div>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            {leagueName.split(' ').slice(0, 2).join(' ')}{' '}
            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              {leagueName.split(' ').slice(2).join(' ')}
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-blue-100 mb-4 max-w-xl mx-auto">
            Fantasy Premier League Championship
          </p>

          {/* Compact Current Leader Spotlight */}
          {currentLeader && authStatus?.authenticated && (
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 max-w-sm mx-auto mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {currentLeader.avatar || currentLeader.managerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                    <Crown size={8} className="text-yellow-800" />
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-yellow-300 text-xs font-semibold">Current Leader</p>
                  <h3 className="text-white font-bold">{currentLeader.managerName}</h3>
                  <p className="text-blue-200 text-sm">{currentLeader.totalPoints?.toLocaleString()} pts</p>
                </div>
              </div>
            </div>
          )}
          
          {/* 🔥 FIXED: Now shows NEXT deadline instead of current */}
          {nextDeadline && authStatus?.authenticated && (
            <div className="bg-red-500/20 backdrop-blur-md border border-red-300/30 rounded-xl p-3 max-w-xs mx-auto mb-4">
              <div className="flex items-center gap-2 text-white">
                <Calendar className="text-red-300" size={16} />
                <div className="text-left">
                  <p className="text-red-200 text-xs font-semibold">Next Deadline</p>
                  <p className="font-bold text-sm">
                    GW{gameweekInfo.current + 1}: {nextDeadline.toLocaleDateString('en-GB', { 
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
        </div>

        {/* Compact Stats Grid - Reduced padding */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {/* Total Prize Pool */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 text-center">
            <div className="flex justify-center mb-2">
              <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Trophy className="text-yellow-400" size={16} />
              </div>
            </div>
            <div className="text-yellow-400 text-lg font-bold">৳{totalPrizePool.toLocaleString()}</div>
            <div className="text-white text-xs">Total Prize</div>
          </div>

          {/* Active Managers */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 text-center">
            <div className="flex justify-center mb-2">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Users className="text-green-400" size={16} />
              </div>
            </div>
            <div className="text-green-400 text-lg font-bold">{totalManagers}</div>
            <div className="text-white text-xs">Active Bros</div>
          </div>

          {/* Current Gameweek */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 text-center">
            <div className="flex justify-center mb-2">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Calendar className="text-blue-400" size={16} />
              </div>
            </div>
            <div className="text-blue-400 text-lg font-bold">GW {gameweekInfo?.current || 3}</div>
            <div className="text-white text-xs">Current Week</div>
          </div>

          {/* Gameweeks Left */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 text-center">
            <div className="flex justify-center mb-2">
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Target className="text-purple-400" size={16} />
              </div>
            </div>
            <div className="text-purple-400 text-lg font-bold">{gameweeksLeft}</div>
            <div className="text-white text-xs">Weeks Left</div>
          </div>
        </div>

        {/* Quick Stats Bar */}
        {authStatus?.authenticated && leagueStats && (
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-white text-lg font-bold">{leagueStats.averageScore || '--'}</div>
                <div className="text-gray-300 text-xs">Avg Score</div>
              </div>
              <div>
                <div className="text-white text-lg font-bold">{leagueStats.highestTotal || '--'}</div>
                <div className="text-gray-300 text-xs">Highest Total</div>
              </div>
              <div>
                <div className="text-white text-lg font-bold">{leagueStats.averageGameweek || '--'}</div>
                <div className="text-gray-300 text-xs">Avg GW Score</div>
              </div>
              <div>
                <div className="text-white text-lg font-bold">{leagueStats.highestGameweek || '--'}</div>
                <div className="text-gray-300 text-xs">Highest GW</div>
              </div>
            </div>
          </div>
        )}

        {/* Top Performers This Week */}
        {topPerformers.length > 0 && authStatus?.authenticated && (
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4">
            <h3 className="text-white font-bold text-center mb-3 flex items-center justify-center gap-2">
              <Zap className="text-yellow-400" size={18} />
              This Gameweek's Heroes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {topPerformers.map((manager, index) => (
                <div key={manager.id} className="bg-white/10 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    {index === 0 && <Crown className="text-yellow-400" size={12} />}
                    {index === 1 && <Award className="text-gray-400" size={12} />}
                    {index === 2 && <Award className="text-orange-400" size={12} />}
                    <span className="text-white font-medium text-sm">{manager.managerName}</span>
                  </div>
                  <div className="text-yellow-400 font-bold">
                    {(manager.gameweekPoints || 0) - (manager.gameweekHits || 0)}
                    {(manager.gameweekHits || 0) > 0 && (
                      <span className="text-xs text-red-400 ml-1">(-{manager.gameweekHits})</span>
                    )}
                    <span className="ml-1 text-xs opacity-80">pts</span>
                  </div>
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