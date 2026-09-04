// src/components/HeadToHead.jsx
//
// Two things now: a simulated FPL-rules H2H mini-league (fixtures + table,
// see src/utils/h2hSchedule.js for the schedule/scoring logic and why it's
// deterministic rather than reshuffled per visit) and the original
// pick-any-two-managers comparison tool. Everything here is reshaped from
// `standings` and `gameweekTable`, which the app already has in state — no
// extra fetching, no server-side storage needed (the schedule is a pure
// function of who's in the league).
import React, { useMemo, useState } from 'react';
import { Swords, Minus, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import Card from './ui/Card';
import Badge from './ui/Badge';
import SectionBanner from './ui/SectionBanner';
import SegmentedControl from './ui/SegmentedControl';
import { CornerFlags, Jersey, TrophyCup, RankBadge } from './ui/Doodles';
import { generateH2HSchedule, computeH2HStandings, seedFromIds, getNetPoints } from '../utils/h2hSchedule';

const VIEWS = [
  { id: 'league', label: 'League', icon: <Trophy size={16} /> },
  { id: 'compare', label: 'Compare', icon: <Swords size={16} /> },
];

// `embedded` is set when this renders inside the More destination, whose own
// SectionBanner already names the section — see MoreHub.jsx.
const HeadToHead = ({ standings = [], gameweekTable = [], gameweekInfo = {}, loading = false, embedded = false }) => {
  const [view, setView] = useState('league');

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
        <Swords className="w-14 h-14 mx-auto mb-4 text-ink/20" />
        <p className="text-lg font-bold text-ink-soft">Need at least two managers to compare</p>
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
          subtitle="A full mini-league, FPL H2H rules — plus pick-any-two bragging rights"
        />
      )}

      <SegmentedControl items={VIEWS} value={view} onChange={setView} layoutId="h2hSegment" />

      {view === 'league' ? (
        <H2HLeague standings={standings} gameweekTable={gameweekTable} gameweekInfo={gameweekInfo} />
      ) : (
        <CompareView standings={standings} gameweekTable={gameweekTable} />
      )}
    </motion.div>
  );
};

