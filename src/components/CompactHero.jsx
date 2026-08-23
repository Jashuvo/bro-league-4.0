import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Card from './ui/Card';
import Badge from './ui/Badge';
import {
  Ball, Jersey, TrophyCup, Whistle, Coins, CheerScene, Confetti, Boot
} from './ui/Doodles';
import { leagueConfig } from '../data/leagueData';

const CompactHero = ({ standings, gameweekInfo, authStatus, bootstrap, leagueStats }) => {
  const { totalPrizePool, name: leagueName } = leagueConfig;

  // leagueStats.totalManagers is FPL's real headcount (covers the whole
  // league even beyond the per-manager detail cap); standings.length is
  // the fallback while that hasn't loaded.
  const totalManagers = leagueStats?.totalManagers ?? standings?.length ?? 0;
  const gameweeksLeft = gameweekInfo?.total ? gameweekInfo.total - (gameweekInfo.current || 0) : 0;
  const currentLeader = standings?.find(manager => manager.rank === 1);

  const nextGameweekData = bootstrap?.gameweeks?.find(gw => gw.id === (gameweekInfo.current + 1));
  const nextDeadline = nextGameweekData?.deadline_time ? new Date(nextGameweekData.deadline_time) : null;

  // Pre-season: GW1 hasn't kicked off yet, so "Current Leader" and "Next
  // Deadline" (which assumes a GW is already in progress) don't make sense
  // to show — a countdown to kickoff is more useful.
  const gw1 = bootstrap?.gameweeks?.find((gw) => gw.id === 1);
  const kickoffDeadline = gw1?.deadline_time ? new Date(gw1.deadline_time) : null;
  const isPreSeason = kickoffDeadline ? kickoffDeadline.getTime() > Date.now() : false;

  // A gameweek is "live" once its deadline has passed and FPL hasn't
  // marked it finished yet — matches are in progress and scores can still
  // move (bonus points, live updates).
  const currentGwData = bootstrap?.gameweeks?.find((gw) => gw.id === gameweekInfo?.current);
  const isLive = !isPreSeason && !!currentGwData && currentGwData.is_current && !currentGwData.finished;

  const topPerformers = standings
    ?.filter(m => (m.gameweekPoints || 0) - (m.gameweekHits || 0) > 0)
    ?.sort((a, b) => {
      const netA = (a.gameweekPoints || 0) - (a.gameweekHits || 0);
      const netB = (b.gameweekPoints || 0) - (b.gameweekHits || 0);
      return netB - netA;
    })
    ?.slice(0, 3) || [];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="relative overflow-hidden pt-8 pb-8">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center"
        >
          {/* League Title + celebration scene */}
          <motion.div variants={itemVariants} className="w-full max-w-4xl mb-8">
            <div className="relative rounded-[2rem] border-2 border-ink/85 bg-surface-alt shadow-pop overflow-hidden">
              <Confetti className="absolute -top-2 left-0 w-full h-16 opacity-90 pointer-events-none" />

              <div className="relative grid md:grid-cols-[1.1fr_1fr] items-center gap-4 p-6 md:p-8">
                <div className="text-center md:text-left">
                  <span className="pill border-ink/85 bg-mint/30 text-ink mb-3">
                    <Ball size={14} /> Season {leagueConfig.season}
                  </span>
                  <h1 className="text-4xl md:text-5xl font-display font-bold text-ink tracking-tight leading-[1.05]">
                    {leagueName}
                  </h1>
                  <div className="rule-confetti w-32 mx-auto md:mx-0 my-3" />
                  <p className="text-ink-soft font-semibold">
                    {totalManagers || '–'} bros. One trophy. Zero mercy.
                  </p>
                </div>

                <CheerScene className="w-full max-w-sm mx-auto" />
              </div>
            </div>
          </motion.div>

          {/* Main Stats Grid */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 w-full max-w-4xl mb-8">
            <StatCard
              art={<Jersey size={30} tone="fill-mint" />}
              value={totalManagers}
              label="Managers"
              tone="bg-mint/25"
            />
            <StatCard
              art={<Whistle size={30} />}
              value={`GW ${gameweekInfo?.current || '-'}`}
              label="Current"
              tone="bg-sky/25"
              live={isLive}
            />
            <StatCard
              art={<Boot size={30} tone="fill-bubblegum" />}
              value={gameweeksLeft}
              label="GWs Left"
              tone="bg-bubblegum/25"
            />
            <StatCard
              art={<Coins size={30} />}
              value={`৳${(totalPrizePool / 1000).toFixed(0)}K`}
              label="Prize Pool"
              tone="bg-sunflower/35"
            />
          </motion.div>

          {/* Kickoff Countdown (pre-season only) */}
          {isPreSeason && (
            <motion.div variants={itemVariants} className="w-full max-w-4xl mb-8">
              <KickoffCountdown deadline={kickoffDeadline} />
            </motion.div>
          )}

          {/* Leader & Deadline Section */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
            {/* Current Leader */}
            {!isPreSeason && currentLeader && (
              <div className="relative flex items-center justify-between gap-4 p-5 rounded-3xl border-2 border-ink/85 bg-sunflower shadow-pop overflow-hidden">
                <div className="relative z-10">
                  <div className="text-ink/70 text-[11px] uppercase tracking-[0.18em] font-bold mb-1">Current Leader</div>
                  <div className="text-ink font-display font-bold text-2xl leading-tight">{currentLeader.managerName}</div>
                  <div className="text-ink/80 text-sm font-bold">{currentLeader.totalPoints} pts</div>
                </div>
                <TrophyCup size={56} tone="fill-surface-alt" className="relative z-10 shrink-0 animate-wiggle" />
              </div>
            )}

            {/* Next Deadline */}
            {!isPreSeason && nextDeadline && (
              <div className="flex items-center justify-between gap-4 p-5 rounded-3xl border-2 border-ink/85 bg-surface-alt shadow-card">
                <div>
                  <div className="text-ink-soft text-[11px] uppercase tracking-[0.18em] font-bold mb-1">Next Deadline</div>
                  <div className="text-ink font-display font-bold text-lg leading-tight">
                    {nextDeadline.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
                    {' • '}
                    {nextDeadline.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text-violet text-sm font-bold tabular-nums">
                    <LiveCountdown deadline={nextDeadline} />
                  </div>
                </div>
                <span className="w-14 h-14 shrink-0 rounded-full bg-violet/20 border-2 border-ink/85 flex items-center justify-center">
                  <Whistle size={30} tone="fill-violet" />
                </span>
              </div>
            )}
          </motion.div>

          {/* Top Performers */}
          {topPerformers.length > 0 && authStatus?.authenticated && (
            <motion.div variants={itemVariants} className="w-full max-w-4xl mt-8">
              <div className="flex items-center gap-2 mb-4">
                <TrophyCup size={22} />
                <h3 className="text-ink font-display font-bold text-lg">Gameweek Heroes</h3>
                <span className="flex-1 rule-confetti opacity-70" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {topPerformers.map((manager, index) => (
                  <Card
                    key={manager.id}
                    tone={index === 0 ? 'sunflower' : index === 1 ? 'mint' : 'coral'}
                    className="flex items-center gap-3 p-4"
                  >
                    <Jersey
                      size={38}
                      number={index + 1}
                      tone={index === 0 ? 'fill-sunflower' : index === 1 ? 'fill-silver' : 'fill-tangerine'}
                      className="shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-ink font-bold truncate">{manager.managerName}</div>
                      <div className="text-ink-soft text-xs truncate">{manager.teamName}</div>
                    </div>
                    <Badge variant="success">
                      {(manager.gameweekPoints || 0) - (manager.gameweekHits || 0)}
                      {(manager.gameweekHits || 0) > 0 && (
                        <span className="text-[10px] opacity-80">(-{manager.gameweekHits})</span>
                      )}
                      <span>pts</span>
                    </Badge>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

const getCountdownParts = (deadline) => {
  const diffMs = Math.max(0, deadline.getTime() - Date.now());
  const totalSeconds = Math.floor(diffMs / 1000);
  return {
    days: Math.floor(totalSeconds / (60 * 60 * 24)),
    hours: Math.floor((totalSeconds / (60 * 60)) % 24),
    minutes: Math.floor((totalSeconds / 60) % 60),
    seconds: totalSeconds % 60
  };
};

// Compact "in Xd Yh Zm" ticker used next to a fixed deadline date — updates
// once a minute, which is plenty for a countdown measured in days/hours.
const LiveCountdown = ({ deadline }) => {
  const [parts, setParts] = useState(() => getCountdownParts(deadline));

  useEffect(() => {
    const tick = () => setParts(getCountdownParts(deadline));
    tick();
    const interval = setInterval(tick, 60000);
    return () => clearInterval(interval);
  }, [deadline]);

  if (parts.days === 0 && parts.hours === 0 && parts.minutes === 0) {
    return <span>Deadline passed</span>;
  }

  if (parts.days > 0) {
    return <span>in {parts.days}d {parts.hours}h</span>;
  }

  return <span>in {parts.hours}h {parts.minutes}m</span>;
};

const KickoffCountdown = ({ deadline }) => {
  const [parts, setParts] = useState(() => getCountdownParts(deadline));

  useEffect(() => {
    const tick = () => setParts(getCountdownParts(deadline));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  return (
    <div className="relative rounded-3xl border-2 border-ink/85 bg-violet text-white shadow-pop p-5 overflow-hidden">
      <Confetti className="absolute inset-x-0 -top-1 h-14 opacity-80 pointer-events-none" />
      <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="w-14 h-14 shrink-0 rounded-2xl bg-surface-alt border-2 border-ink/85 flex items-center justify-center">
            <Ball size={32} className="animate-roll" />
          </span>
          <div>
            <div className="text-white/80 text-[11px] uppercase tracking-[0.18em] font-bold">Season kicks off in</div>
            <div className="text-2xl font-display font-bold tabular-nums">
              {parts.days}d {String(parts.hours).padStart(2, '0')}h {String(parts.minutes).padStart(2, '0')}m {String(parts.seconds).padStart(2, '0')}s
            </div>
          </div>
        </div>
        <div className="text-white/80 text-sm text-center sm:text-right">
          Gameweek 1 deadline
          <div className="font-bold text-white">
            {deadline.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
            {' • '}
            {deadline.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ art, value, label, tone, live = false }) => (
  <div className="relative flex flex-col items-center justify-center p-4 text-center rounded-3xl border-2 border-ink/85 bg-surface-alt shadow-card">
    {live && (
      <div className="absolute top-2 right-2 flex items-center gap-1">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-coral opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-coral" />
        </span>
        <span className="text-[9px] font-bold text-coral uppercase tracking-wider">Live</span>
      </div>
    )}
    <div className={`w-12 h-12 rounded-2xl ${tone} border-2 border-ink/85 flex items-center justify-center mb-2`}>
      {art}
    </div>
    <div className="text-xl font-display font-bold text-ink">{value}</div>
    <div className="text-ink-soft text-[11px] font-bold uppercase tracking-[0.14em]">{label}</div>
  </div>
);

export default CompactHero;
