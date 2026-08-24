import React from 'react';
import { cn } from '../../utils/cn';

// The header block every feature screen opens with.
//
// It used to flood the whole block with a saturated accent and white type
// (`bg-violet text-white`, `bg-sky text-white`, …) under a confetti strip.
// That is the page-2 "Corporate Memphis" treatment. Every page-3 banner —
// FusionGameweeks, FusionPrizes, FusionPrizesMonthly, FusionChipTracker — is
// the same shape instead: WHITE paper, one 2px ink outline, a big radius, and
// the accent carried only by (a) a small uppercase eyebrow above the title,
// (b) the tinted blob the hand-drawn prop sits on, and (c) the tinted stat
// tiles underneath. Nothing is flooded and nothing is shadowed.
const TONES = {
  violet: { eyebrow: 'text-violet-ink', blob: 'bg-violet/15' },
  mint: { eyebrow: 'text-mint-ink', blob: 'bg-mint/35' },
  coral: { eyebrow: 'text-coral-ink', blob: 'bg-coral/25' },
  sunflower: { eyebrow: 'text-sunflower-ink', blob: 'bg-sunflower/35' },
  sky: { eyebrow: 'text-sky-ink', blob: 'bg-sky/35' },
  pitch: { eyebrow: 'text-pitch-ink', blob: 'bg-pitch/20' },
  bubblegum: { eyebrow: 'text-bubblegum-ink', blob: 'bg-bubblegum/30' },
};

// The tiles cycle the dusty fills in the artboards' own order — peach, rose,
// sage, powder blue — rather than all taking the banner's one accent.
const TILE_TINTS = ['bg-tangerine/35', 'bg-bubblegum/30', 'bg-mint/35', 'bg-sky/35'];

const SectionBanner = ({
  tone = 'violet',
  art,
  eyebrow,
  title,
  subtitle,
  actions,
  stats = [],
  className,
}) => {
  const palette = TONES[tone] || TONES.violet;

  return (
    <div
      className={cn(
        'relative rounded-[28px] md:rounded-[32px] border-2 border-ink/85 bg-surface-alt p-5 md:p-6',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-grow">
          {(eyebrow || art) && (
            <div className="flex items-center gap-2.5">
              {art && (
                <span className={cn(
                  'w-9 h-9 shrink-0 rounded-full flex items-center justify-center',
                  palette.blob
                )}>
                  {art}
                </span>
              )}
              {eyebrow && (
                <span className={cn(
                  'text-[10px] md:text-[11px] font-bold uppercase tracking-[0.14em] truncate',
                  palette.eyebrow
                )}>
                  {eyebrow}
                </span>
              )}
            </div>
          )}

          <h2 className="text-2xl md:text-[34px] font-display font-bold leading-[1.05] text-ink mt-2">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm md:text-[15px] font-bold text-ink-soft mt-1.5 text-pretty">
              {subtitle}
            </p>
          )}
        </div>

        {actions && <div className="flex items-center gap-2 flex-wrap justify-end shrink-0">{actions}</div>}
      </div>

      {stats.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3 mt-5">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={cn('rounded-2xl p-3 min-w-0', TILE_TINTS[index % TILE_TINTS.length])}
            >
              <div className="text-lg md:text-[26px] font-display font-bold text-ink leading-none tabular-nums truncate">
                {stat.value}
              </div>
              <div className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.1em] text-ink-soft mt-1.5 truncate">
                {stat.label}
              </div>
              {stat.sublabel && (
                <div className="text-[9px] font-bold uppercase tracking-wider text-ink-soft/70 truncate">
                  {stat.sublabel}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SectionBanner;
