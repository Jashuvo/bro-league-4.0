import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Award } from 'lucide-react';
import Card from './ui/Card';
import { computeRankHistory } from '../utils/rankHistory';

// Every award here is derived from `standings` + `gameweekTable`, both of
// which the app already has in state by the time this tab is visible — no
// extra fetching. Superlatives fill in progressively as more gameweeks
// complete; the season leader/wooden spoon always show once standings load.
const SeasonAwards = ({ standings = [], gameweekTable = [], loading = false }) => {
  const awards = useMemo(() => {
    if (standings.length === 0) return [];

    const list = [];
    const byId = Object.fromEntries(standings.map((m) => [String(m.id || m.entry), m]));

    const sortedByTotal = [...standings].sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
    if (sortedByTotal.length > 0) {
      const leader = sortedByTotal[0];
      list.push({ emoji: '👑', title: 'Season Leader', manager: leader, detail: `${leader.totalPoints} pts` });

      const last = sortedByTotal[sortedByTotal.length - 1];
      if (last && last !== leader) {
        list.push({ emoji: '🥄', title: 'Wooden Spoon', manager: last, detail: `${last.totalPoints} pts` });
      }
    }

    if (gameweekTable.length > 0) {
      const acc = {};
      const ensure = (id) => {
        if (!acc[id]) acc[id] = { hits: 0, bench: 0, scores: [] };
        return acc[id];
      };

      let highestGw = null;
      let lowestGw = null;

      gameweekTable.forEach((gw) => {
        (gw.managers || []).forEach((m) => {
          const id = String(m.id);
          const entry = ensure(id);
          const net = (m.points || 0) - (m.transferCost || 0);
          entry.hits += m.transferCost || 0;
          entry.bench += m.benchPoints || 0;
          entry.scores.push(net);

          if (!highestGw || net > highestGw.net) highestGw = { id, gw: gw.gameweek, net };
          if (!lowestGw || net < lowestGw.net) lowestGw = { id, gw: gw.gameweek, net };
        });
      });

      if (highestGw && byId[highestGw.id]) {
        list.push({
          emoji: '🔥',
          title: 'Highest Single Gameweek',
          manager: byId[highestGw.id],
          detail: `${highestGw.net} pts in GW${highestGw.gw}`,
        });
      }
      if (lowestGw && byId[lowestGw.id] && lowestGw.id !== highestGw?.id) {
        list.push({
          emoji: '💀',
          title: 'Worst Gameweek',
          manager: byId[lowestGw.id],
          detail: `${lowestGw.net} pts in GW${lowestGw.gw}`,
        });
      }

      const hitLeader = Object.entries(acc).sort((a, b) => b[1].hits - a[1].hits)[0];
      if (hitLeader && hitLeader[1].hits > 0 && byId[hitLeader[0]]) {
        list.push({
          emoji: '💸',
          title: 'Hit Man',
          manager: byId[hitLeader[0]],
          detail: `-${hitLeader[1].hits} pts in transfer hits`,
        });
      }

      const benchLeader = Object.entries(acc).sort((a, b) => b[1].bench - a[1].bench)[0];
      if (benchLeader && benchLeader[1].bench > 0 && byId[benchLeader[0]]) {
        list.push({
          emoji: '🪑',
          title: 'Bench Warmer',
          manager: byId[benchLeader[0]],
          detail: `${benchLeader[1].bench} pts stuck on the bench`,
        });
      }

      const consistent = Object.entries(acc)
        .filter(([, v]) => v.scores.length >= 3)
        .map(([id, v]) => {
          const avg = v.scores.reduce((s, x) => s + x, 0) / v.scores.length;
          const variance = v.scores.reduce((s, x) => s + (x - avg) ** 2, 0) / v.scores.length;
          return { id, stddev: Math.sqrt(variance) };
        })
        .sort((a, b) => a.stddev - b.stddev)[0];
      if (consistent && byId[consistent.id]) {
        list.push({
          emoji: '🎯',
          title: 'Mr. Consistent',
          manager: byId[consistent.id],
          detail: `±${consistent.stddev.toFixed(1)} pts week to week`,
        });
      }

      const rankHistory = computeRankHistory(gameweekTable);
      const movers = Object.entries(rankHistory)
        .filter(([, h]) => h.length >= 2)
        .map(([id, h]) => ({ id, delta: h[0].rank - h[h.length - 1].rank }));

      const riser = [...movers].sort((a, b) => b.delta - a.delta)[0];
      if (riser && riser.delta > 0 && byId[riser.id]) {
        list.push({
          emoji: '🚀',
          title: 'Most Improved',
          manager: byId[riser.id],
          detail: `Climbed ${riser.delta} place${riser.delta === 1 ? '' : 's'} this season`,
        });
      }

      const faller = [...movers].sort((a, b) => a.delta - b.delta)[0];
      if (faller && faller.delta < 0 && faller.id !== riser?.id && byId[faller.id]) {
        list.push({
          emoji: '📉',
          title: 'Free Fall',
          manager: byId[faller.id],
          detail: `Dropped ${Math.abs(faller.delta)} place${Math.abs(faller.delta) === 1 ? '' : 's'} this season`,
        });
      }
    }

    return list;
  }, [standings, gameweekTable]);

  if (loading && standings.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-base-200/50 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Card className="bg-gradient-to-r from-bro-primary to-bro-secondary border-none">
        <div className="flex items-center gap-4 text-white">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-lg">
            <Award size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-display font-bold">Season Awards</h2>
            <p className="text-white/80 text-lg">The superlatives nobody asked for, updated every gameweek</p>
          </div>
        </div>
      </Card>

      {awards.length === 0 ? (
        <div className="p-12 text-center text-bro-muted">
          <Award className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg">Awards unlock once the season gets going</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {awards.map((award, index) => (
            <motion.div
              key={award.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="flex items-center gap-4 hover:bg-base-content/5 transition-colors">
                <div className="text-3xl flex-shrink-0">{award.emoji}</div>
                <div className="flex-grow min-w-0">
                  <div className="text-xs text-bro-muted uppercase tracking-wider font-bold mb-0.5">{award.title}</div>
                  <div className="font-bold text-base-content truncate">
                    {award.manager.managerName || award.manager.player_name}
                  </div>
                  <div className="text-sm text-bro-primary font-medium">{award.detail}</div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default SeasonAwards;
