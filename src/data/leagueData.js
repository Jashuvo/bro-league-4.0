// src/data/leagueData.js
//
// Single source of truth for this season's league identity + prize
// structure. Every component that needs an entry fee, prize amount, or
// monthly-competition gameweek range should import it from here instead of
// re-declaring its own copy — that's how the four/five independent copies
// of this data drifted last season.
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
//   - the prize amounts below, if the league changes how winnings are split

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
export const monthlyWindows = [
  { id: 1, name: 'Month 1', start: 1, end: 4 },
  { id: 2, name: 'Month 2', start: 5, end: 8 },
  { id: 3, name: 'Month 3', start: 9, end: 12 },
  { id: 4, name: 'Month 4', start: 13, end: 16 },
  { id: 5, name: 'Month 5', start: 17, end: 20 },
  { id: 6, name: 'Month 6', start: 21, end: 24 },
  { id: 7, name: 'Month 7', start: 25, end: 28 },
  { id: 8, name: 'Month 8', start: 29, end: 32 },
  { id: 9, name: 'Final Month', start: 33, end: 38, isFinal: true },
];

const weeklyPrizeConfig = {
  perWeek: 30,
  totalWeeks: totalGameweeks,
  total: 30 * totalGameweeks,
};

const monthlyPrizeConfig = {
  regularMonths: monthlyWindows.filter((w) => !w.isFinal).length,
  regularPrizes: [350, 250, 150],
  finalMonth: [500, 400, 250],
  get total() {
    return monthlyWindows.reduce((sum, w) => {
      const amounts = w.isFinal ? this.finalMonth : this.regularPrizes;
      return sum + amounts.reduce((a, b) => a + b, 0);
    }, 0);
  },
};

// `color`/`tone` are design tokens from tailwind.config.js (never stock
// Tailwind palette entries) — the amounts are the data, these just say which
// podium metal each position wears.
const seasonPrizes = [
  { position: 1, amount: 800, emoji: '🥇', color: 'text-sunflower-ink', tone: 'fill-sunflower', label: 'Champion' },
  { position: 2, amount: 600, emoji: '🥈', color: 'text-silver-ink', tone: 'fill-silver', label: 'Runner-up' },
  { position: 3, amount: 400, emoji: '🥉', color: 'text-tangerine-ink', tone: 'fill-tangerine', label: 'Third Place' },
];
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
