// src/components/standings/RowPieces.jsx
//
// The three presentational pieces the standings table draws with, moved out
// of LeagueTable.jsx so the file is about the table's behaviour rather than
// its small markup. They were already self-contained; nothing here changed in
// the move except their address.
import React from 'react';
import { cn } from '../../utils/cn';

// The cup tag on a standings row. States are visually distinct on purpose:
// still in (tinted, positive), out (ghost — it's history, not news), and
// champion (gold, the same token the rest of the app uses for a win).
// `compact` drops the "Cup" label for the phone row, where the round is
// the only part that won't crowd out the manager's name.
export const CupTag = ({ cup, compact = false }) => {
  if (!cup) return null;

  const TONES = {
    champion: 'bg-sunflower border-ink/85 text-ink',
    alive: 'bg-tile-sky border-ink/85 text-ink',
    eliminated: 'bg-surface-sunk border-ink/25 text-ink-soft',
  };

  const label = cup.status === 'champion'
    ? (compact ? '🏆' : 'Cup won')
    : cup.status === 'eliminated'
      ? (compact ? cup.roundAbbrev : `Cup out · ${cup.roundAbbrev}`)
      : (compact ? cup.roundAbbrev : `Cup · ${cup.roundAbbrev}`);

  return (
    <span
      className={cn(
        'shrink-0 rounded-full border-2 px-1.5 text-[9.5px] font-bold whitespace-nowrap',
        TONES[cup.status] || TONES.alive
      )}
      title={
        cup.status === 'champion'
          ? 'Won the cup'
          : cup.status === 'eliminated'
            ? `Out of the cup — lost the ${cup.roundName} (GW${cup.gameweek})`
            : `Still in the cup — ${cup.roundName} in GW${cup.gameweek}`
      }
    >
      {label}
    </span>
  );
};

export const StatTile = ({ label, value, note, tone = 'bg-surface-alt', labelClass = 'text-ink-soft', valueClass = 'text-ink' }) => (
  <div className={cn('rounded-[18px] px-4 py-3.5', tone)}>
    <div className={cn('text-[11.5px] font-bold uppercase tracking-[0.04em]', labelClass)}>{label}</div>
    <div className={cn('font-display font-bold text-[26px] leading-none mt-1.5 tabular-nums', valueClass)}>{value}</div>
    {note && <div className="text-[10.5px] font-bold text-ink-soft mt-1.5 leading-tight">{note}</div>}
  </div>
);

// The TREND column. With fewer than two gameweeks there is nothing to draw a
// line BETWEEN, and the artboards are explicit about not faking one: a dashed
// run with a single dot on it is the "no line yet" mark.
export const TrendSpark = ({ history, maxRank }) => {
  if (history.length < 2) {
    return (
      <svg width="60" height="22" viewBox="0 0 60 22" aria-label="No rank trend yet" className="block">
        <path d="M2 11h56" className="stroke-silver" strokeWidth="2.2" strokeDasharray="4 5" strokeLinecap="round" fill="none" />
        <circle cx="9" cy="11" r="4.4" className="fill-sunflower stroke-ink" strokeWidth="1.6" />
      </svg>
    );
  }

  const first = history[0];
  const last = history[history.length - 1];
  const improved = last.rank < first.rank;
  const unchanged = last.rank === first.rank;
  const tone = unchanged ? 'stroke-silver' : improved ? 'stroke-pitch' : 'stroke-coral';
  const dot = unchanged ? 'fill-silver' : improved ? 'fill-pitch' : 'fill-coral';

  const stepX = 56 / (history.length - 1);
  const scaleY = (rank) => ((rank - 1) / Math.max(maxRank - 1, 1)) * 14 + 4;
  const points = history.map((d, i) => `${2 + i * stepX},${scaleY(d.rank)}`).join(' ');

  return (
    <svg
      width="60"
      height="22"
      viewBox="0 0 60 22"
      aria-label={`Rank ${first.rank} in GW${first.gw} to ${last.rank} in GW${last.gw}`}
      className="block"
    >
      <polyline points={points} fill="none" className={tone} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={2 + (history.length - 1) * stepX} cy={scaleY(last.rank)} r="3" className={dot} />
    </svg>
  );
};
