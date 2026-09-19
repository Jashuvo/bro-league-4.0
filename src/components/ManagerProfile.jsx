import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Trophy, TrendingUp, TrendingDown, Repeat, Sparkles, Clock } from 'lucide-react';
import RankTrendSparkline from './RankTrendSparkline';
import FormDots from './ui/FormDots';
import Badge from './ui/Badge';
import { cn } from '../utils/cn';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { buildManagerProfile } from '../utils/managerProfile';

// One manager's whole season, opened from their row in the standings table.
//
// Read-only and instant: every figure comes from data the table above it is
// already rendering (buildManagerProfile derives it all from gameweekTable +
// the standings row), so this sheet fires no request at all. That's a
// deliberate ceiling on what it can show — a "captain accuracy" stat would
// need one picks fetch per manager per gameweek, which is the single most
// expensive thing this app does and not something opening a profile should
// trigger on its own.
const CHIP_LABELS = {
  wildcard: 'Wildcard',
  freehit: 'Free Hit',
  bboost: 'Bench Boost',
  '3xc': 'Triple Captain',
  manager: 'Assistant Manager',
};
const chipLabel = (name) => CHIP_LABELS[name] || name;

const StatTile = ({ label, value, note, tint = 'bg-surface-alt', valueClass = 'text-ink' }) => (
  <div className={cn('rounded-2xl border-2 border-ink/85 px-3 py-2.5', tint)}>
    <div className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-ink-soft">{label}</div>
    <div className={cn('font-display font-bold text-[22px] leading-tight tabular-nums', valueClass)}>
      {value}
    </div>
    {note && <div className="text-[11px] font-semibold text-ink-soft leading-tight mt-0.5">{note}</div>}
  </div>
);

// `ordinal` for the position line — "1st/2nd/3rd/4th", "11th"…
const ordinal = (n) => {
  if (n == null) return '—';
  const rem10 = n % 10;
  const rem100 = n % 100;
  if (rem10 === 1 && rem100 !== 11) return `${n}st`;
  if (rem10 === 2 && rem100 !== 12) return `${n}nd`;
  if (rem10 === 3 && rem100 !== 13) return `${n}rd`;
  return `${n}th`;
};

