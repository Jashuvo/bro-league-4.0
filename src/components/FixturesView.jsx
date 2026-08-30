import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft, ChevronRight, Radio, Zap, AlertTriangle, XCircle,
  ShieldCheck, Shield, Hand
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from './ui/Card';
import Badge from './ui/Badge';
import { CornerFlags, Ball, Coins } from './ui/Doodles';
import { cn } from '../utils/cn';
import fplApi from '../services/fplApi';

// ─── FIXTURES ────────────────────────────────────────────────────────────
//
// A gameweek's match list — kickoff times or live/final scores, grouped by
// day — with a per-match drill-down (goals, assists, cards, saves, bonus,
// BPS, defensive contribution) that expands inline under the row it
// belongs to, the same accordion the standings table uses. Own fetch, own
// loading state: unlike standings/gameweekTable this isn't part of the
// league-complete payload (fixtures aren't league-specific).
//
// The whole gameweek is fetched and cached as one object (fplApi.getFixtures
// — 1 minute while live, hours once finished), so a completed or
// not-yet-started gameweek costs one request and then sits still. Only a
// LIVE gameweek re-polls — every 60s, matching the rest of the app's poll
// cadence, and only while the tab is actually visible — since that's the
// only state where scores/stats can still move.
const POLL_MS = 60000;

const DAY_FORMAT = { weekday: 'short', day: 'numeric', month: 'short' };
const TIME_FORMAT = { hour: '2-digit', minute: '2-digit' };

const dayKey = (iso) => new Date(iso).toDateString();

// FPL's `finished` flag only flips once bonus points are officially locked
// in — which can lag the final whistle by hours (sometimes into the next
// day). `finished_provisional` flips the moment the match actually ends.
// Using `finished` alone for "is this still being played" would show a
// pulsing live/minutes badge on a match that plainly ended yesterday —
// exactly the kind of stale-looking state this tab exists to avoid.
const isMatchOver = (fixture) => fixture.finished || fixture.finishedProvisional;

// identifier -> how its section looks: an icon, a tint, and whether the
// number next to a name is a POINTS value (bonus/BPS — always worth
// showing, even "1") or an occurrence COUNT (goals/cards/etc — only worth
// showing past 1, since a bare name already means "happened once").
const STAT_STYLE = {
  goals_scored: { icon: <Ball size={15} />, tint: 'bg-mint/35', alwaysShowValue: false },
  assists: { icon: <Zap size={14} className="text-sky-ink" />, tint: 'bg-sky/30', alwaysShowValue: false },
  own_goals: { icon: <AlertTriangle size={14} className="text-coral-ink" />, tint: 'bg-coral/25', alwaysShowValue: false },
  penalties_saved: { icon: <ShieldCheck size={14} className="text-mint-ink" />, tint: 'bg-mint/30', alwaysShowValue: false },
  penalties_missed: { icon: <XCircle size={14} className="text-coral-ink" />, tint: 'bg-coral/25', alwaysShowValue: false },
  yellow_cards: { icon: <span className="w-2.5 h-3.5 rounded-[2px] bg-sunflower border border-ink/70 shrink-0" />, tint: 'bg-sunflower/30', alwaysShowValue: false },
  red_cards: { icon: <span className="w-2.5 h-3.5 rounded-[2px] bg-coral border border-ink/70 shrink-0" />, tint: 'bg-coral/35', alwaysShowValue: false },
  saves: { icon: <Hand size={14} className="text-sky-ink" />, tint: 'bg-sky/25', alwaysShowValue: false },
  bonus: { icon: <Coins size={16} />, tint: 'bg-sunflower/40', alwaysShowValue: true },
  bps: { icon: <Coins size={16} />, tint: 'bg-tile-peach', alwaysShowValue: true },
  defensive_contribution: { icon: <Shield size={14} className="text-violet-ink" />, tint: 'bg-violet/20', alwaysShowValue: false },
};
const DEFAULT_STYLE = { icon: <Ball size={15} />, tint: 'bg-surface-sunk', alwaysShowValue: false };

