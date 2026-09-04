// src/components/HeadToHead.jsx
//
// A simulated FPL-rules head-to-head mini-league laid on top of this
// (classic) league's existing data — see src/utils/h2hSchedule.js for the
// schedule/scoring logic and why it's deterministic rather than reshuffled
// per visit. Everything here is reshaped from `standings` and
// `gameweekTable`, which the app already has in state — no extra fetching,
// no server-side storage needed (the schedule is a pure function of who's
// in the league).
import React, { useMemo, useState } from 'react';
import { Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Card from './ui/Card';
import Badge from './ui/Badge';
import SectionBanner from './ui/SectionBanner';
import { CornerFlags, RankBadge } from './ui/Doodles';
import { generateH2HSchedule, computeH2HStandings, seedFromIds, getNetPoints } from '../utils/h2hSchedule';

// `embedded` is set when this renders inside the More destination, whose own
// SectionBanner already names the section — see MoreHub.jsx.
const HeadToHead = ({ standings = [], gameweekTable = [], gameweekInfo = {}, loading = false, embedded = false }) => {
  const totalGameweeks = gameweekInfo.total || 38;
  const [selectedGameweek, setSelectedGameweek] = useState(gameweekInfo.current || 1);

  const managerIds = useMemo(
    () => standings.map((m) => m.id ?? m.entry),
    [standings]
  );
  const managerById = useMemo(
    () => new Map(standings.map((m) => [m.id ?? m.entry, m])),
    [standings]
  );

  const schedule = useMemo(
    () => generateH2HSchedule(managerIds, seedFromIds(managerIds), totalGameweeks),
    [managerIds, totalGameweeks]
  );

  const table = useMemo(
    () => computeH2HStandings(schedule, gameweekTable, standings),
    [schedule, gameweekTable, standings]
  );

  const selectedFixtures = schedule.find((r) => r.gameweek === selectedGameweek)?.pairs || [];
  const selectedGwRow = gameweekTable.find((gw) => gw.gameweek === selectedGameweek);
  const selectedGwPoints = useMemo(() => {
    const m = new Map();
    (selectedGwRow?.managers || []).forEach((mgr) => m.set(mgr.id, getNetPoints(mgr)));
    return m;
  }, [selectedGwRow]);

  // A gameweek with no row in gameweekTable at all hasn't been played yet
  // (no FPL history for it) — the current gameweek before its own deadline
  // is the one case that DOES have a row (FPL creates it early, all zeros)
  // despite nothing having kicked off; `gameweekInfo.isFinished` only ever
  // describes the CURRENT gameweek, so it's only trusted for that one.
  const gwStatus = !selectedGwRow
    ? 'upcoming'
    : selectedGameweek === (gameweekInfo.current || 1) && !gameweekInfo.isFinished
      ? 'current'
      : 'completed';

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-surface-sunk rounded-3xl border-2 border-ink/10 animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (standings.length < 2) {
    return (
      <div className="p-12 text-center">
        <Trophy className="w-14 h-14 mx-auto mb-4 text-ink/20" />
        <p className="text-lg font-bold text-ink-soft">Need at least two managers for a mini-league</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {!embedded && (
        <SectionBanner
          tone="coral"
          art={<CornerFlags size={20} />}
          title="Head-to-Head"
          subtitle="A full mini-league, real FPL H2H rules"
        />
      )}

      {/* The table itself, front and center — this is the thing people
          actually open H2H for, so it comes before the fixture list now
          instead of after it (used to need a scroll past 9 match rows to
          reach it). */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 pb-0 flex items-center justify-between gap-3">
          <h3 className="text-lg font-display font-bold text-ink flex items-center gap-2">
            <Trophy size={20} />
            H2H Table
          </h3>
          <span className="text-[10px] font-bold text-ink-soft uppercase tracking-wider">Win 3 · Draw 1 · Loss 0</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm mt-3">
            <thead>
              <tr className="border-b-2 border-ink/85 text-left bg-surface-sunk">
                <th className="p-2 sm:p-3 w-[40px]"></th>
                <th className="p-2 sm:p-3 text-ink font-display font-bold">Manager</th>
                <th className="p-2 sm:p-3 text-ink font-display font-bold text-center">P</th>
                <th className="p-2 sm:p-3 text-ink font-display font-bold text-center">W</th>
                <th className="p-2 sm:p-3 text-ink font-display font-bold text-center">D</th>
                <th className="p-2 sm:p-3 text-ink font-display font-bold text-center">L</th>
                <th className="p-2 sm:p-3 text-ink font-display font-bold text-center">Pts</th>
                <th className="p-2 sm:p-3 text-ink-soft font-display font-bold text-center hidden sm:table-cell">Total</th>
              </tr>
            </thead>
            <tbody>
              {table.map((row, i) => {
                const manager = managerById.get(row.managerId);
                if (!manager) return null;
                return (
                  <tr key={row.managerId} className="border-b border-ink/10 last:border-0">
                    <td className="p-2 sm:p-3"><RankBadge rank={i + 1} size={28} /></td>
                    <td className="p-2 sm:p-3 min-w-0">
                      <div className="font-bold text-ink truncate">{manager.managerName || manager.player_name}</div>
                      <div className="text-[10px] font-bold text-ink-soft truncate">{manager.teamName || manager.entry_name}</div>
                    </td>
                    <td className="p-2 sm:p-3 text-center text-ink-soft font-semibold">{row.played}</td>
                    <td className="p-2 sm:p-3 text-center text-pitch-ink font-bold">{row.wins}</td>
                    <td className="p-2 sm:p-3 text-center text-ink-soft font-bold">{row.draws}</td>
                    <td className="p-2 sm:p-3 text-center text-coral-ink font-bold">{row.losses}</td>
                    <td className="p-2 sm:p-3 text-center font-display font-bold text-lg text-violet-ink">{row.h2hPoints}</td>
                    <td className="p-2 sm:p-3 text-center text-ink-soft font-semibold hidden sm:table-cell">{row.seasonTotal.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="px-4 py-3 text-[11px] font-semibold text-ink-soft border-t-2 border-dashed border-ink/15 mt-1">
          Fixtures are a simulated season-long schedule (round-robin, same for everyone) since this league isn&rsquo;t
          FPL&rsquo;s own H2H mode — scoring and tiebreaks (season total points) follow FPL&rsquo;s real H2H rules exactly.
        </p>
      </Card>

      {/* Gameweek navigation — same prev/next pattern as GameweekTable.jsx,
          so past weeks' results are one tap away instead of only ever
          showing whichever gameweek is currently live. */}
      <div className="flex items-center gap-2 sm:gap-4 bg-surface-alt p-2.5 sm:p-3 rounded-3xl border-2 border-ink/85">
        <button
          onClick={() => setSelectedGameweek((gw) => Math.max(1, gw - 1))}
          disabled={selectedGameweek <= 1}
          aria-label="Previous gameweek"
          className="w-11 h-11 shrink-0 rounded-2xl bg-surface-sunk text-ink-soft flex items-center justify-center btn-pop disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex items-center gap-2.5 flex-grow min-w-0">
          <CornerFlags size={22} className="shrink-0 hidden sm:block" />
          <div className="min-w-0">
            <div className="font-display font-bold text-base sm:text-lg text-ink leading-tight truncate">
              Gameweek {selectedGameweek} Fixtures
            </div>
            <div className="text-[11px] sm:text-xs font-bold text-ink-soft mt-0.5 truncate">
              {gwStatus === 'completed' && 'Final — points are settled'}
              {gwStatus === 'current' && 'In progress — scores can still move'}
              {gwStatus === 'upcoming' && 'Not played yet'}
            </div>
          </div>
        </div>

        <span className="shrink-0 text-[11px] font-bold text-ink-soft tabular-nums">
          {selectedGameweek}/{totalGameweeks}
        </span>

        <button
          onClick={() => setSelectedGameweek((gw) => Math.min(totalGameweeks, gw + 1))}
          disabled={selectedGameweek >= totalGameweeks}
          aria-label="Next gameweek"
          className="w-11 h-11 shrink-0 rounded-2xl bg-violet/15 text-violet-ink flex items-center justify-center btn-pop disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {selectedFixtures.length > 0 && (
        <Card>
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="text-lg font-display font-bold text-ink">Results</h3>
            <Badge variant="accent">{selectedFixtures.length} match{selectedFixtures.length !== 1 ? 'es' : ''}</Badge>
          </div>
          <div className="space-y-2">
            {selectedFixtures.map(([aId, bId]) => {
              const a = managerById.get(aId);
              const b = managerById.get(bId);
              if (!a || !b) return null;
              const aPts = selectedGwPoints.get(aId);
              const bPts = selectedGwPoints.get(bId);
              const played = gwStatus !== 'upcoming' && aPts != null && bPts != null;
              return (
                <div key={`${aId}-${bId}`} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 p-3 rounded-2xl bg-surface-sunk border-2 border-ink/15">
                  <div className="min-w-0 text-right">
                    <div className={`font-bold truncate ${played && aPts > bPts ? 'text-violet-ink' : 'text-ink'}`}>
                      {a.managerName || a.player_name}
                    </div>
                    <div className="text-[10px] font-bold text-ink-soft truncate">{a.teamName || a.entry_name}</div>
                  </div>
                  <div className="shrink-0 text-center min-w-[64px]">
                    {played ? (
                      <div className="font-display font-bold text-lg text-ink tabular-nums">{aPts} – {bPts}</div>
                    ) : (
                      <div className="text-xs font-bold text-ink-soft uppercase tracking-wider">vs</div>
                    )}
                  </div>
                  <div className="min-w-0 text-left">
                    <div className={`font-bold truncate ${played && bPts > aPts ? 'text-coral-ink' : 'text-ink'}`}>
                      {b.managerName || b.player_name}
                    </div>
                    <div className="text-[10px] font-bold text-ink-soft truncate">{b.teamName || b.entry_name}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </motion.div>
  );
};

export default HeadToHead;
