import { describe, it, expect } from 'vitest';
import { buildManagerProfile, halfOf, CLASSIC_CHIPS } from './managerProfile';

// Two managers, four gameweeks. Manager 1 is the subject throughout.
const gw = (gameweek, managers, averageScore) => ({ gameweek, managers, averageScore });

const TABLE = [
  gw(1, [
    { id: 1, name: 'A', points: 60, transferCost: 0, transfers: 1, benchPoints: 5 },
    { id: 2, name: 'B', points: 40, transferCost: 0, transfers: 0, benchPoints: 2 },
  ]),
  gw(2, [
    { id: 1, name: 'A', points: 50, transferCost: 4, transfers: 2, benchPoints: 12 },
    { id: 2, name: 'B', points: 70, transferCost: 0, transfers: 1, benchPoints: 3 },
  ]),
  gw(3, [
    { id: 1, name: 'A', points: 30, transferCost: 8, transfers: 3, benchPoints: 0 },
    { id: 2, name: 'B', points: 35, transferCost: 0, transfers: 0, benchPoints: 1 },
  ]),
  gw(4, [
    { id: 1, name: 'A', points: 80, transferCost: 0, transfers: 0, benchPoints: 7 },
    { id: 2, name: 'B', points: 60, transferCost: 0, transfers: 1, benchPoints: 9 },
  ]),
];

const SUBJECT = {
  id: 1,
  managerName: 'A Manager',
  teamName: 'A FC',
  chips: [
    { name: 'wildcard', event: 3 },
    { name: 'bboost', event: 22 },
  ],
};

const profile = () =>
  buildManagerProfile({
    manager: SUBJECT,
    gameweekTable: TABLE,
    standings: [
      { id: 1, entry: 1 },
      { id: 2, entry: 2 },
    ],
  });

describe('buildManagerProfile — season totals', () => {
  it('sums raw points, hits, transfers and bench across every played gameweek', () => {
    const p = profile();
    expect(p.gameweeksPlayed).toBe(4);
    expect(p.points).toBe(60 + 50 + 30 + 80);
    expect(p.hits).toBe(12);
    expect(p.transfers).toBe(6);
    expect(p.benchPoints).toBe(5 + 12 + 0 + 7);
  });

  it('reports net points as raw minus hits, not raw', () => {
    const p = profile();
    // 220 raw - 12 in hits. Asserting the NET figure specifically: the whole
    // app ranks on net, so a profile showing raw would disagree with the
    // table it was opened from.
    expect(p.netPoints).toBe(208);
    expect(p.averageNet).toBe(52);
    expect(p.transfersPerGameweek).toBe(1.5);
  });

  it('picks the best and worst gameweek by NET score, not raw', () => {
    const p = profile();
    // GW4 (80) is the best net week; GW3 is the worst at 30 - 8 = 22, and
    // stays the worst even though GW2 scored only 4 more raw than GW3.
    expect(p.best).toMatchObject({ gameweek: 4, points: 80, net: 80 });
    expect(p.worst).toMatchObject({ gameweek: 3, points: 30, net: 22 });
  });

  it('finds the biggest hit and the most points left on the bench', () => {
    const p = profile();
    expect(p.biggestHit).toEqual({ gameweek: 3, hits: 8 });
    expect(p.worstBench).toEqual({ gameweek: 2, points: 12 });
  });
});

