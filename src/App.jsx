import React, { useState, useEffect, useCallback } from 'react';
import fplApi from './services/fplApi';
import { ThemeProvider } from './context/ThemeContext';

import Layout from './components/Layout';
import CompactHero from './components/CompactHero';
import TabNavigation from './components/TabNavigation';
import LeagueTable from './components/LeagueTable';
import GameweekTable from './components/GameweekTable';
import MonthlyPrizes from './components/MonthlyPrizes';
import PrizeDistribution from './components/PrizeDistribution';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';

function AppContent() {
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
    { id: 'gameweek', name: 'Weekly Results', icon: '⚡', shortName: 'Results' },
    { id: 'monthly', name: 'Monthly Prizes', icon: '📅', shortName: 'Monthly' },
    { id: 'prizes', name: 'Prize Distribution', icon: '💰', shortName: 'Prizes' }
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
      case 'prizes':
        return (
          <PrizeDistribution
            gameweekInfo={gameweekInfo}
            standings={standings}
            gameweekTable={gameweekTable}
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
    <Layout
      authStatus={authStatus}
      isRefreshing={isRefreshing}
      onRefresh={handleRefresh}
      performanceInfo={performanceInfo}
      lastUpdated={lastUpdated}
      gameweekInfo={gameweekInfo}
      standings={standings}
      bootstrap={bootstrap}
    >
      <CompactHero
        standings={standings}
        gameweekInfo={gameweekInfo}
        authStatus={authStatus}
        leagueStats={leagueStats}
        bootstrap={bootstrap}
      />

      <div className="container mx-auto px-4 pb-20">
        <TabNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <div className="mt-6">
          {error && (
            <ErrorMessage
              message={error}
              onRetry={() => loadData(true)}
            />
          )}
          <div className="animate-fade-in">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;