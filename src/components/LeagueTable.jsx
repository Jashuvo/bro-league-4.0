// src/components/LeagueTable.jsx
import { TrendingUp, TrendingDown, Minus, ExternalLink, RefreshCw, Award, Zap } from 'lucide-react'

const LeagueTable = ({ standings, loading, authStatus, gameweekInfo }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="p-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <RefreshCw className="animate-spin mx-auto mb-4 text-purple-600" size={40} />
              <p className="text-gray-600 font-medium">
                {authStatus?.authenticated 
                  ? 'Fetching live data from FPL API...' 
                  : 'Loading league data...'}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const getPositionIcon = (position) => {
    switch(position) {
      case 1: return '🥇'
      case 2: return '🥈' 
      case 3: return '🥉'
      default: return ''
    }
  }

  const getRankChangeIcon = (current, last) => {
    if (current < last) return <TrendingUp className="text-green-500" size={14} />
    if (current > last) return <TrendingDown className="text-red-500" size={14} />
    return <Minus className="text-gray-400" size={14} />
  }

  const getSeasonPrize = (position) => {
    switch(position) {
      case 1: return '৳800'
      case 2: return '৳600'
      case 3: return '৳400'
      default: return '--'
    }
  }

  // Calculate stats from API data only
  const gwScores = standings.map(s => s.gameweekPoints).filter(score => score > 0)
  const avgScore = gwScores.length > 0 ? Math.round(gwScores.reduce((a, b) => a + b, 0) / gwScores.length) : 0
  const highestGW = gwScores.length > 0 ? Math.max(...gwScores) : 0
  const topScorer = standings.find(s => s.gameweekPoints === highestGW)

  return (
    <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Award className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">League Standings</h2>
              <p className="text-purple-100 text-sm">
                Gameweek {gameweekInfo?.current || '--'} • {standings.length} managers
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {authStatus?.authenticated ? (
              <div className="flex items-center gap-2 bg-green-500/20 text-white px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Live</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-yellow-500/20 text-white px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-sm font-medium">Demo</span>
              </div>
            )}
            
            {authStatus?.authenticated && (
              <a 
                href="https://fantasy.premierleague.com/leagues/1858389/standings/c"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2"
              >
                <ExternalLink size={16} />
                <span className="hidden sm:block">View on FPL</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-gray-50 border-b border-gray-200 p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{highestGW || '--'}</div>
            <div className="text-sm text-gray-600">Highest GW</div>
            <div className="text-xs text-gray-500">{topScorer?.managerName || '--'}</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{avgScore || '--'}</div>
            <div className="text-sm text-gray-600">Average GW</div>
            <div className="text-xs text-gray-500">This gameweek</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {standings.length > 0 ? Math.max(...standings.map(s => s.totalPoints)).toLocaleString() : '--'}
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
              <th className="text-center p-4 font-semibold text-gray-700 text-sm hidden lg:table-cell">Prize</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((manager, index) => (
              <tr 
                key={manager.id} 
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
                    {getPositionIcon(manager.rank)}
                  </div>
                </td>

                {/* Rank Change */}
                <td className="p-4 text-center hidden sm:table-cell">
                  <div className="flex justify-center">
                    {getRankChangeIcon(manager.rank, manager.lastRank)}
                  </div>
                </td>

                {/* Manager Info */}
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {manager.avatar || manager.managerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
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

                {/* Gameweek Points */}
                <td className="p-4 text-center">
                  <div className={`
                    inline-flex items-center gap-1 px-3 py-1 rounded-full font-semibold text-sm
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

                {/* Season Prize */}
                <td className="p-4 text-center hidden lg:table-cell">
                  <span className={`
                    font-semibold
                    ${manager.rank <= 3 ? 'text-green-600' : 'text-gray-500'}
                  `}>
                    {getSeasonPrize(manager.rank)}
                  </span>
                </td>
              </tr>
            ))}
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
                Live data from FPL API • League ID: 1858389 • 
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
  )
}

export default LeagueTable