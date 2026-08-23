import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import Card from './ui/Card';
import { computeRankHistory } from '../utils/rankHistory';

// A one-glance, auto-generated recap of a gameweek — built entirely from
// data the app already has (gameweekTable), no extra fetching. The whole
// point is to turn a leaderboard into something worth screenshotting into
// the group chat.
const WeeklyStory = ({ gameweekTable = [], gameweek }) => {
  const beats = useMemo(() => {
    const gw = gameweekTable.find((g) => g.gameweek === gameweek);
    const managers = (gw?.managers || []).map((m) => ({
      ...m,
      net: (m.points || 0) - (m.transferCost || 0),
    }));

    if (managers.length === 0) return [];

    const list = [];
    const byNet = [...managers].sort((a, b) => b.net - a.net);
    const top = byNet[0];
    const bottom = byNet[byNet.length - 1];

    if (top) {
      list.push({
        emoji: '🔥',
        text: <><strong>{top.managerName || top.name}</strong> topped the gameweek with <strong>{top.net} pts</strong></>,
      });
    }

    if (byNet.length > 1) {
      const runnerUp = byNet[1];
      const margin = top.net - runnerUp.net;
      if (margin <= 3) {
        list.push({
          emoji: '⚔️',
          text: <><strong>{top.managerName || top.name}</strong> just edged out <strong>{runnerUp.managerName || runnerUp.name}</strong> by {margin} point{margin === 1 ? '' : 's'}</>,
        });
      }
    }

    if (bottom && bottom.id !== top.id) {
      list.push({
        emoji: '💀',
        text: <><strong>{bottom.managerName || bottom.name}</strong> picked up the wooden spoon with just <strong>{bottom.net} pts</strong></>,
      });
    }

    const benchLeader = [...managers].sort((a, b) => (b.benchPoints || 0) - (a.benchPoints || 0))[0];
    if (benchLeader && benchLeader.benchPoints > 10) {
      list.push({
        emoji: '🪑',
        text: <><strong>{benchLeader.managerName || benchLeader.name}</strong> left <strong>{benchLeader.benchPoints} pts</strong> stranded on the bench</>,
      });
    }

    const hitLeader = [...managers].sort((a, b) => (b.transferCost || 0) - (a.transferCost || 0))[0];
    if (hitLeader && hitLeader.transferCost > 0) {
      list.push({
        emoji: '💸',
        text: <><strong>{hitLeader.managerName || hitLeader.name}</strong> paid <strong>-{hitLeader.transferCost} pts</strong> in transfer hits</>,
      });
    }

    // Biggest league-position mover, compared to the previous gameweek.
    const rankHistory = computeRankHistory(gameweekTable);
    const movers = Object.entries(rankHistory)
      .map(([id, hist]) => {
        const idx = hist.findIndex((h) => h.gw === gameweek);
        if (idx < 1) return null; // no prior gameweek to compare against
        return { id, delta: hist[idx - 1].rank - hist[idx].rank, rank: hist[idx].rank };
      })
      .filter(Boolean);

    if (movers.length > 0) {
      const byId = Object.fromEntries(managers.map((m) => [String(m.id), m]));
      const riser = [...movers].sort((a, b) => b.delta - a.delta)[0];
      if (riser?.delta > 0 && byId[riser.id]) {
        list.push({
          emoji: '🚀',
          text: <><strong>{byId[riser.id].managerName || byId[riser.id].name}</strong> climbed {riser.delta} spot{riser.delta === 1 ? '' : 's'} to #{riser.rank}</>,
        });
      }
      const faller = [...movers].sort((a, b) => a.delta - b.delta)[0];
      if (faller?.delta < 0 && faller.id !== riser?.id && byId[faller.id]) {
        list.push({
          emoji: '📉',
          text: <><strong>{byId[faller.id].managerName || byId[faller.id].name}</strong> dropped {Math.abs(faller.delta)} spot{Math.abs(faller.delta) === 1 ? '' : 's'} to #{faller.rank}</>,
        });
      }
    }

    return list;
  }, [gameweekTable, gameweek]);

  if (beats.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <h3 className="text-lg font-bold text-base-content flex items-center gap-2 mb-4">
          <BookOpen className="text-bro-primary" size={20} />
          This Week&rsquo;s Story
        </h3>
        <ul className="space-y-2.5">
          {beats.map((beat, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-base-content">
              <span className="text-lg leading-none flex-shrink-0">{beat.emoji}</span>
              <span className="leading-relaxed">{beat.text}</span>
            </li>
          ))}
        </ul>
      </Card>
    </motion.div>
  );
};

export default WeeklyStory;
