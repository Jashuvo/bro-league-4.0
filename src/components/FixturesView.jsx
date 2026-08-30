import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from './ui/Card';
import Badge from './ui/Badge';
import { CornerFlags } from './ui/Doodles';
import { cn } from '../utils/cn';
import fplApi from '../services/fplApi';

// ─── FIXTURES ────────────────────────────────────────────────────────────
//
// A gameweek's match list — kickoff times or live/final scores, grouped by
// day — with a per-match drill-down (goals, assists, cards, saves, bonus,
// BPS, defensive contribution) on tap. Own fetch, own loading state: unlike
// standings/gameweekTable this isn't part of the league-complete payload
// (fixtures aren't league-specific), so it's fetched directly per gameweek
// the same way FixtureAlerts and the old LiveTicker did.

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

const FixturesView = ({ gameweekInfo = {}, bootstrap = {} }) => {
  const currentGW = gameweekInfo.current || 1;
  const totalGW = gameweekInfo.total || bootstrap.totalGameweeks || 38;

  const [selectedGameweek, setSelectedGameweek] = useState(currentGW);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFixture, setSelectedFixture] = useState(null);

  // If the app's own currentGameweek only resolves after this mounts (a
  // fresh load), jump the picker to it once rather than leaving someone
  // parked on GW1's default.
  useEffect(() => {
    setSelectedGameweek((gw) => (gw === 1 && currentGW !== 1 ? currentGW : gw));
  }, [currentGW]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
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
    <>
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
                <Card className="p-2 divide-y-2 divide-ink/10">
                  {group.fixtures.map((fixture) => (
                    <FixtureRow key={fixture.id} fixture={fixture} onSelect={() => setSelectedFixture(fixture)} />
                  ))}
                </Card>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {selectedFixture && (
          <FixtureDetail fixture={selectedFixture} onClose={() => setSelectedFixture(null)} />
        )}
      </AnimatePresence>
    </>
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

const FixtureRow = ({ fixture, onSelect }) => {
  const over = isMatchOver(fixture);
  const isLive = fixture.started && !over;
  const hasScore = fixture.started;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full flex items-center gap-2 sm:gap-4 px-2.5 sm:px-4 py-3 hover:bg-surface-sunk transition-colors rounded-2xl text-left"
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
    </button>
  );
};

/* ────────────────────────────── detail modal ──────────────────────────*/

const FixtureDetail = ({ fixture, onClose }) => {
  const over = isMatchOver(fixture);
  const isLive = fixture.started && !over;

  return createPortal(
    <div className="fixed inset-0 bg-scrim/70 flex items-center justify-center z-50 p-3 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        className="bg-surface rounded-3xl w-full max-w-lg max-h-[88vh] flex flex-col overflow-hidden border-2 border-ink/85 shadow-pop-lg"
      >
        {/* Header */}
        <div className="bg-tile-peach p-4 shrink-0 border-b-2 border-ink/85">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              {over ? (
                <Badge variant="success">Full time</Badge>
              ) : isLive ? (
                <Badge variant="gold" className="flex items-center gap-1">
                  <Radio size={11} className="animate-pulse" /> {fixture.minutes}&rsquo;
                </Badge>
              ) : (
                <Badge variant="default">
                  {new Date(fixture.kickoff_time).toLocaleString('en-US', {
                    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                  })}
                </Badge>
              )}
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-9 h-9 shrink-0 bg-surface-alt text-ink border-2 border-ink/85 rounded-full flex items-center justify-center hover:bg-coral hover:text-ink transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 mt-4">
            <span className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
              {fixture.homeTeam.crest && (
                <img src={fixture.homeTeam.crest} alt="" className="w-11 h-11 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              )}
              <span className="font-display font-bold text-[13px] text-ink truncate max-w-full">{fixture.homeTeam.name}</span>
            </span>

            <span className="font-display font-bold text-3xl text-ink tabular-nums shrink-0">
              {fixture.started ? `${fixture.homeScore} - ${fixture.awayScore}` : 'vs'}
            </span>

            <span className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
              {fixture.awayTeam.crest && (
                <img src={fixture.awayTeam.crest} alt="" className="w-11 h-11 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              )}
              <span className="font-display font-bold text-[13px] text-ink truncate max-w-full">{fixture.awayTeam.name}</span>
            </span>
          </div>
        </div>

        {/* Stat sections */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {fixture.stats.length === 0 ? (
            <p className="text-sm font-bold text-ink-soft text-center py-8">
              {fixture.started ? 'Nothing to report yet.' : 'Match stats appear once kickoff happens.'}
            </p>
          ) : (
            fixture.stats.map((stat) => (
              <div key={stat.identifier}>
                <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft mb-2">
                  {stat.label}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <StatColumn entries={stat.home} />
                  <StatColumn entries={stat.away} />
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

const StatColumn = ({ entries }) => (
  <div className="space-y-1">
    {entries.map((entry, i) => (
      <div key={`${entry.playerId}-${i}`} className="text-[13px] font-bold text-ink truncate">
        {entry.name} {entry.value > 1 && <span className="text-ink-soft">({entry.value})</span>}
      </div>
    ))}
  </div>
);

export default FixturesView;
