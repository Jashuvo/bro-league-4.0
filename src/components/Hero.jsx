// src/components/Hero.jsx - Fixed & More Compact Version
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
  
  // Get current gameweek deadline info from bootstrap
  const currentGameweekData = bootstrap?.gameweeks?.find(gw => gw.id === gameweekInfo.current)
  const nextDeadline = currentGameweekData?.deadline_time ? new Date(currentGameweekData.deadline_time) : null
  
  // Get top performers this gameweek
  const topPerformers = standings
    .filter(m => m.gameweekPoints > 0)
    .sort((a, b) => b.gameweekPoints - a.gameweekPoints)
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
          
          {/* Compact Next Deadline */}
          {nextDeadline && authStatus?.authenticated && (
            <div className="bg-red-500/20 backdrop-blur-md border border-red-300/30 rounded-xl p-3 max-w-xs mx-auto mb-4">
              <div className="flex items-center gap-2 text-white">
                <Calendar className="text-red-300" size={16} />
                <div className="text-left">
                  <p className="text-red-200 text-xs font-semibold">Next Deadline</p>
                  <p className="font-bold text-sm">
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
        </div>

        {/* Compact Stats Grid - Reduced padding */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-6">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 text-center hover:bg-white/15 transition-all duration-300">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Users className="text-white" size={20} />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {totalManagers}
            </div>
            <div className="text-blue-100 text-sm font-medium">Managers</div>
            {leagueStats.veteranManagers > 0 && (
              <div className="text-xs text-blue-200 mt-1">
                {leagueStats.veteranManagers} veterans
              </div>
            )}
          </div>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 text-center hover:bg-white/15 transition-all duration-300">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Target className="text-white" size={20} />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              ৳{totalPrizePool.toLocaleString()}
            </div>
            <div className="text-blue-100 text-sm font-medium">Prize Pool</div>
            <div className="text-xs text-blue-200 mt-1">Winner: ৳{entryFee}</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 text-center hover:bg-white/15 transition-all duration-300">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Calendar className="text-white" size={20} />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {gameweekInfo?.current || '--'}
            </div>
            <div className="text-blue-100 text-sm font-medium">Current GW</div>
            {currentGameweekData?.average_entry_score && (
              <div className="text-xs text-blue-200 mt-1">
                Avg: {currentGameweekData.average_entry_score}
              </div>
            )}
          </div>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 text-center hover:bg-white/15 transition-all duration-300">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-red-500 rounded-lg flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="text-white" size={20} />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {gameweeksLeft}
            </div>
            <div className="text-blue-100 text-sm font-medium">GWs Left</div>
            <div className="text-xs text-blue-200 mt-1">
              Season ends May 2026
            </div>
          </div>
        </div>

        {/* Enhanced League Info - Now uses environment variables */}
        <div className="text-center">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 max-w-2xl mx-auto">
            <h3 className="text-white font-semibold text-lg mb-3">League Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-blue-200">Entry Fee</p>
                <p className="text-white font-semibold">৳{entryFee}</p>
              </div>
              <div>
                <p className="text-blue-200">Winner Prize</p>
                <p className="text-white font-semibold">৳{entryFee}</p>
              </div>
              <div>
                <p className="text-blue-200">League ID</p>
                <p className="text-white font-semibold">{leagueId}</p>
              </div>
              <div>
                <p className="text-blue-200">League Type</p>
                <p className="text-white font-semibold">Classic</p>
              </div>
            </div>
            
            {/* API Status Indicator */}
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="flex items-center justify-center gap-2">
                <div className={`w-2 h-2 rounded-full ${authStatus?.authenticated ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}></div>
                <span className="text-blue-200 text-sm">
                  {authStatus?.authenticated ? 'Live FPL Data' : 'Demo Mode'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Hero