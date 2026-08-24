import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

// Second-level navigation inside a single destination (Prizes' Weekly /
// Monthly / Season, More's Chips / H2H / Awards). The primary nav is the
// sidebar + bottom bar in AppNav; this is deliberately a different, smaller
// shape so the two levels never read as the same thing.
//
// `layoutId` must be unique per mounted control — it's what the sliding
// active pill animates against.
const SegmentedControl = ({ items, value, onChange, layoutId, className }) => (
  <div
    role="tablist"
    className={cn(
      'inline-flex items-center gap-1 p-1 rounded-2xl border-2 border-ink/85 bg-surface-alt shadow-card max-w-full overflow-x-auto scrollbar-none',
      className
    )}
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
            'relative shrink-0 min-h-[40px] px-3 sm:px-4 rounded-xl font-display font-bold text-sm',
            'flex items-center justify-center transition-colors duration-200',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface-alt',
            isActive ? 'text-ink' : 'text-ink-soft hover:text-ink'
          )}
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          {isActive && (
            <motion.span
              layoutId={layoutId}
              className={cn('absolute inset-0 rounded-xl border-2 border-ink/85', item.tone || 'bg-sunflower')}
              transition={{ type: 'spring', bounce: 0.2, duration: 0.45 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5 whitespace-nowrap">
            {item.icon}
            {item.label}
          </span>
        </button>
      );
    })}
  </div>
);

export default SegmentedControl;
