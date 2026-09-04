// src/data/leagueData.js
//
// Single source of truth for this season's league identity + prize
// structure. Every component that needs an entry fee, prize amount, or
// monthly-competition gameweek range should import it from here instead of
// re-declaring its own copy — that's how the four/five independent copies
// of this data drifted last season.
//
// The gameweek windows and prize AMOUNTS below are imported from
// api/_lib/prizeConfig.js, not redeclared here — that file used to be a
// hand-maintained duplicate (it has to be Node-safe for the serverless
// functions/scripts that use it, and this file can't be, since it reads
// `import.meta.env` — a Vite build-time feature). But prizeConfig.js
// itself has no Vite-only code, so it can just as easily be imported FROM
// the browser side too: importing it here instead of copying its values
// makes it the single real source of truth, with zero drift risk, rather
// than "two copies, please keep them in sync by hand."
//
// Participant count is intentionally NOT here — it's live headcount, not
// season config, so components read it straight from `leagueStats` /
// `standings` instead of a number that would need updating by hand every
// time someone joins or leaves.
//
// What to update at the start of a new season:
//   - `leagueConfig.season` below
//   - VITE_FPL_LEAGUE_ID / VITE_ENTRY_FEE / VITE_TOTAL_PRIZE_POOL in
//     .env.local (and in the Vercel dashboard)
//   - the prize amounts in api/_lib/prizeConfig.js, if the league changes
//     how winnings are split — NOT here, that's the actual source now
import {
  monthlyWindows as sharedMonthlyWindows,
  weeklyPrize,
  monthlyRegularPrizes,
  monthlyFinalPrizes,
  seasonPrizes as sharedSeasonPrizes,
} from '../../api/_lib/prizeConfig.js';

export const leagueConfig = {
  name: import.meta.env.VITE_LEAGUE_NAME || 'BRO League 5',
  season: '2026/27',
  entryFee: Number(import.meta.env.VITE_ENTRY_FEE) || 800,
  totalPrizePool: Number(import.meta.env.VITE_TOTAL_PRIZE_POOL) || 12000,
  currency: '৳',
};

export const totalGameweeks = 38;

// 9 monthly competition windows of 4 gameweeks each, except the final one
// which absorbs the extra gameweeks so they cover all 38.
export const monthlyWindows = sharedMonthlyWindows;

const weeklyPrizeConfig = {
  perWeek: weeklyPrize,
  totalWeeks: totalGameweeks,
  total: weeklyPrize * totalGameweeks,
};

const monthlyPrizeConfig = {
  regularMonths: monthlyWindows.filter((w) => !w.isFinal).length,
  regularPrizes: monthlyRegularPrizes,
  finalMonth: monthlyFinalPrizes,
  get total() {
    return monthlyWindows.reduce((sum, w) => {
      const amounts = w.isFinal ? this.finalMonth : this.regularPrizes;
      return sum + amounts.reduce((a, b) => a + b, 0);
    }, 0);
  },
};

// `color`/`tone`/`emoji` are UI-only — display styling that has no reason
// to exist server-side, so they're layered on here rather than living in
// the shared position/amount/label data prizeConfig.js exports. Design
// tokens from tailwind.config.js (never stock Tailwind palette entries).
const PODIUM_STYLE = {
  1: { emoji: '🥇', color: 'text-sunflower-ink', tone: 'fill-sunflower' },
  2: { emoji: '🥈', color: 'text-silver-ink', tone: 'fill-silver' },
  3: { emoji: '🥉', color: 'text-tangerine-ink', tone: 'fill-tangerine' },
};
const seasonPrizes = sharedSeasonPrizes.map((prize) => ({ ...prize, ...PODIUM_STYLE[prize.position] }));
const seasonTotal = seasonPrizes.reduce((sum, p) => sum + p.amount, 0);

const souvenirs = {
  total: 1910,
  items: ['BRO League Jerseys', 'Certificates', 'Digital Badges', 'Trophy for Champion'],
};

export const prizeStructure = {
  season: { total: seasonTotal, prizes: seasonPrizes },
  weekly: weeklyPrizeConfig,
  monthly: {
    regularMonths: monthlyPrizeConfig.regularMonths,
    regularPrizes: monthlyPrizeConfig.regularPrizes,
    finalMonth: monthlyPrizeConfig.finalMonth,
    total: monthlyPrizeConfig.total,
  },
  souvenirs,
};

// Sum of every category above. This is the number actually being given out —
// if it drifts from `leagueConfig.totalPrizePool` (the entry-fee collection
// total), the prize breakdown and the money collected have gone out of sync
// and one of them needs updating.
export const grandTotal =
  prizeStructure.season.total +
  prizeStructure.weekly.total +
  prizeStructure.monthly.total +
  prizeStructure.souvenirs.total;
