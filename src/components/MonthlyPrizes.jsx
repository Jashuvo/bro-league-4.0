import React, { useState, useMemo } from 'react';
import {
  Calendar, Trophy, Crown, Medal, Award, Gift, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from './ui/Card';
import Badge from './ui/Badge';

const MonthlyPrizes = ({ gameweekTable = [], gameweekInfo = {}, bootstrap = {}, loading = false }) => {
  const currentGW = gameweekInfo.current || 3;
  const [expandedRow, setExpandedRow] = useState(null);

  const months = [
    { id: 1, name: "Month 1", gameweeks: [1, 2, 3, 4], prizes: [350, 250, 150] },
    { id: 2, name: "Month 2", gameweeks: [5, 6, 7, 8], prizes: [350, 250, 150] },
    { id: 3, name: "Month 3", gameweeks: [9, 10, 11, 12], prizes: [350, 250, 150] },
    { id: 4, name: "Month 4", gameweeks: [13, 14, 15, 16], prizes: [350, 250, 150] },
    { id: 5, name: "Month 5", gameweeks: [17, 18, 19, 20], prizes: [350, 250, 150] },
    { id: 6, name: "Month 6", gameweeks: [21, 22, 23, 24], prizes: [350, 250, 150] },
    { id: 7, name: "Month 7", gameweeks: [25, 26, 27, 28], prizes: [350, 250, 150] },
    { id: 8, name: "Month 8", gameweeks: [29, 30, 31, 32], prizes: [350, 250, 150] },
    { id: 9, name: "Final Month", gameweeks: [33, 34, 35, 36, 37, 38], prizes: [500, 400, 250] }
  ];

  const [selectedMonth, setSelectedMonth] = useState(() => {
    return months.find(m => currentGW >= m.gameweeks[0] && currentGW <= m.gameweeks[m.gameweeks.length - 1])?.id || 1;
  });

  const toggleRowExpansion = (managerId) => {
    setExpandedRow(expandedRow === managerId ? null : managerId);
  };

  const getPositionIcon = (position) => {
    if (position === 1) return <Crown className="text-yellow-400 fill-yellow-400" size={20} />;
    if (position === 2) return <Medal className="text-gray-300 fill-gray-300" size={20} />;
    if (position === 3) return <Award className="text-orange-400 fill-orange-400" size={20} />;
    return <span className="font-bold text-bro-muted w-5 text-center">{position}</span>;
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

          const netPoints = (manager.gameweekPoints || manager.points || 0) -
            (manager.transfersCost || manager.event_transfers_cost || 0);

          managerTotals[managerId].totalPoints += netPoints;
          managerTotals[managerId].gameweeksPlayed++;
          managerTotals[managerId].details.push({
            gameweek: gw.gameweek,
            points: netPoints,
            rawPoints: manager.gameweekPoints || manager.points || 0,
            transfersCost: manager.transfersCost || manager.event_transfers_cost || 0
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
    const completedGWs = month.gameweeks.filter(gw => gw < currentGW).length;
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
          <div key={i} className="h-20 bg-base-200/50 rounded-xl animate-pulse"></div>
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
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-green-600 to-teal-600 border-none">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-lg">
              <Calendar size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-display font-bold">Monthly Competitions</h2>
              <p className="text-white/80 text-lg">
                {selectedMonthData?.name} • GW {selectedMonthData?.gameweeks[0]}-{selectedMonthData?.gameweeks[selectedMonthData.gameweeks.length - 1]}
              </p>
            </div>
          </div>

          <Badge
            variant={monthStatus === 'completed' ? 'success' : monthStatus === 'active' ? 'primary' : 'warning'}
            className="px-4 py-2 text-sm bg-white/20 border-white/20 text-white backdrop-blur-md"
          >
            <Gift size={16} className="mr-2" />
            {monthStatus === 'completed' ? 'Complete' : monthStatus === 'active' ? 'Active' : 'Upcoming'}
          </Badge>
        </div>

        {monthStats.highest && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <StatBox value={monthStats.highest} label="Highest Total" />
            <StatBox value={monthStats.average} label="Average" />
            <StatBox value={`৳${monthStats.totalPrizes}`} label="Total Prizes" />
            <StatBox value={monthStats.participants} label="Participants" />
          </div>
        )}
      </Card>

      {/* Month Navigation */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-2 min-w-max">
          {months.map(month => {
            const status = getMonthStatus(month);
            const isSelected = selectedMonth === month.id;
            return (
              <button
                key={month.id}
                onClick={() => setSelectedMonth(month.id)}
                className={`
                  flex flex-col items-center justify-center p-3 rounded-xl min-w-[100px] transition-all duration-300 border
                  ${isSelected
                    ? 'bg-bro-primary text-white border-bro-primary shadow-lg scale-105'
                    : 'bg-base-200 hover:bg-base-content/5 border-base-content/5 text-base-content/60 hover:text-base-content'
                  }
                `}
              >
                <span className="font-bold text-sm">{month.name}</span>
                <span className="text-[10px] opacity-70 mt-1">GW {month.gameweeks[0]}-{month.gameweeks[month.gameweeks.length - 1]}</span>
                <div className="mt-1">
                  {status === 'completed' && '✅'}
                  {status === 'active' && '🔄'}
                  {status === 'upcoming' && '⏳'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Standings List */}
      <div className="space-y-3">
        {!monthlyStandings || monthlyStandings.length === 0 ? (
          <div className="p-12 text-center text-bro-muted">
            <Calendar className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg">No data available for {selectedMonthData?.name}</p>
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
                className={`p-0 overflow-hidden transition-all duration-300 ${expandedRow === manager.id ? 'ring-2 ring-bro-primary' : 'hover:bg-white/5'}`}
              >
                <div
                  className="p-4 flex items-center gap-4 cursor-pointer"
                  onClick={() => toggleRowExpansion(manager.id)}
                >
                  <div className="flex-shrink-0 w-8 flex justify-center">
                    {getPositionIcon(manager.position)}
                  </div>

                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-bold text-lg truncate ${manager.position <= 3 ? 'text-white' : 'text-bro-text'}`}>
                        {manager.name}
                      </h3>
                      {manager.position <= 3 && getPositionIcon(manager.position)}
                    </div>
                    <p className="text-bro-muted text-sm truncate">{manager.teamName}</p>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-xl text-bro-primary">{manager.totalPoints}</div>
                    <div className="text-xs text-bro-muted">Total</div>
                  </div>

                  <ChevronRight
                    className={`text-bro-muted transition-transform duration-300 ${expandedRow === manager.id ? 'rotate-90' : ''}`}
                    size={20}
                  />
                </div>

                <AnimatePresence>
                  {expandedRow === manager.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="bg-black/20 border-t border-white/5 p-4"
                    >
                      <h4 className="font-bold text-white mb-3 text-sm uppercase tracking-wider">Gameweek Breakdown</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        {manager.details.map((detail, idx) => (
                          <div key={idx} className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
                            <div className="text-xs text-bro-muted">GW {detail.gameweek}</div>
                            <div className="font-bold text-white">{detail.points}</div>
                          </div>
                        ))}
                      </div>

                      {manager.prize > 0 && (
                        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2 text-green-400">
                          <Trophy size={18} />
                          <span className="font-bold">
                            {manager.position === 1 ? 'Monthly Champion' : manager.position === 2 ? 'Runner-up' : 'Third Place'} - ৳{manager.prize} Prize!
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

const StatBox = ({ value, label }) => (
  <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm border border-white/10">
    <div className="text-xl font-bold text-white">{value}</div>
    <div className="text-xs font-medium text-white/80">{label}</div>
  </div>
);

export default MonthlyPrizes;