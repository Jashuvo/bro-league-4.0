import React, { useEffect, useMemo, useState } from 'react';
import { Zap, AlertTriangle, XCircle, Radio } from 'lucide-react';
import Card from './ui/Card';
import { Ball, Coins } from './ui/Doodles';
import { cn } from '../utils/cn';
import fplApi from '../services/fplApi';
import { useLeaguePicks } from '../hooks/useLeaguePicks';

const TYPE_STYLE = {
  goals_scored: { icon: <Ball size={18} />, tint: 'bg-mint/35' },
  assists: { icon: <Zap size={16} className="text-sky-ink" />, tint: 'bg-sky/30' },
  bonus: { icon: <Coins size={18} />, tint: 'bg-sunflower/40' },
  own_goals: { icon: <AlertTriangle size={16} className="text-coral-ink" />, tint: 'bg-coral/25' },
  penalties_missed: { icon: <XCircle size={16} className="text-coral-ink" />, tint: 'bg-coral/25' },
  red_cards: { icon: <XCircle size={16} className="text-coral-ink" />, tint: 'bg-coral/30' },
};

// Goals, assists and bonus for the selected gameweek's live fixtures, each
// tagged with which of the league's managers own the player it happened to.
// Ownership reuses the SAME picks fetch CaptainWatch makes (fplApi caches
// per manager+gameweek), so this doesn't double the network cost of having
// both open at once.
const LiveTicker = ({ standings = [], gameweek, enabled = true, status = 'current' }) => {
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const { loading: loadingPicks, rows: picksRows } = useLeaguePicks(standings, gameweek, enabled, status);

  useEffect(() => {
    if (!enabled || !gameweek) {
      setEvents([]);
      setLoadingEvents(false);
      return undefined;
    }

    let cancelled = false;
    setLoadingEvents(true);
    // A finished gameweek's match events aren't going to change — cache
    // them for the rest of the week instead of re-fetching every visit.
    const ttlMinutes = status === 'completed' ? 60 * 24 * 7 : 2;

    fplApi.getGameweekEvents(gameweek, { ttlMinutes }).then((data) => {
      if (cancelled) return;
      setEvents(data?.events || []);
      setLoadingEvents(false);
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, gameweek, status]);

  const ownershipById = useMemo(() => {
    const map = {};
    picksRows.forEach((r) => {
      r.allPicks.forEach((p) => {
        if (!map[p.id]) map[p.id] = [];
        map[p.id].push({ managerName: r.managerName, isCaptain: p.isCaptain });
      });
    });
    return map;
  }, [picksRows]);

  const shownEvents = useMemo(
    () => events.filter((e) => e.type !== 'bonus' || e.finished).slice(0, 20),
    [events]
  );

  if (!enabled) return null;

  const loading = loadingEvents || loadingPicks;

  if (loading) {
    return (
      <Card>
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-surface-sunk rounded-2xl animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <h3 className="text-base font-display font-bold text-ink flex items-center gap-2">
        <Radio size={18} className="text-coral-ink" />
        Live feed — GW{gameweek}
      </h3>
      <p className="text-[13px] font-bold text-ink-soft mt-2 leading-relaxed">
        Goals, assists and bonus this gameweek, tagged with who in the league owns them.
      </p>

      {shownEvents.length === 0 ? (
        <p className="text-[13px] font-bold text-ink-soft mt-4">
          Nothing notable yet — check back once matches get going.
        </p>
      ) : (
        <div className="space-y-1.5 mt-3.5">
          {shownEvents.map((event, index) => {
            const style = TYPE_STYLE[event.type] || TYPE_STYLE.goals_scored;
            const owners = ownershipById[event.playerId] || [];

            return (
              <div
                key={`${event.fixtureId}-${event.type}-${event.playerId}-${index}`}
                className={cn('flex items-center gap-2.5 rounded-2xl px-2.5 py-2 min-w-0', style.tint)}
              >
                <span className="w-8 h-8 shrink-0 rounded-full bg-surface-alt border-2 border-ink/85 flex items-center justify-center">
                  {style.icon}
                </span>
                <span className="min-w-0 flex-grow">
                  <span className="block text-[13px] font-bold text-ink truncate">
                    {event.playerName}
                    {event.value > 1 && event.type !== 'bonus' ? ` ×${event.value}` : event.type === 'bonus' ? ` +${event.value}` : ''}
                    <span className="text-ink-soft font-bold"> · {event.team}</span>
                  </span>
                  <span className="block text-[11px] font-bold text-ink-soft truncate">
                    {event.label}
                    {owners.length > 0 && (
                      <>
                        {' '}· owned by{' '}
                        {owners.map((o, i) => (
                          <span key={o.managerName}>
                            {i > 0 && ', '}
                            {o.managerName}
                            {o.isCaptain && ' (C)'}
                          </span>
                        ))}
                      </>
                    )}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default LiveTicker;
