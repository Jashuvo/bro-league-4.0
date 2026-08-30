import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import Card from './ui/Card';
import { Boot, CornerFlags, Coins, FormArrow, Bench } from './ui/Doodles';
import { computeRankHistory } from '../utils/rankHistory';

// A one-glance, auto-generated recap of a gameweek — built entirely from
// data the app already has (gameweekTable), no extra fetching. The whole
// point is to turn a leaderboard into something worth screenshotting into
// the group chat.
const WeeklyStory = ({ gameweekTable = [], gameweek, standings = [] }) => {
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
        art: <Boot size={26} />, tint: 'bg-tangerine/40',
        text: <><strong>{top.managerName || top.name}</strong> topped the gameweek with <strong>{top.net} pts</strong></>,
      });
    }

    if (byNet.length > 1) {
      const runnerUp = byNet[1];
      const margin = top.net - runnerUp.net;
      if (margin <= 3) {
        list.push({
          art: <CornerFlags size={26} />, tint: 'bg-sky/40',
          text: <><strong>{top.managerName || top.name}</strong> just edged out <strong>{runnerUp.managerName || runnerUp.name}</strong> by {margin} point{margin === 1 ? '' : 's'}</>,
        });
      }
    }

    if (bottom && bottom.id !== top.id) {
      list.push({
        art: <FormArrow size={26} direction="down" />, tint: 'bg-bubblegum/35',
        text: <><strong>{bottom.managerName || bottom.name}</strong> picked up the wooden spoon with just <strong>{bottom.net} pts</strong></>,
      });
    }

    const benchLeader = [...managers].sort((a, b) => (b.benchPoints || 0) - (a.benchPoints || 0))[0];
    if (benchLeader && benchLeader.benchPoints > 10) {
      list.push({
        art: <Bench size={26} />, tint: 'bg-sunflower/40',
        text: <><strong>{benchLeader.managerName || benchLeader.name}</strong> left <strong>{benchLeader.benchPoints} pts</strong> stranded on the bench</>,
      });
    }

    const hitLeader = [...managers].sort((a, b) => (b.transferCost || 0) - (a.transferCost || 0))[0];
    if (hitLeader && hitLeader.transferCost > 0) {
      list.push({
        art: <Coins size={26} />, tint: 'bg-coral/25',
        text: <><strong>{hitLeader.managerName || hitLeader.name}</strong> paid <strong>-{hitLeader.transferCost} pts</strong> in transfer hits</>,
      });
    }

    // Biggest league-position mover, compared to the previous gameweek.
    const rankHistory = computeRankHistory(gameweekTable, standings);
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
          art: <FormArrow size={26} direction="up" />, tint: 'bg-mint/40',
          text: <><strong>{byId[riser.id].managerName || byId[riser.id].name}</strong> climbed {riser.delta} spot{riser.delta === 1 ? '' : 's'} to #{riser.rank}</>,
        });
      }
      const faller = [...movers].sort((a, b) => a.delta - b.delta)[0];
      if (faller?.delta < 0 && faller.id !== riser?.id && byId[faller.id]) {
        list.push({
          art: <FormArrow size={26} direction="down" tone="fill-coral" />, tint: 'bg-coral/25',
          text: <><strong>{byId[faller.id].managerName || byId[faller.id].name}</strong> dropped {Math.abs(faller.delta)} spot{Math.abs(faller.delta) === 1 ? '' : 's'} to #{faller.rank}</>,
        });
      }
    }

    return list;
  }, [gameweekTable, gameweek, standings]);

  if (beats.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      {/* Each beat is a tinted row with a DRAWN icon, the way the
          FusionGameweeks "This week's story" panel does it. The emoji that
          used to sit here (🔥 💀 🪑 …) rendered in whatever the reader's
          system font supplies — glossy, multicoloured, and nothing at all like
          the flat outlined drawings everywhere else on the page. */}
      <Card className="p-5">
        <h3 className="text-base font-display font-bold text-ink flex items-center gap-2 mb-3.5">
          <BookOpen className="text-violet-ink" size={18} />
          This week&rsquo;s story
          <span className="ml-auto text-[11px] font-bold text-ink-soft">Written from the results</span>
        </h3>
        <ul className="space-y-2">
          {beats.map((beat, i) => (
            <li
              key={i}
              className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[13px] font-bold text-ink ${beat.tint}`}
            >
              <span className="shrink-0">{beat.art}</span>
              <span className="leading-snug min-w-0">{beat.text}</span>
            </li>
          ))}
        </ul>
      </Card>
    </motion.div>
  );
};

export default WeeklyStory;
