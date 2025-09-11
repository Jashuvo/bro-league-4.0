// src/App.jsx - Enhanced but Error-Free Version
import React, { useState, useEffect, useCallback } from 'react';
import fplApi from './services/fplApi';

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

// Simple Live Match Day Component (no complex features)
const LiveMatchDay = ({ bootstrap, standings, gameweekInfo, authStatus }) => {
  const currentGW = gameweekInfo?.current || 3;
  const totalManagers = standings?.length || 0;
  
  // Calculate simple stats from real data
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
                GW {currentGW} {authStatus?.authenticated ? 'Live' : 'Demo'}
              </span>
            </div>
          </div>
          
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>

        {/* Current Gameweek Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{totalManagers}</div>
            <div className="text-sm text-blue-600">Active Managers</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{averagePoints}</div>
            <div className="text-sm text-green-600">Average Total</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{highestPoints}</div>
            <div className="text-sm text-purple-600">Highest Total</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{highestGW}</div>
            <div className="text-sm text-orange-600">Best GW Score</div>
          </div>
        </div>
      </div>

      {/* Live League Activity */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Top 5</h3>
        <div className="space-y-3">
          {standings.slice(0, 5).map((manager, index) => (
            <div key={manager.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {manager.rank || (index + 1)}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{manager.managerName || 'Unknown'}</div>
                  <div className="text-sm text-gray-500">{manager.teamName || 'Unknown Team'}</div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-bold text-gray-900">{(manager.totalPoints || 0).toLocaleString()}</div>
                <div className="text-sm text-gray-500">
                  GW: {manager.gameweekPoints || 0}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Connection Status */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Updates</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <span className="text-lg">⚽</span>
            <div>
              <div className="font-medium">Gameweek {currentGW} Status</div>
              <div className="text-sm text-gray-600">
                {authStatus?.authenticated 
                  ? 'Connected to live FPL data'
                  : 'Demo mode - refresh to connect'
                }
              </div>
            </div>
          </div>
          
          {authStatus?.authenticated && (
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <span className="text-lg">✅</span>
              <div>
                <div className="font-medium">Real-time Updates Active</div>
                <div className="text-sm text-gray-600">
                  Data refreshes automatically every 2 minutes
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
    { id: 'live', name: '🔴 Live Match Day', icon: '🔴' },
    { id: 'gameweek', name: '📊 Gameweek Table', icon: '📊' },
    { id: 'monthly', name: '📅 Monthly Prizes', icon: '📅' },
    { id: 'weekly', name: '🎯 Weekly Prizes', icon: '🎯' },
    { id: 'prizes', name: '💰 Prize Distribution', icon: '💰' }
  ];

  // Load data function (simplified)
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
        ? await fplApi.forceRefresh?.() || await fplApi.initializeWithAuth()
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
        authenticated: result.authenticated || false,
        message: result.authenticated 
          ? 'Connected to FPL API via Vercel'
          : result.error || 'Using fallback data'
      });

      // Update data safely
      if (result.bootstrap) {
        setGameweekInfo({
          current: result.bootstrap.currentGameweek || 3,
          total: result.bootstrap.totalGameweeks || 38,
          status: 'active'
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
        cacheAge: result.cacheAge ? Math.round(result.cacheAge / 1000) : null
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

  // Auto-refresh simplified
  useEffect(() => {
    let interval;
    if (authStatus.authenticated) {
      interval = setInterval(() => {
        if (!document.hidden) {
          console.log('🔄 Auto-refreshing data...');
          loadData();
        }
      }, 120000); // Every 2 minutes
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

  // Render content function
  const renderContent = () => {
    if (loading && !standings.length) {
      return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading league data...</p>
        </div>
      );
    }

    if (error && !standings.length) {
      return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={refreshData}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
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

      case 'live':
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
        {/* Performance Monitor (only in dev mode) */}
        {import.meta.env.VITE_DEV_MODE === 'true' && performanceInfo && (
          <PerformanceMonitor
            performanceInfo={performanceInfo}
            dataSource={dataSource}
            cacheStatus={{}}
          />
        )}

        {/* Header */}
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

        {/* Main content */}
        <main className="container mx-auto px-4 py-8">
          {/* Simple Tab Navigation */}
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
                      : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                    }
                    ${(loading && !standings.length) ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.name.split(' ').slice(1).join(' ')}</span>
                  <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
                  {/* Live indicator */}
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