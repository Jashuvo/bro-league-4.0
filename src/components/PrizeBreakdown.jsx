import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Badge from './ui/Badge';
import { Coins, TrophyCup, Whistle, CalendarDoodle, Medal, Confetti } from './ui/Doodles';
import { monthlyWindows } from '../data/leagueData';

const PrizeBreakdown = ({ managerName, teamName, prizeData, onClose }) => {
  if (!prizeData) return null;

  const { weeklyWins = [], monthlyWins = [], totalPrizes = 0 } = prizeData;

  const getMonthName = (monthNum) => {
    const month = monthlyWindows.find((w) => w.id === monthNum);
    if (!month) return `Month ${monthNum}`;
    return month.isFinal ? `${month.name} (Final)` : month.name;
  };

  const podiumTone = (position) =>
    position === 1 ? 'fill-sunflower' : position === 2 ? 'fill-silver' : 'fill-tangerine';

  const getPositionLabel = (position) => {
    if (position === 1) return '1st Place';
    if (position === 2) return '2nd Place';
    if (position === 3) return '3rd Place';
    return `${position}th Place`;
  };

  // Portal straight to document.body — see the comment in TeamView.jsx on
  // why a fixed-position modal rendered as a normal descendant here would
  // get sized/positioned against Layout's animated <motion.main> instead
  // of the real viewport.
  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-ink/70 z-50 flex items-center justify-center p-3 md:p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border-2 border-ink/85 bg-surface shadow-pop-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-sunflower p-5 md:p-6 text-ink sticky top-0 z-10 border-b-2 border-ink/85 overflow-hidden">
            <Confetti className="absolute inset-x-0 -top-1 h-14 opacity-80 pointer-events-none" />

            <div className="relative flex items-start justify-between gap-3">
              <div className="flex items-center gap-4 min-w-0">
                <span className="w-14 h-14 shrink-0 rounded-2xl bg-surface-alt border-2 border-ink/85 flex items-center justify-center">
                  <TrophyCup size={30} />
                </span>
                <div className="min-w-0">
                  <h2 className="text-2xl font-display font-bold truncate">{managerName}</h2>
                  <p className="text-ink/70 text-sm font-semibold truncate">{teamName}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="w-10 h-10 shrink-0 rounded-full bg-surface-alt border-2 border-ink/85 flex items-center justify-center hover:bg-coral hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Total Summary */}
            <div className="relative mt-5 flex items-center justify-between gap-4 p-4 rounded-2xl bg-surface-alt border-2 border-ink/85">
              <div className="flex items-center gap-3 min-w-0">
                <Coins size={34} className="shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-soft">Total Prizes Won</div>
                  <div className="text-3xl font-display font-bold text-pitch leading-tight">৳{totalPrizes}</div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-soft">Wins</div>
                <div className="text-2xl font-display font-bold text-ink">{weeklyWins.length + monthlyWins.length}</div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 md:p-6 space-y-8">
            {/* No Prizes Message */}
            {weeklyWins.length === 0 && monthlyWins.length === 0 && (
              <div className="text-center py-12">
                <TrophyCup size={64} className="mx-auto mb-4 opacity-40" />
                <p className="text-lg font-display font-bold text-ink">No prizes won yet</p>
                <p className="text-ink-soft text-sm font-medium mt-2">Keep playing to win weekly and monthly prizes!</p>
              </div>
            )}

            {/* Weekly Prizes */}
            {weeklyWins.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-11 h-11 shrink-0 rounded-2xl bg-sky/20 border-2 border-ink/85 flex items-center justify-center">
                    <Whistle size={24} tone="fill-sky" />
                  </span>
                  <div>
                    <h3 className="text-xl font-display font-bold text-ink">Weekly Prizes</h3>
                    <p className="text-ink-soft text-sm font-semibold">
                      {weeklyWins.length} gameweek{weeklyWins.length !== 1 ? 's' : ''} won • ৳{weeklyWins.reduce((sum, w) => sum + w.prize, 0)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {weeklyWins.map((win, index) => (
                    <motion.div
                      key={`weekly-${win.gameweek}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 rounded-2xl bg-surface-alt border-2 border-ink/85 shadow-card"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <Badge variant="info" className="text-xs">GW {win.gameweek}</Badge>
                        <TrophyCup size={20} />
                      </div>
                      <div className="text-sm font-semibold text-ink-soft mb-1">{win.points} points</div>
                      <div className="text-xl font-display font-bold text-pitch">৳{win.prize}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Monthly Prizes */}
            {monthlyWins.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-11 h-11 shrink-0 rounded-2xl bg-mint/25 border-2 border-ink/85 flex items-center justify-center">
                    <CalendarDoodle size={24} />
                  </span>
                  <div>
                    <h3 className="text-xl font-display font-bold text-ink">Monthly Prizes</h3>
                    <p className="text-ink-soft text-sm font-semibold">
                      {monthlyWins.length} month{monthlyWins.length !== 1 ? 's' : ''} won • ৳{monthlyWins.reduce((sum, w) => sum + w.prize, 0)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {monthlyWins.map((win, index) => (
                    <motion.div
                      key={`monthly-${win.month}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-5 rounded-2xl bg-surface-alt border-2 border-ink/85 shadow-card"
                    >
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <Badge variant="secondary" className="text-xs">{getMonthName(win.month)}</Badge>
                        <Medal size={26} tone={podiumTone(win.position)} />
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-ink-soft mb-0.5">{getPositionLabel(win.position)}</div>
                          <div className="text-sm font-semibold text-ink">{win.points} points</div>
                        </div>
                        <div className="text-2xl font-display font-bold text-pitch shrink-0">৳{win.prize}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default PrizeBreakdown;
