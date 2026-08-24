import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SectionBanner from './ui/SectionBanner';
import SegmentedControl from './ui/SegmentedControl';
import { ChipCard, CornerFlags, Medal, MoreDots } from './ui/Doodles';
import ChipTracker from './ChipTracker';
import HeadToHead from './HeadToHead';
import SeasonAwards from './SeasonAwards';

// ─── MORE ───────────────────────────────────────────────────────────────────
//
// The three low-frequency views — Chip Tracker, Head-to-Head and Season
// Awards — used to be three of the seven top-level tabs, each competing for
// the same row of chrome as the standings. They are reference material you
// visit occasionally, not somewhere you live, so they sit behind one door.
//
// Each sub-view is the existing component, mounted with its own props and its
// own data handling untouched; `embedded` only tells it to skip the page-level
// banner, because the banner below already names the section.
const VIEWS = [
  {
    id: 'chips',
    label: 'Chips',
    tone: 'bg-bubblegum',
    icon: <ChipCard size={18} />,
    bannerTone: 'bubblegum',
    art: <ChipCard size={34} />,
    title: 'Chip Tracker',
    subtitle: "Who's holding their wildcard — and who's already gone for it",
  },
  {
    id: 'h2h',
    label: 'Head-to-Head',
    tone: 'bg-coral',
    icon: <CornerFlags size={18} />,
    bannerTone: 'coral',
    art: <CornerFlags size={34} />,
    title: 'Head-to-Head',
    subtitle: 'Bragging rights, gameweek by gameweek',
  },
  {
    id: 'awards',
    label: 'Awards',
    tone: 'bg-sunflower',
    icon: <Medal size={18} />,
    bannerTone: 'sunflower',
    art: <Medal size={34} />,
    title: 'Season Awards',
    subtitle: 'The superlatives nobody asked for, updated every gameweek',
  },
];

const MoreHub = ({ standings = [], gameweekTable = [], loading = false }) => {
  const [view, setView] = useState('chips');
  const current = VIEWS.find((v) => v.id === view) || VIEWS[0];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* One banner for the destination, retinted per sub-view so each keeps
          the accent it carried as its own tab. */}
      <SectionBanner
        tone={current.bannerTone}
        art={current.art}
        title={current.title}
        subtitle={current.subtitle}
        actions={
          <span className="inline-flex items-center gap-2 rounded-2xl border-2 border-ink/85 bg-surface-alt px-3 py-1.5">
            <MoreDots size={18} />
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">
              {VIEWS.length} extras
            </span>
          </span>
        }
      />

      <SegmentedControl
        items={VIEWS}
        value={view}
        onChange={setView}
        layoutId="moreSegment"
        className="w-full sm:w-auto"
      />

      {/* Enter-only, and deliberately NOT wrapped in AnimatePresence.
          `mode="wait"` holds the outgoing view mounted until its exit
          animation resolves, and exit propagates to every descendant motion
          component — including the `whileInView` Cards these sub-views are
          built from. Any such Card still below the fold has never entered
          view, so it never reports its exit as finished and the swap deadlocks
          on it: the tall Head-to-Head table left Awards permanently unmounted.
          Keying the container is enough to remount and fade the new view in. */}
      <motion.div
        key={view}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {view === 'chips' && <ChipTracker standings={standings} loading={loading} embedded />}

        {view === 'h2h' && (
          <HeadToHead standings={standings} gameweekTable={gameweekTable} loading={loading} embedded />
        )}

        {view === 'awards' && (
          <SeasonAwards standings={standings} gameweekTable={gameweekTable} loading={loading} embedded />
        )}
      </motion.div>
    </motion.div>
  );
};

export default MoreHub;
