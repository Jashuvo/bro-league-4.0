// src/components/LeagueTable.jsx - Enhanced with Modern UX (Real Data Integration)
import { 
  Trophy, TrendingUp, Users, Crown, Medal, Award, Zap, Star, 
  ExternalLink, ChevronDown, ChevronUp, Filter, Search,
  Heart, Share2, Eye, MoreVertical, ArrowUp, ArrowDown,
  Target, Activity, Flame, Shield
} from 'lucide-react';
import { useState, useMemo } from 'react';

const LeagueTable = ({ 
  standings = [], 
  loading = false, 
  authStatus = {}, 
  gameweekInfo = {}, 
  leagueStats = {}, 
  gameweekTable = [] 
}) => {
  // Enhanced UI state
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [favorites, setFavorites] = useState(new Set());
  const [sortBy, setSortBy] = useState('rank');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('detailed'); // compact, detailed

  // Modern loading state
  if (loading && standings.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced data processing with real data
  const processedStandings = useMemo(() => {
    let filtered = standings;

    // Search functionality
    if (searchQuery) {
      filtered = filtered.filter(manager => 
        manager.managerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        manager.teamName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Enhanced sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'points':
          return (b.totalPoints || 0) - (a.totalPoints || 0);
        case 'gameweek':
          return (b.gameweekPoints || 0) - (a.gameweekPoints || 0);
        case 'change':
          return (b.rankChange || 0) - (a.rankChange || 0);
        case 'name':
          return (a.managerName || '').localeCompare(b.managerName || '');
        default:
          return (a.rank || 999) - (b.rank || 999);
      }
    });
  }, [standings, searchQuery, sortBy]);

  // Calculate enhanced statistics from real data
  const enhancedStats = useMemo(() => {
    if (!standings.length) return {};
    
    const totalPoints = standings.reduce((sum, m) => sum + (m.totalPoints || 0), 0);
    const gameweekPoints = standings.reduce((sum, m) => sum + (m.gameweekPoints || 0), 0);
    
    return {
      averageTotal: Math.round(totalPoints / standings.length),
      averageGameweek: Math.round(gameweekPoints / standings.length),
      highestTotal: Math.max(...standings.map(m => m.totalPoints || 0)),
      highestGameweek: Math.max(...standings.map(m => m.gameweekPoints || 0)),
      activePlayers: standings.length,
      topPerformers: standings.filter(m => (m.totalPoints || 0) > totalPoints / standings.length).length
    };
  }, [standings]);

  // Helper functions
  const toggleExpanded = (managerId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(managerId)) {
      newExpanded.delete(managerId);
    } else {
      newExpanded.add(managerId);
    }
    setExpandedRows(newExpanded);
  };

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

  // Calculate form from your real gameweekTable data
  const getManagerForm = (managerId) => {
    if (!gameweekTable || gameweekTable.length === 0) return [];
    
    return gameweekTable
      .slice(-5) // Last 5 gameweeks
      .map(gw => {
        const managerGW = gw.managers?.find(m => m.id === managerId);
        return managerGW?.points || 0;
      })
      .filter(points => points > 0);
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
                Gameweek {gameweekInfo.current || 3} • {processedStandings.length} Managers
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

        {/* Enhanced Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-xl font-bold">{enhancedStats.averageTotal || '--'}</div>
            <div className="text-sm opacity-80">Avg Total</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-xl font-bold">{enhancedStats.highestTotal || '--'}</div>
            <div className="text-sm opacity-80">Highest Total</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-xl font-bold">{enhancedStats.averageGameweek || '--'}</div>
            <div className="text-sm opacity-80">Avg GW</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-xl font-bold">{enhancedStats.highestGameweek || '--'}</div>
            <div className="text-sm opacity-80">Highest GW</div>
          </div>
        </div>
      </div>

      {/* Enhanced Controls */}
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search managers or teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="rank">Position</option>
              <option value="points">Total Points</option>
              <option value="gameweek">GW Points</option>
              <option value="change">Change</option>
              <option value="name">Name</option>
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2 rounded-lg border transition-colors ${
                showFilters 
                  ? 'bg-blue-500 text-white border-blue-500' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter size={16} />
            </button>

            <button
              onClick={() => setViewMode(viewMode === 'detailed' ? 'compact' : 'detailed')}
              className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Eye size={16} />
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex flex-wrap gap-2">
              <button className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                Top 5
              </button>
              <button className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                Rising
              </button>
              <button className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                Falling
              </button>
              <button className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                Favorites
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Table */}
      <div className="overflow-x-auto">
        {processedStandings.length === 0 ? (
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
                <th className="text-center p-4 font-semibold text-gray-900">Form</th>
                <th className="text-center p-4 font-semibold text-gray-900">Movement</th>
                <th className="text-center p-4 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {processedStandings.map((manager) => {
                const changeIndicator = getChangeIndicator(manager.rankChange);
                const form = getManagerForm(manager.id);
                const isExpanded = expandedRows.has(manager.id);
                const isFavorite = favorites.has(manager.id);

                return (
                  <React.Fragment key={manager.id}>
                    <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
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

                      {/* Form */}
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1">
                          {form.length > 0 ? form.slice(-3).map((score, i) => (
                            <div
                              key={i}
                              className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center text-white ${
                                score >= 80 ? 'bg-green-500' :
                                score >= 60 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              title={`${score} points`}
                            >
                              {score}
                            </div>
                          )) : (
                            <span className="text-gray-400 text-xs">No data</span>
                          )}
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
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => toggleFavorite(manager.id)}
                            className={`p-1 rounded transition-colors ${
                              isFavorite ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                            }`}
                          >
                            <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
                          </button>
                          
                          {viewMode === 'detailed' && (
                            <button
                              onClick={() => toggleExpanded(manager.id)}
                              className="p-1 rounded text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                          )}
                          
                          <button className="p-1 rounded text-gray-400 hover:text-blue-600 transition-colors">
                            <Share2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Row Details */}
                    {isExpanded && viewMode === 'detailed' && (
                      <tr>
                        <td colSpan="7" className="p-0">
                          <div className="bg-gray-50 p-4 border-b border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-2">Performance</h4>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Overall Rank:</span>
                                    <span className="font-medium">{(manager.overallRank || 0).toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Average GW:</span>
                                    <span className="font-medium">
                                      {form.length > 0 ? Math.round(form.reduce((a, b) => a + b, 0) / form.length) : '--'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-2">Team Info</h4>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Bank Value:</span>
                                    <span className="font-medium">£{((manager.bankValue || 0) / 10).toFixed(1)}m</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Team Value:</span>
                                    <span className="font-medium">£{((manager.teamValue || 1000) / 10).toFixed(1)}m</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-2">Form Chart</h4>
                                <div className="flex items-end gap-1 h-12">
                                  {form.map((score, i) => (
                                    <div
                                      key={i}
                                      className={`w-4 bg-blue-500 rounded-t ${
                                        score >= 80 ? 'bg-green-500' :
                                        score >= 60 ? 'bg-yellow-500' :
                                        'bg-red-500'
                                      }`}
                                      style={{ height: `${(score / 100) * 100}%` }}
                                      title={`GW${i+1}: ${score} points`}
                                    ></div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Enhanced Footer */}
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
            Showing {processedStandings.length} of {standings.length} managers
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeagueTable;