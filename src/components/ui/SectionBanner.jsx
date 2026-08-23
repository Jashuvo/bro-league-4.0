import React from 'react';
import { cn } from '../../utils/cn';
import { Confetti } from './Doodles';

// The header block every feature screen opens with. Flat token fill, thin
// ink outline, hard offset shadow, a hand-drawn prop and a confetti strip —
// the celebratory replacement for the old gradient hero cards.
const TONES = {
  violet: 'bg-violet text-white',
  mint: 'bg-mint text-ink',
  coral: 'bg-coral text-white',
  sunflower: 'bg-sunflower text-ink',
  sky: 'bg-sky text-white',
  pitch: 'bg-pitch text-white',
  bubblegum: 'bg-bubblegum text-white',
};

const SectionBanner = ({
  tone = 'violet',
  art,
  title,
  subtitle,
  actions,
  stats = [],
  className,
}) => {
  const isLight = tone === 'mint' || tone === 'sunflower';

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl border-2 border-ink/85 shadow-pop p-5 md:p-6',
        TONES[tone] || TONES.violet,
        className
      )}
    >
      <Confetti className="absolute inset-x-0 -top-1 h-14 opacity-80 pointer-events-none" />

      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          {art && (
            <span className="w-16 h-16 shrink-0 rounded-2xl bg-surface-alt border-2 border-ink/85 flex items-center justify-center">
              {art}
            </span>
          )}
          <div className="min-w-0">
            <h2 className="text-2xl md:text-3xl font-display font-bold leading-tight">{title}</h2>
            {subtitle && (
              <p className={cn('text-sm md:text-base font-semibold', isLight ? 'text-ink/70' : 'text-white/85')}>
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {actions && <div className="flex items-center gap-2 flex-wrap shrink-0">{actions}</div>}
      </div>

      {stats.length > 0 && (
        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl bg-surface-alt border-2 border-ink/85 p-3 text-center"
            >
              <div className="text-xl font-display font-bold text-ink">{stat.value}</div>
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft">{stat.label}</div>
              {stat.sublabel && (
                <div className="text-[10px] font-semibold text-ink-soft/70 uppercase tracking-wider">{stat.sublabel}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SectionBanner;
