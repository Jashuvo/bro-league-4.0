import React, { useEffect, useState } from 'react';
import { Star, Gem } from 'lucide-react';
import Card from './ui/Card';
import { TrophyCup, Jersey } from './ui/Doodles';
import { cn } from '../utils/cn';
import fplApi from '../services/fplApi';

// Dusty fills, in the artboards' own order, for the captain-split bar and its
// legend chips.
const SPLIT_TINTS = ['bg-sunflower/60', 'bg-mint/55', 'bg-sky/55', 'bg-bubblegum/50', 'bg-tangerine/55'];

// Aggregates every manager's captain pick for a gameweek (and, as a side
// effect of already having every manager's 15 picks in hand, who owns the
// rare players nobody else does). Only fetches when `enabled` — there's no
// picks data to fetch for a gameweek that hasn't started yet.
const CaptainWatch = ({ standings = [], gameweek, enabled = true }) => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [differentials, setDifferentials] = useState([]);
  const [showAllDifferentials, setShowAllDifferentials] = useState(false);

  useEffect(() => {
    if (!enabled || !gameweek || standings.length === 0) {
      setLoading(false);
      setRows([]);
      setDifferentials([]);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    const load = async () => {
      const results = await Promise.all(
        standings.map(async (manager) => {
          const id = manager.id || manager.entry;
          const picks = await fplApi.getTeamPicks(id, gameweek);
          if (!picks || !picks.captain) return null;
          return {
            id,
            managerName: manager.managerName || manager.player_name,
            captain: picks.captain,
            allPicks: picks.picks || [],
          };
        })
      );

      if (cancelled) return;

      const valid = results.filter(Boolean);

      const leaderboard = [...valid].sort(
        (a, b) => (b.captain.points || 0) - (a.captain.points || 0)
      );
      setRows(leaderboard);

      // League-wide ownership across everyone's 15 picks — players only
      // one manager has this gameweek.
      const ownership = {};
      valid.forEach((r) => {
        r.allPicks.forEach((p) => {
          if (!ownership[p.id]) ownership[p.id] = { name: p.name, owners: [] };
          ownership[p.id].owners.push(r.managerName);
        });
      });

      const rare = Object.values(ownership)
        .filter((o) => o.owners.length === 1)
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, 8);
      setDifferentials(rare);

      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [enabled, gameweek, standings]);

  if (!enabled) return null;

  if (loading) {
    return (
      <Card>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 bg-surface-sunk rounded-2xl animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  if (rows.length === 0) return null;

  const captainCounts = {};
  rows.forEach((r) => {
    captainCounts[r.captain.name] = (captainCounts[r.captain.name] || 0) + 1;
  });

  // The full fifteen-row table this used to render was almost entirely
  // repetition: in a fifteen-man league the armband lands on two or three
  // players, so twelve of the rows said "Haaland — Popular" one after another.
  // What is actually worth reading is the SHAPE of the week — how the league
  // split — plus the one or two managers who went their own way, because those
  // are the picks that decide the ৳30. So: a tally, then the differentials.
  const tally = Object.entries(captainCounts)
    .map(([name, count]) => ({
      name,
      count,
      points: rows.find((r) => r.captain.name === name)?.captain.points ?? 0,
    }))
    .sort((a, b) => b.count - a.count || b.points - a.points);

  const differentialPicks = rows
    .filter((r) => captainCounts[r.captain.name] === 1)
    .sort((a, b) => (b.captain.points || 0) - (a.captain.points || 0));

  const topCaptain = tally[0];
  const shownDifferentials = showAllDifferentials ? differentials : differentials.slice(0, 4);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="p-5">
        <h3 className="text-base font-display font-bold text-ink flex items-center gap-2">
          <TrophyCup size={20} />
          Captain watch
        </h3>

        {topCaptain && (
          <p className="text-[13px] font-bold text-ink-soft leading-relaxed mt-2">
            {topCaptain.count} of {rows.length} gave the armband to{' '}
            <span className="text-ink">{topCaptain.name}</span>
            {tally[1] && (
              <>
                , {tally[1].count} to <span className="text-ink">{tally[1].name}</span>
              </>
            )}
            {tally.length > 2 && <> and {tally.length - 2} more went elsewhere</>}.
          </p>
        )}

        {/* The split, as one bar rather than fifteen rows. */}
        <div className="flex gap-1 mt-3.5 h-2.5 rounded-full overflow-hidden bg-surface-sunk">
          {tally.map((c, index) => (
            <span
              key={c.name}
              title={`${c.name} — ${c.count}`}
              className={cn('h-full', SPLIT_TINTS[index % SPLIT_TINTS.length])}
              style={{ width: `${(c.count / rows.length) * 100}%` }}
            />
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {tally.slice(0, 4).map((c, index) => (
            <span
              key={c.name}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold text-ink min-w-0',
                SPLIT_TINTS[index % SPLIT_TINTS.length]
              )}
            >
              <Star size={10} className="fill-ink/40 text-ink/40 shrink-0" />
              <span className="truncate">{c.name}</span>
              <span className="tabular-nums text-ink/60">×{c.count}</span>
              <span className="tabular-nums">{c.points}pts</span>
            </span>
          ))}
        </div>

        {differentialPicks.length > 0 && (
          <div className="mt-4 pt-3.5 border-t-2 border-dashed border-ink/12">
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-soft mb-2">
              Went against the grain
            </div>
            <div className="space-y-1.5">
              {differentialPicks.map((r) => (
                <div key={r.id} className="flex items-center gap-2.5 rounded-2xl bg-mint/25 px-2.5 py-2 min-w-0">
                  <Jersey size={26} tone="fill-mint" className="shrink-0" />
                  <span className="text-[13px] font-bold text-ink truncate flex-grow min-w-0">
                    {r.managerName}
                  </span>
                  <span className="text-[12px] font-bold text-ink-soft truncate max-w-[38%]">
                    {r.captain.name}
                  </span>
                  <span className="font-display font-bold text-ink tabular-nums shrink-0">
                    {r.captain.points}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {differentials.length > 0 && (
        <Card className="p-5">
          <h3 className="text-base font-display font-bold text-ink flex items-center gap-2">
            <Gem className="text-mint-ink" size={18} />
            League differentials
          </h3>
          <p className="text-[13px] font-bold text-ink-soft mt-2 leading-relaxed">
            {differentials.length} player{differentials.length === 1 ? '' : 's'} owned by exactly one
            manager this gameweek.
          </p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {shownDifferentials.map((d) => (
              <span
                key={d.name}
                className="text-[11px] bg-sky/30 text-ink rounded-full px-2.5 py-1 max-w-full truncate"
              >
                <span className="font-bold">{d.name}</span>
                <span className="text-ink-soft"> · {d.owners[0]}</span>
              </span>
            ))}
          </div>
          {differentials.length > 4 && (
            <button
              type="button"
              onClick={() => setShowAllDifferentials((open) => !open)}
              className="mt-3 text-[11px] font-bold uppercase tracking-[0.12em] text-violet-ink hover:text-ink"
            >
              {showAllDifferentials ? 'Show fewer' : `Show all ${differentials.length}`}
            </button>
          )}
        </Card>
      )}
    </div>
  );
};

export default CaptainWatch;
