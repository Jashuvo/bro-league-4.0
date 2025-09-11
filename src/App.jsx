import React, { useState, useEffect, useCallback, useMemo } from 'react';
import fplApi from './services/fplApi';

import Header from './components/Header';
import Hero from './components/Hero';
import LeagueTable from './components/LeagueTable';
import GameweekTable from './components/GameweekTable';
import MonthlyPrizes from './components/MonthlyPrizes';
import WeeklyPrizes from './components/WeeklyPrizes';
import Footer from './components/Footer';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';

function App() {
  const [standings, setStandings] = useState([]);
  const [gameweekInfo, setGameweekInfo] = useState({ current: 3, total: 38 });
  const [gameweekTable, setGameweekTable] = useState([]);
  const [leagueStats, setLeagueStats] = useState({});
  const [bootstrap, setBootstrap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('standings');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [authStatus, setAuthStatus] = useState({ authenticated: false, message: '' });
  const [lastUpdated, setLastUpdated] = useState(null);
  const [performanceInfo, setPerformanceInfo] = useState(null);

  const tabs = [
    { id: 'standings', name: 'League Table', icon: '🏆', shortName: 'Table' },
    { id: 'gameweek', name: 'Gameweek', icon: '📊', shortName: 'GW' },
    { id: 'monthly', name: 'Monthly Prizes', icon: '💰', shortName: 'Monthly' },
    { id: 'weekly', name: 'Weekly Prizes', icon: '🎯', shortName: 'Weekly' }
  ];

  const loadData = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }
    
    setError(null);
    const startTime = performance.now();

    try {
      const result = forceRefresh 
        ? await fplApi.forceRefresh()
        : await fplApi.initializeWithAuth();
      
      const loadTime = Math.round(performance.now() - startTime);
      
      setAuthStatus({
        authenticated: result.authenticated,
        message: result.authenticated 
          ? 'Live FPL data loaded successfully'
          : 'Using cached data'
      });

      if (result.standings && result.standings.length > 0) {
        setStandings(result.standings);
      }
      
      if (result.bootstrap) {
        setBootstrap(result.bootstrap);
        setGameweekInfo({
          current: result.bootstrap.currentGameweek || 3,
          total: result.bootstrap.totalGameweeks || 38
        });
      }
      
      if (result.gameweekTable) {
        setGameweekTable(result.gameweekTable);
      }
      
      if (result.leagueStats) {
        setLeagueStats(result.leagueStats);
      }

      setPerformanceInfo({ loadTime, fromCache: result.fromCache });
      setLastUpdated(new Date());

    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data. Please try again.');
      setAuthStatus({
        authenticated: false,
        message: 'Connection failed'
      });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    loadData(true);
  };

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'standings':
        return (
          <LeagueTable 
            standings={standings}
            loading={loading}
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
            currentGameweek={gameweekInfo.current}
            loading={loading}
            bootstrap={bootstrap}
          />
        );
      case 'monthly':
        return (
          <MonthlyPrizes
            gameweekTable={gameweekTable}
            gameweekInfo={gameweekInfo}
            loading={loading}
          />
        );
      case 'weekly':
        return (
          <WeeklyPrizes
            gameweekTable={gameweekTable}
            gameweekInfo={gameweekInfo}
            loading={loading}
          />
        );
      default:
        return null;
    }
  };

  if (loading && standings.length === 0) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header 
        onRefresh={handleRefresh}
        authStatus={authStatus}
        loading={isRefreshing}
        performanceInfo={performanceInfo}
      />
      
      <Hero 
        standings={standings}
        gameweekInfo={gameweekInfo}
        authStatus={authStatus}
        leagueStats={leagueStats}
        bootstrap={bootstrap}
      />

      <div className="container mx-auto px-4 pb-20">
        {/* Mobile Tab Navigation */}
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 -mx-4 px-4 py-3 mb-6">
          <div className="flex space-x-1 bg-gray-100 rounded-xl p-1 relative overflow-hidden">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`
                  flex-1 px-3 py-2 text-sm font-medium rounded-lg
                  transition-all duration-300 ease-out
                  ${activeTab === tab.id 
                    ? 'bg-white text-purple-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                  }
                  active:scale-95 select-none
                `}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span className="text-base">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.name}</span>
                  <span className="sm:hidden">{tab.shortName}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="animate-fade-in-up">
          {error && (
            <ErrorMessage 
              message={error} 
              onRetry={() => loadData(true)} 
            />
          )}
          {renderTabContent()}
        </div>
      </div>

      <Footer 
        gameweekInfo={gameweekInfo}
        standings={standings}
        authStatus={authStatus}
        bootstrap={bootstrap}
      />
    </div>
  );
}

export default App;