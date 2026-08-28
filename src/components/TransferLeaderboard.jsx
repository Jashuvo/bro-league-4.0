import React, { useMemo } from 'react';
import { Repeat } from 'lucide-react';
import Card from './ui/Card';

// Season-wide transfer activity — reshaped from the per-gameweek
// `transfers` figure that's already in gameweekTable, no new fetching.
// Extracted out of GameweekTable so the same card can render inside the
// mobile Insights sheet without duplicating the computation.
const TransferLeaderboard = ({ gameweekTable = [] }) => {
  const leaderboard = useMemo(() => {
    const totals = {};
    gameweekTable.forEach((gw) => {
      gw.managers?.forEach((manager) => {
        const id = manager.id;
        if (!totals[id]) {
          totals[id] = {
            id,
            name: manager.managerName || manager.name,
            teamName: manager.teamName,
            totalTransfers: 0,
            totalHits: 0
          };
        }
        totals[id].totalTransfers += manager.transfers || 0;
        totals[id].totalHits += manager.transferCost || 0;
      });
    });

    return Object.values(totals)
      .filter((m) => m.totalTransfers > 0)
      .sort((a, b) => b.totalTransfers - a.totalTransfers)
      .slice(0, 5);
  }, [gameweekTable]);

  if (leaderboard.length === 0) return null;

  return (
    <Card>
      <h3 className="text-lg font-display font-bold text-ink flex items-center gap-2 mb-3">
        <Repeat className="text-mint-ink" size={18} />
        Busiest in the transfer market
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {leaderboard.map((manager, index) => (
          <div key={manager.id} className="bg-mint/25 rounded-2xl p-2.5 flex items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-mint text-ink flex items-center justify-center font-bold text-xs shrink-0">
                {index + 1}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-ink text-[13px] truncate">{manager.name}</div>
                {manager.totalHits > 0 && (
                  <div className="text-[11px] font-bold text-coral-ink">-{manager.totalHits} pts in hits</div>
                )}
              </div>
            </div>
            <div className="text-lg font-display font-bold text-pitch-ink shrink-0 tabular-nums">
              {manager.totalTransfers}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default TransferLeaderboard;
