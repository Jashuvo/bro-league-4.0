// src/App.jsx - Enhanced with Live Match Day Experience (Real Integration)
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import fplApi from './services/fplApi';
import { 
  Clock, Users, Trophy, Activity, Target, Flame, 
  Eye, Bell, RefreshCw, Zap 
} from 'lucide-react';

// Import YOUR existing components
import Header from './components/Header';
import Hero from './components/Hero';
import LeagueTable from './components/LeagueTable';
import GameweekTable from './components/GameweekTable';
import MonthlyPrizes from './components/MonthlyPrizes';
import WeeklyPrizes from './components/WeeklyPrizes';
import PrizeDistribution from './components/PrizeDistribution';
import Footer from './components/Footer';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import PerformanceMonitor from './components/PerformanceMonitor';
import ErrorBoundary from './components/ErrorBoundary';

// NEW: Live Match Day Component (integrated with your real data)
const LiveMatchDay = ({ bootstrap, standings, gameweekInfo, authStatus }) => {
  const [liveMatches, setLiveMatches] = useState([]);
  const [isLive, setIsLive] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Get current gameweek fixtures from bootstrap
  const currentGWFixtures = useMemo(() => {
    if (!bootstrap?.gameweeks || !gameweekInfo?.current) return [];
    
    const currentGW = bootstrap.gameweeks.find(gw => gw.id === gameweekInfo.current);
    if (!currentGW) return [];

    // Transform your real FPL data into match format
    return [
      {
        id: 1,
        gameweek: gameweekInfo.current,
        status: currentGW.finished ? 'finished' : 'live',
        deadline: currentGW.deadline_time,
        averageScore: currentGW.average_entry_score || 0,
        highestScore: currentGW.highest_score || 0,
        transfersMade: currentGW.transfers_made || 0
      }
    ];
  }, [bootstrap, gameweekInfo]);

  // Live league activity using your real standings data
  const liveLeagueActivity = useMemo(() => {
    if (!standings || standings.length === 0) return [];
    
    return standings.slice(0, 5).map(manager => ({
      id: manager.id,
      name: manager.managerName,
      team: manager.teamName,
      currentPoints: manager.totalPoints,
      gameweekPoints: manager.gameweekPoints || 0,
      rank: manager.rank,
      rankChange: manager.rankChange || 0,
      status: Math.random() > 0.5 ? 'watching' : 'idle', // Simulated activity
      lastSeen: 'now'
    }));
  }, [standings]);

  return (
    <div className="space-y-6">
      {/* Live Status Header */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-900">Live Match Day</h2>
            <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-700">
                GW {gameweekInfo.current} {authStatus?.authenticated ? 'Live' : 'Demo'}
              </span>
            </div>
          </div>
          
          <div className="text-sm text-gray-500">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>

        {/* Current Gameweek Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{standings.length}</div>
            <div className="text-sm text-blue-600">Active Managers</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {currentGWFixtures[0]?.averageScore || '--'}
            </div>
            <div className="text-sm text-green-600">Average Score</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {currentGWFixtures[0]?.highestScore || '--'}
            </div>
            <div className="text-sm text-purple-600">Highest Score</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {Math.max(...standings.map(m => m.gameweekPoints || 0)) || '--'}
            </div>
            <div className="text-sm text-orange-600">League High</div>
          </div>
        </div>
      </div>

      {/* Live League Activity */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Live League Activity</h3>
        <div className="space-y-3">
          {liveLeagueActivity.map(manager => (
            <div key={manager.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {manager.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                    manager.status === 'watching' ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{manager.name}</div>
                  <div className="text-sm text-gray-500">{manager.team}</div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-bold text-gray-900">{manager.currentPoints}</div>
                <div className="text-sm text-gray-500">
                  GW: {manager.gameweekPoints}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Real-time Updates */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {authStatus?.authenticated ? 'Live Updates' : 'Sample Live Updates'}
        </h3>
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <span className="text-lg">⚽</span>
            <div>
              <div className="font-medium">Gameweek {gameweekInfo.current} in Progress</div>
              <div className="text-sm text-gray-600">
                {authStatus?.authenticated 
                  ? 'Tracking live scores and fantasy points'
                  : 'Connect to FPL API for live tracking'
                }
              </div>
            </div>
          </div>
          
          {!authStatus?.authenticated && (
            <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
              <span className="text-lg">🔄</span>
              <div>
                <div className="font-medium">Demo Mode Active</div>
                <div className="text-sm text-gray-600">
                  Refresh page to connect to live FPL data
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function App() {
  // Core state (keeping your existing structure)
  const [standings, setStandings] = useState([]);
  const [gameweekInfo, setGameweekInfo] = useState({ current: 3, total: 38 });
  const [gameweekTable, setGameweekTable] = useState([]);
  const [leagueStats, setLeagueStats] = useState({});
  const [bootstrap, setBootstrap] = useState({});
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('standings');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Performance state
  const [authStatus, setAuthStatus] = useState({
    authenticated: false,
    message: ''
  });
  const [lastUpdated, setLastUpdated] = useState(null);
  const [performanceInfo, setPerformanceInfo] = useState(null);
  const [dataSource, setDataSource] = useState('loading');

  // ENHANCED: Updated tabs with Live Match Day
  const tabs = [
    { id: 'standings', name: '🏆 Standings', icon: '🏆' },
    { id: 'live', name: '🔴 Live Match Day', icon: '🔴' }, // NEW TAB
    { id: 'gameweek', name: '📊 Gameweek Table', icon: '📊' },
    { id: 'monthly', name: '📅 Monthly Prizes', icon: '📅' },
    { id: 'weekly', name: '🎯 Weekly Prizes', icon: '🎯' },
    { id: 'prizes', name: '💰 Prize Distribution', icon: '💰' }
  ];

  // Load data with optimizations (keeping your existing logic)
  const loadData = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }
    
    setError(null);
    const startTime = performance.now();

    try {
      console.log(`🚀 Loading FPL data${forceRefresh ? ' (force refresh)' : ''}...`);
      
      const result = forceRefresh 
        ? await fplApi.forceRefresh()
        : await fplApi.initializeWithAuth();
      
      const loadTime = Math.round(performance.now() - startTime);
      console.log(`⚡ Data loaded in ${loadTime}ms`);
      
      // Determine data source
      let source = 'fresh';
      if (result.fromCache) source = 'cache';
      if (result.isStale) source = 'stale';
      if (result.error) source = 'error';
      setDataSource(source);
      
      // Update auth status
      setAuthStatus({
        authenticated: result.authenticated,
        message: result.authenticated 
          ? 'Connected to FPL API via Vercel'
          : result.error || 'Using fallback data'
      });

      // Update data (keeping your existing structure)
      if (result.bootstrap) {
        setGameweekInfo({
          current: result.bootstrap.currentGameweek || 3,
          total: result.bootstrap.totalGameweeks || 38,
          status: result.bootstrap.gameweeks?.find(gw => gw.is_current)?.data_checked ? 'finalized' : 'active'
        });
        setBootstrap(result.bootstrap);
      }

      if (result.standings && Array.isArray(result.standings)) {
        setStandings(result.standings);
        console.log(`✅ Loaded ${result.standings.length} managers`);
      } else {
        setStandings([]);
      }

      if (result.gameweekTable && Array.isArray(result.gameweekTable)) {
        setGameweekTable(result.gameweekTable);
        console.log(`📈 Loaded ${result.gameweekTable.length} gameweeks`);
      }

      if (result.leagueStats) {
        setLeagueStats(result.leagueStats);
      }

      // Performance info
      setPerformanceInfo({
        loadTime,
        serverTime: result.performance?.processingTime || 'N/A',
        managersLoaded: result.standings?.length || 0,
        dataCompleteness: result.performance?.dataCompleteness || 0,
        cacheHit: result.fromCache || false,
        cacheAge: result.cacheAge ? Math.round(result.cacheAge / 1000) : null,
        clientMetrics: result.clientMetrics
      });

      setLastUpdated(new Date());
      setError(null);

    } catch (error) {
      console.error('❌ Error loading FPL data:', error);
      setError(error.message || 'Failed to load data');
      setDataSource('error');
      setAuthStatus({
        authenticated: false,
        message: 'Connection failed - ' + error.message
      });

      // Keep existing data if any
      if (!standings.length) {
        setStandings([]);
        setGameweekTable([]);
        setLeagueStats({});
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [standings.length]);

  // Auto-refresh during live gameweeks
  useEffect(() => {
    let interval;
    const startAutoRefresh = () => {
      interval = setInterval(() => {
        if (!document.hidden && authStatus.authenticated) {
          console.log('🔄 Auto-refreshing data...');
          loadData();
        }
      }, 120000); // Every 2 minutes during live gameweeks
    };

    if (authStatus.authenticated) {
      startAutoRefresh();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [authStatus.authenticated, loadData]);

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  const refreshData = useCallback(async () => {
    console.log('🔄 User triggered refresh...');
    await loadData(true);
  }, [loadData]);

  // Enhanced render content function
  const renderContent = () => {
    if (loading && !standings.length) {
      return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
          <LoadingSpinner size="large" message="Loading league data..." />
        </div>
      );
    }

    if (error && !standings.length) {
      return (
        <ErrorMessage 
          message={error} 
          onRetry={refreshData}
          details={authStatus.message}
        />
      );
    }

    switch (activeTab) {
      case 'standings':
        return (
          <LeagueTable
            standings={standings}
            loading={isRefreshing}
            authStatus={authStatus}
            gameweekInfo={gameweekInfo}
            leagueStats={leagueStats}
            gameweekTable={gameweekTable}
          />
        );

      case 'live': // NEW: Live Match Day tab
        return (
          <LiveMatchDay
            bootstrap={bootstrap}
            standings={standings}
            gameweekInfo={gameweekInfo}
            authStatus={authStatus}
          />
        );

      case 'gameweek':
        return (
          <GameweekTable
            gameweekTable={gameweekTable}
            standings={standings}
            currentGameweek={gameweekInfo.current}
            loading={isRefreshing}
          />
        );

      case 'monthly':
        return (
          <MonthlyPrizes
            standings={standings}
            gameweekInfo={gameweekInfo}
            gameweekTable={gameweekTable}
          />
        );

      case 'weekly':
        return (
          <WeeklyPrizes
            standings={standings}
            gameweekInfo={gameweekInfo}
            gameweekTable={gameweekTable}
          />
        );

      case 'prizes':
        return (
          <PrizeDistribution
            standings={standings}
            currentGameweek={gameweekInfo.current}
            totalGameweeks={gameweekInfo.total}
          />
        );

      default:
        return null;
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Performance Monitor (enhanced) */}
        {import.meta.env.VITE_DEV_MODE === 'true' && performanceInfo && (
          <PerformanceMonitor
            performanceInfo={performanceInfo}
            dataSource={dataSource}
            cacheStatus={fplApi.getCacheStatus ? fplApi.getCacheStatus() : {}}
          />
        )}

        {/* Header with refresh capability */}
        <Header
          onRefresh={refreshData}
          authStatus={authStatus}
          loading={isRefreshing}
          performanceInfo={performanceInfo}
          lastUpdated={lastUpdated}
        />

        {/* Hero section */}
        <Hero
          standings={standings}
          gameweekInfo={gameweekInfo}
          authStatus={authStatus}
          leagueStats={leagueStats}
          bootstrap={bootstrap}
        />

        {/* Main content with enhanced navigation */}
        <main className="container mx-auto px-4 py-8">
          {/* Enhanced Tab Navigation */}
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-2 flex gap-2 overflow-x-auto max-w-5xl">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  disabled={loading && !standings.length}
                  className={`
                    px-4 py-2 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap
                    flex items-center gap-2 min-w-fit text-sm md:text-base
                    ${activeTab === tab.id 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105' 
                      : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50 hover:scale-102'
                    }
                    ${(loading && !standings.length) ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.name.split(' ').slice(1).join(' ')}</span>
                  <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
                  {/* NEW: Live indicator for live tab */}
                  {tab.id === 'live' && authStatus.authenticated && (
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse ml-1"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="tab-content">
            {renderContent()}
          </div>
        </main>

        {/* Footer */}
        <Footer
          gameweekInfo={gameweekInfo}
          standings={standings}
          authStatus={authStatus}
          bootstrap={bootstrap}
        />
      </div>
    </ErrorBoundary>
  );
}

export default App;