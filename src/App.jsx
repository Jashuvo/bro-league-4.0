import React, { useState, useEffect, useCallback } from 'react';
import fplApi from './services/fplApi';
import { ThemeProvider } from './context/ThemeContext';
import { ExclusionProvider, useExclusion } from './context/ExclusionContext';

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
  const { excludedTeamIds } = useExclusion();
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

  const filteredStandings = React.useMemo(() => {
    return standings.filter(manager => !excludedTeamIds.includes(Number(manager.id || manager.entry)));
  }, [standings, excludedTeamIds]);

  const filteredGameweekTable = React.useMemo(() => {
    return gameweekTable.map(gw => {
      const filteredManagers = gw.managers.filter(m => !excludedTeamIds.includes(Number(m.id || m.entry)));

      if (filteredManagers.length > 0) {
        const getNetPoints = (m) => {
          const rawPoints = m.points || 0;
          const transferCost = m.transferCost || m.event_transfers_cost || 0;
          return rawPoints - transferCost;
        };

        const sorted = [...filteredManagers].sort((a, b) => getNetPoints(b) - getNetPoints(a));

        return {
          ...gw,
          managers: filteredManagers,
          winner: sorted[0]?.name || sorted[0]?.managerName || 'N/A',
          highestScore: sorted[0]?.points || 0,
          averageScore: Math.round(
            filteredManagers.reduce((sum, m) => sum + (m.points || 0), 0) / filteredManagers.length
          )
        };
      }
      return { ...gw, managers: [] };
    });
  }, [gameweekTable, excludedTeamIds]);

  const filteredLeagueStats = React.useMemo(() => {
    if (filteredStandings.length === 0) return leagueStats;

    return {
      averageScore: Math.round(
        filteredStandings.reduce((sum, m) => sum + (m.totalPoints || m.total || 0), 0) / filteredStandings.length
      ),
      highestTotal: Math.max(...filteredStandings.map(m => m.totalPoints || m.total || 0), 0),
      lowestTotal: Math.min(...filteredStandings.map(m => m.totalPoints || m.total || 0), 0),
      averageGameweekScore: Math.round(
        filteredStandings.reduce((sum, m) => sum + (m.gameweekPoints || m.event_total || 0), 0) / filteredStandings.length
      ),
      highestGameweekScore: Math.max(...filteredStandings.map(m => m.gameweekPoints || m.event_total || 0), 0),
      totalChipsUsed: filteredStandings.reduce((sum, m) => sum + (m.chips?.length || 0), 0),
      averageTeamValue: Math.round(
        (filteredStandings.reduce((sum, m) => sum + (m.teamValue || 100), 0) / (filteredStandings.length || 1)) * 10
      ) / 10
    };
  }, [filteredStandings, leagueStats]);

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
        const currentGW = result.bootstrap.currentGameweek || 3;
        const currentGWData = result.bootstrap.gameweeks?.find(gw => gw.id === currentGW);
        setGameweekInfo({
          current: currentGW,
          total: result.bootstrap.totalGameweeks || 38,
          isFinished: currentGWData?.finished || false
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
            standings={filteredStandings}
            loading={loading}
            authStatus={authStatus}
            gameweekInfo={gameweekInfo}
            leagueStats={filteredLeagueStats}
            gameweekTable={filteredGameweekTable}
          />
        );
      case 'gameweek':
        return (
          <GameweekTable
            gameweekTable={filteredGameweekTable}
            currentGameweek={gameweekInfo.current}
            loading={loading}
            bootstrap={bootstrap}
          />
        );
      case 'monthly':
        return (
          <MonthlyPrizes
            gameweekTable={filteredGameweekTable}
            gameweekInfo={gameweekInfo}
            loading={loading}
          />
        );
      case 'prizes':
        return (
          <PrizeDistribution
            gameweekInfo={gameweekInfo}
            standings={filteredStandings}
            gameweekTable={filteredGameweekTable}
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
      standings={filteredStandings}
      bootstrap={bootstrap}
    >
      <CompactHero
        standings={filteredStandings}
        gameweekInfo={gameweekInfo}
        authStatus={authStatus}
        leagueStats={filteredLeagueStats}
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
      <ExclusionProvider>
        <AppContent />
      </ExclusionProvider>
    </ThemeProvider>
  );
}

export default App;