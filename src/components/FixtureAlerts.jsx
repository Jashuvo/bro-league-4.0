import React, { useEffect, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import Card from './ui/Card';
import fplApi from '../services/fplApi';

// Blank and double gameweeks — the single most-planned-around thing in real
// FPL, and something this app has never surfaced: `/api/fixtures/` (the
// data source) wasn't called anywhere in this codebase before
// api/fixture-alerts.js. Silent when there's nothing upcoming to flag
// (normal for most of a season — blanks/doubles cluster around cup replay
// weeks, usually from around March on) rather than a permanently-empty card.
const FixtureAlerts = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fplApi.getFixtureAlerts().then((result) => {
      if (!cancelled) setData(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data) return null;

  const upcoming = (data.alerts || [])
    .filter((a) => !data.currentEvent || a.event >= data.currentEvent)
    .slice(0, 3);

  if (upcoming.length === 0) return null;

  return (
    <Card className="p-5" tone="violet">
      <h3 className="text-base font-display font-bold text-ink flex items-center gap-2">
        <CalendarClock size={18} className="text-violet-ink" />
        Blank &amp; double gameweeks ahead
      </h3>
      <div className="space-y-2 mt-3">
        {upcoming.map((alert) => (
          <div key={alert.event} className="rounded-2xl bg-surface-alt px-3 py-2.5">
            <div className="text-[13px] font-bold text-ink">Gameweek {alert.event}</div>
            {alert.doubles.length > 0 && (
              <div className="text-[12px] font-bold text-mint-ink mt-0.5">
                Double: {alert.doubles.join(', ')}
              </div>
            )}
            {alert.blanks.length > 0 && (
              <div className="text-[12px] font-bold text-coral-ink mt-0.5">
                Blank: {alert.blanks.join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};

export default FixtureAlerts;
