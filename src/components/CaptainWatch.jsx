import React, { useEffect, useState } from 'react';
import { Star, Gem } from 'lucide-react';
import Card from './ui/Card';
import Badge from './ui/Badge';
import { TrophyCup, Jersey } from './ui/Doodles';
import fplApi from '../services/fplApi';

// Aggregates every manager's captain pick for a gameweek (and, as a side
// effect of already having every manager's 15 picks in hand, who owns the
// rare players nobody else does). Only fetches when `enabled` — there's no
// picks data to fetch for a gameweek that hasn't started yet.
const CaptainWatch = ({ standings = [], gameweek, enabled = true }) => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [differentials, setDifferentials] = useState([]);

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
  const mostPopularCaptain = Object.entries(captainCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="text-lg font-display font-bold text-ink flex items-center gap-2 mb-4">
          <TrophyCup size={22} />
          Captain Watch — GW {gameweek}
        </h3>
        <div className="space-y-2">
          {rows.map((r, index) => {
            const isDifferentialCaptain = captainCounts[r.captain.name] === 1;
            return (
              <div
                key={r.id}
                className={`flex items-center gap-3 p-3 rounded-2xl border-2 ${index === 0 ? 'bg-sunflower/25 border-ink/85' : 'bg-surface-sunk border-ink/15'
                  }`}
              >
                <Jersey
                  size={32}
                  number={index + 1}
                  tone={index === 0 ? 'fill-sunflower' : 'fill-surface-alt'}
                  className="flex-shrink-0"
                />
                <div className="flex-grow min-w-0">
                  <div className="font-bold text-ink text-sm truncate">{r.managerName}</div>
                  <div className="text-xs font-medium text-ink-soft truncate flex items-center gap-1.5">
                    <Star size={10} className="text-sunflower fill-sunflower flex-shrink-0" />
                    <span className="truncate">{r.captain.name}</span>
                    {isDifferentialCaptain ? (
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0 flex-shrink-0">Differential</Badge>
                    ) : r.captain.name === mostPopularCaptain ? (
                      <Badge variant="primary" className="text-[9px] px-1.5 py-0 flex-shrink-0">Popular</Badge>
                    ) : null}
                  </div>
                </div>
                <div className="text-lg font-display font-bold text-violet flex-shrink-0">{r.captain.points}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {differentials.length > 0 && (
        <Card>
          <h3 className="text-lg font-display font-bold text-ink flex items-center gap-2 mb-4">
            <Gem className="text-mint" size={20} />
            League Differentials
          </h3>
          <p className="text-xs font-semibold text-ink-soft mb-3">Players only one manager in the league owns this gameweek</p>
          <div className="flex flex-wrap gap-2">
            {differentials.map((d) => (
              <span
                key={d.name}
                className="text-xs bg-mint/20 text-ink border-2 border-ink/85 rounded-full px-3 py-1"
              >
                <span className="font-bold">{d.name}</span>
                <span className="text-ink-soft"> · {d.owners[0]}</span>
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default CaptainWatch;
