// src/App.jsx - Complete Updated App with Enhanced Visual Polish
import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  BarChart3, 
  Award, 
  DollarSign,
  Users,
  TrendingUp,
  Calendar,
  Target,
  Zap,
  Star,
  Medal
} from 'lucide-react';

// Import services
import fplApi from './services/fplApi';

// Import components
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import PrizeDashboard from './components/PrizeDashboard.jsx';
import AchievementBadges from './components/AchievementBadges.jsx';

function App() {
  // State management
  const [standings, setStandings] = useState([]);
  const [gameweekInfo, setGameweekInfo] = useState({ current: 3, total: 38 });
  const [gameweekTable, setGameweekTable] = useState([]);
  const [leagueStats, setLeagueStats] = useState({});
  const [bootstrap, setBootstrap] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('standings');
  const [authStatus, setAuthStatus] = useState({ authenticated: false, message: '' });
  const [lastUpdated, setLastUpdated] = useState(null);
  const [performanceInfo, setPerformanceInfo] = useState(null);

  // Load data function
  const loadData = async () => {
    setLoading(true);
    const startTime = performance.now();

    try {
      console.log('🚀 Loading optimized FPL data for BRO League 4.0...');
      
      const result = await fplApi.initializeWithAuth();
      const endTime = performance.now();
      const totalTime = Math.round(endTime - startTime);

      console.log(`⚡ Data loaded in ${totalTime}ms`);
      console.log('📊 API Result:', result);

      // Update auth status
      setAuthStatus({
        authenticated: result.authenticated,
        message: result.authenticated ? 'Connected to FPL API via Vercel' : 'Using fallback data'
      });

      // Update bootstrap data
      if (result.bootstrap) {
        setGameweekInfo({
          current: result.bootstrap.currentGameweek || 3,
          total: result.bootstrap.totalGameweeks || 38,
          status: 'active'
        });
        setBootstrap(result.bootstrap);
      }

      // Update standings
      if (result.standings && result.standings.length > 0) {
        setStandings(result.standings);
        console.log(`✅ Loaded ${result.standings.length} managers with enhanced data`);
      } else {
        console.log('⚠️ No standings data available');
        setStandings([]);
      }

      // Update gameweek table
      if (result.gameweekTable) {
        setGameweekTable(result.gameweekTable);
        console.log(`📈 Loaded gameweek history for ${result.gameweekTable.length} gameweeks`);
      }

      // Update league stats
      if (result.leagueStats) {
        setLeagueStats(result.leagueStats);
        console.log('📊 Loaded league statistics');
      }

      // Performance tracking
      setPerformanceInfo({
        loadTime: totalTime,
        serverTime: result.performance?.processingTime || 'N/A',
        managersLoaded: result.standings?.length || 0,
        cacheHit: totalTime < 1000
      });

      setLastUpdated(new Date());

    } catch (error) {
      console.error('❌ Error loading FPL data:', error);
      setAuthStatus({
        authenticated: false,
        message: 'Failed to connect to API'
      });
      
      setStandings([]);
      setGameweekTable([]);
      setLeagueStats({});
    } finally {
      setLoading(false);
    }
  };

  // Force refresh function
  const handleRefresh = async () => {
    console.log('🔄 Force refreshing data...');
    await fplApi.forceRefresh();
    await loadData();
  };

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Auto-refresh every 5 minutes if tab is active
  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden && authStatus.authenticated) {
        console.log('🔄 Auto-refreshing data...');
        loadData();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [authStatus.authenticated]);

  // Tab configuration
  const tabs = [
    {
      id: 'standings',
      name: 'League Table',
      icon: Trophy,
      color: 'purple'
    },
    {
      id: 'prizes',
      name: 'Prize Money',
      icon: DollarSign,
      color: 'green'
    },
    {
      id: 'achievements',
      name: 'Achievements',
      icon: Award,
      color: 'yellow'
    },
    {
      id: 'analysis',
      name: 'Analysis',
      icon: BarChart3,
      color: 'blue'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Development Performance Indicator */}
      {import.meta.env.VITE_DEV_MODE === 'true' && performanceInfo && (
        <div className="fixed top-4 right-4 z-50 bg-black/80 text-white text-xs p-3 rounded-lg shadow-lg backdrop-blur-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Zap size={12} />
              <span>Load: {performanceInfo.loadTime}ms</span>
            </div>
            <div>Server: {performanceInfo.serverTime}</div>
            <div>Managers: {performanceInfo.managersLoaded}</div>
            <div className="flex items-center gap-1">
              {performanceInfo.cacheHit ? '📋' : '🌐'}
              <span>{performanceInfo.cacheHit ? 'Cache Hit' : 'Fresh Data'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <Header 
        onRefresh={handleRefresh} 
        authStatus={authStatus} 
        loading={loading}
        performanceInfo={performanceInfo}
        lastUpdated={lastUpdated}
      />

      {/* Hero Section */}
      <Hero 
        standings={standings}
        gameweekInfo={gameweekInfo}
        authStatus={authStatus}
        leagueStats={leagueStats}
        bootstrap={bootstrap}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Enhanced Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-2 flex gap-2 overflow-x-auto">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  className={`
                    flex items-center gap-3 px-6 py-4 rounded-xl font-medium transition-all duration-300 whitespace-nowrap
                    ${isActive 
                      ? `bg-gradient-to-r from-${tab.color}-500 to-${tab.color}-600 text-white shadow-lg transform scale-105` 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <IconComponent size={20} className={isActive ? 'text-white' : ''} />
                  <span className="font-semibold">{tab.name}</span>
                  {tab.id === 'standings' && standings.length > 0 && (
                    <span className={`
                      px-2 py-1 rounded-full text-xs font-bold
                      ${isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'}
                    `}>
                      {standings.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* League Standings */}
          {activeTab === 'standings' && (
            <div className="space-y-6">
              {/* Quick Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                  <div className="flex items-center gap-3">
                    <Users className="text-purple-500" size={24} />
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{standings.length}</p>
                      <p className="text-gray-600 text-sm">Total Managers</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="text-blue-500" size={24} />
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{leagueStats.averageScore || 0}</p>
                      <p className="text-gray-600 text-sm">Average Score</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                  <div className="flex items-center gap-3">
                    <Target className="text-green-500" size={24} />
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{leagueStats.highestTotal || 0}</p>
                      <p className="text-gray-600 text-sm">Highest Total</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
                  <div className="flex items-center gap-3">
                    <Calendar className="text-orange-500" size={24} />
                    <div>
                      <p className="text-2xl font-bold text-gray-900">GW{gameweekInfo.current}</p>
                      <p className="text-gray-600 text-sm">Current Week</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* League Table */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                  <div className="flex items-center gap-3">
                    <Trophy size={24} />
                    <div>
                      <h2 className="text-2xl font-bold">League Standings</h2>
                      <p className="text-purple-100">Current season rankings</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {loading ? (
                    <div className="space-y-4">
                      {[...Array(10)].map((_, i) => (
                        <div key={i} className="animate-pulse flex items-center space-x-4">
                          <div className="rounded-full bg-gray-200 h-12 w-12"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                          <div className="h-8 bg-gray-200 rounded w-16"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {standings.map((manager, index) => (
                        <div 
                          key={manager.id} 
                          className={`
                            flex items-center justify-between p-4 rounded-xl transition-all hover:shadow-md cursor-pointer
                            ${index === 0 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200' :
                              index === 1 ? 'bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200' :
                              index === 2 ? 'bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200' :
                              'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                            }
                          `}
                        >
                          <div className="flex items-center gap-4">
                            {/* Rank Badge */}
                            <div className={`
                              w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg
                              ${index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' :
                                index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white' :
                                index === 2 ? 'bg-gradient-to-r from-orange-400 to-red-500 text-white' :
                                'bg-gray-200 text-gray-600'
                              }
                            `}>
                              {index < 3 ? (
                                index === 0 ? <Trophy size={20} /> :
                                index === 1 ? <Medal size={20} /> :
                                <Award size={20} />
                              ) : (
                                index + 1
                              )}
                            </div>
                            
                            {/* Manager Info */}
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                {manager.avatar || manager.managerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{manager.teamName}</h4>
                                <p className="text-gray-600 text-sm">{manager.managerName}</p>
                              </div>
                            </div>
                          </div>

                          {/* Points Display */}
                          <div className="text-right">
                            <div className="flex items-center gap-4">
                              <div className="bg-white rounded-lg px-4 py-2 shadow-sm border">
                                <span className="font-bold text-xl text-gray-900">{manager.totalPoints.toLocaleString()}</span>
                                <span className="text-gray-500 text-sm ml-1">pts</span>
                              </div>
                              <div className="bg-white rounded-lg px-3 py-2 shadow-sm border">
                                <span className="font-bold text-green-600">{manager.gameweekPoints}</span>
                                <span className="text-gray-500 text-sm ml-1">GW</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {standings.length === 0 && !loading && (
                        <div className="text-center py-12">
                          <Users className="mx-auto text-gray-400 mb-4" size={48} />
                          <h3 className="text-lg font-medium text-gray-600 mb-2">No Data Available</h3>
                          <p className="text-gray-500">League standings will appear here once data is loaded.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Prize Money Dashboard */}
          {activeTab === 'prizes' && (
            <PrizeDashboard 
              standings={standings}
              gameweekInfo={gameweekInfo}
              gameweekTable={gameweekTable}
            />
          )}

          {/* Achievement System */}
          {activeTab === 'achievements' && (
            <AchievementBadges 
              standings={standings}
              gameweekInfo={gameweekInfo}
              gameweekTable={gameweekTable}
              leagueStats={leagueStats}
            />
          )}

          {/* Analysis Tab - Placeholder for future gameweek analysis */}
          {activeTab === 'analysis' && (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <BarChart3 className="mx-auto text-blue-500 mb-4" size={48} />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Gameweek Analysis</h3>
              <p className="text-gray-600 mb-4">
                Detailed gameweek-by-gameweek performance analysis and charts coming soon!
              </p>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-blue-700 text-sm">
                  🚧 This section will include line charts, form tables, transfer analysis, and head-to-head comparisons.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Enhanced Footer */}
      <footer className="bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 text-white mt-16">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* League Info */}
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                <Trophy className="text-yellow-400" size={24} />
                <h3 className="text-2xl font-bold">BRO League 4.0</h3>
              </div>
              <p className="text-gray-300 mb-4">
                The ultimate Fantasy Premier League competition among friends. 
                {standings.length} bros, one champion, endless memories.
              </p>
              <div className="flex items-center justify-center md:justify-start gap-4 text-sm">
                <span className="bg-white/20 px-3 py-1 rounded-full">
                  £{(import.meta.env.VITE_TOTAL_PRIZE_POOL || 12000).toLocaleString()} Prize Pool
                </span>
                <span className="bg-white/20 px-3 py-1 rounded-full">
                  {standings.length} Managers
                </span>
              </div>
            </div>

            {/* Season Stats */}
            <div className="text-center">
              <h4 className="text-lg font-semibold mb-4 text-yellow-300">Season Stats</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Current Gameweek:</span>
                  <span className="text-white font-semibold">GW{gameweekInfo.current}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">League Average:</span>
                  <span className="text-white font-semibold">{leagueStats.averageScore || 0} pts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Highest Total:</span>
                  <span className="text-white font-semibold">{leagueStats.highestTotal || 0} pts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Best Gameweek:</span>
                  <span className="text-white font-semibold">{leagueStats.highestGameweek || 0} pts</span>
                </div>
              </div>
            </div>

            {/* Tech Info */}
            <div className="text-center md:text-right">
              <h4 className="text-lg font-semibold mb-4 text-yellow-300">Powered By</h4>
              <div className="space-y-2 text-sm text-gray-300">
                <p>⚡ Vercel Serverless Functions</p>
                <p>🔄 Real-time FPL API</p>
                <p>⚛️ React + Vite</p>
                <p>🎨 Tailwind CSS</p>
              </div>
              {performanceInfo && (
                <div className="mt-4 bg-white/10 rounded-lg p-3">
                  <p className="text-xs text-gray-300">
                    ⚡ {performanceInfo.loadTime}ms load time
                    {performanceInfo.cacheHit && ' (cached)'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/20 pt-8 text-center">
            <div className="text-sm text-center">
              <span className="text-green-400">Assalamualaikum wa rahmatullahi wa barakatuh</span>
            </div>
            <div className="text-sm text-gray-400 mt-2">
              Last updated: {lastUpdated ? lastUpdated.toLocaleString('en-US', {
                timeZone: 'Asia/Dhaka',
                dateStyle: 'short',
                timeStyle: 'short'
              }) : 'Never'} BD
            </div>
          </div>

          {/* Inspirational Quote */}
          <div className="text-center mt-6 p-4 bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-lg border border-green-400/30">
            <div className="text-sm text-gray-300 mb-2">
              "May your captain always return, your differentials always haul, and your rivals always blank!"
            </div>
            <div className="text-xs text-gray-500">
              - Ancient FPL Wisdom 🏆⚽
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;