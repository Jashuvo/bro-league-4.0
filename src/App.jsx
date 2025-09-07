// src/App.jsx - FIXED VERSION - Complete Working Tab Navigation and Table Display

import React, { useState, useEffect } from 'react';
import fplApi from './services/fplApi';

// Import enhanced components
import Header from './components/Header';
import Hero from './components/Hero';
import EnhancedStandingsTable from './components/EnhancedStandingsTable';
import PrizeTracker from './components/PrizeTracker';

function App() {
  const [standings, setStandings] = useState([]);
  const [gameweekInfo, setGameweekInfo] = useState({ current: 3, total: 38 });
  const [gameweekTable, setGameweekTable] = useState([]);
  const [leagueStats, setLeagueStats] = useState({});
  const [bootstrap, setBootstrap] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('standings'); // FIXED: Ensure this is set correctly
  const [authStatus, setAuthStatus] = useState({ authenticated: false, message: '' });
  const [lastUpdated, setLastUpdated] = useState(null);
  const [performanceInfo, setPerformanceInfo] = useState(null);

  // FIXED: Tab configuration - ensure these match exactly
  const tabs = [
    { id: 'standings', name: '🏆 Standings', icon: '🏆' },
    { id: 'prizes', name: '💰 Prize Tracker', icon: '💰' },
    { id: 'gameweek', name: '📊 Gameweek Analysis', icon: '📊' },
    { id: 'winners', name: '🎯 Weekly Winners', icon: '🎯' }
  ];

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

      // FIXED: Update standings with better error handling
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

  // FIXED: Tab click handler with debug logging
  const handleTabClick = (tabId) => {
    console.log(`🔄 Switching to tab: ${tabId}`);
    setActiveTab(tabId);
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

  // FIXED: Debug logging for tab changes
  useEffect(() => {
    console.log(`📋 Active tab changed to: ${activeTab}`);
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Performance indicator for development */}
      {import.meta.env.VITE_DEV_MODE === 'true' && performanceInfo && (
        <div className="fixed top-4 right-4 z-50 bg-black/80 text-white text-xs p-2 rounded backdrop-blur-sm">
          <div>Load: {performanceInfo.loadTime}ms</div>
          <div>Server: {performanceInfo.serverTime}</div>
          <div>Managers: {performanceInfo.managersLoaded}</div>
          <div>{performanceInfo.cacheHit ? '📋 Cache' : '🌐 Fresh'}</div>
          <div>Tab: {activeTab}</div>
        </div>
      )}

      {/* Header Component */}
      <Header 
        onRefresh={handleRefresh} 
        authStatus={authStatus} 
        loading={loading}
        performanceInfo={performanceInfo}
      />

      {/* Enhanced Hero Section */}
      <Hero 
        standings={standings}
        gameweekInfo={gameweekInfo}
        authStatus={authStatus}
        leagueStats={leagueStats}
        bootstrap={bootstrap}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* FIXED: Enhanced Tab Navigation with better styling and debugging */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-2 flex gap-2 overflow-x-auto max-w-4xl">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`
                  px-6 py-3 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap
                  flex items-center gap-2 min-w-fit
                  ${activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50 hover:scale-102'
                  }
                `}
                onClick={() => handleTabClick(tab.id)}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.name.split(' ').slice(1).join(' ')}</span>
                <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* FIXED: Tab Content with better conditional rendering and debugging */}
        <div className="tab-content">
          {/* Debug info */}
          {import.meta.env.VITE_DEV_MODE === 'true' && (
            <div className="mb-4 p-2 bg-yellow-100 border border-yellow-300 rounded text-sm">
              <strong>Debug:</strong> Active Tab = "{activeTab}" | 
              Standings Count = {standings.length} | 
              Loading = {loading.toString()}
            </div>
          )}

          {activeTab === 'standings' && (
            <div className="standings-tab">
              <EnhancedStandingsTable 
                standings={standings} 
                loading={loading} 
                gameweekInfo={gameweekInfo}
                authStatus={authStatus}
                leagueStats={leagueStats}
                gameweekTable={gameweekTable}
              />
            </div>
          )}

          {activeTab === 'prizes' && (
            <div className="prizes-tab">
              <PrizeTracker 
                gameweekInfo={gameweekInfo}
                standings={standings}
                gameweekTable={gameweekTable}
              />
            </div>
          )}

          {activeTab === 'gameweek' && (
            <div className="gameweek-tab">
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📊</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Gameweek Analysis</h2>
                <p className="text-gray-600 mb-6">
                  Detailed gameweek-by-gameweek performance analysis coming soon!
                </p>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-blue-700 text-sm">
                    📈 Charts showing form, transfers, and head-to-head comparisons
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'winners' && (
            <div className="winners-tab">
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎯</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Weekly Winners</h2>
                <p className="text-gray-600 mb-6">
                  Weekly champions and prize distribution timeline coming soon!
                </p>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="text-yellow-700 text-sm">
                    🏆 Interactive timeline of weekly winners with prize tracking
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* FIXED: Fallback if no valid tab is selected */}
          {!['standings', 'prizes', 'gameweek', 'winners'].includes(activeTab) && (
            <div className="bg-red-100 border border-red-300 rounded-lg p-4 text-center">
              <p className="text-red-700">Unknown tab: {activeTab}</p>
              <button 
                onClick={() => setActiveTab('standings')}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Go to Standings
              </button>
            </div>
          )}
        </div>

        {/* Connection Status Footer */}
        <div className="mt-12 bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className={`flex items-center gap-3 ${authStatus.authenticated ? 'text-green-600' : 'text-amber-600'}`}>
                <div className={`w-3 h-3 rounded-full ${authStatus.authenticated ? 'bg-green-400 animate-pulse' : 'bg-amber-400'}`}></div>
                <span className="font-medium text-sm">{authStatus.message}</span>
              </div>
              
              {performanceInfo && (
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <span className="text-lg">⚡</span>
                    <span>{performanceInfo.loadTime}ms</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {lastUpdated?.toLocaleTimeString('en-BD')} BD
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-lg">👥</span>
                <span className="font-semibold text-purple-600">{standings.length}</span>
                <span className="text-gray-600">Managers</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🎯</span>
                <span className="font-semibold text-purple-600">GW{gameweekInfo.current}</span>
                <span className="text-gray-600">Current</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">💰</span>
                <span className="font-semibold text-purple-600">৳12K</span>
                <span className="text-gray-600">Prize Pool</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;