describe('buildManagerProfile — positions and form', () => {
  it('reads league position from the rank trend and reports the climb', () => {
    const p = profile();
    // Cumulative net: GW1 A 60 vs B 40 (A 1st), GW2 A 106 vs B 110 (A 2nd),
    // GW3 A 128 vs B 145 (A 2nd), GW4 A 208 vs B 205 (A back to 1st).
    expect(p.rankTrend.map((t) => t.rank)).toEqual([1, 2, 2, 1]);
    expect(p.position.current.rank).toBe(1);
    expect(p.position.best.rank).toBe(1);
    // `total` is the SUBJECT's own running net (106), not the leader's 110.
    expect(p.position.worst).toEqual({ gw: 2, rank: 2, total: 106 });
    expect(p.position.change).toBe(0);
  });

  it('counts weeks above/below the league average with the same rule as the dots', () => {
    const p = profile();
    // GW1 +10 above, GW2 -8.5... net 46 vs avg 60 => below, GW3 below,
    // GW4 above. Totals: 2 above, 2 below, 0 par.
    expect(p.aboveAverage).toEqual({ above: 2, below: 2, par: 0 });
    expect(p.aboveAverage.above + p.aboveAverage.below + p.aboveAverage.par).toBe(p.gameweeksPlayed);
  });

  it('keeps only the most recent five weeks of form detail', () => {
    const p = profile();
    expect(p.form).toHaveLength(4);
    expect(p.form.map((f) => f.gameweek)).toEqual([1, 2, 3, 4]);
    expect(p.form.every((f) => ['up', 'down', 'flat'].includes(f.trend))).toBe(true);
  });
});
describe('buildManagerProfile — chips', () => {
  it('lists chips in gameweek order, not FPL response order', () => {
    const p = buildManagerProfile({
      manager: {
        id: 1,
        chips: [
          { name: '3xc', event: 12 },
          { name: 'wildcard', event: 3 },
        ],
      },
      gameweekTable: TABLE,
      standings: [{ id: 1 }],
    });
    expect(p.chips.played).toEqual([
      { name: 'wildcard', gameweek: 3 },
      { name: '3xc', gameweek: 12 },
    ]);
    expect(p.chips.playedCount).toBe(2);
  });

  it('holds back only the unused chips for the CURRENT half of the season', () => {
    // Chips played in the first half (GW3) must not count against the second
    // half (GW22) — FPL re-issues the whole set at GW20.
    const p = profile();
    expect(p.chips.half).toBe(1);
    expect(p.chips.holding).toEqual(CLASSIC_CHIPS.filter((c) => c !== 'wildcard'));
  });

  it('reports the second half once the latest gameweek is past GW19', () => {
    const secondHalfTable = [
      ...TABLE,
      gw(20, [
        { id: 1, name: 'A', points: 55, transferCost: 0, transfers: 0, benchPoints: 0 },
        { id: 2, name: 'B', points: 45, transferCost: 0, transfers: 0, benchPoints: 0 },
      ]),
    ];
    const p = buildManagerProfile({
      manager: {
        id: 1,
        chips: [
          { name: 'wildcard', event: 3 },
          { name: 'freehit', event: 21 },
        ],
      },
      gameweekTable: secondHalfTable,
      standings: [{ id: 1 }, { id: 2 }],
    });
    expect(p.chips.half).toBe(2);
    // wildcard was spent in half one, so it's available again in half two.
    expect(p.chips.holding).toEqual(['wildcard', 'bboost', '3xc']);
  });

  it('halfOf uses FPL\u2019s own boundary at GW19/GW20', () => {
    expect(halfOf(1)).toBe(1);
    expect(halfOf(19)).toBe(1);
    expect(halfOf(20)).toBe(2);
    expect(halfOf(38)).toBe(2);
  });
});

describe('buildManagerProfile — missing data', () => {
  it('survives a manager with no rows, no chips and no history', () => {
    const p = buildManagerProfile({ manager: { id: 99 }, gameweekTable: TABLE, standings: [] });
    expect(p.gameweeksPlayed).toBe(0);
    expect(p.netPoints).toBe(0);
    expect(p.averageNet).toBe(0);
    expect(p.transfersPerGameweek).toBe(0);
    expect(p.best.gameweek).toBeNull();
    expect(p.worst.gameweek).toBeNull();
    expect(p.position).toEqual({ current: null, best: null, worst: null, change: 0 });
    expect(p.rankTrend).toEqual([]);
    expect(p.form).toEqual([]);
    expect(p.chips.holding).toEqual(CLASSIC_CHIPS);
  });

  it('never emits NaN averages for a manager with no played gameweeks', () => {
    const p = buildManagerProfile({ manager: { entry: 99 }, gameweekTable: [] });
    // A divide-by-zero here would have rendered "NaN pts avg" in the sheet.
    Object.values(p).forEach((value) => {
      if (typeof value === 'number') expect(Number.isNaN(value)).toBe(false);
    });
  });

  it('accepts a manager keyed by `entry` rather than `id` (raw standings rows)', () => {
    const p = buildManagerProfile({
      manager: { entry: 1, player_name: 'Raw Row', entry_name: 'Raw FC' },
      gameweekTable: TABLE,
      standings: [{ id: 1 }, { id: 2 }],
    });
    expect(p.gameweeksPlayed).toBe(4);
    expect(p.managerName).toBe('Raw Row');
    expect(p.teamName).toBe('Raw FC');
  });

  it('reuses a precomputed rank history when one is passed in', () => {
    const p = buildManagerProfile({
      manager: { id: 1 },
      gameweekTable: TABLE,
      rankHistory: { 1: [{ gw: 1, rank: 7, total: 1 }] },
    });
    expect(p.rankTrend).toEqual([{ gw: 1, rank: 7, total: 1 }]);
    expect(p.position.current.rank).toBe(7);
  });
});