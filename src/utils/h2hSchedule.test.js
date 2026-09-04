import { describe, it, expect } from 'vitest';
import { generateH2HSchedule, computeH2HStandings, seedFromIds } from './h2hSchedule.js';

describe('generateH2HSchedule', () => {
  it('is deterministic — same manager IDs always produce the same schedule', () => {
    const ids = [1, 2, 3, 4, 5, 6];
    const seed = seedFromIds(ids);
    const a = generateH2HSchedule(ids, seed, 10);
    const b = generateH2HSchedule(ids, seed, 10);
    expect(a).toEqual(b);
  });

  it('every manager plays exactly one match per gameweek (even league size)', () => {
    const ids = [1, 2, 3, 4, 5, 6];
    const schedule = generateH2HSchedule(ids, seedFromIds(ids), 12);
    schedule.forEach(({ pairs }) => {
      const playing = pairs.flat();
      expect(playing.length).toBe(ids.length);
      expect(new Set(playing).size).toBe(ids.length); // nobody plays twice in one gameweek
    });
  });

  it('handles an odd number of managers with a bye (nobody double-booked)', () => {
    const ids = [1, 2, 3, 4, 5];
    const schedule = generateH2HSchedule(ids, seedFromIds(ids), 8);
    schedule.forEach(({ pairs }) => {
      const playing = pairs.flat();
      expect(playing.length).toBeLessThanOrEqual(ids.length - 1);
      expect(new Set(playing).size).toBe(playing.length);
    });
  });

  it('cycles the round-robin to cover a season longer than one cycle', () => {
    const ids = [1, 2, 3, 4]; // one cycle = 3 rounds
    const schedule = generateH2HSchedule(ids, seedFromIds(ids), 7);
    expect(schedule).toHaveLength(7);
    expect(schedule[0].pairs).toEqual(schedule[3].pairs); // gw4 repeats gw1's round
    expect(schedule[1].pairs).toEqual(schedule[4].pairs);
  });

  it('never pairs a manager against themselves', () => {
    const ids = [1, 2, 3, 4, 5, 6, 7, 8];
    const schedule = generateH2HSchedule(ids, seedFromIds(ids), 20);
    schedule.forEach(({ pairs }) => {
      pairs.forEach(([a, b]) => expect(a).not.toBe(b));
    });
  });
});

describe('computeH2HStandings', () => {
  const standings = [
    { id: 1, totalPoints: 500 },
    { id: 2, totalPoints: 520 },
    { id: 3, totalPoints: 480 },
  ];

  it('awards 3 for a win, 1 each for a draw, 0 for a loss', () => {
    const schedule = [
      { gameweek: 1, pairs: [[1, 2]] },
      { gameweek: 2, pairs: [[1, 3]] },
    ];
    const gameweekTable = [
      { gameweek: 1, managers: [{ id: 1, points: 60, transferCost: 0 }, { id: 2, points: 50, transferCost: 0 }] }, // 1 beats 2
      { gameweek: 2, managers: [{ id: 1, points: 40, transferCost: 0 }, { id: 3, points: 40, transferCost: 0 }] }, // draw
    ];
    const table = computeH2HStandings(schedule, gameweekTable, standings);
    const row1 = table.find((r) => r.managerId === 1);
    expect(row1).toMatchObject({ wins: 1, draws: 1, losses: 0, h2hPoints: 4, played: 2 });
    const row2 = table.find((r) => r.managerId === 2);
    expect(row2).toMatchObject({ wins: 0, draws: 0, losses: 1, h2hPoints: 0 });
  });

  it('counts net points (after transfer-cost hits), not raw points', () => {
    const schedule = [{ gameweek: 1, pairs: [[1, 2]] }];
    const gameweekTable = [
      // Manager 1: 60 raw - 8 hit = 52 net. Manager 2: 55 raw, no hit = 55 net.
      // Manager 2 should win on NET points despite a lower raw score.
      { gameweek: 1, managers: [{ id: 1, points: 60, transferCost: 8 }, { id: 2, points: 55, transferCost: 0 }] },
    ];
    const table = computeH2HStandings(schedule, gameweekTable, standings);
    expect(table.find((r) => r.managerId === 2).wins).toBe(1);
    expect(table.find((r) => r.managerId === 1).losses).toBe(1);
  });

  it('ties on H2H points are broken by season total points, not any points-margin metric', () => {
    // Both 1 and 3 finish with identical W/D/L/h2hPoints; standings gives
    // manager 1 a HIGHER season total, so it must rank above manager 3
    // despite manager 3 having, say, won by a bigger margin in its match.
    const schedule = [
      { gameweek: 1, pairs: [[1, 2]] },
      { gameweek: 1, pairs: [[3, 2]] }, // (contrived: reuse gw1 twice for a minimal fixture)
    ];
    const gameweekTable = [
      { gameweek: 1, managers: [{ id: 1, points: 51, transferCost: 0 }, { id: 2, points: 50, transferCost: 0 }, { id: 3, points: 90, transferCost: 0 }] },
    ];
    const table = computeH2HStandings(schedule, gameweekTable, standings); // 1 wins by 1, 3 wins by 40
    const row1 = table.find((r) => r.managerId === 1);
    const row3 = table.find((r) => r.managerId === 3);
    expect(row1.h2hPoints).toBe(row3.h2hPoints); // same H2H points despite very different margins
    const pos1 = table.indexOf(row1);
    const pos3 = table.indexOf(row3);
    expect(pos1).toBeLessThan(pos3); // manager 1 (season total 500) ranks above manager 3 (480)
  });

  it('skips gameweeks that have not been played yet', () => {
    const schedule = [
      { gameweek: 1, pairs: [[1, 2]] },
      { gameweek: 2, pairs: [[1, 2]] }, // no gameweekTable entry for gw2
    ];
    const gameweekTable = [
      { gameweek: 1, managers: [{ id: 1, points: 60, transferCost: 0 }, { id: 2, points: 50, transferCost: 0 }] },
    ];
    const table = computeH2HStandings(schedule, gameweekTable, standings);
    expect(table.find((r) => r.managerId === 1).played).toBe(1);
  });
});
