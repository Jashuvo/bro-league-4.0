import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '../utils/cn';
import {
  Ball, Jersey, TrophyCup, Whistle, Coins, Boot
} from './ui/Doodles';
import { getDestination } from './navDestinations';
import { leagueConfig } from '../data/leagueData';

// ─── THE COMMAND BAR ────────────────────────────────────────────────────────
//
// One persistent strip above whichever destination is showing. It replaced
// CompactHero, which stacked a title card + a 4-up stat grid + a leader card +
// a deadline card + a 3-up "Gameweek Heroes" row — ~650-700px of identical
// chrome that every destination made you scroll past before reaching its own
// content.
//
// Same information, same tokens, one row: title, a stat cluster, the leader
// and deadline as chips, and the live pill + refresh. ~80px on desktop,
// ~140px on mobile (where the cluster wraps to its own scrollable line).
const CommandBar = ({
  activeTab,
  standings,
  gameweekInfo,
  authStatus,
  bootstrap,
  leagueStats,
  isRefreshing,
  onRefresh,
}) => {
  const { totalPrizePool } = leagueConfig;
  const destination = getDestination(activeTab);

  // leagueStats.totalManagers is FPL's real headcount (covers the whole
  // league even beyond the per-manager detail cap); standings.length is
  // the fallback while that hasn't loaded.
  const totalManagers = leagueStats?.totalManagers ?? standings?.length ?? 0;
  const gameweeksLeft = gameweekInfo?.total ? gameweekInfo.total - (gameweekInfo.current || 0) : 0;
  const currentLeader = standings?.find((manager) => manager.rank === 1);

  const nextGameweekData = bootstrap?.gameweeks?.find((gw) => gw.id === (gameweekInfo?.current + 1));
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
    ?.filter((m) => (m.gameweekPoints || 0) - (m.gameweekHits || 0) > 0)
    ?.sort((a, b) => {
      const netA = (a.gameweekPoints || 0) - (a.gameweekHits || 0);
      const netB = (b.gameweekPoints || 0) - (b.gameweekHits || 0);
      return netB - netA;
    })
    ?.slice(0, 3) || [];

  const showHeroes = topPerformers.length > 0 && authStatus?.authenticated;

  return (
    <div className="sticky top-14 lg:top-0 z-30 border-b-2 border-ink/85 bg-surface-alt/95 backdrop-blur-md">
      <div className="px-4 lg:px-6 py-2.5 flex flex-col lg:flex-row lg:items-center gap-2.5 lg:gap-4">
        {/* Title */}
        <div className="flex items-center gap-3 min-w-0 shrink-0">
          <span className={cn(
            'w-10 h-10 shrink-0 rounded-2xl border-2 border-ink/85 shadow-pop-sm flex items-center justify-center',
            destination.tone
          )}>
            <destination.icon size={24} />
          </span>
          <div className="min-w-0">
            <h1 className="font-display font-bold text-xl lg:text-2xl leading-none text-ink truncate">
              {destination.name}
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-soft mt-1 truncate">
              {totalManagers || '–'} bros • {leagueConfig.season}
            </p>
          </div>

          {/* Live pill + refresh sit next to the title on mobile so the chip
              cluster below gets the full width to scroll in. */}
          <div className="flex lg:hidden items-center gap-2 ml-auto shrink-0">
            <LivePill authenticated={authStatus?.authenticated} />
            <RefreshButton isRefreshing={isRefreshing} onRefresh={onRefresh} compact />
          </div>
        </div>

        {/* Stat cluster + context chips */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none lg:ml-auto lg:justify-end min-w-0">
          <StatChip tone="bg-mint/30" art={<Jersey size={18} tone="fill-mint" />} value={totalManagers} label="Bros" />
          <StatChip
            tone="bg-sky/30"
            art={<Whistle size={18} />}
            value={`GW${gameweekInfo?.current || '-'}`}
            label="Now"
            live={isLive}
          />
          <StatChip tone="bg-bubblegum/30" art={<Boot size={18} tone="fill-bubblegum" />} value={gameweeksLeft} label="Left" />
          <StatChip
            tone="bg-sunflower/40"
            art={<Coins size={18} />}
            value={`৳${(totalPrizePool / 1000).toFixed(0)}K`}
            label="Pool"
          />

          {isPreSeason && kickoffDeadline && <KickoffChip deadline={kickoffDeadline} />}

          {!isPreSeason && currentLeader && (
            <span className="shrink-0 h-10 pl-2 pr-3 rounded-2xl border-2 border-ink/85 bg-sunflower shadow-pop-sm flex items-center gap-2">
              <TrophyCup size={20} tone="fill-surface-alt" className="shrink-0" />
              <span className="min-w-0">
                <span className="block text-[9px] font-bold uppercase tracking-[0.14em] text-ink/60 leading-none">Leader</span>
                <span className="block font-display font-bold text-sm text-ink leading-tight truncate max-w-[120px]">
                  {currentLeader.managerName}
                </span>
              </span>
              <span className="font-display font-bold text-sm text-ink/80 tabular-nums shrink-0">
                {currentLeader.totalPoints}
              </span>
            </span>
          )}

          {!isPreSeason && nextDeadline && (
            <span className="shrink-0 h-10 pl-2 pr-3 rounded-2xl border-2 border-ink/85 bg-surface-alt shadow-card flex items-center gap-2">
              <span className="w-7 h-7 shrink-0 rounded-full bg-violet/20 border-2 border-ink/85 flex items-center justify-center">
                <Whistle size={16} tone="fill-violet" />
              </span>
              <span>
                <span className="block text-[9px] font-bold uppercase tracking-[0.14em] text-ink-soft leading-none">Deadline</span>
                <span className="block font-display font-bold text-sm text-violet leading-tight tabular-nums whitespace-nowrap">
                  {nextDeadline.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
                  {' • '}
                  <LiveCountdown deadline={nextDeadline} />
                </span>
              </span>
            </span>
          )}

          {/* Desktop keeps the live pill + refresh at the end of the row. */}
          <span className="hidden lg:flex items-center gap-2 shrink-0 pl-1">
            <LivePill authenticated={authStatus?.authenticated} />
            <RefreshButton isRefreshing={isRefreshing} onRefresh={onRefresh} />
          </span>
        </div>
      </div>

      {/* Gameweek Heroes — the old 3-up card row, reduced to a slim ribbon. */}
      {showHeroes && (
        <div className="px-4 lg:px-6 pb-2 -mt-0.5 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.16em] text-ink-soft flex items-center gap-1">
            <Ball size={13} /> GW Heroes
          </span>
          {topPerformers.map((manager, index) => (
            <span
              key={manager.id}
              className={cn(
                'shrink-0 h-7 pl-1 pr-2.5 rounded-full border-2 border-ink/85 flex items-center gap-1.5',
                index === 0 ? 'bg-sunflower' : index === 1 ? 'bg-mint/40' : 'bg-coral/25'
              )}
            >
              <Jersey
                size={18}
                number={index + 1}
                tone={index === 0 ? 'fill-sunflower' : index === 1 ? 'fill-silver' : 'fill-tangerine'}
                className="shrink-0"
              />
              <span className="text-xs font-bold text-ink truncate max-w-[110px]">{manager.managerName}</span>
              <span className="text-xs font-display font-bold text-ink/70 tabular-nums">
                {(manager.gameweekPoints || 0) - (manager.gameweekHits || 0)}
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

/* ───────────────────────────────── Pieces ────────────────────────────────*/

// Each stat keeps the accent it carried in the old 4-up grid — the treatment
// moved from a 120px card to a 40px chip, the token did not change.
const StatChip = ({ art, value, label, tone, live = false }) => (
  <span className={cn(
    'relative shrink-0 h-10 pl-2 pr-3 rounded-2xl border-2 border-ink/85 shadow-card flex items-center gap-2',
    tone
  )}>
    <span className="shrink-0">{art}</span>
    <span>
      <span className="block font-display font-bold text-sm text-ink leading-none tabular-nums">{value}</span>
      <span className="block text-[9px] font-bold uppercase tracking-[0.14em] text-ink-soft leading-none mt-0.5">
        {label}
      </span>
    </span>
    {live && (
      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-coral opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-coral border border-ink/85" />
      </span>
    )}
  </span>
);

const LivePill = ({ authenticated }) => (
  <span
    className={cn(
      'shrink-0 inline-flex items-center gap-1.5 h-8 px-2.5 rounded-full border-2 text-[11px] font-bold whitespace-nowrap',
      authenticated ? 'bg-pitch/20 text-pitch border-pitch/70' : 'bg-sunflower/35 text-ink border-sunflower'
    )}
  >
    <span className={cn('w-2 h-2 rounded-full', authenticated ? 'bg-pitch animate-pulse' : 'bg-tangerine')} />
    <span className="hidden sm:inline">{authenticated ? 'Live data' : 'Offline'}</span>
  </span>
);

const RefreshButton = ({ isRefreshing, onRefresh, compact = false }) => (
  <button
    type="button"
    onClick={onRefresh}
    disabled={isRefreshing}
    aria-label="Refresh league data"
    className={cn(
      'shrink-0 inline-flex items-center justify-center gap-2 h-9 rounded-2xl border-2 border-ink/85',
      'bg-violet text-white font-display font-bold text-sm btn-pop disabled:opacity-60',
      compact ? 'w-9' : 'px-3'
    )}
  >
    <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : undefined} />
    {!compact && <span>{isRefreshing ? 'Syncing' : 'Refresh'}</span>}
  </button>
);

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

// Compact "in Xd Yh" ticker used next to a fixed deadline date — updates
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
    return <span>passed</span>;
  }

  if (parts.days > 0) {
    return <span>{parts.days}d {parts.hours}h</span>;
  }

  return <span>{parts.hours}h {parts.minutes}m</span>;
};

// Pre-season stand-in for the leader/deadline chips: the old full-width
// violet countdown banner, condensed to the same chip footprint.
const KickoffChip = ({ deadline }) => {
  const [parts, setParts] = useState(() => getCountdownParts(deadline));

  useEffect(() => {
    const tick = () => setParts(getCountdownParts(deadline));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  return (
    <span className="shrink-0 h-10 pl-2 pr-3 rounded-2xl border-2 border-ink/85 bg-violet text-white shadow-pop-sm flex items-center gap-2">
      <span className="w-7 h-7 shrink-0 rounded-full bg-surface-alt border-2 border-ink/85 flex items-center justify-center">
        <Ball size={18} className="animate-roll" />
      </span>
      <span>
        <span className="block text-[9px] font-bold uppercase tracking-[0.14em] text-white/75 leading-none">Kicks off in</span>
        <span className="block font-display font-bold text-sm leading-tight tabular-nums whitespace-nowrap">
          {parts.days}d {String(parts.hours).padStart(2, '0')}h {String(parts.minutes).padStart(2, '0')}m {String(parts.seconds).padStart(2, '0')}s
        </span>
      </span>
    </span>
  );
};

export default CommandBar;
