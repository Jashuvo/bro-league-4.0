import React from 'react';
import FixtureAlerts from './FixtureAlerts';
import WeeklyStory from './WeeklyStory';
import LiveTicker from './LiveTicker';
import CaptainWatch from './CaptainWatch';
import PriceWatch from './PriceWatch';
import TransferLeaderboard from './TransferLeaderboard';

// Everything "worth reading beyond the leaderboard" for one gameweek, in one
// place — this week's story, the live goal feed, the captain split (plus
// regret and Dream Team watch), player price movers, blank/double gameweek
// alerts, and the transfer-hits board. Used twice: folded inside
// GameweekTable's "Insights" accordion, and again — unfolded — inside the
// mobile Insights sheet (InsightsFAB), so both stay in sync for free instead
// of drifting apart as two copies of the same markup.
const InsightsPanel = ({ gameweekTable = [], gameweek, standings = [], status = 'current' }) => {
  const picksEnabled = status === 'current' || status === 'completed';

  return (
    <div className="space-y-3">
      <FixtureAlerts />
      <WeeklyStory gameweekTable={gameweekTable} gameweek={gameweek} />
      <LiveTicker standings={standings} gameweek={gameweek} enabled={picksEnabled} status={status} />
      <CaptainWatch standings={standings} gameweek={gameweek} enabled={picksEnabled} status={status} />
      <PriceWatch />
      <TransferLeaderboard gameweekTable={gameweekTable} />
    </div>
  );
};

export default InsightsPanel;
