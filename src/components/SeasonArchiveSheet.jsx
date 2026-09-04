import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, ScrollText } from 'lucide-react';
import Badge from './ui/Badge';
import SegmentedControl from './ui/SegmentedControl';
import { Whistle, CalendarDoodle, TrophyCup } from './ui/Doodles';
import { leagueConfig } from '../data/leagueData';

// This season's permanent record — weekly winners, monthly winners, and the
// full per-gameweek standings table — captured daily into Supabase (see
// SUPABASE_ARCHIVE_PLAN.md and api/warm-cache.js) straight from FPL's own
// numbers, already net of transfer hits. Opened from the season badge in
// CommandBar so it's one tap away from every tab, not buried behind a
// dedicated destination for something people will check occasionally.
//
// Renders nothing (returns null) unless `open` — App.jsx keeps this mounted
// so seasonArchive stays fresh, same idea as PlayerDetail's own sheet.
const VIEWS = [
  { id: 'weekly', label: 'Weekly', icon: <Whistle size={16} /> },
  { id: 'monthly', label: 'Monthly', icon: <CalendarDoodle size={16} /> },
  { id: 'standings', label: 'Standings', icon: <TrophyCup size={16} /> },
];

const SeasonArchiveSheet = ({ open, onClose, seasonArchive = [] }) => {
  const [view, setView] = useState('weekly');

  const weekly = useMemo(
    () => seasonArchive
      .filter((r) => r.category === 'weekly_winner')
      .sort((a, b) => (b.period || 0) - (a.period || 0)),
    [seasonArchive]
  );

  const monthly = useMemo(() => {
    const byMonth = new Map();
    seasonArchive
      .filter((r) => r.category === 'monthly_winner')
      .forEach((r) => {
        if (!byMonth.has(r.period)) byMonth.set(r.period, []);
        byMonth.get(r.period).push(r);
      });
    return [...byMonth.entries()]
      .sort(([a], [b]) => b - a)
      .map(([period, rows]) => [period, rows.sort((a, b) => (b.total_points || 0) - (a.total_points || 0))]);
  }, [seasonArchive]);

  // Standings: the latest captured gameweek only — a running history of
  // every past gameweek's full table lives in the same rows (the whole
  // point of capturing it daily), but this sheet shows "where things stand
  // now" rather than a 38-gameweek scrollback.
  const standings = useMemo(() => {
    const rows = seasonArchive.filter((r) => r.category === 'total_standing');
    if (rows.length === 0) return { period: null, rows: [] };
    const latestPeriod = Math.max(...rows.map((r) => r.period || 0));
    return {
      period: latestPeriod,
      rows: rows
        .filter((r) => r.period === latestPeriod)
        .sort((a, b) => (a.final_rank || 0) - (b.final_rank || 0)),
    };
  }, [seasonArchive]);

  if (!open) return null;

  const isEmpty = weekly.length === 0 && monthly.length === 0 && standings.rows.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-6"
    >
      <div onClick={onClose} className="absolute inset-0 bg-scrim/75" />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
        className="relative w-full md:max-w-lg max-h-[85vh] md:max-h-[640px] overflow-y-auto bg-surface rounded-t-3xl md:rounded-3xl border-2 border-ink/85 shadow-pop-lg"
      >
        <div className="sticky top-0 bg-violet text-white p-4 border-b-2 border-ink/85 flex items-start gap-3 z-10">
          <span className="w-11 h-11 shrink-0 rounded-2xl bg-surface-alt border-2 border-ink/85 flex items-center justify-center">
            <ScrollText size={22} className="text-violet-ink" />
          </span>
          <div className="min-w-0 flex-grow">
            <h2 className="font-display font-bold text-lg leading-tight truncate">Season Archive</h2>
            <p className="text-white/80 text-sm font-semibold truncate">{leagueConfig.season} · saved permanently</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 shrink-0 rounded-xl bg-surface-alt border-2 border-ink/85 flex items-center justify-center"
          >
            <X size={18} className="text-ink" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <SegmentedControl items={VIEWS} value={view} onChange={setView} layoutId="seasonArchiveSegment" />

          {isEmpty ? (
            <div className="text-center py-10 px-4">
              <p className="font-bold text-ink">Nothing saved yet</p>
              <p className="text-sm text-ink-soft mt-1">
                Results get captured here automatically once the first gameweek&rsquo;s bonus points settle.
              </p>
            </div>
          ) : (
            <>
              {view === 'weekly' && (
                <div className="space-y-2">
                  {weekly.length === 0 && <EmptyNote text="No gameweek has finalized yet." />}
                  {weekly.map((row) => (
                    <ArchiveRow
                      key={`${row.period}-${row.manager_id}`}
                      leftTop={`GW${row.period}`}
                      name={row.manager_name}
                      teamName={row.team_name}
                      points={row.total_points}
                      prizeLabel={row.prize_label}
                      prizeAmount={row.prize_amount}
                    />
                  ))}
                </div>
              )}

              {view === 'monthly' && (
                <div className="space-y-4">
                  {monthly.length === 0 && <EmptyNote text="No month has completed yet." />}
                  {monthly.map(([period, rows]) => (
                    <div key={period}>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-ink-soft mb-2 px-1">
                        {rows[0]?.prize_label?.split(' — ')[0] || `Month ${period}`}
                      </p>
                      <div className="space-y-2">
                        {rows.map((row) => (
                          <ArchiveRow
                            key={`${row.period}-${row.manager_id}`}
                            leftTop={`#${row.prize_label?.split('#')[1] || ''}`}
                            name={row.manager_name}
                            teamName={row.team_name}
                            points={row.total_points}
                            prizeAmount={row.prize_amount}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {view === 'standings' && (
                <div className="space-y-2">
                  {standings.rows.length === 0 ? (
                    <EmptyNote text="No standings captured yet." />
                  ) : (
                    <>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-ink-soft px-1">
                        As of GW{standings.period}
                      </p>
                      {standings.rows.map((row) => (
                        <ArchiveRow
                          key={row.manager_id}
                          leftTop={row.final_rank}
                          name={row.manager_name}
                          teamName={row.team_name}
                          points={row.total_points}
                          prizeLabel={row.prize_label}
                          prizeAmount={row.prize_amount}
                        />
                      ))}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const ArchiveRow = ({ leftTop, name, teamName, points, prizeLabel, prizeAmount }) => (
  <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-surface-sunk border-2 border-ink/15">
    <div className="flex items-center gap-3 min-w-0">
      <span className="w-8 h-8 shrink-0 rounded-full bg-ink/10 flex items-center justify-center text-xs font-display font-bold text-ink">
        {leftTop}
      </span>
      <div className="min-w-0">
        <div className="font-bold text-ink truncate">{name}</div>
        {teamName && <div className="text-[11px] font-bold text-ink-soft truncate">{teamName}</div>}
      </div>
    </div>
    <div className="text-right shrink-0">
      <div className="text-sm font-display font-bold text-violet-ink">{points?.toLocaleString()} pts</div>
      {prizeAmount != null && (
        <Badge variant="gold" className="mt-0.5 text-[10px] px-1.5 py-0">
          {prizeLabel ? `${prizeLabel} · ৳${prizeAmount}` : `৳${prizeAmount}`}
        </Badge>
      )}
    </div>
  </div>
);

const EmptyNote = ({ text }) => (
  <p className="text-sm text-ink-soft text-center py-6">{text}</p>
);

export default SeasonArchiveSheet;
