import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

// Second-level navigation inside a single destination (Prizes' Weekly /
// Monthly / Season, More's Chips / H2H / Awards).
//
// Two things were wrong with the first version and both cost users the
// Monthly view — people reported it as "missing" when it was one tap away:
//
//  1. It didn't read as a set of choices. The container carried the same
//     2px ink outline and card shadow as every panel on the page, so it
//     looked like one more bordered box; only the active item was filled,
//     and the inactive labels sat on the same white as everything else.
//     The page-3 artboards draw it the other way round: a SUNK pill track,
//     inactive items as bare muted text ON that track, and the active item
//     as a filled pill that is the only thing wearing an ink outline. That
//     contrast — sunk track, raised outlined pill — is what says "tabs".
//  2. It could scroll sideways, so on a phone a segment could sit off-screen.
//     The items are now an equal-width grid that always fits the width.
//
// Each item may carry a `hint` (Prizes uses the pot: "৳750/mo"), so a segment
// says what it holds rather than only what it is called.
//
// `layoutId` must be unique per mounted control — it's what the sliding
// active pill animates against.
const SegmentedControl = ({ items, value, onChange, layoutId, className }) => (
  <div
    role="tablist"
    className={cn(
      'grid gap-1 p-1.5 rounded-full bg-surface-sunk border-2 border-ink/12 w-full',
      className
    )}
    style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
  >
    {items.map((item) => {
      const isActive = item.id === value;

      return (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={isActive}
          onClick={() => onChange(item.id)}
          className={cn(
            'relative min-h-[44px] px-1.5 sm:px-3 rounded-full font-display font-bold',
            'flex flex-col items-center justify-center transition-colors duration-200',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface-sunk',
            isActive ? 'text-ink' : 'text-ink-soft hover:text-ink'
          )}
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          {isActive && (
            <motion.span
              layoutId={layoutId}
              className={cn(
                'absolute inset-0 rounded-full border-2 border-ink/85',
                item.tone || 'bg-sunflower'
              )}
              transition={{ type: 'spring', bounce: 0.2, duration: 0.45 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5 min-w-0">
            <span className="shrink-0">{item.icon}</span>
            <span className="text-[13px] sm:text-sm truncate">{item.label}</span>
          </span>
          {item.hint && (
            <span
              className={cn(
                'relative z-10 text-[9.5px] sm:text-[10px] font-bold tracking-[0.04em] leading-none mt-0.5 truncate max-w-full',
                isActive ? 'text-ink/65' : 'text-ink-soft/75'
              )}
            >
              {item.hint}
            </span>
          )}
        </button>
      );
    })}
  </div>
);

export default SegmentedControl;
