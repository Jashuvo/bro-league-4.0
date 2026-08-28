import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import Card from './ui/Card';
import { cn } from '../utils/cn';
import fplApi from '../services/fplApi';

// Two independent fetches, four pill-chip cards — same grid/card/chip
// language as CaptainWatch's captain split and league differentials.
// Player PRICE movement is inherently FPL-wide (a price is a global
// number, so "risers/fallers" only makes sense season-wide — fetches once
// on mount, not per gameweek). Most-transferred-in/out is the opposite:
// only interesting scoped to THIS league's managers, not FPL's ~10M-manager
// pool, so it re-fetches whenever the selected gameweek changes. See
// api/price-watch.js and api/league-transfers.js for why each half lives
// where it does.
const PriceWatch = ({ gameweek }) => {
  const [priceData, setPriceData] = useState(null);
  const [transferData, setTransferData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fplApi.getPriceWatch().then((result) => {
      if (!cancelled) setPriceData(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!gameweek) return undefined;
    let cancelled = false;
    setLoading(true);
    fplApi.getLeagueTransfers(gameweek).then((result) => {
      if (cancelled) return;
      setTransferData(result);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [gameweek]);

  if (loading && !priceData) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <div className="h-14 bg-surface-sunk rounded-2xl animate-pulse" />
          </Card>
        ))}
      </div>
    );
  }

  const risers = priceData?.risers || [];
  const fallers = priceData?.fallers || [];
  const transfersIn = transferData?.transfersIn || [];
  const transfersOut = transferData?.transfersOut || [];

  if (risers.length === 0 && fallers.length === 0 && transfersIn.length === 0 && transfersOut.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {risers.length > 0 && (
        <PriceCard
          title="Price risers"
          icon={<TrendingUp size={18} className="text-mint-ink" />}
          subtitle="Today’s biggest price rises, league-wide."
          players={risers}
          tint="bg-mint/30"
          renderValue={(p) => `+${p.changeToday.toFixed(1)}`}
        />
      )}

      {fallers.length > 0 && (
        <PriceCard
          title="Price fallers"
          icon={<TrendingDown size={18} className="text-coral-ink" />}
          subtitle="Today’s biggest price drops, league-wide."
          players={fallers}
          tint="bg-coral/25"
          renderValue={(p) => p.changeToday.toFixed(1)}
        />
      )}

      {transfersIn.length > 0 && (
        <PriceCard
          title="Transferred in"
          icon={<ArrowUpCircle size={18} className="text-sky-ink" />}
          subtitle="Who your league brought in this gameweek."
          players={transfersIn}
          tint="bg-sky/30"
          renderValue={(p) => `+${p.count}`}
          renderTitle={(p) => `In by: ${p.managers.join(', ')}`}
        />
      )}

      {transfersOut.length > 0 && (
        <PriceCard
          title="Transferred out"
          icon={<ArrowDownCircle size={18} className="text-bubblegum-ink" />}
          subtitle="Who your league let go this gameweek."
          players={transfersOut}
          tint="bg-bubblegum/30"
          renderValue={(p) => `-${p.count}`}
          renderTitle={(p) => `Out by: ${p.managers.join(', ')}`}
        />
      )}
    </div>
  );
};

const PriceCard = ({ title, icon, subtitle, players, tint, renderValue, renderTitle }) => (
  <Card className="p-5">
    <h3 className="text-base font-display font-bold text-ink flex items-center gap-2">
      {icon}
      {title}
    </h3>
    <p className="text-[13px] font-bold text-ink-soft mt-2 leading-relaxed">{subtitle}</p>
    <div className="flex flex-wrap gap-1.5 mt-3">
      {players.map((p) => (
        <span
          key={p.id}
          title={renderTitle ? renderTitle(p) : undefined}
          className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold text-ink max-w-full truncate', tint)}
        >
          <span className="truncate">{p.name}</span>
          <span className="text-ink-soft shrink-0">· {p.team}</span>
          <span className="tabular-nums shrink-0">{renderValue(p)}</span>
        </span>
      ))}
    </div>
  </Card>
);

export default PriceWatch;
