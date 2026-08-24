// src/components/ChipTracker.jsx - League-wide view of who's played which
// FPL chip (and when), and who's still holding theirs in the bank.
import React, { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import Card from './ui/Card';
import SectionBanner from './ui/SectionBanner';
import { ChipCard, TrophyCup, FormArrow, Bench } from './ui/Doodles';
import { cn } from '../utils/cn';

// FPL's chip identifiers, in the order managers typically consider playing
// them. `wildcard` can appear twice in a season (one per half) — this UI
// just lists every play rather than assuming a fixed count.
//
// The icons are drawn, not typed: the FusionChipTracker legend gives each chip
// its own line-art mark in the accent it owns. Emoji (🃏 🔄 🚀 👑) rendered in
// the reader's system font and read as a different design from everything
// around them.
const CHIP_TYPES = [
  { id: 'wildcard', label: 'Wildcard', art: <ChipCard size={18} />, tint: 'bg-coral/25' },
  { id: 'freehit', label: 'Free Hit', art: <FormArrow size={18} direction="up" tone="fill-sky" />, tint: 'bg-sky/30' },
  { id: 'bboost', label: 'Bench Boost', art: <Bench size={18} />, tint: 'bg-violet/15' },
  { id: '3xc', label: 'Triple Captain', art: <TrophyCup size={18} />, tint: 'bg-sunflower/40' }
];

// `embedded` is set when this renders inside the More destination, whose own
// SectionBanner already names the section — see MoreHub.jsx.
const ChipTracker = ({ standings = [], loading = false, embedded = false }) => {
  const rows = useMemo(() => {
    return standings
      .map((manager) => {
        const chipsById = {};
        (manager.chips || []).forEach((chip) => {
          if (!chipsById[chip.name]) chipsById[chip.name] = [];
          chipsById[chip.name].push(chip.event);
        });
        return {
          id: manager.id || manager.entry,
          managerName: manager.managerName || manager.player_name,
          teamName: manager.teamName || manager.entry_name,
          chipsById,
          chipsPlayed: Object.values(chipsById).reduce((sum, evs) => sum + evs.length, 0)
        };
      })
      .sort((a, b) => b.chipsPlayed - a.chipsPlayed);
  }, [standings]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-surface-sunk rounded-3xl border-2 border-ink/10 animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="p-12 text-center">
        <Sparkles className="w-14 h-14 mx-auto mb-4 text-ink/20" />
        <p className="text-lg font-bold text-ink-soft">No chip data available yet</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {!embedded && (
        <SectionBanner
          tone="bubblegum"
          art={<ChipCard size={20} />}
          title="Chip Tracker"
          subtitle="Who's holding their wildcard — and who's already gone for it"
        />
      )}

      {/* Phone layout: one card per manager with the four chips as a 2×2 of
          pills. The five-column table below needs 560px and used to be handed
          to phones behind a sideways scroll, which meant three of the four
          chip columns were off-screen. */}
      <div className="md:hidden space-y-2.5">
        {rows.map((row) => (
          <div key={row.id} className="rounded-3xl bg-surface-alt p-3.5">
            <div className="min-w-0">
              <div className="font-display font-bold text-ink truncate">{row.managerName}</div>
              <div className="text-xs font-bold text-ink-soft truncate">{row.teamName}</div>
            </div>
            <div className="grid grid-cols-2 gap-1.5 mt-3">
              {CHIP_TYPES.map((chip) => {
                const plays = row.chipsById[chip.id];
                const played = plays && plays.length > 0;
                return (
                  <span
                    key={chip.id}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-bold min-w-0',
                      played ? `${chip.tint} text-ink border-2 border-ink/85` : 'bg-surface-sunk text-ink-soft'
                    )}
                  >
                    <span className="shrink-0">{chip.art}</span>
                    <span className="truncate flex-grow">{chip.label}</span>
                    <span className="shrink-0 tabular-nums">
                      {played ? plays.map((gw) => `GW${gw}`).join(', ') : '—'}
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Deliberately restrained: this is a dense reference table, so colour
          is carried by the chip pills alone rather than the whole grid. */}
      <Card className="p-0 overflow-hidden hidden md:block">
        <div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-ink/85 text-left bg-surface-sunk">
                <th className="p-4 text-ink font-display font-bold">Manager</th>
                {CHIP_TYPES.map((chip) => (
                  <th key={chip.id} className="p-4 text-ink font-display font-bold text-center whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 justify-center">
                      {chip.art}
                      {chip.label}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={row.id}
                  className={`border-b border-ink/10 last:border-0 ${index % 2 === 1 ? 'bg-surface-sunk/50' : ''}`}
                >
                  <td className="p-4">
                    <div className="font-bold text-ink truncate max-w-[160px]">{row.managerName}</div>
                    <div className="text-xs font-medium text-ink-soft truncate max-w-[160px]">{row.teamName}</div>
                  </td>
                  {CHIP_TYPES.map((chip) => {
                    const plays = row.chipsById[chip.id];
                    return (
                      <td key={chip.id} className="p-4 text-center">
                        {plays && plays.length > 0 ? (
                          <div className="flex flex-wrap justify-center gap-1">
                            {plays.map((gw) => (
                              <span
                                key={gw}
                                className={cn(
                                  'inline-flex items-center px-2 py-0.5 rounded-full border-2 border-ink/85 text-ink text-xs font-bold',
                                  chip.tint
                                )}
                              >
                                GW{gw}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-ink-soft/60 text-xs font-semibold">In the bank</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
};

export default ChipTracker;
