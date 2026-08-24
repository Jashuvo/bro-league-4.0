import React from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { cn } from '../utils/cn';
import { useTheme } from '../context/ThemeContext';
import { Ball } from './ui/Doodles';
import { DESTINATIONS } from './navDestinations';
import { leagueConfig } from '../data/leagueData';

// The four destinations themselves live in ./navDestinations — both
// presentations below render from that one array, so a destination can never
// exist in the sidebar and not the bottom bar.

/* ─────────────────────────────── Sidebar ─────────────────────────────────*/

const SidebarNav = ({ activeTab, onTabChange, authStatus, lastUpdated }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-[236px] flex-col border-r-2 border-ink/85 bg-surface-alt">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 h-16 shrink-0 border-b-2 border-ink/85">
        <span className="relative flex w-10 h-10 shrink-0 items-center justify-center rounded-full bg-sunflower border-2 border-ink/85 shadow-pop-sm">
          <Ball size={24} />
        </span>
        <div className="min-w-0">
          <div className="font-display font-bold text-lg leading-none text-ink truncate">{leagueConfig.name}</div>
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-soft mt-1">
            Season {leagueConfig.season}
          </div>
        </div>
      </div>

      {/* Destinations */}
      <nav aria-label="Primary" className="flex-1 overflow-y-auto p-3 space-y-2">
        {DESTINATIONS.map((destination) => {
          const isActive = activeTab === destination.id;
          const Icon = destination.icon;

          return (
            <button
              key={destination.id}
              type="button"
              onClick={() => onTabChange(destination.id)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'relative w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl border-2 text-left',
                'font-display font-bold transition-colors duration-200',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface-alt',
                isActive
                  ? 'border-ink/85 text-ink shadow-pop-sm'
                  : 'border-transparent text-ink-soft hover:border-ink/20 hover:text-ink hover:bg-surface-sunk/70'
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="primaryNavActive"
                  className={cn('absolute inset-0 rounded-2xl', destination.tone)}
                  transition={{ type: 'spring', bounce: 0.22, duration: 0.5 }}
                />
              )}
              <Icon size={26} className="relative z-10 shrink-0" />
              <span className="relative z-10 min-w-0">
                <span className="block truncate leading-tight">{destination.name}</span>
                <span
                  className={cn(
                    'block text-[10px] font-bold uppercase tracking-[0.12em] truncate',
                    isActive ? 'text-ink/60' : 'text-ink-soft/70'
                  )}
                >
                  {destination.blurb}
                </span>
              </span>
            </button>
          );
        })}
      </nav>

      {/* Live-sync status + theme, pinned to the bottom */}
      <div className="p-3 border-t-2 border-ink/85 space-y-2">
        <div className="rounded-2xl border-2 border-ink/15 bg-surface-sunk px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              {authStatus?.authenticated && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pitch opacity-75" />
              )}
              <span
                className={cn(
                  'relative inline-flex rounded-full h-2.5 w-2.5',
                  authStatus?.authenticated ? 'bg-pitch' : 'bg-tangerine'
                )}
              />
            </span>
            <span className="text-xs font-bold text-ink truncate">
              {authStatus?.authenticated ? 'Live data' : 'Offline mode'}
            </span>
          </div>
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-soft mt-1">
            {lastUpdated
              ? `Synced ${lastUpdated.toLocaleTimeString('en-US', { timeStyle: 'short' })}`
              : 'Waiting for sync'}
          </div>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle colour theme"
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-2xl border-2 border-ink/85 bg-surface-alt text-ink text-sm font-display font-bold btn-pop hover:bg-sunflower"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          {theme === 'dark' ? 'Light' : 'Dark'} mode
        </button>
      </div>
    </aside>
  );
};

/* ──────────────────────────── Mobile bottom bar ──────────────────────────*/

const BottomNav = ({ activeTab, onTabChange }) => (
  <nav
    aria-label="Primary"
    className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t-2 border-ink/85 bg-surface-alt/95 backdrop-blur-md"
    style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
  >
    <div className="flex items-stretch">
      {DESTINATIONS.map((destination) => {
        const isActive = activeTab === destination.id;
        const Icon = destination.icon;

        return (
          <button
            key={destination.id}
            type="button"
            onClick={() => onTabChange(destination.id)}
            aria-current={isActive ? 'page' : undefined}
            className="relative flex-1 min-w-[44px] min-h-[56px] px-1 py-1.5 flex flex-col items-center justify-center gap-0.5 focus:outline-none"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <span
              className={cn(
                'relative flex items-center justify-center w-11 h-8 rounded-xl border-2 transition-colors duration-200',
                isActive ? 'border-ink/85' : 'border-transparent'
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="primaryNavActiveMobile"
                  className={cn('absolute inset-0 rounded-xl', destination.tone)}
                  transition={{ type: 'spring', bounce: 0.22, duration: 0.5 }}
                />
              )}
              <Icon size={22} className="relative z-10" />
            </span>
            <span
              className={cn(
                'text-[10px] font-display font-bold leading-none',
                isActive ? 'text-ink' : 'text-ink-soft'
              )}
            >
              {destination.short}
            </span>
          </button>
        );
      })}
    </div>
  </nav>
);

// One nav, two presentations. `variant` picks which one — both read the same
// DESTINATIONS array and the same active-tab state.
const AppNav = ({ variant = 'sidebar', ...props }) =>
  variant === 'bottom' ? <BottomNav {...props} /> : <SidebarNav {...props} />;

export default AppNav;
