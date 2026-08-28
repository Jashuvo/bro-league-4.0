import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Coins as CoinsIcon } from 'lucide-react';
import Card from './ui/Card';
import { cn } from '../utils/cn';
import fplApi from '../services/fplApi';

// Player price movement — season-wide, not tied to whichever gameweek is
// selected, so this fetches once on mount rather than re-running per
// gameweek. `cost_change_event`/`cost_change_start` have sat on every
// bootstrap-static element the whole time; nothing in this codebase had
// ever read them before api/price-watch.js.
const PriceWatch = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fplApi.getPriceWatch().then((result) => {
      if (cancelled) return;
      setData(result);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <Card>
        <div className="h-24 bg-surface-sunk rounded-2xl animate-pulse" />
      </Card>
    );
  }

  const risers = data?.risers || [];
  const fallers = data?.fallers || [];

  if (risers.length === 0 && fallers.length === 0) {
    return null;
  }

  return (
    <Card className="p-5">
      <h3 className="text-base font-display font-bold text-ink flex items-center gap-2">
        <CoinsIcon size={18} className="text-sunflower-ink" />
        Price watch
      </h3>
      <p className="text-[13px] font-bold text-ink-soft mt-2 leading-relaxed">
        Today&rsquo;s player price movers — see if anyone in your squad just got a pay rise.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3.5">
        {risers.length > 0 && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-mint-ink mb-1.5 flex items-center gap-1">
              <TrendingUp size={12} /> Risers
            </div>
            <div className="space-y-1">
              {risers.map((p) => (
                <PriceRow key={p.id} player={p} tint="bg-mint/25" ink="text-mint-ink" />
              ))}
            </div>
          </div>
        )}

        {fallers.length > 0 && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-coral-ink mb-1.5 flex items-center gap-1">
              <TrendingDown size={12} /> Fallers
            </div>
            <div className="space-y-1">
              {fallers.map((p) => (
                <PriceRow key={p.id} player={p} tint="bg-coral/20" ink="text-coral-ink" />
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

const PriceRow = ({ player, tint, ink }) => (
  <div className={cn('flex items-center gap-2 rounded-xl px-2.5 py-1.5 min-w-0', tint)}>
    <span className="text-[12.5px] font-bold text-ink truncate flex-grow min-w-0">
      {player.name} <span className="text-ink-soft">· {player.team}</span>
    </span>
    <span className={cn('text-[12.5px] font-display font-bold tabular-nums shrink-0', ink)}>
      {player.changeToday > 0 ? '+' : ''}{player.changeToday.toFixed(1)}
    </span>
  </div>
);

export default PriceWatch;