const FixturesView = ({ gameweekInfo = {}, bootstrap = {} }) => {
  const currentGW = gameweekInfo.current || 1;
  const totalGW = gameweekInfo.total || bootstrap.totalGameweeks || 38;

  const [selectedGameweek, setSelectedGameweek] = useState(currentGW);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  // If the app's own currentGameweek only resolves after this mounts (a
  // fresh load), jump the picker to it once rather than leaving someone
  // parked on GW1's default.
  useEffect(() => {
    setSelectedGameweek((gw) => (gw === 1 && currentGW !== 1 ? currentGW : gw));
  }, [currentGW]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setExpandedId(null);
    fplApi.getFixtures(selectedGameweek).then((result) => {
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [selectedGameweek]);

  const gwMeta = bootstrap?.gameweeks?.find((gw) => gw.id === selectedGameweek);
  const status = gwMeta?.finished
    ? 'completed'
    : gwMeta?.is_current
      ? 'current'
      : selectedGameweek < currentGW
        ? 'completed'
        : selectedGameweek > currentGW
          ? 'upcoming'
          : 'current';

  // Only a live gameweek re-polls — everything else is fetched once and
  // left alone, per the cache TTLs in fplApi.getFixtures.
  useEffect(() => {
    if (status !== 'current') return undefined;

    const tick = () => {
      if (document.visibilityState === 'visible') {
        fplApi.getFixtures(selectedGameweek, { force: true }).then(setData);
      }
    };

    const interval = setInterval(tick, POLL_MS);
    document.addEventListener('visibilitychange', tick);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [status, selectedGameweek]);

  // Grouped by calendar day, in kickoff order (the API already sorts
  // fixtures that way) — mirrors how FPL's own fixtures list reads.
  const groupedByDay = useMemo(() => {
    const fixtures = data?.fixtures || [];
    const groups = [];
    fixtures.forEach((fixture) => {
      const key = dayKey(fixture.kickoff_time);
      const last = groups[groups.length - 1];
      if (last && last.key === key) {
        last.fixtures.push(fixture);
      } else {
        groups.push({ key, fixtures: [fixture] });
      }
    });
    return groups;
  }, [data]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {/* Gameweek switcher — same shape as the Gameweeks tab's own, so
          moving between the two destinations doesn't relearn a control. */}
      <div className="flex items-center gap-2 sm:gap-4 bg-surface-alt p-2.5 sm:p-3 rounded-3xl border-2 border-ink/85">
        <button
          onClick={() => setSelectedGameweek((gw) => Math.max(1, gw - 1))}
          disabled={selectedGameweek <= 1}
          aria-label="Previous gameweek"
          className="w-11 h-11 shrink-0 rounded-2xl bg-surface-sunk text-ink-soft flex items-center justify-center btn-pop disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex items-center gap-2.5 flex-grow min-w-0">
          <CornerFlags size={24} className="shrink-0 hidden sm:block" />
          <div className="min-w-0">
            <div className="font-display font-bold text-base sm:text-lg text-ink leading-tight truncate">
              Gameweek {selectedGameweek}
            </div>
            <div className="text-[11px] sm:text-xs font-bold text-ink-soft mt-0.5 truncate">
              {status === 'completed' && 'Final — all matches played'}
              {status === 'current' && 'Live now — scores can still move'}
              {status === 'upcoming' && 'Not played yet'}
            </div>
          </div>
        </div>

        <Badge
          variant={status === 'completed' ? 'success' : status === 'current' ? 'gold' : 'default'}
          className="hidden sm:inline-flex shrink-0"
        >
          {status === 'completed' ? 'Completed' : status === 'current' ? 'In progress' : 'Upcoming'}
        </Badge>

        <button
          onClick={() => setSelectedGameweek((gw) => Math.min(totalGW, gw + 1))}
          disabled={selectedGameweek >= totalGW}
          aria-label="Next gameweek"
          className="w-11 h-11 shrink-0 rounded-2xl bg-violet/15 text-violet-ink flex items-center justify-center btn-pop disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-surface-sunk rounded-3xl border-2 border-ink/10 animate-pulse" />
          ))}
        </div>
      ) : groupedByDay.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm font-bold text-ink-soft">No fixtures scheduled for Gameweek {selectedGameweek}.</p>
        </Card>
      ) : (
        <div className="space-y-5">
          {groupedByDay.map((group) => (
            <div key={group.key}>
              <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-soft mb-2 px-1">
                {new Date(group.fixtures[0].kickoff_time).toLocaleDateString('en-US', DAY_FORMAT)}
              </div>
              <Card className="p-2 flex flex-col gap-1">
                {group.fixtures.map((fixture) => (
                  <div key={fixture.id}>
                    <FixtureRow
                      fixture={fixture}
                      isExpanded={expandedId === fixture.id}
                      onToggle={() => setExpandedId((id) => (id === fixture.id ? null : fixture.id))}
                    />
                    <AnimatePresence initial={false}>
                      {expandedId === fixture.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <FixtureStats fixture={fixture} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </Card>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

/* ─────────────────────────────── row ──────────────────────────────────*/

const TeamLabel = ({ team, align }) => (
  <span className={cn('flex items-center gap-2 min-w-0 flex-1', align === 'right' ? 'justify-end' : 'justify-start')}>
    {align === 'right' && (
      <span className="font-display font-bold text-[13.5px] sm:text-[15px] text-ink truncate">{team.short_name}</span>
    )}
    {team.crest && (
      <img
        src={team.crest}
        alt=""
        className="w-6 h-6 sm:w-7 sm:h-7 shrink-0 object-contain"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    )}
    {align !== 'right' && (
      <span className="font-display font-bold text-[13.5px] sm:text-[15px] text-ink truncate">{team.short_name}</span>
    )}
  </span>
);

const FixtureRow = ({ fixture, isExpanded, onToggle }) => {
  const over = isMatchOver(fixture);
  const isLive = fixture.started && !over;
  const hasScore = fixture.started;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isExpanded}
      className={cn(
        'w-full flex items-center gap-2 sm:gap-4 px-2.5 sm:px-4 py-3 transition-colors rounded-2xl text-left',
        isExpanded ? 'bg-surface-sunk' : 'hover:bg-surface-sunk'
      )}
    >
      <TeamLabel team={fixture.homeTeam} align="right" />

      <span className="shrink-0 flex flex-col items-center justify-center min-w-[64px]">
        {hasScore ? (
          <span className="flex items-center gap-1.5">
            <span className="font-display font-bold text-lg text-ink tabular-nums">
              {fixture.homeScore} - {fixture.awayScore}
            </span>
          </span>
        ) : (
          <span className="text-[13px] font-bold text-ink-soft tabular-nums">
            {new Date(fixture.kickoff_time).toLocaleTimeString('en-US', TIME_FORMAT)}
          </span>
        )}
        {isLive && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-coral-ink mt-0.5">
            <Radio size={10} className="animate-pulse" />
            {fixture.minutes}&rsquo;
          </span>
        )}
        {over && (
          <span className="text-[10px] font-bold text-ink-soft uppercase tracking-wide mt-0.5">FT</span>
        )}
      </span>

      <TeamLabel team={fixture.awayTeam} align="left" />

      <ChevronRight
        size={16}
        className={cn('shrink-0 text-ink-soft transition-transform duration-300', isExpanded && 'rotate-90')}
      />
    </button>
  );
};

/* ─────────────────────────────── expanded stats ────────────────────────*/

const FixtureStats = ({ fixture }) => {
  if (fixture.stats.length === 0) {
    return (
      <p className="text-[13px] font-bold text-ink-soft text-center py-6 px-4">
        {fixture.started ? 'Nothing to report yet.' : 'Match stats appear once kickoff happens.'}
      </p>
    );
  }

  return (
    <div className="px-1 sm:px-2 pb-3 pt-1 space-y-2.5">
      {fixture.stats.map((stat) => {
        const style = STAT_STYLE[stat.identifier] || DEFAULT_STYLE;
        return (
          <div key={stat.identifier} className="rounded-2xl overflow-hidden border-2 border-ink/10">
            <div className={cn('flex items-center gap-2 px-3 py-1.5', style.tint)}>
              <span className="shrink-0 flex items-center justify-center">{style.icon}</span>
              <span className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink">{stat.label}</span>
            </div>
            <div className="grid grid-cols-2 divide-x-2 divide-ink/10 bg-surface-alt">
              <StatColumn entries={stat.home} alwaysShowValue={style.alwaysShowValue} />
              <StatColumn entries={stat.away} alwaysShowValue={style.alwaysShowValue} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const StatColumn = ({ entries, alwaysShowValue }) => (
  <div className="p-2.5 space-y-1.5 min-h-[1px]">
    {entries.map((entry, i) => (
      <div key={`${entry.playerId}-${i}`} className="flex items-center justify-between gap-2">
        <span className="text-[12.5px] font-bold text-ink truncate">{entry.name}</span>
        {(alwaysShowValue || entry.value > 1) && (
          <span className="text-[11px] font-bold text-ink-soft tabular-nums shrink-0">
            {alwaysShowValue ? entry.value : `×${entry.value}`}
          </span>
        )}
      </div>
    ))}
  </div>
);

export default FixturesView;
