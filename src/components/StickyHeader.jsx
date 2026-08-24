import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import { Ball } from './ui/Doodles';
import { cn } from '../utils/cn';
import { leagueConfig } from '../data/leagueData';

// ─── MOBILE TOP BAR ─────────────────────────────────────────────────────────
//
// Mobile only, and deliberately thin: exactly 56px (h-14), which is what the
// CommandBar's `sticky top-14` parks itself against. On desktop the sidebar in
// AppNav carries the brand, the sync status and the theme toggle, so this is
// hidden outright rather than duplicated.
//
// It used to be the app's whole header — full-width on every breakpoint, with
// a hamburger that opened a menu holding Refresh and the sync time. Both of
// those now live in the CommandBar one row down, and navigation lives in the
// bottom bar, so the menu had nothing left to hold.
const StickyHeader = ({ authStatus, lastUpdated }) => {
  const { theme, toggleTheme } = useTheme();

  // Split "BRO League 5" into "BRO League" + "5" so the trailing
  // number/edition can be styled separately, without hardcoding it here.
  const nameParts = leagueConfig.name.split(' ');
  const leagueEdition = nameParts.pop();
  const leagueBaseName = nameParts.join(' ');

  return (
    <motion.header
      initial={{ y: -60 }}
      animate={{ y: 0 }}
      className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 border-b-2 border-ink/85 bg-surface/95 backdrop-blur-md"
    >
      <div className="h-full px-4 flex items-center gap-3">
        <span className="relative flex w-9 h-9 shrink-0 items-center justify-center rounded-full bg-sunflower border-2 border-ink/85 shadow-pop-sm">
          <Ball size={20} />
        </span>

        <div className="min-w-0">
          <h1 className="font-display font-bold text-base tracking-tight text-ink leading-none truncate">
            {leagueBaseName}{' '}
            <span className="inline-flex items-center justify-center min-w-[1.35rem] h-5 px-1 rounded-md bg-coral text-ink border-2 border-ink/85 text-sm align-middle">
              {leagueEdition}
            </span>
          </h1>
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-ink-soft mt-0.5 truncate">
            {lastUpdated
              ? `Synced ${lastUpdated.toLocaleTimeString('en-US', { timeStyle: 'short' })}`
              : 'Fantasy Premier League'}
          </p>
        </div>

        <span className="ml-auto flex items-center gap-2 shrink-0">
          <span
            aria-label={authStatus?.authenticated ? 'Live data' : 'Offline mode'}
            className={cn(
              'w-2.5 h-2.5 rounded-full border-2 border-ink/85',
              authStatus?.authenticated ? 'bg-pitch animate-pulse' : 'bg-tangerine'
            )}
          />
          <button
            onClick={toggleTheme}
            aria-label="Toggle colour theme"
            className="p-2 rounded-xl border-2 border-ink/85 bg-surface-alt text-ink shadow-pop-sm"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </span>
      </div>
    </motion.header>
  );
};

export default StickyHeader;
