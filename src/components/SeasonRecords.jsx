import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Crown, Repeat, Activity, Armchair } from 'lucide-react';
import Card from './ui/Card';
import SectionBanner from './ui/SectionBanner';
import { computeSeasonRecords } from '../utils/seasonRecords';

// Ranked season-long boards — the "records" counterpart to SeasonAwards'
// one-manager superlatives. All computation lives in
// utils/seasonRecords.js (tested); this is presentation only. Zero extra
// fetching: everything derives from the gameweekTable the app already
// holds.
const BOARDS = [
  { key: 'weeklyWins', title: 'Most weekly wins', icon: Crown, hint: 'Gameweeks topped, net of hits', valueLabel: 'wins' },
  { key: 'consistency', title: 'Most consistent', icon: Activity, hint: 'Lowest week-to-week spread', valueLabel: '±', lowerIsBetter: true },
  { key: 'benchStrength', title: 'Bench hoarder', icon: Armchair, hint: 'Points left on the bench, season total', valueLabel: 'pts benched' },
  { key: 'mostTransfers', title: 'Busiest transfer market', icon: Repeat, hint: 'Transfers made, season total', valueLabel: 'transfers' },
];

const SeasonRecords = ({ standings = [], gameweekTable = [], loading = false, embedded = false }) => {
  const records = useMemo(
    () => computeSeasonRecords(gameweekTable, standings),
    [gameweekTable, standings]
  );

  if (loading && standings.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-surface-sunk rounded-3xl border-2 border-ink/10 animate-pulse" />
        ))}
      </div>
    );
  }

  const isEmpty = BOARDS.every(({ key }) => records[key].length === 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {!embedded && (
        <SectionBanner
          tone="sky"
          art={<BarChart3 size={20} />}
          eyebrow="Ranked season boards"
          title="Records"
          subtitle="Top five in every category, updated every gameweek"
        />
      )}

      {isEmpty ? (
        <div className="p-12 text-center">
          <BarChart3 className="w-14 h-14 mx-auto mb-4 text-ink/20" />
          <p className="text-lg font-bold text-ink-soft">Records unlock once the first gameweek is in</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {BOARDS.map(({ key, title, icon: Icon, hint, valueLabel, lowerIsBetter }) => {
            const rows = records[key];
            if (rows.length === 0) return null;
            return (
              <Card key={key} className="p-5">
                <h3 className="text-base font-display font-bold text-ink flex items-center gap-2">
                  <Icon size={18} className="text-sky-ink" />
                  {title}
                </h3>
                <p className="text-[13px] font-bold text-ink-soft mt-1.5">{hint}</p>
                <ol className="mt-3 space-y-1.5">
                  {rows.map((row, index) => (
                    <li key={row.id} className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[10px] font-display font-bold ${
                        index === 0 ? 'bg-sunflower text-ink border-2 border-ink/85' : 'bg-surface-sunk text-ink-soft'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-grow truncate text-[13px] font-bold text-ink">{row.name}</span>
                      <span className="shrink-0 text-[13px] font-display font-bold text-pitch-ink tabular-nums">
                        {row.value}
                        <span className="text-[10px] font-bold text-ink-soft ml-1">
                          {lowerIsBetter ? `±${row.value}` : valueLabel}
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
              </Card>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default SeasonRecords;