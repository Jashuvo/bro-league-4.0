import React, { useMemo } from 'react';
import { Medal } from 'lucide-react';
import Card from './ui/Card';
import { useLeaguePicks } from '../hooks/useLeaguePicks';

// LIVE bonus-point race, aggregated across every manager's picks for the
// gameweek being viewed. FPL awards the 1/2/3 bonus points to whoever tops
// the BPS (bonus points system) tally in each match — the per-player `bps`
// figure already rides through api/team-picks.js's live stats, and
// useLeaguePicks fans out to every manager's picks (cached, so this card
// and CaptainWatch share one fetch per manager), so this is a pure
// frontend aggregation: no new endpoint, no new fetching beyond what the
// captain board was already paying for.
//
// Only rendered while the gameweek is in progress (`enabled`/`status`) —
// once the gameweek finishes, bonus points are locked in and the settled
// `bonus` field everywhere else tells the story.
const BonusWatch = ({ standings = [], gameweek, enabled = true, status = 'current' }) => {
  const { loading, rows: picksRows } = useLeaguePicks(standings, gameweek, enabled, status);

  const race = useMemo(() => {
    const byPlayer = new Map();
    picksRows.forEach((r) => {
      r.allPicks.forEach((p) => {
        const bps = p.bps || 0;
        if (bps <= 0) return;
        const existing = byPlayer.get(p.id);
        if (existing) {
          existing.owners += 1;
          return;
        }
        byPlayer.set(p.id, {
          id: p.id,
          name: p.name,
          team: p.team,
          bps,
          minutes: p.minutes || 0,
          owners: 1
        });
      });
    });

    // Highest BPS first; played > not-yet-played breaks ties (a player on
    // the pitch can only add to their tally, one yet to kick off can't).
    return [...byPlayer.values()]
      .sort((a, b) =>
        b.bps - a.bps ||
        (b.minutes > 0 ? 1 : 0) - (a.minutes > 0 ? 1 : 0) ||
        a.name.localeCompare(b.name)
      )
      .slice(0, 6);
  }, [picksRows]);

  // A race with nobody on the board (matches haven't kicked off, or live
  // stats haven't landed) renders nothing rather than an empty shell.
  if (!enabled || (!loading && race.length === 0)) return null;

  return (
    <Card className="p-5" tone="sky">
      <h3 className="text-base font-display font-bold text-ink flex items-center gap-2">
        <Medal size={18} className="text-sky-ink" />
        Bonus race
      </h3>
      <p className="text-[13px] font-bold text-ink-soft mt-2 leading-relaxed">
        Live BPS — FPL hands the 3 bonus points to whoever tops this table in each match.
      </p>
      {loading && race.length === 0 ? (
        <div className="mt-3 space-y-2" aria-busy="true">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-8 rounded-xl bg-surface-sunk animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {race.map((p, index) => (
            <div
              key={p.id}
              title={`${p.name} (${p.team}) — ${p.bps} BPS, ${p.owners} owner${p.owners === 1 ? '' : 's'} in the league`}
              className="flex items-center gap-2 bg-surface-alt rounded-xl px-2.5 py-1.5 min-w-0"
            >
              <span className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[10px] font-display font-bold border-2 ${
                index === 0 ? 'bg-sunflower border-ink/85 text-ink' : 'bg-surface-sunk border-ink/15 text-ink-soft'
              }`}>
                {index + 1}
              </span>
              <span className="min-w-0 flex-grow truncate text-[12px] font-bold text-ink">
                {p.name}
                <span className="text-ink-soft font-semibold"> · {p.team}</span>
              </span>
              <span className="text-[12px] font-bold text-ink-soft shrink-0">
                {p.owners > 1 ? `${p.owners}×` : ''}
              </span>
              <span className="shrink-0 text-sm font-display font-bold text-pitch-ink tabular-nums">
                {p.bps}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default BonusWatch;