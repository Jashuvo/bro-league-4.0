import { describe, it, expect } from 'vitest';
import {
  getNetPoints,
  collectWeeklyWins,
  collectMonthlyWins,
  calculatePrizeBreakdown,
  calculateTotalPrizesWon,
} from './prizeMath';

// Only the fields the prize math reads — gameweekTable's real manager shape
// (`points` + `transferCost`) plus the alternate shapes the fallbacks cover.
const m = (id, points, transferCost = 0) => ({ id, name: `Manager ${id}`, points, transferCost });
const gw = (gameweek, managers) => ({ gameweek, managers });

const prizeStructure = {
  weekly: { perWeek: 30 },
  monthly: { regularPrizes: [350, 250, 150], finalMonth: [500, 400, 250] },
};

const monthlyWindows = [
  { id: 1, name: 'Month 1', start: 1, end: 4 },
  { id: 9, name: 'Final Month', start: 33, end: 38, isFinal: true },
];

// Month 1: four gameweeks, same relative order each week — A < B < C < D.
const month1Table = [1, 2, 3, 4].map((gameweek) => gw(gameweek, [
  m(1, 10), m(2, 20), m(3, 30), m(4, 40),
]));

const weeklyCtx = (overrides) => ({
  currentGW: 4,
  gwFinished: true,
  perWeekPrize: prizeStructure.weekly.perWeek,
  ...overrides,
});

describe('getNetPoints', () => {
  it('deducts transfer hits from gameweek points', () => {
    expect(getNetPoints(m(1, 70, 8))).toBe(62);
  });

  it('falls back through the alternate field shapes the data arrives in', () => {
    expect(getNetPoints({ gameweekPoints: 55, gameweekHits: 4 })).toBe(51);
    expect(getNetPoints({ points: 40, event_transfers_cost: 4 })).toBe(36);
  });
});

describe('collectWeeklyWins', () => {
  it('awards the gameweeks a manager actually won, with points after hits', () => {
    const table = [gw(1, [m(1, 60, 8), m(2, 55)]), gw(2, [m(1, 40), m(2, 50)])];
    // GW1: 52 net vs 55 — the hit costs manager 1 the week. GW2: manager 2 wins again.
    expect(collectWeeklyWins(table, 1, weeklyCtx({ currentGW: 2 }))).toEqual([]);
    expect(collectWeeklyWins(table, 2, weeklyCtx({ currentGW: 2 }))).toEqual([
      { gameweek: 1, points: 55, prize: 30 },
      { gameweek: 2, points: 50, prize: 30 },
    ]);
  });

  it('does not count the current gameweek until FPL has finished it', () => {
    const table = month1Table;
    // Manager 4 led GW4 — still live, so GW4 is not theirs yet.
    const wins = collectWeeklyWins(table, 4, weeklyCtx({ currentGW: 4, gwFinished: false }));
    expect(wins.map((w) => w.gameweek)).toEqual([1, 2, 3]);
    expect(collectWeeklyWins(table, 4, weeklyCtx({ currentGW: 4, gwFinished: true })).map((w) => w.gameweek))
      .toEqual([1, 2, 3, 4]);
  });

  it('never awards a gameweek nobody scored in', () => {
    const table = [gw(1, [m(1, 0), m(2, 0)])];
    expect(collectWeeklyWins(table, 1, weeklyCtx({ currentGW: 1 }))).toEqual([]);
  });

  it('returns nothing for an empty table or a non-winner', () => {
    expect(collectWeeklyWins([], 1, weeklyCtx())).toEqual([]);
    expect(collectWeeklyWins(month1Table, 99, weeklyCtx())).toEqual([]);
  });
});

describe('collectMonthlyWins', () => {
  const ctx = (overrides) => ({
    currentGW: 5,
    gwFinished: false,
    monthlyWindows,
    prizeStructure,
    ...overrides,
  });

  it('sums a window and pays the top three', () => {
    // Totals over GW1-4: A 40, B 80, C 120, D 160.
    expect(collectMonthlyWins(month1Table, 4, ctx())).toEqual([
      { month: 1, position: 1, points: 160, prize: 350 },
    ]);
    expect(collectMonthlyWins(month1Table, 3, ctx())[0]).toMatchObject({ position: 2, prize: 250 });
    expect(collectMonthlyWins(month1Table, 2, ctx())[0]).toMatchObject({ position: 3, prize: 150 });
    expect(collectMonthlyWins(month1Table, 1, ctx())).toEqual([]);
  });

  it('pays the final month from the final prize table', () => {
    // The final window is GW33–38, so it settles at GW38 — not when we reach
    // its first gameweek.
    const table = [gw(33, [m(1, 5), m(2, 9)]), gw(38, [m(1, 5), m(2, 9)])];
    const finalCtx = ctx({ currentGW: 38, gwFinished: true });
    expect(collectMonthlyWins(table, 2, finalCtx)).toEqual([
      { month: 9, position: 1, points: 18, prize: 500 },
    ]);
    expect(collectMonthlyWins(table, 1, finalCtx)[0]).toMatchObject({ position: 2, prize: 400 });
    expect(collectMonthlyWins(table, 2, ctx({ currentGW: 37, gwFinished: true }))).toEqual([]);
  });

  it("holds a month back while its last gameweek is still live", () => {
    expect(collectMonthlyWins(month1Table, 4, ctx({ currentGW: 4, gwFinished: false }))).toEqual([]);
    expect(collectMonthlyWins(month1Table, 4, ctx({ currentGW: 4, gwFinished: true }))).toHaveLength(1);
  });

  it('counts a month once it is behind us', () => {
    expect(collectMonthlyWins(month1Table, 4, ctx({ currentGW: 5, gwFinished: false }))).toHaveLength(1);
  });

  it('sums hits along with points', () => {
    // Manager 2 scores more raw but takes a hit, dropping below manager 1.
    const table = [1, 2, 3, 4].map((gameweek) => gw(gameweek, [m(1, 30), m(2, 32, 4)]));
    expect(collectMonthlyWins(table, 1, ctx())[0]).toMatchObject({ position: 1, points: 120, prize: 350 });
    expect(collectMonthlyWins(table, 2, ctx())[0]).toMatchObject({ position: 2, points: 112 });
  });
});

describe('prize totals', () => {
  const ctx = { currentGW: 4, gwFinished: true, monthlyWindows, prizeStructure, perWeekPrize: 30 };

  it('is the sum of weekly and monthly wins, and the breakdown agrees', () => {
    const breakdown = calculatePrizeBreakdown(month1Table, 4, ctx);
    // Three weekly wins at 30 each + month 1 as winner at 350.
    expect(breakdown.weeklyWins).toHaveLength(4);
    expect(breakdown.totalPrizes).toBe(4 * 30 + 350);
    expect(calculateTotalPrizesWon(month1Table, 4, ctx)).toBe(breakdown.totalPrizes);
  });

  it('is zero — with an empty breakdown — before any gameweek has finished', () => {
    const breakdown = calculatePrizeBreakdown(month1Table, 4, { ...ctx, currentGW: 1, gwFinished: false });
    expect(breakdown).toEqual({ weeklyWins: [], monthlyWins: [], totalPrizes: 0 });
    expect(calculateTotalPrizesWon([], 4, ctx)).toBe(0);
  });
});
