// src/components/LeagueTable.jsx
import { TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react'

const LeagueTable = ({ standings, loading, authStatus, gameweekInfo }) => {
  if (loading) {
    return (
      <div className="card bg-white/10 backdrop-blur shadow-2xl">
        <div className="card-body">
          <div className="flex justify-center items-center h-64">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <span className="ml-4 text-white">
              {authStatus?.authenticated 
                ? 'Fetching live data from FPL API...' 
                : 'Loading league data...'}
            </span>
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
    if (current < last) return <TrendingUp className="text-green-500" size={16} />
    if (current > last) return <TrendingDown className="text-red-500" size={16} />
    return <Minus className="text-gray-400" size={16} />
  }

  const getSeasonPrize = (position) => {
    switch(position) {
      case 1: return '৳800'
      case 2: return '৳600'
      case 3: return '৳400'
      default: return '--'
    }
  }

  // Calculate stats
  const gwScores = standings.map(s => s.gameweekPoints).filter(score => score > 0)
  const avgScore = gwScores.length > 0 ? Math.round(gwScores.reduce((a, b) => a + b, 0) / gwScores.length) : 0
  const highestGW = gwScores.length > 0 ? Math.max(...gwScores) : 0
  const topScorer = standings.find(s => s.gameweekPoints === highestGW)

  return (
    <div id="standings" className="card bg-white/10 backdrop-blur shadow-2xl">
      <div className="card-body">
        <div className="flex justify-between items-center mb-6">
          <h2 className="card-title text-2xl text-white">
            🏆 League Standings
            <div className="badge badge-accent">Live</div>
          </h2>
          
          {authStatus?.authenticated && (
            <a 
              href="https://fantasy.premierleague.com/leagues/1858389/standings/c"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-outline text-white hover:bg-white/20"
            >
              <ExternalLink size={16} />
              View on FPL
            </a>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr className="bg-bro-primary text-white border-none">
                <th className="text-center">Pos</th>
                <th className="hidden sm:table-cell text-center">Change</th>
                <th>Manager</th>
                <th className="hidden md:table-cell">Team Name</th>
                <th className="text-center">GW{gameweekInfo?.current || ''}</th>
                <th className="text-center">Total</th>
                <th className="hidden lg:table-cell text-center">Season Prize</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((manager) => (
                <tr 
                  key={manager.id} 
                  className={`
                    ${manager.rank <= 3 ? 'bg-yellow-50/20 border-yellow-300/30' : 'bg-white/5'}
                    hover:bg-white/10 transition-all duration-200
                  `}
                >
                  {/* Position */}
                  <td className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-bold text-lg text-white">
                        {manager.rank}
                      </span>
                      {getPositionIcon(manager.rank)}
                    </div>
                  </td>

                  {/* Rank Change */}
                  <td className="hidden sm:table-cell text-center">
                    {getRankChangeIcon(manager.rank, manager.lastRank)}
                  </td>

                  {/* Manager Info */}
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar placeholder">
                        <div className="bg-bro-secondary text-bro-primary rounded-full w-10 h-10">
                          <span className="text-sm font-bold">
                            {manager.avatar || manager.managerName.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="font-bold text-white">{manager.managerName}</div>
                        <div className="text-sm opacity-70 text-gray-300 md:hidden">
                          {manager.teamName}
                        </div>
                        {authStatus?.authenticated && (
                          <div className="text-xs text-gray-500">
                            ID: {manager.id}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Team Name */}
                  <td className="hidden md:table-cell text-gray-300">
                    {manager.teamName}
                  </td>

                  {/* Gameweek Points */}
                  <td className="text-center">
                    <div className={`
                      badge font-bold
                      ${manager.gameweekPoints >= 80 ? 'badge-success' : 
                        manager.gameweekPoints >= 60 ? 'badge-warning' : 
                        manager.gameweekPoints > 0 ? 'badge-error' : 'badge-ghost'}
                    `}>
                      {manager.gameweekPoints || '--'}
                    </div>
                  </td>

                  {/* Total Points */}
                  <td className="text-center">
                    <span className="font-bold text-lg text-white">
                      {manager.totalPoints?.toLocaleString() || '--'}
                    </span>
                  </td>

                  {/* Season Prize */}
                  <td className="hidden lg:table-cell text-center">
                    <div className={`
                      badge 
                      ${manager.rank <= 3 ? 'badge-success' : 'badge-ghost'}
                    `}>
                      {getSeasonPrize(manager.rank)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat bg-white/5 rounded-lg">
            <div className="stat-title text-gray-300">Highest GW</div>
            <div className="stat-value text-green-400 text-xl">
              {highestGW || '--'}
            </div>
            <div className="stat-desc text-gray-400">
              {topScorer?.managerName || '--'}
            </div>
          </div>

          <div className="stat bg-white/5 rounded-lg">
            <div className="stat-title text-gray-300">Average GW</div>
            <div className="stat-value text-blue-400 text-xl">
              {avgScore || '--'}
            </div>
            <div className="stat-desc text-gray-400">This gameweek</div>
          </div>

          <div className="stat bg-white/5 rounded-lg">
            <div className="stat-title text-gray-300">Top Score</div>
            <div className="stat-value text-purple-400 text-xl">
              {standings.length > 0 ? Math.max(...standings.map(s => s.totalPoints)).toLocaleString() : '--'}
            </div>
            <div className="stat-desc text-gray-400">Season high</div>
          </div>

          <div className="stat bg-white/5 rounded-lg">
            <div className="stat-title text-gray-300">Gap to Top</div>
            <div className="stat-value text-yellow-400 text-xl">
              {standings.length >= 2 ? 
                (standings[0]?.totalPoints - standings[standings.length - 1]?.totalPoints) : '--'}
            </div>
            <div className="stat-desc text-gray-400">Points difference</div>
          </div>
        </div>

        <div className="mt-4 text-center text-gray-400 text-sm">
          {authStatus?.authenticated ? (
            <>
              🟢 Live data from FPL API • League ID: 1858389 <br />
              Last updated: {new Date().toLocaleString('en-US', { 
                timeZone: 'Asia/Dhaka',
                dateStyle: 'medium',
                timeStyle: 'short'
              })} (BD Time)
            </>
          ) : (
            <>
              🟡 Demo data • 
              <button 
                className="link text-gray-300 ml-1" 
                onClick={() => window.location.reload()}
              >
                Try refreshing to connect to FPL API
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default LeagueTable