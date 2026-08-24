import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Award } from 'lucide-react';
import Card from './ui/Card';
import SectionBanner from './ui/SectionBanner';
import { Medal } from './ui/Doodles';
import { computeRankHistory } from '../utils/rankHistory';

// Every award here is derived from `standings` + `gameweekTable`, both of
// which the app already has in state by the time this tab is visible — no
// extra fetching. Superlatives fill in progressively as more gameweeks
// complete; the season leader/wooden spoon always show once standings load.
// `embedded` is set when this renders inside the More destination, whose own
// SectionBanner already names the section — see MoreHub.jsx.
const SeasonAwards = ({ standings = [], gameweekTable = [], loading = false, embedded = false }) => {
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
          <div key={i} className="h-28 bg-surface-sunk rounded-3xl border-2 border-ink/10 animate-pulse" />
        ))}
      </div>
    );
  }

  const TONES = ['sunflower', 'coral', 'mint', 'sky', 'violet'];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {!embedded && (
        <SectionBanner
          tone="sunflower"
          art={<Medal size={34} />}
          title="Season Awards"
          subtitle="The superlatives nobody asked for, updated every gameweek"
        />
      )}

      {awards.length === 0 ? (
        <div className="p-12 text-center">
          <Award className="w-14 h-14 mx-auto mb-4 text-ink/20" />
          <p className="text-lg font-bold text-ink-soft">Awards unlock once the season gets going</p>
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
              <Card tone={TONES[index % TONES.length]} className="flex items-center gap-4 p-5">
                <span className="w-12 h-12 shrink-0 rounded-2xl bg-surface-sunk border-2 border-ink/85 flex items-center justify-center text-2xl">
                  {award.emoji}
                </span>
                <div className="flex-grow min-w-0">
                  <div className="text-[10px] text-ink-soft uppercase tracking-[0.14em] font-bold mb-0.5">{award.title}</div>
                  <div className="font-display font-bold text-ink truncate">
                    {award.manager.managerName || award.manager.player_name}
                  </div>
                  <div className="text-sm text-violet font-bold">{award.detail}</div>
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
