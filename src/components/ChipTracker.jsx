// src/components/ChipTracker.jsx - League-wide view of who's played which
// FPL chip (and when), and who's still holding theirs in the bank.
import React, { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import Card from './ui/Card';
import SectionBanner from './ui/SectionBanner';
import { ChipCard } from './ui/Doodles';

// FPL's chip identifiers, in the order managers typically consider playing
// them. `wildcard` can appear twice in a season (one per half) — this UI
// just lists every play rather than assuming a fixed count.
const CHIP_TYPES = [
  { id: 'wildcard', label: 'Wildcard', emoji: '🃏' },
  { id: 'freehit', label: 'Free Hit', emoji: '🔄' },
  { id: 'bboost', label: 'Bench Boost', emoji: '🚀' },
  { id: '3xc', label: 'Triple Captain', emoji: '👑' }
];

const ChipTracker = ({ standings = [], loading = false }) => {
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
      <SectionBanner
        tone="bubblegum"
        art={<ChipCard size={34} />}
        title="Chip Tracker"
        subtitle="Who's holding their wildcard — and who's already gone for it"
      />

      {/* Deliberately restrained: this is a dense reference table, so colour
          is carried by the chip pills alone rather than the whole grid. */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="border-b-2 border-ink/85 text-left bg-surface-sunk">
                <th className="p-4 text-ink font-display font-bold">Manager</th>
                {CHIP_TYPES.map((chip) => (
                  <th key={chip.id} className="p-4 text-ink font-display font-bold text-center whitespace-nowrap">
                    <span className="mr-1">{chip.emoji}</span>
                    {chip.label}
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
                                className="inline-flex items-center px-2 py-0.5 rounded-full border-2 border-ink/85 bg-mint text-ink text-xs font-bold"
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
