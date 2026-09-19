import { describe, it, expect } from 'vitest';
import { computeSeasonRecords } from './seasonRecords';

const gw = (num, managers) => ({ gameweek: num, managers });

const m = (id, points, transferCost = 0, transfers = 0, benchPoints = 0) => ({
  id, points, transferCost, transfers, benchPoints, name: `M${id}`
});

const standings = [
  { id: 1, managerName: 'Alpha' },
  { id: 2, managerName: 'Bravo' },
  { id: 3, managerName: 'Charlie' },
];

const table = [
  gw(1, [m(1, 60, 0, 1, 5), m(2, 50, 4, 2, 10), m(3, 40, 0, 0, 2)]),
  gw(2, [m(1, 45, 0, 0, 5), m(2, 70, 0, 1, 8), m(3, 65, 8, 3, 3)]),
  gw(3, [m(1, 60, 0, 0, 5), m(2, 50, 0, 1, 9), m(3, 60, 0, 2, 4)]),
  gw(4, [m(1, 55, 0, 0, 5), m(2, 55, 0, 0, 9), m(3, 45, 0, 0, 4)]),
];

describe('computeSeasonRecords', () => {
  const records = computeSeasonRecords(table, standings);

  it('counts net-of-hits weekly wins', () => {
    // GW1: Alpha 60 vs Bravo 46 net → Alpha. GW2: Bravo 70 vs Charlie 57 →
    // Bravo. GW3: Alpha & Charlie both 60 → first by points sort wins the
    // sort tie (both raw 60; sort is stable on net, Alpha listed first).
    // GW4: Alpha & Bravo both 55 net.
    expect(records.weeklyWins[0]).toEqual({ id: 1, name: 'Alpha', value: 3 });
    expect(records.weeklyWins[1]).toEqual({ id: 2, name: 'Bravo', value: 1 });
  });

  it('sums season transfer counts', () => {
    expect(records.mostTransfers[0]).toEqual({ id: 3, name: 'Charlie', value: 5 });
    expect(records.mostTransfers.map((r) => r.id)).toEqual([3, 2, 1]);
  });

  it('totals points left on the bench', () => {
    expect(records.benchStrength[0]).toEqual({ id: 2, name: 'Bravo', value: 36 });
  });

  it('ranks consistency as the lowest spread of net points', () => {
    // Alpha nets: 60, 45, 60, 55 → tight. Bravo nets: 50, 70, 50, 55 → wide.
    const alpha = records.consistency.find((r) => r.id === 1);
    const bravo = records.consistency.find((r) => r.id === 2);
    expect(alpha.value).toBeLessThan(bravo.value);
    expect(records.consistency[0].id).toBe(1);
  });

  it('returns empty boards for an empty table', () => {
    const empty = computeSeasonRecords([], standings);
    expect(empty.weeklyWins).toEqual([]);
    expect(empty.mostTransfers).toEqual([]);
    expect(empty.benchStrength).toEqual([]);
    expect(empty.consistency).toEqual([]);
  });
});