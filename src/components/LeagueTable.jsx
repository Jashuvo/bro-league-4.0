// src/components/LeagueTable.jsx - Enhanced but Error-Free Version
import React, { useState } from 'react';
import { 
  Trophy, TrendingUp, Users, Crown, Medal, Award, 
  Search, ArrowUp, ArrowDown, Heart
} from 'lucide-react';

const LeagueTable = ({ 
  standings = [], 
  loading = false, 
  authStatus = {}, 
  gameweekInfo = {}, 
  leagueStats = {}, 
  gameweekTable = [] 
}) => {
  // Simple UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState(new Set());

  // Simple loading state
  if (loading && standings.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading league table...</p>
        </div>
      </div>
    );
  }

  // Simple data filtering
  const filteredStandings = standings.filter(manager => 
    !searchQuery || 
    (manager.managerName && manager.managerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (manager.teamName && manager.teamName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Calculate simple stats
  const totalManagers = standings.length;
  const averagePoints = totalManagers > 0 
    ? Math.round(standings.reduce((sum, m) => sum + (m.totalPoints || 0), 0) / totalManagers)
    : 0;
  const highestPoints = totalManagers > 0 
    ? Math.max(...standings.map(m => m.totalPoints || 0))
    : 0;
  const averageGW = totalManagers > 0 
    ? Math.round(standings.reduce((sum, m) => sum + (m.gameweekPoints || 0), 0) / totalManagers)
    : 0;
  const highestGW = totalManagers > 0 
    ? Math.max(...standings.map(m => m.gameweekPoints || 0))
    : 0;

  const toggleFavorite = (managerId) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(managerId)) {
      newFavorites.delete(managerId);
    } else {
      newFavorites.add(managerId);
    }
    setFavorites(newFavorites);
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="text-yellow-500" size={20} />;
    if (rank === 2) return <Medal className="text-gray-500" size={20} />;
    if (rank === 3) return <Award className="text-orange-500" size={20} />;
    return <span className="font-bold text-lg">{rank}</span>;
  };

  const getRankBadgeColor = (rank) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
    if (rank === 2) return 'bg-gradient-to-r from-gray-400 to-gray-600';
    if (rank === 3) return 'bg-gradient-to-r from-orange-400 to-orange-600';
    if (rank <= 5) return 'bg-gradient-to-r from-green-400 to-green-600';
    if (rank <= 10) return 'bg-gradient-to-r from-blue-400 to-blue-600';
    return 'bg-gradient-to-r from-gray-500 to-gray-700';
  };

  const getChangeIndicator = (change) => {
    if (!change || change === 0) return { icon: null, color: 'text-gray-400', text: '—' };
    if (change > 0) return { 
      icon: <ArrowUp size={12} />, 
      color: 'text-green-600 bg-green-100', 
      text: `+${change}` 
    };
    return { 
      icon: <ArrowDown size={12} />, 
      color: 'text-red-600 bg-red-100', 
      text: `${change}` 
    };
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Trophy size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">League Standings</h2>
              <p className="text-blue-100">
                Gameweek {gameweekInfo.current || 3} • {totalManagers} Managers
              </p>
            </div>
          </div>
          
          {authStatus?.authenticated && (
            <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Live Data</span>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-xl font-bold">{averagePoints}</div>
            <div className="text-sm opacity-80">Avg Total</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-xl font-bold">{highestPoints}</div>
            <div className="text-sm opacity-80">Highest Total</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-xl font-bold">{averageGW}</div>
            <div className="text-sm opacity-80">Avg GW</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-xl font-bold">{highestGW}</div>
            <div className="text-sm opacity-80">Highest GW</div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <div className="relative max-w-md">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search managers or teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {filteredStandings.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="text-gray-400" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Managers Found</h3>
            <p className="text-gray-500">
              {searchQuery ? 'Try adjusting your search terms.' : 'Standings will appear here once data loads.'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-semibold text-gray-900">Position</th>
                <th className="text-left p-4 font-semibold text-gray-900">Manager</th>
                <th className="text-center p-4 font-semibold text-gray-900">Total Points</th>
                <th className="text-center p-4 font-semibold text-gray-900">GW Points</th>
                <th className="text-center p-4 font-semibold text-gray-900">Movement</th>
                <th className="text-center p-4 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStandings.map((manager) => {
                const changeIndicator = getChangeIndicator(manager.rankChange);
                const isFavorite = favorites.has(manager.id);

                return (
                  <tr key={manager.id || manager.entry} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    {/* Position */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-10 h-10 rounded-full flex items-center justify-center text-white font-bold
                          ${getRankBadgeColor(manager.rank)}
                        `}>
                          {manager.rank <= 3 ? getRankIcon(manager.rank) : manager.rank}
                        </div>
                      </div>
                    </td>

                    {/* Manager */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {(manager.managerName || 'Unknown').split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 flex items-center gap-2">
                            {manager.managerName || 'Unknown Manager'}
                            {isFavorite && <Heart size={14} className="text-red-500 fill-current" />}
                          </div>
                          <div className="text-sm text-gray-500">{manager.teamName || 'Unknown Team'}</div>
                        </div>
                      </div>
                    </td>

                    {/* Total Points */}
                    <td className="p-4 text-center">
                      <div className="font-bold text-lg text-gray-900">
                        {(manager.totalPoints || 0).toLocaleString()}
                      </div>
                    </td>

                    {/* GW Points */}
                    <td className="p-4 text-center">
                      <div className="font-semibold text-blue-600">
                        {manager.gameweekPoints || 0}
                      </div>
                    </td>

                    {/* Movement */}
                    <td className="p-4 text-center">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${changeIndicator.color}`}>
                        {changeIndicator.icon}
                        {changeIndicator.text}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-center">
                      <button
                        onClick={() => toggleFavorite(manager.id)}
                        className={`p-2 rounded transition-colors ${
                          isFavorite ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                        }`}
                      >
                        <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t border-gray-200 p-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-2">
            {authStatus?.authenticated ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>
                  Live data from FPL API • League ID: {import.meta.env.VITE_FPL_LEAGUE_ID} • 
                  Last updated: {new Date().toLocaleString('en-US', { 
                    timeZone: 'Asia/Dhaka',
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })} (BD Time)
                </span>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
          
          <div className="text-xs text-gray-500">
            Showing {filteredStandings.length} of {standings.length} managers
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeagueTable;