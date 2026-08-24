import React, { useState } from 'react';
import { DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import Badge from './ui/Badge';
import SectionBanner from './ui/SectionBanner';
import SegmentedControl from './ui/SegmentedControl';
import { Coins, Whistle, CalendarDoodle, TrophyCup } from './ui/Doodles';
import MonthlyPrizes from './MonthlyPrizes';
import WeeklyPrizes from './prizes/WeeklyPrizes';
import SeasonPrizes from './prizes/SeasonPrizes';
import ProgressCard from './prizes/ProgressCard';
import usePrizeStats from './prizes/usePrizeStats';
import { prizeStructure, grandTotal } from '../data/leagueData';

// ─── PRIZES ─────────────────────────────────────────────────────────────────
//
// One destination that used to be two top-level tabs, "Monthly Prizes" and
// "Prize Distribution", each mounting its own banner, its own stats header and
// its own copy of the distribution math. Now: one banner carrying the pool
// totals, one segmented control, three views over the same `usePrizeStats`
// result.
const VIEWS = [
  { id: 'weekly', label: 'Weekly', tone: 'bg-sky', icon: <Whistle size={18} /> },
  { id: 'monthly', label: 'Monthly', tone: 'bg-mint', icon: <CalendarDoodle size={18} /> },
  { id: 'season', label: 'Season', tone: 'bg-sunflower', icon: <TrophyCup size={18} /> },
];

const PrizesHub = ({ gameweekTable = [], standings = [], gameweekInfo = {}, loading = false }) => {
  const [view, setView] = useState('weekly');
  const stats = usePrizeStats({ gameweekTable, standings, gameweekInfo });

  const subtitle =
    view === 'weekly' ? `৳${prizeStructure.weekly.perWeek} every gameweek • ৳${prizeStructure.weekly.total} pot`
      : view === 'monthly' ? `Nine monthly competitions • ৳${prizeStructure.monthly.total} pot`
        : `Podium, form and swag • ৳${prizeStructure.season.total} on the podium`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <SectionBanner
        tone="violet"
        art={<Coins size={34} />}
        title="Prizes"
        subtitle={subtitle}
        actions={
          <Badge variant="gold" className="px-3 py-1.5 text-sm">
            <DollarSign size={14} />
            ৳{stats.totalDistributed.toLocaleString()} of ৳{grandTotal.toLocaleString()} paid
          </Badge>
        }
        stats={[
          { value: `৳${stats.weeklyDistributed}`, label: 'Weekly', sublabel: 'Distributed' },
          { value: `৳${stats.monthlyDistributed}`, label: 'Monthly', sublabel: 'Distributed' },
          { value: `৳${stats.remainingPrizes}`, label: 'Remaining', sublabel: 'To be won' },
          { value: `${Math.round((stats.totalDistributed / grandTotal) * 100)}%`, label: 'Completed', sublabel: 'Season progress' },
        ]}
      />

      <SegmentedControl
        items={VIEWS}
        value={view}
        onChange={setView}
        layoutId="prizesSegment"
        className="w-full sm:w-auto"
      />

      {/* Enter-only, and deliberately NOT wrapped in AnimatePresence — see the
          note in MoreHub.jsx: `mode="wait"` propagates exit to the `whileInView`
          Cards these views are built from, and any Card still below the fold
          never resolves its exit, so the swap deadlocks on it. */}
      <motion.div
        key={view}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
          {view === 'weekly' && <WeeklyPrizes stats={stats} />}

          {view === 'monthly' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ProgressCard
                  art={<CalendarDoodle size={24} />}
                  title="Monthly Pot"
                  badge={`৳${prizeStructure.monthly.total}`}
                  badgeVariant="success"
                  amountLabel="Per Month"
                  amountValue="৳750"
                  amountColor="text-pitch"
                  amountTone="bg-pitch/12"
                  countLabel="Months Done"
                  countValue={stats.monthsCompleted}
                  progress={stats.monthlyProgress}
                  progressColor="bg-pitch"
                  progressTextColor="text-pitch"
                />
                <div className="rounded-3xl border-2 border-ink/85 bg-surface-alt shadow-card p-6 flex flex-col justify-center">
                  <h3 className="text-lg font-display font-bold text-ink mb-2">How months pay out</h3>
                  <p className="text-sm font-semibold text-ink-soft leading-relaxed">
                    Every four-gameweek window pays its top three
                    {' '}৳{prizeStructure.monthly.regularPrizes.join(' / ৳')}.
                    The final month covers the run-in and pays
                    {' '}৳{prizeStructure.monthly.finalMonth.join(' / ৳')}.
                    A month only counts once its last gameweek has actually finished.
                  </p>
                </div>
              </div>

              <MonthlyPrizes
                gameweekTable={gameweekTable}
                gameweekInfo={gameweekInfo}
                loading={loading}
                embedded
              />
            </div>
          )}

          {view === 'season' && <SeasonPrizes stats={stats} standings={standings} />}
      </motion.div>
    </motion.div>
  );
};

export default PrizesHub;
