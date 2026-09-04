import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import fplApi from './services/fplApi';
import { ThemeProvider } from './context/ThemeContext';
import { ExclusionProvider, useExclusion } from './context/ExclusionContext';

import Layout from './components/Layout';
import CommandBar from './components/CommandBar';
import LeagueTable from './components/LeagueTable';
import GameweekTable from './components/GameweekTable';
import FixturesView from './components/FixturesView';
import PrizesHub from './components/PrizesHub';
import MoreHub from './components/MoreHub';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import PWAUpdate from './components/PWAUpdate';
import SeasonArchiveSheet from './components/SeasonArchiveSheet';

function AppContent() {
  const { excludedTeamIds } = useExclusion();
  const [standings, setStandings] = useState([]);
  const [gameweekInfo, setGameweekInfo] = useState({ current: 1, total: 38 });
  const [gameweekTable, setGameweekTable] = useState([]);
  const [leagueStats, setLeagueStats] = useState({});
  const [bootstrap, setBootstrap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('standings');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [authStatus, setAuthStatus] = useState({ authenticated: false, message: '' });
  const [lastUpdated, setLastUpdated] = useState(null);
  // This season's permanent archive (see SUPABASE_ARCHIVE_PLAN.md) —
  // fetched once, independent of loadData/initializeWithAuth entirely: it
  // never touches standings/gameweekTable/leagueStats, and an empty result
  // (nothing archived yet, or Supabase not configured) is a normal, silent
  // state. Surfaced via the season badge in CommandBar — see
  // showSeasonArchive below.
  const [seasonArchive, setSeasonArchive] = useState([]);
  const [showSeasonArchive, setShowSeasonArchive] = useState(false);
  // Load timing is logged rather than held in state: the old CompactHero was
  // the only thing that ever rendered it, and the CommandBar that replaced it
  // shows the live/offline pill and last-sync time instead.
  const [, setPerformanceInfo] = useState(null);

  // The app has four destinations, defined once in AppNav.DESTINATIONS (which
  // both the desktop sidebar and the mobile bottom bar render from). `activeTab`
  // holds one of those ids; the seven-entry tab array that used to live here is
  // gone — Monthly Prizes + Prize Distribution now sit behind `prizes`, and Chip
  // Tracker + Head-to-Head + Season Awards behind `more`.

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

  // `silent` is for the background poll below — a scheduled refresh
  // shouldn't flash every component's loading skeleton every 60 seconds
  // (several of them, e.g. GameweekTable, key their skeleton off `loading`
  // alone with no "already have data" guard). It still updates state once
  // the fetch resolves; it just doesn't touch `loading`/`isRefreshing` to
  // get there.
  const loadData = useCallback(async (forceRefresh = false, { silent = false } = {}) => {
    if (!silent) {
      if (!forceRefresh) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
    }

    setError(null);
    const startTime = performance.now();

    try {
      const result = forceRefresh
        ? await fplApi.forceRefresh()
        : await fplApi.initializeWithAuth();

      const loadTime = Math.round(performance.now() - startTime);

      // A failed fetch resolves here too — fplApi falls back internally
      // rather than throwing — with `authenticated: false` and empty/
      // default data (bootstrap.currentGameweek pinned to 1, gameweekTable:
      // [], leagueStats: {}, all of which are truthy and would otherwise
      // sail straight past the `if (result.x)` checks below and overwrite
      // a perfectly good screen with a blank one). Only apply the payload
      // when it's actually live data. A SILENT background poll additionally
      // leaves the status pill alone on that path too — same reasoning as
      // the catch block further down: one 60-second tick failing shouldn't
      // flip "Live data" to "Offline" out from under data that's still
      // sitting there correctly; let the next successful tick speak for
      // itself, same as if this one had been skipped entirely.
      if (!silent || result.authenticated) {
        setAuthStatus({
          authenticated: result.authenticated,
          message: result.authenticated
            ? 'Live FPL data loaded successfully'
            : 'Using cached data'
        });
      }

      if (result.authenticated) {
        if (result.standings && result.standings.length > 0) {
          setStandings(result.standings);
        }

        if (result.bootstrap) {
          setBootstrap(result.bootstrap);
          const currentGW = result.bootstrap.currentGameweek || 1;
          const currentGWData = result.bootstrap.gameweeks?.find(gw => gw.id === currentGW);
          // Merge with, rather than replace, any `isFinished: true` the
          // fixtures-polling effect below already established for this
          // same gameweek — otherwise every refresh here would stomp that
          // correction back to false until FPL's own flag catches up.
          setGameweekInfo((prev) => ({
            current: currentGW,
            total: result.bootstrap.totalGameweeks || 38,
            isFinished: !!(currentGWData?.finished || (prev.current === currentGW && prev.isFinished))
          }));
        }

        if (result.gameweekTable) {
          setGameweekTable(result.gameweekTable);
        }

        if (result.leagueStats) {
          setLeagueStats(result.leagueStats);
        }

        setLastUpdated(new Date());
      }

      setPerformanceInfo({ loadTime, fromCache: result.fromCache });

    } catch (error) {
      console.error('Error loading data:', error);
      // A silent background poll failing shouldn't put a scary red error
      // banner over the page the user is currently looking at — whatever
      // data is already on screen just stays as it is until the next poll,
      // same as it would if this tick had been skipped entirely.
      if (!silent) {
        setError('Failed to load data. Please try again.');
        setAuthStatus({
          authenticated: false,
          message: 'Connection failed'
        });
      }
    } finally {
      if (!silent) {
        setLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    fplApi.getSeasonArchive().then(setSeasonArchive);
  }, []);

  // `gameweekInfo.isFinished` above comes straight from FPL's own event
  // `finished` flag, which only flips once bonus points are officially
  // locked in — that can lag the actual final whistle by hours (see the
  // same reasoning in FixturesView.jsx). Left alone, that pins every
  // "finished" badge in the app (League Table, Gameweeks tab) on "in
  // progress" long after every match has plainly ended. Fixtures already
  // expose `finishedProvisional`, which flips the moment every match in
  // the gameweek actually ends — poll that here (same 60s cadence as the
  // rest of the app's live polling) and let it correct the flag locally.
  // Self-terminating: once `isFinished` flips true this effect's own
  // condition tears its interval down.
  useEffect(() => {
    if (!gameweekInfo.current || gameweekInfo.isFinished) return undefined;

    let cancelled = false;
    const check = () => {
      fplApi.getFixtures(gameweekInfo.current).then((data) => {
        if (!cancelled && data?.finishedProvisional) {
          setGameweekInfo((prev) =>
            prev.current === gameweekInfo.current ? { ...prev, isFinished: true } : prev
          );
        }
      });
    };

    check();
    const interval = setInterval(check, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [gameweekInfo.current, gameweekInfo.isFinished]);

  // FPL's own site keeps overall rank, live points and bonus moving on
  // their own; this app only ever fetched once on load and then sat there
  // until someone hit "Refresh". Poll quietly in the background instead —
  // every 60s while the tab is actually visible (no point spending a
  // request on a backgrounded tab nobody's looking at), and once more the
  // moment it becomes visible again in case it sat hidden through a few
  // ticks. `initializeWithAuth`'s own 2-minute cache means most of these
  // calls resolve from cache anyway; this just makes sure one keeps
  // getting through often enough that the page never goes stale for long.
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === 'visible') {
        loadData(false, { silent: true });
      }
    };

    const interval = setInterval(tick, 60000);
    document.addEventListener('visibilitychange', tick);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', tick);
    };
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
      case 'gameweeks':
        return (
          <GameweekTable
            gameweekTable={filteredGameweekTable}
            currentGameweek={gameweekInfo.current}
            currentGameweekFinished={gameweekInfo.isFinished}
            loading={loading}
            bootstrap={bootstrap}
            standings={filteredStandings}
          />
        );
      case 'fixtures':
        return (
          <FixturesView
            gameweekInfo={gameweekInfo}
            bootstrap={bootstrap}
          />
        );
      case 'prizes':
        return (
          <PrizesHub
            gameweekTable={filteredGameweekTable}
            standings={filteredStandings}
            gameweekInfo={gameweekInfo}
            loading={loading}
          />
        );
      case 'more':
        return (
          <MoreHub
            standings={filteredStandings}
            gameweekTable={filteredGameweekTable}
            loading={loading}
          />
        );
      default:
        return null;
    }
  };

  if (loading && standings.length === 0) {
    return (
      <>
        <PWAUpdate authenticated={authStatus.authenticated} />
        <LoadingSpinner fullScreen />
      </>
    );
  }

  return (
    <>
      <PWAUpdate authenticated={authStatus.authenticated} />
      <Layout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        authStatus={authStatus}
        lastUpdated={lastUpdated}
        gameweekInfo={gameweekInfo}
        standings={filteredStandings}
        bootstrap={bootstrap}
        leagueStats={leagueStats}
      >
        {/* One condensed strip above whichever destination is showing, in
            place of the full-height hero that every tab used to sit below. */}
        <CommandBar
          activeTab={activeTab}
          standings={filteredStandings}
          gameweekInfo={gameweekInfo}
          authStatus={authStatus}
          bootstrap={bootstrap}
          leagueStats={filteredLeagueStats}
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
          onOpenSeasonArchive={() => setShowSeasonArchive(true)}
        />

        <div className="max-w-[1500px] mx-auto px-4 lg:px-6 pt-5 pb-28 lg:pb-14">
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
      </Layout>

      <AnimatePresence>
        {showSeasonArchive && (
          <SeasonArchiveSheet
            open={showSeasonArchive}
            onClose={() => setShowSeasonArchive(false)}
            seasonArchive={seasonArchive}
          />
        )}
      </AnimatePresence>
    </>
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