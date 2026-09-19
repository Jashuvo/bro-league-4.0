import React, { useMemo } from 'react';
import { Repeat } from 'lucide-react';
import Card from './ui/Card';

// THIS gameweek's transfer activity — read from the per-manager row the
// gameweekTable already carries for the gameweek the panel is showing, no
// new fetching. This used to sum `transfers` across EVERY gameweek in the
// table (a season-wide total) while living inside a per-gameweek Insights
// panel, so a manager with 2 transfers this week but 4 across the season
// read as "4" — a season figure nobody was asking for. Now scoped to the
// named gameweek; the season total is kept only as a small context line.
// Both consumers (GameweekTable's Insights accordion and the mobile Insights
// sheet via InsightsFAB) already pass their gameweek in.
const TransferLeaderboard = ({ gameweekTable = [], gameweek }) => {
  const leaderboard = useMemo(() => {
    // No gameweek named (neither caller does this today) falls back to the
    // LATEST gameweek in the table — deliberately not a season total, so
    // this card can never quietly turn back into the old misleading sum.
    const gw = gameweek ?? Math.max(...gameweekTable.map(g => g.gameweek), 0);
    const row = gameweekTable.find(g => g.gameweek === gw);
    if (!row?.managers) return [];

    // Season totals, only for the "(N this season)" context line — the
    // ranking itself is this gameweek's transfers, hits breaking ties.
    const seasonTotals = {};
    gameweekTable.forEach((g) => {
      g.managers?.forEach((manager) => {
        seasonTotals[manager.id] = (seasonTotals[manager.id] || 0) + (manager.transfers || 0);
      });
    });

    return row.managers
      .map((manager) => ({
        id: manager.id,
        name: manager.managerName || manager.name,
        teamName: manager.teamName,
        gameweekTransfers: manager.transfers || 0,
        hits: manager.transferCost || 0,
        seasonTotal: seasonTotals[manager.id] || 0
      }))
      .filter((m) => m.gameweekTransfers > 0)
      .sort((a, b) =>
        b.gameweekTransfers - a.gameweekTransfers || b.seasonTotal - a.seasonTotal
      )
      .slice(0, 5);
  }, [gameweekTable, gameweek]);

  if (leaderboard.length === 0) return null;

  return (
    <Card>
      <h3 className="text-lg font-display font-bold text-ink flex items-center gap-2 mb-3 flex-wrap">
        <Repeat className="text-mint-ink" size={18} />
        <span>Busiest in the transfer market</span>
        {gameweek != null && (
          <span className="text-[11px] font-bold text-ink-soft">· Gameweek {gameweek}</span>
        )}
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
                {manager.hits > 0 && (
                  <div className="text-[11px] font-bold text-coral-ink">-{manager.hits} pts in hits</div>
                )}
                {manager.seasonTotal > manager.gameweekTransfers && (
                  <div className="text-[10px] font-semibold text-ink-soft">
                    {manager.seasonTotal} this season
                  </div>
                )}
              </div>
            </div>
            <div className="text-lg font-display font-bold text-pitch-ink shrink-0 tabular-nums">
              {manager.gameweekTransfers}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default TransferLeaderboard;
