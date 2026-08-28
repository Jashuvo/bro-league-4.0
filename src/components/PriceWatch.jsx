import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Coins as CoinsIcon, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
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
  const transfersIn = data?.transfersIn || [];
  const transfersOut = data?.transfersOut || [];

  if (risers.length === 0 && fallers.length === 0 && transfersIn.length === 0 && transfersOut.length === 0) {
    return null;
  }

  return (
    <Card className="p-5">
      <h3 className="text-base font-display font-bold text-ink flex items-center gap-2">
        <CoinsIcon size={18} className="text-sunflower-ink" />
        Price &amp; transfer watch
      </h3>
      <p className="text-[13px] font-bold text-ink-soft mt-2 leading-relaxed">
        Today&rsquo;s price movers and this gameweek&rsquo;s most-transferred players, league-wide.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3.5">
        {risers.length > 0 && (
          <PriceColumn
            label="Risers"
            icon={<TrendingUp size={12} />}
            players={risers}
            tint="bg-mint/25"
            ink="text-mint-ink"
            renderValue={(p) => `${p.changeToday > 0 ? '+' : ''}${p.changeToday.toFixed(1)}`}
          />
        )}

        {fallers.length > 0 && (
          <PriceColumn
            label="Fallers"
            icon={<TrendingDown size={12} />}
            players={fallers}
            tint="bg-coral/20"
            ink="text-coral-ink"
            renderValue={(p) => p.changeToday.toFixed(1)}
          />
        )}

        {transfersIn.length > 0 && (
          <PriceColumn
            label="Most transferred in"
            icon={<ArrowUpCircle size={12} />}
            players={transfersIn}
            tint="bg-sky/25"
            ink="text-sky-ink"
            renderValue={(p) => `+${p.count.toLocaleString()}`}
          />
        )}

        {transfersOut.length > 0 && (
          <PriceColumn
            label="Most transferred out"
            icon={<ArrowDownCircle size={12} />}
            players={transfersOut}
            tint="bg-bubblegum/25"
            ink="text-bubblegum-ink"
            renderValue={(p) => `-${p.count.toLocaleString()}`}
          />
        )}
      </div>
    </Card>
  );
};

const PriceColumn = ({ label, icon, players, tint, ink, renderValue }) => (
  <div>
    <div className={cn('text-[10px] font-bold uppercase tracking-[0.14em] mb-1.5 flex items-center gap-1', ink)}>
      {icon} {label}
    </div>
    <div className="space-y-1">
      {players.map((p) => (
        <div key={p.id} className={cn('flex items-center gap-2 rounded-xl px-2.5 py-1.5 min-w-0', tint)}>
          <span className="text-[12.5px] font-bold text-ink truncate flex-grow min-w-0">
            {p.name} <span className="text-ink-soft">· {p.team}</span>
          </span>
          <span className={cn('text-[12.5px] font-display font-bold tabular-nums shrink-0', ink)}>
            {renderValue(p)}
          </span>
        </div>
      ))}
    </div>
  </div>
);

export default PriceWatch;
