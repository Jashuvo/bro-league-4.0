// src/App.jsx - Updated to use optimized Vercel API

import React, { useState, useEffect } from 'react';
import fplApi from './services/fplApi';

// Import your existing components
// import Header from './components/Header';
// import StandingsTable from './components/StandingsTable';
// import GameweekHistory from './components/GameweekHistory';
// import WeeklyWinners from './components/WeeklyWinners';
// import Footer from './components/Footer';

function App() {
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
      
      // Use the optimized complete API call
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
        cacheHit: totalTime < 1000 // Assume cache hit if very fast
      });

      setLastUpdated(new Date());

    } catch (error) {
      console.error('❌ Error loading FPL data:', error);
      setAuthStatus({
        authenticated: false,
        message: 'Failed to connect to API'
      });
      
      // Set empty data instead of keeping old data
      setStandings([]);
      setGameweekTable([]);
      setLeagueStats({});
    } finally {
      setLoading(false);
    }
  };

  // Force refresh function (clears cache)
  const handleRefresh = async () => {
    console.log('🔄 Force refreshing data...');
    await fplApi.forceRefresh();
    await loadData();
  };

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Auto-refresh every 5 minutes if the tab is active
  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden && authStatus.authenticated) {
        console.log('🔄 Auto-refreshing data...');
        loadData();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [authStatus.authenticated]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Performance indicator for development */}
      {import.meta.env.VITE_DEV_MODE === 'true' && performanceInfo && (
        <div className="fixed top-4 right-4 z-50 bg-black/80 text-white text-xs p-2 rounded">
          <div>Load: {performanceInfo.loadTime}ms</div>
          <div>Server: {performanceInfo.serverTime}</div>
          <div>Managers: {performanceInfo.managersLoaded}</div>
          <div>{performanceInfo.cacheHit ? '📋 Cache' : '🌐 Fresh'}</div>
        </div>
      )}

      {/* Header Component */}
      {/* <Header 
        onRefresh={handleRefresh} 
        authStatus={authStatus} 
        loading={loading}
        performanceInfo={performanceInfo}
      /> */}

      {/* Hero Section Component */}
      {/* <HeroSection 
        standings={standings}
        gameweekInfo={gameweekInfo}
        authStatus={authStatus}
        leagueStats={leagueStats}
        bootstrap={bootstrap}
      /> */}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-1 flex gap-1 overflow-x-auto">
            <button
              className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
                activeTab === 'standings'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
              }`}
              onClick={() => setActiveTab('standings')}
            >
              🏆 Standings
            </button>
            <button
              className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
                activeTab === 'gameweek'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
              }`}
              onClick={() => setActiveTab('gameweek')}
            >
              📊 Gameweek Analysis
            </button>
            <button
              className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
                activeTab === 'winners'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
              }`}
              onClick={() => setActiveTab('winners')}
            >
              🎯 Weekly Winners
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'standings' && (
            <div>
              {/* <StandingsTable 
                standings={standings} 
                loading={loading} 
                gameweekInfo={gameweekInfo}
                authStatus={authStatus}
              /> */}
              
              {/* Placeholder for development */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4">League Standings</h2>
                {loading ? (
                  <div className="animate-pulse space-y-4">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {standings.map((manager, index) => (
                      <div key={manager.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <span className="text-lg font-bold text-gray-600">#{index + 1}</span>
                          <div>
                            <div className="font-semibold">{manager.teamName}</div>
                            <div className="text-sm text-gray-600">{manager.managerName}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">{manager.totalPoints}</div>
                          <div className="text-sm text-gray-600">GW: {manager.gameweekPoints}</div>
                        </div>
                      </div>
                    ))}
                    {standings.length === 0 && !loading && (
                      <div className="text-center py-8 text-gray-500">
                        No data available. Please check your connection and try refreshing.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'gameweek' && (
            <div>
              {/* <GameweekHistory 
                gameweekTable={gameweekTable} 
                loading={loading} 
                currentGameweek={gameweekInfo.current}
              /> */}
              
              {/* Placeholder */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4">Gameweek Analysis</h2>
                <p className="text-gray-600">Gameweek-by-gameweek performance analysis will appear here.</p>
              </div>
            </div>
          )}

          {activeTab === 'winners' && (
            <div>
              {/* <WeeklyWinners 
                gameweekTable={gameweekTable} 
                loading={loading}
                currentGameweek={gameweekInfo.current}
              /> */}
              
              {/* Placeholder */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4">Weekly Winners</h2>
                <p className="text-gray-600">Weekly winners and top performers will appear here.</p>
              </div>
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 ${authStatus.authenticated ? 'text-green-600' : 'text-red-600'}`}>
                <div className={`w-2 h-2 rounded-full ${authStatus.authenticated ? 'bg-green-500' : 'bg-red-500'}`}></div>
                {authStatus.message}
              </div>
              
              {performanceInfo && (
                <div className="text-gray-600">
                  ⚡ {performanceInfo.loadTime}ms
                </div>
              )}
            </div>
            
            <div className="text-gray-500">
              {lastUpdated && `Last updated: ${lastUpdated.toLocaleTimeString('en-US', { 
                timeZone: 'Asia/Dhaka', 
                timeStyle: 'short' 
              })} BD`}
            </div>
          </div>
        </div>
      </main>

      {/* Footer Component */}
      {/* <Footer 
        standings={standings}
        gameweekInfo={gameweekInfo}
        authStatus={authStatus}
        bootstrap={bootstrap}
      /> */}
    </div>
  );
}

export default App;