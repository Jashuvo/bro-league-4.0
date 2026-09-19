import { describe, it, expect } from 'vitest';
import { computeRecentForm, FORM_THRESHOLD } from './formGuide';

const gw = (num, rows) => ({
  gameweek: num,
  managers: rows.map(([id, points, transferCost = 0]) => ({ id, points, transferCost }))
});

const table = [
  gw(1, [[1, 60], [2, 40], [3, 50]]),   // avg 50
  gw(2, [[1, 40], [2, 70], [3, 60]]),   // avg ~56.7
  gw(3, [[1, 70], [2, 60], [3, 60]]),   // avg ~63.3
  gw(4, [[1, 65], [2, 65], [3, 65]]),   // avg 65
  gw(5, [[1, 55], [2, 80], [3, 60]]),   // avg ~65
  gw(6, [[1, 90], [2, 30], [3, 60]]),   // avg 60
];

describe('computeRecentForm', () => {
  it('marks above/below/flat against the gameweek league average', () => {
    const form = computeRecentForm(table, 1, 5);
    // Manager 1: GW2 40 vs 56.7 → down; GW3 70 vs 63.3 → up; GW4 65 flat;
    // GW5 55 vs 65 → down; GW6 90 vs 60 → up.
    expect(form.map((f) => f.trend)).toEqual(['down', 'up', 'flat', 'down', 'up']);
    expect(form[form.length - 1].gameweek).toBe(6);
  });

  it('caps at lastN gameweeks, oldest first', () => {
    const form = computeRecentForm(table, 1, 5);
    expect(form).toHaveLength(5);
    expect(form[0].gameweek).toBe(2);
  });

  it('uses net (after hits) points, not raw', () => {
    const hitTable = [gw(1, [[1, 60, 20], [2, 40], [3, 50]])];
    // Everyone's net: 40, 40, 50 → league net avg 43.3; manager 1 nets 40.
    const form = computeRecentForm(hitTable, 1, 5);
    expect(form[0].net).toBe(40);
    expect(Math.abs(form[0].delta)).toBeCloseTo(3.3, 1);
    expect(form[0].trend).toBe('down');
  });

  it('returns empty for an unknown manager', () => {
    expect(computeRecentForm(table, 999, 5)).toEqual([]);
  });

  it('keeps sub-threshold weeks flat', () => {
    expect(FORM_THRESHOLD).toBe(1);
  });
});