import React, { useMemo, useState } from 'react';
import { Star, Gem, Frown, Sparkles } from 'lucide-react';
import Card from './ui/Card';
import { TrophyCup, Jersey } from './ui/Doodles';
import { cn } from '../utils/cn';
import { useLeaguePicks } from '../hooks/useLeaguePicks';

// Dusty fills, in the artboards' own order, for the captain-split bar and its
// legend chips.
const SPLIT_TINTS = ['bg-sunflower/60', 'bg-mint/55', 'bg-sky/55', 'bg-bubblegum/50', 'bg-tangerine/55'];

// A 1-point captain regret or a single Dream Team pick is completely normal
// in an 18-manager league — the popular players show up everywhere. Below
// these, the section is more noise than signal, so it doesn't qualify at
// all rather than padding out a "show all" list nobody asked to expand.
const MIN_REGRET_DELTA = 3;
const MIN_DREAM_TEAM_PLAYERS = 2;

// Aggregates every manager's captain pick for a gameweek (and, as a side
// effect of already having every manager's 15 picks in hand: who owns the
// rare players nobody else does, who'd have been better off captaining
// someone else, and who has the most players in FPL's official Team of the
// Week). Only fetches when `enabled` — there's no picks data to fetch for a
// gameweek that hasn't started yet.
const CaptainWatch = ({ standings = [], gameweek, enabled = true, status = 'current' }) => {
  const { loading, rows: picksRows } = useLeaguePicks(standings, gameweek, enabled, status);
  const [showAllDifferentials, setShowAllDifferentials] = useState(false);
  const [showAllRegrets, setShowAllRegrets] = useState(false);
  const [showAllDreamTeam, setShowAllDreamTeam] = useState(false);

  const { rows, differentials, regrets, dreamTeamManagers } = useMemo(() => {
    const valid = picksRows.filter((r) => r.captain);

    const leaderboard = [...valid].sort((a, b) => (b.captain.points || 0) - (a.captain.points || 0));

    // League-wide ownership across everyone's 15 picks — players only one
    // manager has this gameweek.
    const ownership = {};
    valid.forEach((r) => {
      r.allPicks.forEach((p) => {
        if (!ownership[p.id]) ownership[p.id] = { name: p.name, owners: [] };
        ownership[p.id].owners.push(r.managerName);
      });
    });
    const rarePlayers = Object.values(ownership)
      .filter((o) => o.owners.length === 1)
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 8);

    // Captain regret: the highest RAW scorer in a manager's own squad,
    // compared against what the armband actually returned. Only counts if
    // someone else in the squad would genuinely have out-scored the
    // captain's raw total — a captain who was already the best pick has
    // nothing to regret.
    const regretList = valid
      .map((r) => {
        const bestPick = [...r.allPicks].sort((a, b) => (b.eventPoints || 0) - (a.eventPoints || 0))[0];
        if (!bestPick || bestPick.id === r.captain.id) return null;
        if ((bestPick.eventPoints || 0) <= (r.captain.eventPoints || 0)) return null;
        const wouldHave = (bestPick.eventPoints || 0) * (r.captain.multiplier || 1);
        const delta = wouldHave - (r.captain.points || 0);
        if (delta < MIN_REGRET_DELTA) return null;
        return { id: r.id, managerName: r.managerName, captain: r.captain, bestPick, wouldHave, delta };
      })
      .filter(Boolean)
      .sort((a, b) => b.delta - a.delta)
      .slice(0, 5);

    // Dream Team watch: how many of each manager's 15 made FPL's official
    // Team of the Week for this gameweek (`inDreamTeam`, surfaced in
    // api/team-picks.js from the live stats already fetched there).
    const dreamTeamList = valid
      .map((r) => ({
        id: r.id,
        managerName: r.managerName,
        players: r.allPicks.filter((p) => p.inDreamTeam),
      }))
      .filter((r) => r.players.length >= MIN_DREAM_TEAM_PLAYERS)
      .sort((a, b) => b.players.length - a.players.length);

    return { rows: leaderboard, differentials: rarePlayers, regrets: regretList, dreamTeamManagers: dreamTeamList };
  }, [picksRows]);

  if (!enabled) return null;

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <div className="space-y-3">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="h-14 bg-surface-sunk rounded-2xl animate-pulse" />
              ))}
            </div>
          </Card>
        ))}
      </div>
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
  const shownRegrets = showAllRegrets ? regrets : regrets.slice(0, 4);
  const shownDreamTeam = showAllDreamTeam ? dreamTeamManagers : dreamTeamManagers.slice(0, 4);

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

      {regrets.length > 0 && (
        <Card className="p-5" tone="coral">
          <h3 className="text-base font-display font-bold text-ink flex items-center gap-2">
            <Frown size={18} className="text-coral-ink" />
            Captain regret
          </h3>
          <p className="text-[13px] font-bold text-ink-soft mt-2 leading-relaxed">
            Someone else in the squad would&rsquo;ve worn the armband better.
          </p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {shownRegrets.map((r) => (
              <span
                key={r.id}
                title={`Captained ${r.captain.name} (${r.captain.points}) — ${r.bestPick.name} would've scored ${r.wouldHave}`}
                className="text-[11px] bg-surface-alt text-ink rounded-full px-2.5 py-1 max-w-full truncate"
              >
                <span className="font-bold">{r.managerName}</span>
                <span className="text-ink-soft"> · left </span>
                <span className="font-bold">{r.bestPick.name}</span>
                <span className="text-coral-ink font-bold"> +{r.delta}</span>
              </span>
            ))}
          </div>
          {regrets.length > 4 && (
            <button
              type="button"
              onClick={() => setShowAllRegrets((open) => !open)}
              className="mt-3 text-[11px] font-bold uppercase tracking-[0.12em] text-violet-ink hover:text-ink"
            >
              {showAllRegrets ? 'Show fewer' : `Show all ${regrets.length}`}
            </button>
          )}
        </Card>
      )}

      {dreamTeamManagers.length > 0 && (
        <Card className="p-5" tone="sunflower">
          <h3 className="text-base font-display font-bold text-ink flex items-center gap-2">
            <Sparkles size={18} className="text-sunflower-ink" />
            Dream Team watch
          </h3>
          <p className="text-[13px] font-bold text-ink-soft mt-2 leading-relaxed">
            Whose squad has the most players in FPL&rsquo;s official Team of the Week.
          </p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {shownDreamTeam.map((r) => (
              <span
                key={r.id}
                title={r.players.map((p) => p.name).join(', ')}
                className="text-[11px] bg-surface-alt text-ink rounded-full px-2.5 py-1 max-w-full truncate"
              >
                <span className="font-bold">{r.managerName}</span>
                <span className="text-sunflower-ink font-bold"> · {r.players.length}</span>
              </span>
            ))}
          </div>
          {dreamTeamManagers.length > 4 && (
            <button
              type="button"
              onClick={() => setShowAllDreamTeam((open) => !open)}
              className="mt-3 text-[11px] font-bold uppercase tracking-[0.12em] text-violet-ink hover:text-ink"
            >
              {showAllDreamTeam ? 'Show fewer' : `Show all ${dreamTeamManagers.length}`}
            </button>
          )}
        </Card>
      )}
    </div>
  );
};

export default CaptainWatch;
