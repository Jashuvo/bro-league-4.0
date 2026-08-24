import React, { useState, useMemo } from 'react';
import { Calendar, Gift, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from './ui/Card';
import Badge from './ui/Badge';
import SectionBanner from './ui/SectionBanner';
import { CalendarDoodle, RankBadge, Coins } from './ui/Doodles';
import { monthlyWindows, prizeStructure } from '../data/leagueData';

// `embedded` is set when this renders inside the Prizes destination, which
// already carries the pool-level SectionBanner. In that mode the full banner
// would be a second, redundant page header, so the month context it holds
// (name, gameweek window, status, stats) collapses into one compact strip —
// the same "no banner of my own" contract WeeklyPrizes/SeasonPrizes follow.
const MonthlyPrizes = ({ gameweekTable = [], gameweekInfo = {}, loading = false, embedded = false }) => {
  const currentGW = gameweekInfo.current || 1;
  const [expandedRow, setExpandedRow] = useState(null);

  const months = useMemo(() => monthlyWindows.map((window) => ({
    id: window.id,
    name: window.name,
    gameweeks: Array.from({ length: window.end - window.start + 1 }, (_, i) => window.start + i),
    prizes: window.isFinal ? prizeStructure.monthly.finalMonth : prizeStructure.monthly.regularPrizes
  })), []);

  const [selectedMonth, setSelectedMonth] = useState(() => {
    return months.find(m => currentGW >= m.gameweeks[0] && currentGW <= m.gameweeks[m.gameweeks.length - 1])?.id || 1;
  });

  const toggleRowExpansion = (managerId) => {
    setExpandedRow(expandedRow === managerId ? null : managerId);
  };

  const monthlyStandings = useMemo(() => {
    const selectedMonthData = months.find(m => m.id === selectedMonth);
    if (!selectedMonthData || !gameweekTable.length) return [];

    const monthGameweeks = gameweekTable.filter(gw =>
      selectedMonthData.gameweeks.includes(gw.gameweek)
    );

    if (monthGameweeks.length === 0) return [];

    const managerTotals = {};

    monthGameweeks.forEach(gw => {
      if (gw.managers) {
        gw.managers.forEach(manager => {
          const managerId = manager.id || manager.entry;
          if (!managerTotals[managerId]) {
            managerTotals[managerId] = {
              id: managerId,
              name: manager.managerName || manager.name,
              teamName: manager.teamName || manager.entry_name,
              totalPoints: 0,
              gameweeksPlayed: 0,
              details: []
            };
          }

          const rawPoints = manager.gameweekPoints || manager.points || 0;
          const transfersCost = manager.transfersCost || manager.event_transfers_cost || manager.transferCost || 0;
          const netPoints = rawPoints - transfersCost;

          managerTotals[managerId].totalPoints += netPoints;
          managerTotals[managerId].gameweeksPlayed++;
          managerTotals[managerId].details.push({
            gameweek: gw.gameweek,
            points: netPoints,
            rawPoints: rawPoints,
            transfersCost: transfersCost
          });
        });
      }
    });

    return Object.values(managerTotals)
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((manager, index) => ({
        ...manager,
        position: index + 1,
        averagePoints: Math.round(manager.totalPoints / (manager.gameweeksPlayed || 1)),
        prize: index < selectedMonthData.prizes.length ? selectedMonthData.prizes[index] : 0
      }));
  }, [gameweekTable, selectedMonth, months]);

  const monthStats = useMemo(() => {
    if (monthlyStandings.length === 0) return {};
    const allPoints = monthlyStandings.map(m => m.totalPoints);
    const totalPrizes = months.find(m => m.id === selectedMonth)?.prizes.reduce((sum, prize) => sum + prize, 0) || 0;
    return {
      highest: Math.max(...allPoints),
      average: Math.round(allPoints.reduce((sum, points) => sum + points, 0) / allPoints.length),
      totalPrizes,
      participants: monthlyStandings.length
    };
  }, [monthlyStandings, selectedMonth, months]);

  const getMonthStatus = (month) => {
    const lastCompletedGW = gameweekInfo.isFinished ? currentGW : currentGW - 1;
    const completedGWs = month.gameweeks.filter(gw => gw <= lastCompletedGW).length;
    const totalGWs = month.gameweeks.length;
    if (completedGWs === totalGWs) return 'completed';
    if (completedGWs > 0) return 'active';
    return 'upcoming';
  };

  const selectedMonthData = months.find(m => m.id === selectedMonth);
  const monthStatus = getMonthStatus(selectedMonthData);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-surface-sunk rounded-3xl border-2 border-ink/10 animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header — full banner standalone, compact strip when embedded */}
      {embedded ? (
        <div className="rounded-3xl border-2 border-ink/85 bg-surface-alt shadow-card px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-3">
          <span className="w-11 h-11 shrink-0 rounded-2xl bg-mint border-2 border-ink/85 flex items-center justify-center">
            <CalendarDoodle size={24} />
          </span>
          <div className="min-w-0">
            <h3 className="font-display font-bold text-lg text-ink leading-tight truncate">
              {selectedMonthData?.name}
            </h3>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-soft">
              GW {selectedMonthData?.gameweeks[0]}-{selectedMonthData?.gameweeks[selectedMonthData.gameweeks.length - 1]}
            </p>
          </div>

          <Badge
            variant={monthStatus === 'completed' ? 'success' : monthStatus === 'active' ? 'gold' : 'default'}
            className="shrink-0"
          >
            <Gift size={14} />
            {monthStatus === 'completed' ? 'Complete' : monthStatus === 'active' ? 'Active' : 'Upcoming'}
          </Badge>

          {monthStats.highest && (
            <div className="flex items-center gap-2 ml-auto overflow-x-auto scrollbar-none">
              {[
                { value: monthStats.highest, label: 'Highest' },
                { value: monthStats.average, label: 'Average' },
                { value: `৳${monthStats.totalPrizes}`, label: 'Prizes' },
                { value: monthStats.participants, label: 'Bros' },
              ].map((stat) => (
                <span
                  key={stat.label}
                  className="shrink-0 rounded-2xl border-2 border-ink/15 bg-surface-sunk px-3 py-1.5 text-center"
                >
                  <span className="block font-display font-bold text-ink leading-none tabular-nums">{stat.value}</span>
                  <span className="block text-[9px] font-bold uppercase tracking-[0.14em] text-ink-soft mt-0.5">
                    {stat.label}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <SectionBanner
          tone="mint"
          art={<CalendarDoodle size={34} />}
          title="Monthly Competitions"
          subtitle={`${selectedMonthData?.name} • GW ${selectedMonthData?.gameweeks[0]}-${selectedMonthData?.gameweeks[selectedMonthData.gameweeks.length - 1]}`}
          stats={monthStats.highest ? [
            { value: monthStats.highest, label: 'Highest Total' },
            { value: monthStats.average, label: 'Average' },
            { value: `৳${monthStats.totalPrizes}`, label: 'Total Prizes' },
            { value: monthStats.participants, label: 'Participants' },
          ] : []}
          actions={
            <Badge
              variant={monthStatus === 'completed' ? 'success' : monthStatus === 'active' ? 'gold' : 'default'}
              className="px-3 py-1.5 text-sm"
            >
              <Gift size={14} />
              {monthStatus === 'completed' ? 'Complete' : monthStatus === 'active' ? 'Active' : 'Upcoming'}
            </Badge>
          }
        />
      )}

      {/* Month Navigation */}
      <div className="overflow-x-auto scrollbar-none pb-2">
        <div className="flex gap-2 min-w-max">
          {months.map(month => {
            const status = getMonthStatus(month);
            const isSelected = selectedMonth === month.id;
            return (
              <button
                key={month.id}
                onClick={() => setSelectedMonth(month.id)}
                className={`
                  flex flex-col items-center justify-center p-3 rounded-2xl min-w-[104px] border-2 border-ink/85 transition-colors duration-200
                  ${isSelected
                    ? 'bg-violet text-white shadow-pop-sm'
                    : 'bg-surface-alt text-ink-soft hover:bg-surface-sunk shadow-card'
                  }
                `}
              >
                <span className="font-display font-bold text-sm">{month.name}</span>
                <span className="text-[10px] font-semibold opacity-80 mt-0.5">GW {month.gameweeks[0]}-{month.gameweeks[month.gameweeks.length - 1]}</span>
                <span
                  className={`mt-1.5 h-2 w-2 rounded-full ${status === 'completed' ? 'bg-pitch' : status === 'active' ? 'bg-sunflower' : 'bg-ink/25'}`}
                  title={status}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Standings List */}
      <div className="space-y-3">
        {!monthlyStandings || monthlyStandings.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-14 h-14 mx-auto mb-4 text-ink/20" />
            <p className="text-lg font-bold text-ink-soft">No data available for {selectedMonthData?.name}</p>
          </div>
        ) : (
          monthlyStandings.map((manager, index) => (
            <motion.div
              key={manager.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                tone={manager.position === 1 ? 'sunflower' : manager.position === 2 ? 'mint' : manager.position === 3 ? 'coral' : 'paper'}
                className={`p-0 overflow-hidden transition-colors duration-300 ${expandedRow === manager.id ? 'bg-surface-sunk' : 'hover:bg-surface-sunk/60'}`}
              >
                <div
                  className="p-3 md:p-4 flex items-center gap-3 md:gap-4 cursor-pointer"
                  onClick={() => toggleRowExpansion(manager.id)}
                >
                  <RankBadge rank={manager.position} size={manager.position <= 3 ? 44 : 38} className="shrink-0" />

                  <div className="flex-grow min-w-0">
                    <h3 className="font-display font-bold text-lg truncate text-ink">
                      {manager.name}
                    </h3>
                    <p className="text-ink-soft text-sm font-medium truncate">{manager.teamName}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-display font-bold text-xl text-violet leading-tight">{manager.totalPoints}</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">Total</div>
                  </div>

                  <ChevronRight
                    className={`text-ink-soft shrink-0 transition-transform duration-300 ${expandedRow === manager.id ? 'rotate-90' : ''}`}
                    size={20}
                  />
                </div>

                <AnimatePresence>
                  {expandedRow === manager.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="bg-surface-sunk border-t-2 border-dashed border-ink/15 p-4"
                    >
                      <h4 className="font-display font-bold text-ink mb-3 text-xs uppercase tracking-[0.14em]">Gameweek Breakdown</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        {manager.details.map((detail, idx) => (
                          <div key={idx} className="bg-surface-alt rounded-2xl p-2 text-center border-2 border-ink/15">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">GW {detail.gameweek}</div>
                            <div className="font-display font-bold text-ink">
                              {detail.points}
                              {detail.transfersCost > 0 && (
                                <span className="text-xs text-coral ml-1">(-{detail.transfersCost})</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {manager.prize > 0 && (
                        <div className="p-3 bg-sunflower rounded-2xl border-2 border-ink/85 flex items-center gap-3 text-ink">
                          <Coins size={24} />
                          <span className="font-display font-bold">
                            {manager.position === 1 ? 'Monthly Champion' : manager.position === 2 ? 'Runner-up' : 'Third Place'} — ৳{manager.prize} Prize!
                          </span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default MonthlyPrizes;