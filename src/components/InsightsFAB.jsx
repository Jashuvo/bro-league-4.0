import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Ball } from './ui/Doodles';
import InsightsPanel from './InsightsPanel';

// ─── MOBILE INSIGHTS SHORTCUT ───────────────────────────────────────────────
//
// On desktop, Insights lives one click away inside the Gameweeks destination.
// On mobile that's still true, but it's also the destination people open
// LEAST — Standings is home, and getting to this week's story/captain
// split from there means switching tabs first. A floating button
// on the home screen — the same shape as a Stories bubble — turns that into
// one tap from wherever a mobile visitor actually lands.
//
// Desktop doesn't need it: the sidebar makes every destination equally one
// click away already, so there's nothing here to shortcut.
//
// Rendered from LeagueTable (the Standings destination), which already has
// every prop this needs — no new data fetching, no App.jsx plumbing.
const InsightsFAB = ({ gameweekTable = [], gameweek, standings = [], status = 'current' }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="This gameweek's insights"
        style={{ bottom: 'calc(56px + env(safe-area-inset-bottom) + 16px)' }}
        className="lg:hidden fixed right-4 z-40 w-14 h-14 rounded-full border-2 border-ink/85 bg-sunflower flex items-center justify-center btn-pop"
      >
        <Ball size={28} className="animate-float" />
        {status === 'current' && (
          <span className="absolute top-0 right-0 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-coral opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-coral border border-ink/85" />
          </span>
        )}
      </button>

      {/* Parent-controlled mount, same as TeamView.jsx/PrizeBreakdown.jsx —
          entrance animation only, no AnimatePresence. AnimatePresence
          wrapping a conditionally-called createPortal doesn't work (a
          Portal isn't a plain element, so it's never recognized as a child
          to mount), and restructuring so AnimatePresence's direct child
          IS a portaled motion component didn't reliably unmount either —
          the exit never reported as complete, leaving the sheet stuck open
          after "Close". Matching the pattern already proven elsewhere in
          this codebase sidesteps that whole class of bug: closing loses the
          slide-down exit, which is a fair trade for not going through that
          again. */}
      {open && createPortal(
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            onClick={() => setOpen(false)}
            className="absolute inset-0"
            style={{ backgroundColor: 'rgb(var(--c-scrim) / 0.6)' }}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
            className="absolute inset-x-0 bottom-0 top-[10vh] bg-surface rounded-t-[28px] border-t-2 border-x-2 border-ink/85 flex flex-col overflow-hidden"
          >
            <div className="shrink-0 flex items-center gap-3 px-4 py-3.5 border-b-2 border-ink/85 bg-surface-alt">
              <span className="w-9 h-9 shrink-0 rounded-full bg-sunflower border-2 border-ink/85 flex items-center justify-center">
                <Ball size={18} />
              </span>
              <div className="min-w-0 flex-grow">
                <h2 className="font-display font-bold text-lg text-ink leading-tight">This gameweek&rsquo;s insights</h2>
                <p className="text-[11px] font-bold text-ink-soft truncate">Gameweek {gameweek} — story, captains &amp; more</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="w-9 h-9 shrink-0 rounded-full bg-surface-sunk flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-3" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
              <InsightsPanel
                gameweekTable={gameweekTable}
                gameweek={gameweek}
                standings={standings}
                status={status}
              />
            </div>
          </motion.div>
        </div>,
        document.body
      )}
    </>
  );
};

export default InsightsFAB;
