import React from 'react';
import { motion } from 'framer-motion';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

// The "per period / periods done / progress bar" block. Weekly and Monthly
// each had their own copy of this markup side by side in the old Prize
// Distribution tab; now that they're separate segmented views, they share it.
const ProgressCard = ({
  art,
  title,
  badge,
  badgeVariant = 'info',
  amountLabel,
  amountValue,
  amountColor = 'text-sky-ink',
  amountTone = 'bg-sky/12',
  countLabel,
  countValue,
  progress = 0,
  progressColor = 'bg-sky',
  progressTextColor = 'text-sky-ink',
}) => (
  <Card className="h-full">
    <div className="flex items-center justify-between gap-3 mb-5">
      <h3 className="text-lg font-display font-bold text-ink flex items-center gap-2">
        {art}
        {title}
      </h3>
      {badge && <Badge variant={badgeVariant}>{badge}</Badge>}
    </div>

    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div className={`${amountTone} border-2 border-ink/15 p-3 rounded-2xl text-center`}>
          <div className={`text-xl font-display font-bold ${amountColor}`}>{amountValue}</div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">{amountLabel}</div>
        </div>
        <div className="bg-surface-sunk border-2 border-ink/15 p-3 rounded-2xl text-center">
          <div className="text-xl font-display font-bold text-ink">{countValue}</div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">{countLabel}</div>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-sm font-bold mb-2">
          <span className="text-ink-soft">Progress</span>
          <span className={progressTextColor}>{Math.round(progress)}%</span>
        </div>
        <div className="h-3 bg-surface-sunk rounded-full border-2 border-ink/85 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className={`h-full ${progressColor}`}
          />
        </div>
      </div>
    </div>
  </Card>
);

export default ProgressCard;
