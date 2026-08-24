import React, { useState, useMemo } from 'react';
import { Calendar, Gift, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from './ui/Card';
import Badge from './ui/Badge';
import SectionBanner from './ui/SectionBanner';
import { CalendarDoodle, RankBadge, Coins } from './ui/Doodles';
import { cn } from '../utils/cn';
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
        <div className="rounded-3xl border-2 border-ink/85 bg-surface-alt px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-3">
          <span className="w-11 h-11 shrink-0 rounded-2xl bg-mint/50 flex items-center justify-center">
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
            <div className="grid grid-cols-4 gap-1.5 w-full sm:w-auto sm:flex sm:items-center sm:gap-2 sm:ml-auto">
              {[
                { value: monthStats.highest, label: 'Highest', tint: 'bg-tangerine/35' },
                { value: monthStats.average, label: 'Average', tint: 'bg-bubblegum/30' },
                { value: `৳${monthStats.totalPrizes}`, label: 'Prizes', tint: 'bg-mint/35' },
                { value: monthStats.participants, label: 'Bros', tint: 'bg-sky/35' },
              ].map((stat) => (
                <span
                  key={stat.label}
                  className={cn('sm:shrink-0 rounded-2xl px-2 sm:px-3 py-1.5 text-center min-w-0', stat.tint)}
                >
                  <span className="block font-display font-bold text-ink leading-none tabular-nums truncate">{stat.value}</span>
                  <span className="block text-[9px] font-bold uppercase tracking-[0.12em] text-ink-soft mt-0.5 truncate">
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
          art={<CalendarDoodle size={20} />}
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

      {/* Month Navigation.
          This was nine 104px pills in an `overflow-x-auto` strip: 1000px wide
          in a 390px viewport, with no fade, arrow or dot to say so. On a phone
          that reads as "the monthly view is broken/empty" depending on which
          month happened to be scrolled into frame — a large part of why the
          monthly prizes were reported missing.

          The FusionPrizesMonthly artboard never had a pill row. It has exactly
          this: a prev/next pair either side of the month's name and gameweek
          window, with one dot per month showing where you are. It fits any
          width, and the dots make the ninth month discoverable without a
          swipe. The dots stay tappable so you can still jump. */}
      <div className="rounded-3xl border-2 border-ink/85 bg-surface-alt p-2.5 sm:p-3 flex items-center gap-2 sm:gap-4">
        <button
          type="button"
          onClick={() => setSelectedMonth(Math.max(months[0].id, selectedMonth - 1))}
          disabled={selectedMonth <= months[0].id}
          aria-label="Previous month"
          className="w-11 h-11 shrink-0 rounded-2xl bg-surface-sunk text-ink-soft flex items-center justify-center btn-pop disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex items-center gap-2.5 flex-grow min-w-0">
          <CalendarDoodle size={24} className="shrink-0 hidden sm:block" />
          <div className="min-w-0">
            <div className="font-display font-bold text-base sm:text-lg text-ink leading-tight truncate">
              {selectedMonthData?.name}
            </div>
            <div className="text-[11px] sm:text-xs font-bold text-ink-soft mt-0.5 truncate">
              Gameweeks {selectedMonthData?.gameweeks[0]}–
              {selectedMonthData?.gameweeks[selectedMonthData.gameweeks.length - 1]}
            </div>
          </div>
        </div>

        {/* One dot per month — the whole nine-month season at a glance. */}
        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          {months.map((month) => {
            const status = getMonthStatus(month);
            return (
              <button
                key={month.id}
                type="button"
                onClick={() => setSelectedMonth(month.id)}
                aria-label={`${month.name}, gameweeks ${month.gameweeks[0]} to ${month.gameweeks[month.gameweeks.length - 1]}`}
                aria-current={selectedMonth === month.id ? 'true' : undefined}
                title={`${month.name} • ${status}`}
                className="p-1 -m-0.5 rounded-full"
              >
                <span
                  className={cn(
                    'block h-2.5 w-2.5 rounded-full transition-colors',
                    selectedMonth === month.id
                      ? 'ring-2 ring-ink/85 ring-offset-1 ring-offset-surface-alt'
                      : '',
                    status === 'completed' ? 'bg-pitch' : status === 'active' ? 'bg-sunflower' : 'bg-ink/20'
                  )}
                />
              </button>
            );
          })}
        </div>

        <span className="sm:hidden shrink-0 text-[11px] font-bold text-ink-soft tabular-nums">
          {selectedMonth} / {months.length}
        </span>

        <button
          type="button"
          onClick={() => setSelectedMonth(Math.min(months[months.length - 1].id, selectedMonth + 1))}
          disabled={selectedMonth >= months[months.length - 1].id}
          aria-label="Next month"
          className="w-11 h-11 shrink-0 rounded-2xl bg-violet/15 text-violet-ink flex items-center justify-center btn-pop disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight size={20} />
        </button>
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
                    <div className="font-display font-bold text-xl text-violet-ink leading-tight">{manager.totalPoints}</div>
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
                                <span className="text-xs text-coral-ink ml-1">(-{detail.transfersCost})</span>
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