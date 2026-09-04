// api/_lib/prizeConfig.test.js
//
// Tests for exactly the logic that produced two real, live bugs today
// (caught by hand, against production, before this test suite existed):
// final_rank showing FPL's global rank instead of the league's, and a
// season Champion getting crowned after gameweek 2. Both are now
// impossible to regress silently.
import { describe, it, expect } from 'vitest';
import { getWeeklyWinner, getMonthlyTop, getInLeagueRanks, isSeasonFinalGameweek } from './prizeConfig.js';

describe('getWeeklyWinner', () => {
  it('picks the highest net points (points minus transfer hits)', () => {
    const gw = {
      gameweek: 5,
      managers: [
        { id: 1, managerName: 'A', teamName: 'TA', points: 60, transferCost: 4 }, // net 56
        { id: 2, managerName: 'B', teamName: 'TB', points: 58, transferCost: 0 }, // net 58
      ],
    };
    expect(getWeeklyWinner(gw)).toEqual({ managerId: 2, managerName: 'B', teamName: 'TB', netPoints: 58 });
  });

  it('returns null for a gameweek with no manager data', () => {
    expect(getWeeklyWinner({ gameweek: 1, managers: [] })).toBeNull();
    expect(getWeeklyWinner({ gameweek: 1 })).toBeNull();
  });
});

describe('getMonthlyTop', () => {
  const table = [
    { gameweek: 1, managers: [{ id: 1, managerName: 'A', points: 50, transferCost: 0 }, { id: 2, managerName: 'B', points: 40, transferCost: 0 }] },
    { gameweek: 2, managers: [{ id: 1, managerName: 'A', points: 30, transferCost: 4 }, { id: 2, managerName: 'B', points: 55, transferCost: 0 }] },
  ];

  it('sums net points across the window and ranks highest first', () => {
    const top = getMonthlyTop(table, { start: 1, end: 4 }, 3);
    // A: 50 + (30-4) = 76, B: 40 + 55 = 95
    expect(top).toEqual([
      { managerId: 2, managerName: 'B', teamName: undefined, totalPoints: 95 },
      { managerId: 1, managerName: 'A', teamName: undefined, totalPoints: 76 },
    ]);
  });

  it('respects prizeCount', () => {
    expect(getMonthlyTop(table, { start: 1, end: 4 }, 1)).toHaveLength(1);
  });

  it('returns [] when no gameweek in the window has been played yet', () => {
    expect(getMonthlyTop(table, { start: 33, end: 38 }, 3)).toEqual([]);
  });
});

describe('getInLeagueRanks', () => {
  it('ranks by cumulative total_points, NOT by any global-rank-shaped field', () => {
    // Regression test: the original bug used `manager.rank`, which in
    // gameweekTable is FPL's global overall rank (a number like
    // 6382778) — this fixture deliberately gives each manager a `rank`
    // field that would produce the OPPOSITE order if it were used.
    const managers = [
      { id: 1, totalPoints: 100, rank: 9000000 },
      { id: 2, totalPoints: 200, rank: 100 },
      { id: 3, totalPoints: 150, rank: 5000000 },
    ];
    const ranks = getInLeagueRanks(managers);
    expect(ranks.get(2)).toBe(1); // highest total_points -> rank 1
    expect(ranks.get(3)).toBe(2);
    expect(ranks.get(1)).toBe(3);
  });

  it('handles an empty or missing managers list', () => {
    expect(getInLeagueRanks([]).size).toBe(0);
    expect(getInLeagueRanks(undefined).size).toBe(0);
  });
});

describe('isSeasonFinalGameweek', () => {
  it('is false for any gameweek short of the season\'s real final one', () => {
    // Regression test: this is the exact scenario that crowned a
    // "Champion" after gameweek 2 in testing — finalGwNumber must come
    // from the season's total (38), not from "highest gameweek captured
    // so far".
    expect(isSeasonFinalGameweek(2, 38, true)).toBe(false);
    expect(isSeasonFinalGameweek(37, 38, true)).toBe(false);
  });

  it('is true only on gameweek 38 once its bonus points are locked in', () => {
    expect(isSeasonFinalGameweek(38, 38, true)).toBe(true);
    expect(isSeasonFinalGameweek(38, 38, false)).toBe(false);
    expect(isSeasonFinalGameweek(38, 38, undefined)).toBe(false);
  });
});
