import React, { useState, useMemo } from 'react';
import { ChevronRight, Search, UserX, UserCheck, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TeamView from './TeamView';
import Card from './ui/Card';
import Button from './ui/Button';
import { RankBadge, StandingsScene, Coins, Jersey, Ball } from './ui/Doodles';
import PrizeBreakdown from './PrizeBreakdown';
import InsightsFAB from './InsightsFAB';
import { useExclusion } from '../context/ExclusionContext';
import RankTrendSparkline from './RankTrendSparkline';
import { monthlyWindows, prizeStructure } from '../data/leagueData';
import { computeRankHistory } from '../utils/rankHistory';
import { cn } from '../utils/cn';

// ─── THE STANDINGS TABLE ────────────────────────────────────────────────────
//
// Built against the FusionDesktop / FusionMobile artboards, which specify a
// good deal more than a "# / manager / points" list:
//
//   • a narrative line under the title, written from the live standings, next
//     to an illustrated scene (Doodles.StandingsScene);
//   • a toolbar over the table — search, sort, and a chip-usage badge;
//   • CHIP / BENCH / OVERALL RANK / TREND columns alongside GW and TOTAL;
//   • an expanded row carrying four stat tiles, the rank-trend line (with an
//     HONEST empty state before there are two gameweeks to draw between) and
//     three actions: view the XI, prize breakdown, exclude from prizes.
//
// The prize maths below is unchanged from the previous version — only the
// presentation around it is new.

/* ─────────────────────────────── constants ───────────────────────────────*/

// The eight dusty pastels the artboards cycle through for manager discs, in
// order. Full class names: Tailwind can't see an interpolated one.
const AVATAR_TONES = [
  'bg-tone-1', 'bg-tone-2', 'bg-tone-3', 'bg-tone-4',
  'bg-tone-5', 'bg-tone-6', 'bg-tone-7', 'bg-tone-8',
];

// FPL's chip ids, spelled the way a human would say them.
const CHIP_LABELS = {
  bboost: 'Bench Boost',
  '3xc': 'Triple Captain',
  freehit: 'Free Hit',
  wildcard: 'Wildcard',
  manager: 'Assistant Manager',
};

const chipLabel = (name) => CHIP_LABELS[name] || name;

// Short form for the mobile row, where a full "Triple Captain" pill would
// eat the manager's name.
const CHIP_SHORT = {
  bboost: 'BB',
  '3xc': 'TC',
  freehit: 'FH',
  wildcard: 'WC',
  manager: 'AM',
};

const SORTS = [
  { id: 'total', label: 'Total points' },
  { id: 'gw', label: 'This gameweek' },
  { id: 'bench', label: 'Points benched' },
  { id: 'overall', label: 'Overall rank' },
  { id: 'name', label: 'Manager A–Z' },
];

const NUMBER_WORDS = ['nil', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const numberWord = (n) => (n >= 0 && n <= 10 ? NUMBER_WORDS[n] : String(n));

const initialsOf = (name = '') =>
  String(name).split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';

// "S.M. Sazzad Hossain" -> "Sazzad" — the narrative reads as people talking,
// so it uses the name they'd actually be called, skipping initial-only
// prefixes. Same rule the CommandBar's top-3 strip uses.
const firstNameOf = (name = '') => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  return parts.find((part) => part.replace(/\./g, '').length > 2) || parts[0] || '';
};

const netGwPoints = (manager) =>
  (manager.gameweekPoints || manager.event_total || 0) - (manager.gameweekHits || 0);

// `teamValue` arrives from api/league-complete.js already converted out of
// FPL's raw tenths-of-a-million units (see the `value: gw.value / 10` line
// in league-complete.js) — it's already £m here (100.3, not 1003).
const formatTeamValue = (value) =>
  value == null ? null : `£${value.toFixed(1)}m`;

/* ─────────────────────────────── component ───────────────────────────────*/

const LeagueTable = ({ standings = [], loading = false, gameweekInfo = {}, leagueStats = {}, gameweekTable = [] }) => {
  const [expandedRow, setExpandedRow] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedPrizeManager, setSelectedPrizeManager] = useState(null);
  const [showExclusionSettings, setShowExclusionSettings] = useState(false);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('total');
  const { excludeTeam, includeTeam, excludedTeamIds, clearExclusions } = useExclusion();

  const currentGW = gameweekInfo.current || 1;
  const gwFinished = !!gameweekInfo.isFinished;

  // Calculate total prizes won (Logic preserved)
  const calculateTotalPrizesWon = (managerId) => {
    let totalWon = 0;

    if (gameweekTable.length === 0) return 0;

    const getNetPoints = (manager) => {
      const rawPoints = manager.gameweekPoints || manager.points || 0;
      const transfersCost = manager.transfersCost || manager.event_transfers_cost || manager.transferCost || manager.transfers_cost || manager.penalty || manager.hit || manager.gameweekHits || 0;
      return rawPoints - transfersCost;
    };

    // Weekly Prizes - Only count FINISHED gameweeks
    const lastCompletedGW = gwFinished ? currentGW : currentGW - 1;
    for (let gw = 1; gw <= lastCompletedGW; gw++) {
      const gameweekData = gameweekTable.find(g => g.gameweek === gw);
      if (!gameweekData?.managers) continue;
      const sortedManagers = [...gameweekData.managers]
        .filter(m => (m.gameweekPoints || m.points || 0) > 0)
        .sort((a, b) => getNetPoints(b) - getNetPoints(a));
      const managerRank = sortedManagers.findIndex(m => m.id === managerId) + 1;
      if (managerRank === 1) totalWon += prizeStructure.weekly.perWeek;
    }

    // Monthly Prizes - a month only "counts" once its last gameweek has
    // actually finished, not merely once we've reached it (matches the
    // weekly-prize gating above).
    monthlyWindows.forEach((month) => {
      const isMonthFinished = currentGW > month.end || (currentGW === month.end && gwFinished);
      if (isMonthFinished) {
        const allMonthlyScores = gameweekTable
          .filter(gw => gw.gameweek >= month.start && gw.gameweek <= month.end)
          .reduce((scores, gw) => {
            gw.managers?.forEach(manager => {
              if (!scores[manager.id]) scores[manager.id] = 0;
              scores[manager.id] += getNetPoints(manager);
            });
            return scores;
          }, {});
        const sortedMonthly = Object.entries(allMonthlyScores).sort((a, b) => b[1] - a[1]);
        const monthlyRank = sortedMonthly.findIndex(([id]) => id == managerId) + 1;
        if (monthlyRank >= 1 && monthlyRank <= 3) {
          const prizes = month.isFinal ? prizeStructure.monthly.finalMonth : prizeStructure.monthly.regularPrizes;
          totalWon += prizes[monthlyRank - 1];
        }
      }
    });
    return totalWon;
  };

  // Calculate detailed prize breakdown for a manager
  const calculatePrizeBreakdown = (managerId) => {
    const weeklyWins = [];
    const monthlyWins = [];

    if (gameweekTable.length === 0) {
      return { weeklyWins, monthlyWins, totalPrizes: 0 };
    }

    const getNetPoints = (manager) => {
      const rawPoints = manager.gameweekPoints || manager.points || 0;
      const transfersCost = manager.transfersCost || manager.event_transfers_cost || manager.transferCost || manager.transfers_cost || manager.penalty || manager.hit || 0;
      return rawPoints - transfersCost;
    };

    // Weekly Prizes - Only count FINISHED gameweeks
    const lastCompletedGW = gwFinished ? currentGW : currentGW - 1;
    for (let gw = 1; gw <= lastCompletedGW; gw++) {
      const gameweekData = gameweekTable.find(g => g.gameweek === gw);
      if (!gameweekData?.managers) continue;
      const sortedManagers = [...gameweekData.managers]
        .filter(m => (m.gameweekPoints || m.points || 0) > 0)
        .sort((a, b) => getNetPoints(b) - getNetPoints(a));
      const managerRank = sortedManagers.findIndex(m => m.id === managerId) + 1;
      if (managerRank === 1) {
        const winnerData = sortedManagers[0];
        weeklyWins.push({
          gameweek: gw,
          points: getNetPoints(winnerData),
          prize: prizeStructure.weekly.perWeek
        });
      }
    }

    // Monthly Prizes - same "actually finished" gating as calculateTotalPrizesWon above
    monthlyWindows.forEach((month) => {
      const isMonthFinished = currentGW > month.end || (currentGW === month.end && gwFinished);
      if (isMonthFinished) {
        const allMonthlyScores = gameweekTable
          .filter(gw => gw.gameweek >= month.start && gw.gameweek <= month.end)
          .reduce((scores, gw) => {
            gw.managers?.forEach(manager => {
              if (!scores[manager.id]) scores[manager.id] = 0;
              scores[manager.id] += getNetPoints(manager);
            });
            return scores;
          }, {});
        const sortedMonthly = Object.entries(allMonthlyScores).sort((a, b) => b[1] - a[1]);
        const monthlyRank = sortedMonthly.findIndex(([id]) => id == managerId) + 1;
        if (monthlyRank >= 1 && monthlyRank <= 3) {
          const prizes = month.isFinal ? prizeStructure.monthly.finalMonth : prizeStructure.monthly.regularPrizes;
          monthlyWins.push({
            month: month.id,
            position: monthlyRank,
            points: allMonthlyScores[managerId],
            prize: prizes[monthlyRank - 1]
          });
        }
      }
    });

    const totalPrizes = weeklyWins.reduce((sum, w) => sum + w.prize, 0) +
      monthlyWins.reduce((sum, w) => sum + w.prize, 0);

    return { weeklyWins, monthlyWins, totalPrizes };
  };

  // Points left on the bench, this gameweek. `points_on_bench` already rides
  // through api/league-complete.js into gameweekTable[].managers[].benchPoints —
  // the field just wasn't being read anywhere until this column existed.
  const benchByManager = useMemo(() => {
    const row = gameweekTable.find((gw) => gw.gameweek === currentGW);
    const map = {};
    row?.managers?.forEach((m) => { map[String(m.id)] = m.benchPoints; });
    return map;
  }, [gameweekTable, currentGW]);

  // Whoever is top of THIS gameweek on net points — used only to say whether
  // the weekly prize is theirs once the gameweek closes.
  const currentGwLeaderId = useMemo(() => {
    const row = gameweekTable.find((gw) => gw.gameweek === currentGW);
    if (!row?.managers?.length) return null;
    const ranked = [...row.managers]
      .filter((m) => (m.points || 0) > 0)
      .sort((a, b) => ((b.points || 0) - (b.transferCost || 0)) - ((a.points || 0) - (a.transferCost || 0)));
    return ranked[0] ? String(ranked[0].id) : null;
  }, [gameweekTable, currentGW]);

  const enhancedStandings = useMemo(() => {
    return standings.map((manager, index) => {
      const id = manager.id || manager.entry;
      const chips = manager.chips || [];
      return {
        ...manager,
        id,
        position: index + 1,
        totalPrizesWon: calculateTotalPrizesWon(id),
        benchPoints: benchByManager[String(id)],
        chipThisGw: chips.find((chip) => chip.event === currentGW) || null,
        chipsPlayed: chips,
        initials: initialsOf(manager.managerName || manager.player_name),
        avatarTone: AVATAR_TONES[index % AVATAR_TONES.length],
      };
    });
    // calculateTotalPrizesWon closes over gameweekTable/gameweekInfo, both of
    // which are already listed here.
  }, [standings, gameweekTable, gameweekInfo, benchByManager, currentGW]);

  // Cumulative league-position history per manager, derived from
  // gameweekTable — powers the "Rank Trend" sparkline in each expanded row.
  const rankHistoryByManager = useMemo(
    () => computeRankHistory(gameweekTable, standings),
    [gameweekTable, standings]
  );

  // The "magic number": how many points separate the season top-3 cutoff
  // (prizeStructure.season — the ৳800/600/400 prize) from each manager.
  // `enhancedStandings` is already in rank order (it's built by mapping
  // `standings`, which the API returns rank-sorted), so index 2/3 are
  // literally 3rd and 4th place — no re-sorting needed for this.
  const magicNumberByManager = useMemo(() => {
    const map = {};
    if (enhancedStandings.length < 4) return map;
    const thirdPlacePoints = enhancedStandings[2]?.totalPoints ?? 0;
    const fourthPlacePoints = enhancedStandings[3]?.totalPoints ?? 0;
    enhancedStandings.forEach((manager, index) => {
      const total = manager.totalPoints || manager.total || 0;
      map[manager.id] = index < 3
        ? { onPodium: true, gap: total - fourthPlacePoints }
        : { onPodium: false, gap: thirdPlacePoints - total };
    });
    return map;
  }, [enhancedStandings]);

  // ── The narrative line. Written from the live table, never canned copy:
  // who leads and by how much, whether the chasers have already burned a
  // chip, and where the league average sits.
  const narrative = useMemo(() => {
    if (enhancedStandings.length === 0) return null;

    const [leader, second, third] = enhancedStandings;
    const average = leagueStats?.averageGameweekScore ?? leagueStats?.averageScore;
    const averageClause = average ? ` Average across the league: ${average}.` : '';

    if (!second) {
      return `${firstNameOf(leader.managerName || leader.player_name)} is the only manager in so far.${averageClause}`;
    }

    // Everyone level with second place is "a chaser".
    const chasers = [second, third].filter(
      (m) => m && m.totalPoints === second.totalPoints
    );
    const chaserNames = chasers.map((m) => firstNameOf(m.managerName || m.player_name));
    const chaserList = chaserNames.length > 1
      ? `${chaserNames.slice(0, -1).join(', ')} and ${chaserNames[chaserNames.length - 1]}`
      : chaserNames[0];

    const gap = (leader.totalPoints || 0) - (second.totalPoints || 0);
    const lead = gap === 0
      ? `${firstNameOf(leader.managerName || leader.player_name)} and ${chaserList} are level at the top`
      : `${firstNameOf(leader.managerName || leader.player_name)} is ${numberWord(gap)} clear of ${chaserList}`;

    // Only claim a shared chip when every chaser has genuinely played the
    // same one — a half-true flourish is worse than no flourish.
    const chaserChips = chasers.map((m) => m.chipsPlayed?.[m.chipsPlayed.length - 1]?.name);
    const sharedChip = chaserChips.every((name) => name && name === chaserChips[0]) ? chaserChips[0] : null;
    const chipClause = sharedChip
      ? `, who ${chasers.length > 1 ? 'have' : 'has'} already spent ${chasers.length > 1 ? 'their' : 'their'} ${chipLabel(sharedChip)}`
      : '';

    return `${lead}${chipClause}.${averageClause}`;
  }, [enhancedStandings, leagueStats]);

  // ── The chip-usage badge. Counts chips played in the CURRENT gameweek and
  // names the most common one, rather than asserting "Bench Boost" whatever
  // people actually played.
  const chipBadge = useMemo(() => {
    const counts = {};
    enhancedStandings.forEach((m) => {
      if (m.chipThisGw) counts[m.chipThisGw.name] = (counts[m.chipThisGw.name] || 0) + 1;
    });
    const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (ranked.length === 0) return `No chips played in GW${currentGW}`;
    const [name, count] = ranked[0];
    return `${count} ${chipLabel(name)}${count > 1 ? 's' : ''} played`;
  }, [enhancedStandings, currentGW]);

  // Search + sort. `position` is fixed above, before either runs, so a row
  // keeps its real league place no matter how the view is ordered.
  const visibleStandings = useMemo(() => {
    const needle = query.trim().toLowerCase();
    let rows = enhancedStandings;

    if (needle) {
      rows = rows.filter((m) =>
        `${m.managerName || m.player_name} ${m.teamName || m.entry_name}`.toLowerCase().includes(needle)
      );
    }

    const sorted = [...rows];
    switch (sortBy) {
      case 'gw':
        sorted.sort((a, b) => netGwPoints(b) - netGwPoints(a));
        break;
      case 'bench':
        sorted.sort((a, b) => (b.benchPoints ?? -1) - (a.benchPoints ?? -1));
        break;
      case 'overall':
        // 0 means "we never got this manager's entry data" — park those last
        // rather than letting them win a rank-ascending sort.
        sorted.sort((a, b) => (a.overallRank || Infinity) - (b.overallRank || Infinity));
        break;
      case 'name':
        sorted.sort((a, b) =>
          String(a.managerName || a.player_name).localeCompare(String(b.managerName || b.player_name))
        );
        break;
      default:
        sorted.sort((a, b) => (b.totalPoints || b.total || 0) - (a.totalPoints || a.total || 0));
    }
    return sorted;
  }, [enhancedStandings, query, sortBy]);

  const toggleRowExpansion = (managerId) => {
    setExpandedRow(expandedRow === managerId ? null : managerId);
  };

  if (loading && (!standings || standings.length === 0)) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-surface-sunk rounded-3xl border-2 border-ink/10 animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-5"
      >
        {/* ── Intro: the story of the table, and the scene beside it ─────── */}
        <Card tone="outlined" className="p-5 lg:p-7 overflow-hidden">
          <div className="flex items-start gap-6">
            <div className="flex-grow min-w-0">
              <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-pitch-ink">
                <Ball size={18} className="shrink-0" />
                Gameweek {currentGW} {gwFinished ? '· final' : '· live now'}
              </span>
              <h2 className="font-display font-bold text-2xl lg:text-[40px] leading-[1.05] text-ink mt-2">
                League Standings
              </h2>
              {narrative && (
                <p
                  className="text-[13.5px] lg:text-[15px] font-bold text-ink-soft mt-2 max-w-[520px]"
                  style={{ textWrap: 'pretty' }}
                >
                  {narrative}
                </p>
              )}

              {leagueStats && (
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <span className="h-10 px-3.5 rounded-2xl bg-tile-sand flex flex-col justify-center whitespace-nowrap">
                    <span className="text-[9px] text-ink-soft font-bold uppercase tracking-[0.14em] leading-none">Avg Total</span>
                    <span className="font-display font-bold text-ink leading-none mt-0.5 tabular-nums">{leagueStats.averageScore || '--'}</span>
                  </span>
                  <span className="h-10 px-3.5 rounded-2xl bg-tile-sage flex flex-col justify-center whitespace-nowrap">
                    <span className="text-[9px] text-ink-soft font-bold uppercase tracking-[0.14em] leading-none">Highest</span>
                    <span className="font-display font-bold text-pitch-ink leading-none mt-0.5 tabular-nums">{leagueStats.highestTotal || '--'}</span>
                  </span>
                  <span className="h-10 px-3.5 rounded-2xl bg-tile-sky flex flex-col justify-center whitespace-nowrap">
                    <span className="text-[9px] text-ink-soft font-bold uppercase tracking-[0.14em] leading-none">Managers</span>
                    <span className="font-display font-bold text-sky-ink leading-none mt-0.5 tabular-nums">{enhancedStandings.length}</span>
                  </span>
                </div>
              )}
            </div>

            {/* The scene is decoration: it goes when there isn't room for it
                rather than squeezing the sentence it sits beside. */}
            <StandingsScene className="hidden md:block w-[228px] lg:w-[277px] shrink-0 -mt-2" />
          </div>
        </Card>

        {/* Exclusion Settings Panel */}
        <AnimatePresence>
          {showExclusionSettings && excludedTeamIds.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <Card tone="coral">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-display font-bold text-coral-ink flex items-center gap-2">
                    <UserX size={20} /> Excluded Teams
                  </h3>
                  <button
                    onClick={clearExclusions}
                    className="text-xs font-bold text-coral-ink hover:underline"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {excludedTeamIds.map(id => (
                    <div
                      key={id}
                      className="px-3 py-1.5 bg-surface-alt border-2 border-coral rounded-xl flex items-center gap-2 text-sm font-bold text-coral-ink"
                    >
                      <span>ID: {id}</span>
                      <button
                        onClick={() => includeTeam(id)}
                        className="p-1 hover:bg-coral/20 rounded-full transition-colors"
                        title="Restore Team"
                      >
                        <UserCheck size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs text-ink-soft font-medium">
                  These teams are completely excluded from all rankings, statistics, and prize calculations.
                </p>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── The table ──────────────────────────────────────────────────── */}
        <Card className="p-0 overflow-hidden">
          {/* Toolbar */}
          <div className="p-3 lg:px-5 lg:py-4 flex flex-wrap items-center gap-2.5">
            <h3 className="font-display font-bold text-xl lg:text-2xl text-ink shrink-0 mr-1">The table</h3>

            <label className="relative flex-grow min-w-[180px] lg:flex-grow-0 lg:w-[280px]">
              <span className="sr-only">Search managers</span>
              <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft pointer-events-none" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search managers…"
                className="w-full h-11 pl-11 pr-4 rounded-full bg-surface-sunk text-[13.5px] font-bold text-ink placeholder:text-ink-soft placeholder:font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-violet"
              />
            </label>

            <label className="relative shrink-0 lg:ml-auto">
              <span className="sr-only">Sort the table</span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="h-11 pl-4 pr-9 rounded-full bg-surface-sunk text-[13px] font-bold text-ink-soft appearance-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-violet"
              >
                {SORTS.map((sort) => (
                  <option key={sort.id} value={sort.id}>Sort: {sort.label}</option>
                ))}
              </select>
              <ChevronRight size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 rotate-90 text-ink-soft pointer-events-none" />
            </label>

            <span className="shrink-0 h-11 px-4 rounded-full bg-tile-sage text-[13px] font-bold text-pitch-ink flex items-center">
              {chipBadge}
            </span>

            {excludedTeamIds.length > 0 && (
              <button
                onClick={() => setShowExclusionSettings(!showExclusionSettings)}
                className={cn(
                  'shrink-0 h-11 px-4 text-[13px] font-bold rounded-full flex items-center gap-2 btn-pop',
                  showExclusionSettings ? 'bg-coral text-ink border-2 border-ink/85' : 'bg-tile-clay text-coral-ink'
                )}
              >
                <Settings size={16} />
                {excludedTeamIds.length} excluded
              </button>
            )}
          </div>

          {/* Column headings — the full set only from `lg`, where the grid
              below actually renders. */}
          <div className="hidden lg:grid grid-cols-[46px_minmax(0,1fr)_76px_104px_62px_92px_52px_72px_62px_16px] gap-2.5 items-center px-5 pb-3 text-[11.5px] font-bold uppercase tracking-[0.04em] text-ink-soft">
            <span>Shirt</span>
            <span>Manager &amp; team</span>
            <span className="text-right">Value</span>
            <span className="text-center">Chip</span>
            <span className="text-center">Bench</span>
            <span className="text-right">Overall rank</span>
            <span className="text-right">GW</span>
            <span className="text-right">Total</span>
            <span className="text-center">Trend</span>
            <span />
          </div>

          <div className="px-2 pb-3 lg:px-5 lg:pb-5 flex flex-col gap-2">
            {visibleStandings.length === 0 && (
              <p className="py-12 text-center text-sm font-bold text-ink-soft">
                No manager matches “{query}”.
              </p>
            )}

            {visibleStandings.map((manager) => {
              const position = manager.position;
              const isExpanded = expandedRow === manager.id;
              const gwNet = netGwPoints(manager);
              const history = rankHistoryByManager[String(manager.id)] || [];
              const benched = manager.benchPoints;
              // A double-digit bench score is points thrown away — call it out.
              const benchInk = benched >= 8 ? 'text-coral-ink' : 'text-ink-soft';
              const rowTone = position <= 3 ? 'bg-surface' : 'bg-tile-row';
              const wonThisGw = currentGwLeaderId === String(manager.id);

              return (
                <div key={manager.id}>
                  {/* ── Desktop row ─────────────────────────────────────── */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleRowExpansion(manager.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        toggleRowExpansion(manager.id);
                      }
                    }}
                    className={cn(
                      'cursor-pointer rounded-[22px] transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet',
                      isExpanded ? 'bg-surface-sunk' : rowTone,
                      'hover:brightness-[0.98]'
                    )}
                  >
                    <div className="hidden lg:grid grid-cols-[46px_minmax(0,1fr)_76px_104px_62px_92px_52px_72px_62px_16px] gap-2.5 items-center px-3.5 py-2.5">
                      <RankBadge rank={position} size={44} />

                      <div className="flex items-center gap-3 min-w-0">
                        <span className={cn(
                          'w-11 h-11 shrink-0 rounded-full border-2 border-ink/85 flex items-center justify-center font-display font-bold text-[15px] text-ink',
                          manager.avatarTone
                        )}>
                          {manager.initials}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-display font-bold text-[17px] leading-tight text-ink truncate">
                            {manager.teamName || manager.entry_name}
                          </span>
                          <span className="block text-[13px] font-bold text-ink-soft leading-tight truncate">
                            {manager.managerName || manager.player_name}
                          </span>
                        </span>
                      </div>

                      <span className="text-right text-[13px] font-bold text-ink-soft tabular-nums">
                        {formatTeamValue(manager.teamValue) || '—'}
                      </span>

                      <span className="text-center">
                        {manager.chipThisGw ? (
                          <span className="inline-block bg-tone-2 border-2 border-ink/85 rounded-full px-2.5 py-1 text-[11px] font-bold text-ink whitespace-nowrap">
                            {chipLabel(manager.chipThisGw.name)}
                          </span>
                        ) : (
                          <span className="text-[15px] font-bold text-ink-soft/45">—</span>
                        )}
                      </span>

                      <span className={cn('text-center text-[15.5px] font-bold tabular-nums', benchInk)}>
                        {benched ?? '—'}
                      </span>

                      <span className="text-right text-[13.5px] font-bold text-ink-soft tabular-nums">
                        {manager.overallRank ? manager.overallRank.toLocaleString() : '—'}
                      </span>

                      <span className="text-right text-[16px] font-bold text-ink tabular-nums">
                        {gwNet}
                        {(manager.gameweekHits || 0) > 0 && (
                          <span className="block text-[10px] text-coral-ink leading-none">-{manager.gameweekHits}</span>
                        )}
                      </span>

                      <span className="text-right font-display font-bold text-[26px] leading-none text-pitch-ink tabular-nums">
                        {manager.totalPoints || manager.total || 0}
                      </span>

                      <span className="flex justify-center">
                        <TrendSpark history={history} maxRank={standings.length} />
                      </span>

                      <ChevronRight
                        size={16}
                        className={cn('text-ink-soft transition-transform duration-300', isExpanded && 'rotate-90')}
                      />
                    </div>

                    {/* ── Mobile row ────────────────────────────────────── */}
                    <div className="lg:hidden flex items-center gap-2.5 px-2.5 py-2 min-h-[58px]">
                      <RankBadge rank={position} size={34} className="shrink-0" />
                      <span className={cn(
                        'w-9 h-9 shrink-0 rounded-full border-2 border-ink/85 flex items-center justify-center font-display font-bold text-[13px] text-ink',
                        manager.avatarTone
                      )}>
                        {manager.initials}
                      </span>
                      <span className="flex-grow min-w-0">
                        <span className="block font-display font-bold text-[15px] leading-tight text-ink truncate">
                          {manager.teamName || manager.entry_name}
                        </span>
                        <span className="flex items-center gap-1.5 mt-0.5 min-w-0">
                          <span className="text-[11.5px] font-bold text-ink-soft truncate">
                            {manager.managerName || manager.player_name}
                          </span>
                          {formatTeamValue(manager.teamValue) && (
                            <span className="shrink-0 bg-tile-sand rounded-full px-1.5 text-[9.5px] font-bold text-ink-soft tabular-nums">
                              {formatTeamValue(manager.teamValue)}
                            </span>
                          )}
                          {manager.chipThisGw && (
                            <span className="shrink-0 bg-tone-2 border-[1.5px] border-ink/85 rounded-full px-1.5 text-[9.5px] font-bold text-ink">
                              {CHIP_SHORT[manager.chipThisGw.name] || chipLabel(manager.chipThisGw.name)}
                            </span>
                          )}
                        </span>
                      </span>
                      <span className="text-right shrink-0">
                        <span className="block font-display font-bold text-[22px] leading-none text-ink tabular-nums">
                          {manager.totalPoints || manager.total || 0}
                        </span>
                        <span className={cn('block text-[10px] font-bold mt-0.5 tabular-nums', benchInk)}>
                          {benched == null ? `${gwNet} GW` : `${benched} benched`}
                        </span>
                      </span>
                      <ChevronRight
                        size={16}
                        className={cn('shrink-0 text-ink-soft transition-transform duration-300', isExpanded && 'rotate-90')}
                      />
                    </div>
                  </div>

                  {/* ── The drill-down ──────────────────────────────────── */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-surface-sunk rounded-[24px] p-4 lg:p-5 mt-2">
                          {/* Four stat tiles */}
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <StatTile label={`GW${currentGW} points`} value={gwNet} />
                            <StatTile
                              label="Overall rank"
                              value={manager.overallRank ? manager.overallRank.toLocaleString() : '—'}
                            />
                            <StatTile label="Left on the bench" value={benched ?? '—'} />
                            {/* The weekly prize is only ever awarded once FPL
                                marks the gameweek finished — bonus points are
                                still moving until then. ৳0 mid-gameweek is
                                correct, so the tile says WHY rather than
                                looking broken. */}
                            <StatTile
                              tone="bg-tile-sage"
                              labelClass="text-pitch-ink"
                              valueClass="text-pitch-ink"
                              label="Weekly prize"
                              value={`৳${gwFinished && wonThisGw ? prizeStructure.weekly.perWeek : 0}`}
                              note={
                                gwFinished
                                  ? (wonThisGw ? `Top of GW${currentGW}` : `Won by the GW${currentGW} leader`)
                                  : `Confirmed once GW${currentGW} closes`
                              }
                            />
                          </div>

                          {/* Prize race — how many points separate this
                              manager from the season top-3 cutoff, which is
                              where the real money (৳800/600/400) sits. */}
                          {magicNumberByManager[manager.id] && (
                            <div
                              className={cn(
                                'rounded-[18px] px-4 py-3.5 mt-3.5 flex items-center gap-3',
                                magicNumberByManager[manager.id].onPodium ? 'bg-tile-gold' : 'bg-tile-clay'
                              )}
                            >
                              <Coins size={22} className="shrink-0" />
                              <p className="text-[13.5px] font-bold text-ink leading-snug">
                                {magicNumberByManager[manager.id].onPodium ? (
                                  magicNumberByManager[manager.id].gap > 0 ? (
                                    <><span className="font-display text-[17px]">{magicNumberByManager[manager.id].gap}</span> pts clear of 4th — the podium prize is theirs to lose.</>
                                  ) : (
                                    <>Level with 4th on points — the podium is not locked in yet.</>
                                  )
                                ) : (
                                  magicNumberByManager[manager.id].gap > 0 ? (
                                    <><span className="font-display text-[17px]">{magicNumberByManager[manager.id].gap}</span> pts back from 3rd — still in the podium race.</>
                                  ) : (
                                    <>Level with 3rd on points — right on the podium cutoff.</>
                                  )
                                )}
                              </p>
                            </div>
                          )}

                          {/* Rank trend */}
                          <div className="bg-surface-alt rounded-[18px] p-4 mt-3.5">
                            {history.length < 2 ? (
                              <div className="flex items-center gap-4">
                                <svg width="240" height="34" viewBox="0 0 240 34" aria-hidden="true" className="shrink-0 max-w-[45%]">
                                  <path d="M8 17h224" className="stroke-silver" strokeWidth="2.6" strokeDasharray="5 6" strokeLinecap="round" fill="none" />
                                  <circle cx="14" cy="17" r="7" className="fill-sunflower stroke-ink" strokeWidth="1.8" />
                                </svg>
                                <p className="text-[13.5px] font-bold text-ink-soft">
                                  Rank trend starts drawing from GW{Math.max(2, currentGW)} — {history.length === 1 ? 'one week in' : 'nothing played yet'}, there is no line yet.
                                </p>
                              </div>
                            ) : (
                              <>
                                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-soft mb-1">
                                  League rank trend
                                </p>
                                <RankTrendSparkline data={history} maxRank={standings.length} />
                              </>
                            )}
                          </div>

                          {/* Three actions */}
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-3.5">
                            <Button
                              variant="primary"
                              className="w-full justify-center min-h-[48px] rounded-full bg-ink text-surface hover:bg-ink/90"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTeam(manager);
                              }}
                            >
                              <Jersey size={19} tone="fill-coral" /> View the XI
                            </Button>

                            {/* Always reachable now. It used to be rendered
                                only when this manager had already won
                                something, which — with no gameweek finished
                                yet — meant the Prize breakdown simply
                                disappeared from the app. The modal has its own
                                "no prizes won yet" state; that is the honest
                                answer, not a hidden button. */}
                            <Button
                              variant="outline"
                              className="w-full justify-center min-h-[48px] rounded-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPrizeManager({
                                  ...manager,
                                  prizeData: calculatePrizeBreakdown(manager.id)
                                });
                              }}
                            >
                              <Coins size={19} /> Prize breakdown
                              {manager.totalPrizesWon > 0 && (
                                <span className="font-display text-pitch-ink">৳{manager.totalPrizesWon}</span>
                              )}
                            </Button>

                            <Button
                              variant="ghost"
                              className="w-full justify-center min-h-[48px] rounded-full text-coral-ink hover:bg-tile-clay"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Exclude ${manager.managerName || manager.player_name} from all rankings and prize calculations?`)) {
                                  excludeTeam(manager.id);
                                }
                              }}
                            >
                              <UserX size={17} /> Exclude from prizes
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </Card>
      </motion.div>

      {selectedTeam && (
        <TeamView
          managerId={selectedTeam.id || selectedTeam.entry}
          managerName={selectedTeam.managerName}
          teamName={selectedTeam.teamName}
          gameweekInfo={gameweekInfo}
          onClose={() => setSelectedTeam(null)}
        />
      )}

      {selectedPrizeManager && (
        <PrizeBreakdown
          managerName={selectedPrizeManager.managerName || selectedPrizeManager.player_name}
          teamName={selectedPrizeManager.teamName || selectedPrizeManager.entry_name}
          prizeData={selectedPrizeManager.prizeData}
          onClose={() => setSelectedPrizeManager(null)}
        />
      )}

      {/* Mobile-only shortcut to this gameweek's Insights (story, captain
          split, price/fixture watch) — see InsightsFAB.jsx for why this
          lives on the home destination specifically. */}
      <InsightsFAB
        gameweekTable={gameweekTable}
        gameweek={currentGW}
        standings={standings}
        status={gwFinished ? 'completed' : 'current'}
      />
    </>
  );
};

/* ─────────────────────────────── row pieces ──────────────────────────────*/

const StatTile = ({ label, value, note, tone = 'bg-surface-alt', labelClass = 'text-ink-soft', valueClass = 'text-ink' }) => (
  <div className={cn('rounded-[18px] px-4 py-3.5', tone)}>
    <div className={cn('text-[11.5px] font-bold uppercase tracking-[0.04em]', labelClass)}>{label}</div>
    <div className={cn('font-display font-bold text-[26px] leading-none mt-1.5 tabular-nums', valueClass)}>{value}</div>
    {note && <div className="text-[10.5px] font-bold text-ink-soft mt-1.5 leading-tight">{note}</div>}
  </div>
);

// The TREND column. With fewer than two gameweeks there is nothing to draw a
// line BETWEEN, and the artboards are explicit about not faking one: a dashed
// run with a single dot on it is the "no line yet" mark.
const TrendSpark = ({ history, maxRank }) => {
  if (history.length < 2) {
    return (
      <svg width="60" height="22" viewBox="0 0 60 22" aria-label="No rank trend yet" className="block">
        <path d="M2 11h56" className="stroke-silver" strokeWidth="2.2" strokeDasharray="4 5" strokeLinecap="round" fill="none" />
        <circle cx="9" cy="11" r="4.4" className="fill-sunflower stroke-ink" strokeWidth="1.6" />
      </svg>
    );
  }

  const first = history[0];
  const last = history[history.length - 1];
  const improved = last.rank < first.rank;
  const unchanged = last.rank === first.rank;
  const tone = unchanged ? 'stroke-silver' : improved ? 'stroke-pitch' : 'stroke-coral';
  const dot = unchanged ? 'fill-silver' : improved ? 'fill-pitch' : 'fill-coral';

  const stepX = 56 / (history.length - 1);
  const scaleY = (rank) => ((rank - 1) / Math.max(maxRank - 1, 1)) * 14 + 4;
  const points = history.map((d, i) => `${2 + i * stepX},${scaleY(d.rank)}`).join(' ');

  return (
    <svg
      width="60"
      height="22"
      viewBox="0 0 60 22"
      aria-label={`Rank ${first.rank} in GW${first.gw} to ${last.rank} in GW${last.gw}`}
      className="block"
    >
      <polyline points={points} fill="none" className={tone} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={2 + (history.length - 1) * stepX} cy={scaleY(last.rank)} r="3" className={dot} />
    </svg>
  );
};

export default LeagueTable;
