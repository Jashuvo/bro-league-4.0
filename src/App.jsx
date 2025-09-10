// src/App.jsx - Optimized with YOUR Actual Components
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import fplApi from './services/fplApi';

// Import YOUR actual components
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

function App() {
  // Core state
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

  // Load data with optimizations
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

      // Update bootstrap and gameweek info
      if (result.bootstrap) {
        setGameweekInfo({
          current: result.bootstrap.currentGameweek || 3,
          total: result.bootstrap.totalGameweeks || 38,
          status: result.bootstrap.gameweeks?.find(gw => gw.is_current)?.data_checked 
            ? 'finalized' 
            : 'active'
        });
        setBootstrap(result.bootstrap);
      }

      // Update standings
      if (result.standings && Array.isArray(result.standings)) {
        setStandings(result.standings);
        console.log(`✅ Loaded ${result.standings.length} managers`);
      } else {
        setStandings([]);
      }

      // Update gameweek table
      if (result.gameweekTable && Array.isArray(result.gameweekTable)) {
        setGameweekTable(result.gameweekTable);
        console.log(`📈 Loaded ${result.gameweekTable.length} gameweeks`);
      }

      // Update league stats
      if (result.leagueStats) {
        setLeagueStats(result.leagueStats);
      }

      // Update performance info
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

  // Force refresh handler
  const handleRefresh = useCallback(async () => {
    console.log('🔄 User triggered refresh...');
    await loadData(true);
  }, [loadData]);

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  // Auto-refresh every 2 minutes when tab is active
  useEffect(() => {
    let intervalId;
    
    const setupAutoRefresh = () => {
      intervalId = setInterval(() => {
        if (!document.hidden && authStatus.authenticated) {
          console.log('🔄 Auto-refreshing data...');
          loadData();
        }
      }, 2 * 60 * 1000); // 2 minutes
    };
    
    if (authStatus.authenticated) {
      setupAutoRefresh();
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [authStatus.authenticated, loadData]);

  // Tab configuration for YOUR components
  const tabs = useMemo(() => [
    { id: 'standings', name: '🏆 Standings', icon: '🏆' },
    { id: 'gameweek', name: '📊 Gameweek Table', icon: '📊' },
    { id: 'monthly', name: '📅 Monthly Prizes', icon: '📅' },
    { id: 'weekly', name: '🎯 Weekly Prizes', icon: '🎯' },
    { id: 'prizes', name: '💰 Prize Distribution', icon: '💰' }
  ], []);

  // Render tab content with YOUR components
  const renderTabContent = useCallback(() => {
    if (loading && !isRefreshing) {
      return <LoadingSpinner message="Loading league data..." />;
    }

    if (error && !standings.length) {
      return (
        <ErrorMessage 
          message={error} 
          onRetry={handleRefresh}
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
  }, [
    loading, 
    isRefreshing, 
    error, 
    standings, 
    activeTab, 
    gameweekInfo, 
    gameweekTable, 
    leagueStats,
    authStatus, 
    handleRefresh
  ]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Performance Monitor (Development Only) */}
        {import.meta.env.VITE_DEV_MODE === 'true' && performanceInfo && (
          <PerformanceMonitor 
            performanceInfo={performanceInfo}
            dataSource={dataSource}
            cacheStatus={fplApi.getCacheStatus()}
          />
        )}

        {/* Header */}
        <Header 
          onRefresh={handleRefresh}
          authStatus={authStatus}
          loading={isRefreshing}
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
          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-2 flex gap-2 overflow-x-auto max-w-5xl">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  disabled={loading && !isRefreshing}
                  className={`
                    px-4 py-2 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap
                    flex items-center gap-2 min-w-fit text-sm md:text-base
                    ${activeTab === tab.id
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg transform scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                    }
                    ${(loading && !isRefreshing) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.name.replace(tab.icon, '').trim()}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="transition-all duration-300">
            {error && standings.length > 0 && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800">
                  ⚠️ {error} - Showing cached data
                </p>
              </div>
            )}
            
            {renderTabContent()}
          </div>

          {/* Status Footer */}
          {lastUpdated && (
            <div className="mt-8 text-center text-sm text-gray-500">
              <p>
                Last updated: {lastUpdated.toLocaleTimeString()} 
                {dataSource === 'cache' && ' (from cache)'}
                {dataSource === 'stale' && ' (stale data)'}
              </p>
              {performanceInfo?.clientMetrics?.performanceStats && (
                <p className="mt-1">
                  Avg response: {performanceInfo.clientMetrics.performanceStats.averageDuration}ms 
                  • Success rate: {performanceInfo.clientMetrics.performanceStats.successRate}%
                </p>
              )}
            </div>
          )}
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