const ManagerProfile = ({ manager, gameweekTable = [], standings = [], rankHistory = null, onClose }) => {
  const profile = useMemo(
    () => buildManagerProfile({ manager, gameweekTable, standings, rankHistory }),
    [manager, gameweekTable, standings, rankHistory]
  );

  const panelRef = useFocusTrap(onClose, true);

  const { position, chips } = profile;
  const climb = position.change;
  const rankMoved = position.current && position.best && position.worst;

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-6">
      <div onClick={onClose} className="absolute inset-0 bg-scrim/75" />
      <motion.div
        ref={panelRef}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
        className="relative w-full md:max-w-lg max-h-[85vh] md:max-h-[640px] overflow-y-auto bg-surface rounded-t-3xl md:rounded-3xl border-2 border-ink/85 shadow-pop-lg"
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="sticky top-0 bg-violet text-white p-4 border-b-2 border-ink/85 z-10">
          <div className="flex items-start gap-3">
            <span className="w-11 h-11 shrink-0 rounded-2xl bg-surface-alt border-2 border-ink/85 flex items-center justify-center font-display font-bold text-[17px] text-ink">
              {profile.managerName
                ? profile.managerName.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
                : '?'}
            </span>
            <div className="min-w-0 flex-grow">
              <h2 className="font-display font-bold text-lg leading-tight truncate">
                {profile.teamName || profile.managerName || 'Manager'}
              </h2>
              <p className="text-white/80 text-sm font-semibold truncate">{profile.managerName}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close profile"
              className="w-9 h-9 shrink-0 rounded-xl bg-surface-alt border-2 border-ink/85 flex items-center justify-center"
            >
              <X size={18} className="text-ink" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-3">
            {position.current && (
              <Badge variant="gold">
                <Trophy size={13} /> {ordinal(position.current.rank)} of {standings.length || '—'}
              </Badge>
            )}
            {profile.form.length > 0 && (
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/30 px-2.5 py-0.5">
                <FormDots form={profile.form} />
                <span className="text-[11px] font-bold">Last {profile.form.length}</span>
              </span>
            )}
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* ── Rank trend ─────────────────────────────────────────── */}
          <div className="bg-surface-alt rounded-2xl border-2 border-ink/85 p-4">
            <div className="flex items-baseline justify-between gap-2 mb-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-soft">
                League position
              </p>
              {rankMoved && (
                <p className={cn(
                  'text-[12px] font-bold flex items-center gap-1',
                  climb > 0 ? 'text-pitch-ink' : climb < 0 ? 'text-coral-ink' : 'text-ink-soft'
                )}>
                  {climb > 0 ? <TrendingUp size={14} /> : climb < 0 ? <TrendingDown size={14} /> : null}
                  {climb === 0
                    ? 'Unchanged since GW1'
                    : `${climb > 0 ? 'Up' : 'Down'} ${Math.abs(climb)} since GW${profile.rankTrend[0].gw}`}
                </p>
              )}
            </div>
            <RankTrendSparkline data={profile.rankTrend} maxRank={standings.length || 15} />

            {rankMoved && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                <StatTile label="Best" value={`#${position.best.rank}`} note={`GW${position.best.gw}`} tint="bg-tile-sage" />
                <StatTile label="Worst" value={`#${position.worst.rank}`} note={`GW${position.worst.gw}`} tint="bg-tile-clay" />
                <StatTile label="Now" value={`#${position.current.rank}`} note={`GW${position.current.gw}`} tint="bg-tile-sky" />
              </div>
            )}
          </div>

          {/* ── Season totals ──────────────────────────────────────── */}
          <div>
            <h3 className="text-[10px] font-display font-bold text-ink-soft uppercase tracking-[0.16em] mb-2 ml-1">
              Season so far · {profile.gameweeksPlayed} {profile.gameweeksPlayed === 1 ? 'gameweek' : 'gameweeks'}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <StatTile
                label="Net points"
                value={profile.netPoints.toLocaleString()}
                note={profile.hits > 0 ? `${profile.points} raw − ${profile.hits} in hits` : `${profile.points} raw, no hits`}
                tint="bg-tile-gold"
                valueClass="text-ink text-[26px]"
              />
              <StatTile label="Average" value={profile.averageNet} note="per gameweek, net" />
              <StatTile
                label={`Best · GW${profile.best.gameweek ?? '—'}`}
                value={profile.best.gameweek ? profile.best.net : '—'}
                note={profile.best.gameweek ? `${profile.best.points} raw` : 'Nothing played yet'}
                tint="bg-tile-sage"
              />
              <StatTile
                label={`Worst · GW${profile.worst.gameweek ?? '—'}`}
                value={profile.worst.gameweek ? profile.worst.net : '—'}
                note={profile.worst.gameweek ? `${profile.worst.points} raw` : 'Nothing played yet'}
                tint="bg-tile-clay"
              />
            </div>

            <p className="text-[12.5px] font-semibold text-ink-soft mt-2 ml-1">
              {profile.aboveAverage.above > profile.aboveAverage.below
                ? `Above the league average in ${profile.aboveAverage.above} of ${profile.gameweeksPlayed} weeks.`
                : profile.aboveAverage.below > profile.aboveAverage.above
                  ? `Below the league average in ${profile.aboveAverage.below} of ${profile.gameweeksPlayed} weeks.`
                  : `Bang on the league average across ${profile.gameweeksPlayed} weeks.`}
            </p>
          </div>

          {/* ── Transfer habits ────────────────────────────────────── */}
          <div className="bg-surface-alt rounded-2xl border-2 border-ink/85 p-4">
            <h3 className="text-[10px] font-display font-bold text-ink-soft uppercase tracking-[0.16em] mb-2.5 flex items-center gap-1.5">
              <Repeat size={13} /> In the transfer market
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <StatTile label="Transfers" value={profile.transfers} note={`${profile.transfersPerGameweek} per GW`} />
              <StatTile
                label="Hits taken"
                value={profile.biggestHit.hits > 0 ? `-${profile.hits}` : 0}
                note={profile.biggestHit.hits > 0 ? `worst −${profile.biggestHit.hits} in GW${profile.biggestHit.gameweek}` : 'No hits taken'}
                tint={profile.hits > 0 ? 'bg-tile-clay' : 'bg-tile-sage'}
              />
              <StatTile
                label="Benched"
                value={profile.benchPoints}
                note={profile.worstBench.points > 0 ? `worst ${profile.worstBench.points} in GW${profile.worstBench.gameweek}` : 'Nothing left on the bench'}
              />
            </div>
            {profile.hits > 0 && profile.netPoints > 0 && (
              <p className="text-[12.5px] font-semibold text-ink-soft mt-2.5">
                Hits cost {profile.hits} points — {Math.round((profile.hits / (profile.netPoints + profile.hits)) * 100)}% of what the season would otherwise have scored.
              </p>
            )}
          </div>
          {/* ── Chips ──────────────────────────────────────────────── */}
          <div className="bg-surface-alt rounded-2xl border-2 border-ink/85 p-4">
            <h3 className="text-[10px] font-display font-bold text-ink-soft uppercase tracking-[0.16em] mb-2.5 flex items-center gap-1.5">
              <Sparkles size={13} /> Chips · {chips.playedCount} played
            </h3>

            {chips.played.length === 0 ? (
              <p className="text-[13px] font-semibold text-ink-soft">
                Nothing played yet this season.
              </p>
            ) : (
              <div className="space-y-1.5">
                {chips.played.map((chip, index) => (
                  <div
                    key={`${chip.name}-${chip.gameweek}-${index}`}
                    className="flex items-center justify-between gap-2 rounded-xl bg-surface-sunk border-2 border-ink/85 px-3 py-2"
                  >
                    <span className="font-bold text-ink text-sm">{chipLabel(chip.name)}</span>
                    <span className="inline-flex items-center gap-1 text-[12px] font-bold text-ink-soft">
                      <Clock size={12} /> GW{chip.gameweek}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* "Still holding" is scoped to the CURRENT half — FPL re-issues
                the whole set at GW20, so an unplayed first-half wildcard is
                not an unplayed second-half one. The heading says which half
                it means rather than leaving the reader to assume. */}
            {chips.holding.length > 0 && (
              <div className="mt-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-soft mb-1.5">
                  Still holding · {chips.half === 1 ? 'first' : 'second'} half of the season
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {chips.holding.map((name) => (
                    <Badge key={name} variant="secondary">{chipLabel(name)}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <p className="text-[11px] font-semibold text-ink-soft text-center px-4 pb-2">
            Net figures count transfer hits, same as the standings table above.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ManagerProfile;
