// src/components/ChipTracker.jsx - League-wide view of who's played which
// FPL chip (and when), and who's still holding theirs in the bank.
import React, { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import Card from './ui/Card';

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
          <div key={i} className="h-16 bg-base-200/50 rounded-xl animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="p-12 text-center text-bro-muted">
        <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-20" />
        <p className="text-lg">No chip data available yet</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <Card className="bg-gradient-to-r from-bro-primary to-bro-secondary border-none">
        <div className="flex items-center gap-4 text-white">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-lg">
            <Sparkles size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-display font-bold">Chip Tracker</h2>
            <p className="text-white/80 text-lg">Who&rsquo;s holding their wildcard — and who&rsquo;s already gone for it</p>
          </div>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="border-b border-base-content/10 text-left">
                <th className="p-4 text-bro-muted font-medium">Manager</th>
                {CHIP_TYPES.map((chip) => (
                  <th key={chip.id} className="p-4 text-bro-muted font-medium text-center whitespace-nowrap">
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
                  className={`border-b border-base-content/5 last:border-0 ${index % 2 === 1 ? 'bg-base-content/[0.02]' : ''}`}
                >
                  <td className="p-4">
                    <div className="font-bold text-base-content truncate max-w-[160px]">{row.managerName}</div>
                    <div className="text-xs text-bro-muted truncate max-w-[160px]">{row.teamName}</div>
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
                                className="inline-flex items-center px-2 py-1 rounded-lg bg-bro-secondary/15 text-bro-secondary text-xs font-bold"
                              >
                                GW{gw}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-bro-muted/40 text-xs">In the bank</span>
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