// ─── LEAGUE ─────────────────────────────────────────────────────────────────
const H2HLeague = ({ standings, gameweekTable, gameweekInfo }) => {
  const managerIds = useMemo(
    () => standings.map((m) => m.id ?? m.entry),
    [standings]
  );
  const managerById = useMemo(
    () => new Map(standings.map((m) => [m.id ?? m.entry, m])),
    [standings]
  );

  const schedule = useMemo(
    () => generateH2HSchedule(managerIds, seedFromIds(managerIds), gameweekInfo.total || 38),
    [managerIds, gameweekInfo.total]
  );

  const table = useMemo(
    () => computeH2HStandings(schedule, gameweekTable, standings),
    [schedule, gameweekTable, standings]
  );

  const currentGw = gameweekInfo.current || 1;
  const currentFixtures = schedule.find((r) => r.gameweek === currentGw)?.pairs || [];
  const currentGwPoints = useMemo(() => {
    const row = gameweekTable.find((gw) => gw.gameweek === currentGw);
    const m = new Map();
    (row?.managers || []).forEach((mgr) => m.set(mgr.id, getNetPoints(mgr)));
    return m;
  }, [gameweekTable, currentGw]);

  return (
    <div className="space-y-6">
      {currentFixtures.length > 0 && (
        <Card>
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="text-lg font-display font-bold text-ink flex items-center gap-2">
              <CornerFlags size={22} />
              Gameweek {currentGw} Fixtures
            </h3>
            <Badge variant="accent">{currentFixtures.length} match{currentFixtures.length !== 1 ? 'es' : ''}</Badge>
          </div>
          <div className="space-y-2">
            {currentFixtures.map(([aId, bId]) => {
              const a = managerById.get(aId);
              const b = managerById.get(bId);
              if (!a || !b) return null;
              const aPts = currentGwPoints.get(aId);
              const bPts = currentGwPoints.get(bId);
              const played = aPts != null && bPts != null;
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
    </div>
  );
};

// ─── COMPARE (unchanged from before) ───────────────────────────────────────
const CompareView = ({ standings, gameweekTable }) => {
  const [managerAId, setManagerAId] = useState(standings[0]?.id ?? standings[0]?.entry ?? null);
  const [managerBId, setManagerBId] = useState(standings[1]?.id ?? standings[1]?.entry ?? null);

  const managerA = standings.find((m) => (m.id ?? m.entry) === managerAId);
  const managerB = standings.find((m) => (m.id ?? m.entry) === managerBId);

  const record = useMemo(() => {
    if (!managerAId || !managerBId || managerAId === managerBId) {
      return { weeks: [], aWins: 0, bWins: 0, draws: 0 };
    }

    let aWins = 0, bWins = 0, draws = 0;
    const weeks = gameweekTable
      .map((gw) => {
        const a = gw.managers?.find((m) => m.id === managerAId);
        const b = gw.managers?.find((m) => m.id === managerBId);
        if (!a || !b) return null;

        const aPoints = getNetPoints(a);
        const bPoints = getNetPoints(b);
        if (aPoints > bPoints) aWins++;
        else if (bPoints > aPoints) bWins++;
        else draws++;

        return { gameweek: gw.gameweek, aPoints, bPoints };
      })
      .filter(Boolean);

    return { weeks, aWins, bWins, draws };
  }, [gameweekTable, managerAId, managerBId]);

  return (
    <div className="space-y-6">
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-3">
          <ManagerPicker
            standings={standings}
            value={managerAId}
            onChange={setManagerAId}
            excludeId={managerBId}
          />
          <div className="flex items-center justify-center">
            <span className="w-11 h-11 rounded-full bg-sunflower border-2 border-ink/85 shadow-pop-sm flex items-center justify-center font-display font-bold text-ink text-sm">
              VS
            </span>
          </div>
          <ManagerPicker
            standings={standings}
            value={managerBId}
            onChange={setManagerBId}
            excludeId={managerAId}
          />
        </div>
      </Card>

      {managerA && managerB && managerAId !== managerBId && (
        <>
          <Card>
            <div className="grid grid-cols-3 items-center text-center gap-3">
              <div className="rounded-2xl border-2 border-violet/60 bg-violet/12 p-3">
                <Jersey size={34} tone="fill-violet" className="mx-auto mb-1" />
                <div className="text-3xl font-display font-bold text-violet-ink leading-none">{record.aWins}</div>
                <div className="text-[10px] font-bold text-ink-soft uppercase tracking-wider mt-1 truncate">{managerA.managerName}</div>
              </div>
              <div>
                <Badge variant="warning">{record.draws} draw{record.draws !== 1 ? 's' : ''}</Badge>
                <div className="text-xs font-semibold text-ink-soft mt-2">{record.weeks.length} gameweeks played</div>
              </div>
              <div className="rounded-2xl border-2 border-coral/60 bg-coral/12 p-3">
                <Jersey size={34} tone="fill-coral" className="mx-auto mb-1" />
                <div className="text-3xl font-display font-bold text-coral-ink leading-none">{record.bWins}</div>
                <div className="text-[10px] font-bold text-ink-soft uppercase tracking-wider mt-1 truncate">{managerB.managerName}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t-2 border-dashed border-ink/15">
              <div className="text-center">
                <div className="text-xl font-display font-bold text-ink">{managerA.totalPoints ?? managerA.total ?? 0}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">Season Total</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-display font-bold text-ink">{managerB.totalPoints ?? managerB.total ?? 0}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">Season Total</div>
              </div>
            </div>
          </Card>

          {record.weeks.length > 0 && (
            <Card className="p-0 overflow-hidden">
              {/* `min-w-[420px]` forced a sideways scroll on any phone. Four
                  narrow columns fit 390px on their own once the padding is
                  tightened and the two names are allowed to truncate. */}
              <div>
                <table className="w-full text-sm table-fixed">
                  <thead>
                    <tr className="border-b-2 border-ink/85 text-left bg-surface-sunk">
                      <th className="p-2 sm:p-3 w-[64px] text-ink font-display font-bold">GW</th>
                      <th className="p-2 sm:p-3 text-ink font-display font-bold text-right truncate">{managerA.managerName}</th>
                      <th className="p-2 sm:p-3 w-[40px]"></th>
                      <th className="p-2 sm:p-3 text-ink font-display font-bold truncate">{managerB.managerName}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...record.weeks].reverse().map((week) => (
                      <tr key={week.gameweek} className="border-b border-ink/10 last:border-0">
                        <td className="p-2 sm:p-3 font-semibold text-ink-soft">GW{week.gameweek}</td>
                        <td className={`p-2 sm:p-3 text-right font-display font-bold ${week.aPoints > week.bPoints ? 'text-violet-ink' : 'text-ink'}`}>
                          {week.aPoints}
                        </td>
                        <td className="p-2 sm:p-3 text-center text-ink-soft">
                          {week.aPoints === week.bPoints ? <Minus size={14} className="mx-auto" /> : (
                            <TrophyCup
                              size={18}
                              className="mx-auto"
                              tone={week.aPoints > week.bPoints ? 'fill-violet' : 'fill-coral'}
                            />
                          )}
                        </td>
                        <td className={`p-2 sm:p-3 font-display font-bold ${week.bPoints > week.aPoints ? 'text-coral-ink' : 'text-ink'}`}>
                          {week.bPoints}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

const ManagerPicker = ({ standings, value, onChange, excludeId }) => (
  <select
    value={value ?? ''}
    onChange={(e) => onChange(Number(e.target.value))}
    className="w-full bg-surface-alt border-2 border-ink/85 rounded-2xl px-4 py-3 text-ink font-bold shadow-card focus:outline-none focus-visible:ring-2 focus-visible:ring-violet"
  >
    {standings.map((manager) => {
      const id = manager.id ?? manager.entry;
      return (
        <option key={id} value={id} disabled={id === excludeId}>
          {manager.managerName || manager.player_name} {id === excludeId ? '(selected)' : ''}
        </option>
      );
    })}
  </select>
);

export default HeadToHead;
