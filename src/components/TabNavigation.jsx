import React from 'react';
import { motion } from 'framer-motion';
import {
  Standings, Whistle, CalendarDoodle, ChipCard, CornerFlags, Coins, Medal
} from './ui/Doodles';

// Hand-drawn tab icons, keyed by tab id. The tab bar is the most-looked-at
// piece of chrome in the app, so it gets real illustrations rather than a
// stock icon set whose language would fight the outlines everywhere else.
const TAB_ICONS = {
  standings: Standings,
  gameweek: Whistle,
  monthly: CalendarDoodle,
  chips: ChipCard,
  h2h: CornerFlags,
  prizes: Coins,
  awards: Medal,
};

const TabNavigation = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="sticky top-[4.5rem] z-40 bg-surface/95 backdrop-blur-md -mx-4 px-4 py-3">
      <div className="relative max-w-5xl mx-auto">
        <div className="flex gap-2 overflow-x-auto pb-1 md:overflow-visible scrollbar-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = TAB_ICONS[tab.id];

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`
                  relative shrink-0 md:flex-1 px-3 md:px-2 lg:px-3 py-2 rounded-2xl border-2
                  flex items-center justify-center gap-2 font-display font-semibold text-sm
                  transition-colors duration-200
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface
                  ${isActive
                    ? 'border-ink/85 text-ink shadow-pop-sm'
                    : 'border-ink/15 bg-surface-alt text-ink-soft hover:border-ink/40 hover:text-ink'}
                `}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {isActive && (
                  <motion.span
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-2xl bg-sunflower"
                    transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
                  />
                )}

                {Icon && <Icon size={22} className="relative z-10 shrink-0" />}
                <span className="relative z-10 hidden lg:inline whitespace-nowrap">{tab.name}</span>
                <span className="relative z-10 lg:hidden whitespace-nowrap">{tab.shortName}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TabNavigation;
