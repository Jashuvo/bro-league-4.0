// src/App.jsx - Updated with Enhanced Visual Polish Components

import React, { useState, useEffect } from 'react';
import fplApi from './services/fplApi';

// Import enhanced components
import Header from './components/Header';
import Hero from './components/Hero';
import EnhancedStandingsTable from './components/EnhancedStandingsTable';
import PrizeTracker from './components/PrizeTracker';
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

  // Tab configuration
  const tabs = [
    { id: 'standings', name: '🏆 Standings', icon: '🏆' },
    { id: 'prizes', name: '💰 Prize Tracker', icon: '💰' },
    { id: 'gameweek', name: '📊 Gameweek Analysis', icon: '📊' },
    { id: 'winners', name: '🎯 Weekly Winners', icon: '🎯' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Performance indicator for development */}
      {import.meta.env.VITE_DEV_MODE === 'true' && performanceInfo && (
        <div className="fixed top-4 right-4 z-50 bg-black/80 text-white text-xs p-2 rounded backdrop-blur-sm">
          <div>Load: {performanceInfo.loadTime}ms</div>
          <div>Server: {performanceInfo.serverTime}</div>
          <div>Managers: {performanceInfo.managersLoaded}</div>
          <div>{performanceInfo.cacheHit ? '📋 Cache' : '🌐 Fresh'}</div>
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
        {/* Enhanced Tab Navigation */}
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
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.name.split(' ').slice(1).join(' ')}</span>
                <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'standings' && (
            <EnhancedStandingsTable 
              standings={standings} 
              loading={loading} 
              gameweekInfo={gameweekInfo}
              authStatus={authStatus}
              leagueStats={leagueStats}
              gameweekTable={gameweekTable}
            />
          )}

          {activeTab === 'prizes' && (
            <PrizeTracker 
              gameweekInfo={gameweekInfo}
              standings={standings}
              gameweekTable={gameweekTable}
            />
          )}

          {activeTab === 'gameweek' && (
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
          )}

          {activeTab === 'winners' && (
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
          )}
        </div>

        {/* Enhanced Status Bar */}
        <div className="mt-12 bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              {/* API Status */}
              <div className={`flex items-center gap-3 ${authStatus.authenticated ? 'text-green-600' : 'text-amber-600'}`}>
                <div className={`w-3 h-3 rounded-full ${authStatus.authenticated ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`}></div>
                <div>
                  <div className="font-semibold">{authStatus.message}</div>
                  <div className="text-xs text-gray-500">API Connection Status</div>
                </div>
              </div>
              
              {/* Performance Info */}
              {performanceInfo && (
                <div className="text-gray-600">
                  <div className="font-semibold flex items-center gap-2">
                    ⚡ {performanceInfo.loadTime}ms
                    {performanceInfo.cacheHit && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Cached</span>}
                  </div>
                  <div className="text-xs text-gray-500">Load Time</div>
                </div>
              )}
              
              {/* Last Updated */}
              <div className="text-gray-500">
                <div className="font-semibold">
                  {lastUpdated && lastUpdated.toLocaleTimeString('en-US', { 
                    timeZone: 'Asia/Dhaka', 
                    timeStyle: 'short' 
                  })} BD
                </div>
                <div className="text-xs text-gray-500">Last Updated</div>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="flex items-center gap-6 text-sm">
              <div className="text-center">
                <div className="font-bold text-purple-600">{standings.length}</div>
                <div className="text-gray-500">Managers</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-blue-600">GW{gameweekInfo.current}</div>
                <div className="text-gray-500">Current</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-green-600">৳12K</div>
                <div className="text-gray-500">Prize Pool</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Enhanced Footer */}
      <footer className="bg-gradient-to-r from-gray-800 to-gray-900 text-white mt-16">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🏆</span>
            </div>
            <h3 className="text-2xl font-bold mb-2">BRO League 4.0</h3>
            <p className="text-gray-300 mb-6">Fantasy Premier League Championship</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto mb-8">
              <div>
                <div className="text-xl font-bold text-yellow-400">15</div>
                <div className="text-sm text-gray-400">Participants</div>
              </div>
              <div>
                <div className="text-xl font-bold text-green-400">৳12,000</div>
                <div className="text-sm text-gray-400">Prize Pool</div>
              </div>
              <div>
                <div className="text-xl font-bold text-blue-400">38</div>
                <div className="text-sm text-gray-400">Gameweeks</div>
              </div>
              <div>
                <div className="text-xl font-bold text-purple-400">9</div>
                <div className="text-sm text-gray-400">Months</div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm">
                <span className="text-green-400">●</span>
                <span>Live FPL data powered by Vercel</span>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-gray-700 text-sm text-gray-400">
              <p>&copy; 2024 BRO League 4.0. Built with ❤️ for the bros.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;