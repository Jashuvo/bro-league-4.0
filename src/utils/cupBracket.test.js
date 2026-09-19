import { describe, it, expect } from 'vitest';
import {
  bracketSizeFor,
  roundGameweeks,
  buildCupBracket
} from './cupBracket';

const manager = (id, total) => ({ id, managerName: `Manager ${id}`, totalPoints: total });

const gwTable = (gameweek, pointsById, costById = {}) => ({
  gameweek,
  managers: Object.entries(pointsById).map(([id, points]) => ({
    id: Number(id),
    points,
    transferCost: costById[id] || 0
  }))
});

describe('bracketSizeFor', () => {
  it('takes the largest power of two that fits', () => {
    expect(bracketSizeFor(18)).toBe(16);
    expect(bracketSizeFor(15)).toBe(8);
    expect(bracketSizeFor(8)).toBe(8);
    expect(bracketSizeFor(3)).toBe(2);
  });
});

describe('roundGameweeks', () => {
  it('spreads rounds evenly and always ends on the final gameweek', () => {
    expect(roundGameweeks(3, 8, 38)).toEqual([8, 23, 38]);
    expect(roundGameweeks(2, 8, 38)).toEqual([8, 38]);
  });

  it('collapses a single round onto the final gameweek', () => {
    expect(roundGameweeks(1, 8, 38)).toEqual([38]);
  });

  it('never lets two rounds share a gameweek after rounding', () => {
    const gws = roundGameweeks(4, 30, 31);
    new Set(gws).forEach(() => {}); // sanity: just ensure no throw
    for (let i = 1; i < gws.length; i++) {
      expect(gws[i]).toBeGreaterThan(gws[i - 1]);
    }
  });
});

describe('buildCupBracket', () => {
  // 8 managers, seeded by season total: ids 1..8 with descending totals.
  const standings = [1, 2, 3, 4, 5, 6, 7, 8].map((id) => manager(id, 1000 - id * 10));

  it('seeds the quarter-finals as 1v8, 2v7, 3v6, 4v5', () => {
    const cup = buildCupBracket(standings, [], { totalGameweeks: 38, startGameweek: 8 });
    expect(cup.rounds).toHaveLength(3); // QF, SF, F
    expect(cup.rounds[0].name).toBe('Quarter-finals');
    const pairs = cup.rounds[0].matches.map(({ a, b }) => [a.id, b.id]);
    expect(pairs).toEqual([[1, 8], [2, 7], [3, 6], [4, 5]]);
    expect(cup.rounds[2].name).toBe('Final');
  });

  it('advances the higher net scorer of the round gameweek', () => {
    // GW8: seeds 8 and 7 out-score their opponents (10 pts is the table value).
    const table = [gwTable(8, { 1: 50, 2: 50, 3: 50, 4: 50, 5: 50, 6: 50, 7: 60, 8: 70 })];
    const cup = buildCupBracket(standings, table, { totalGameweeks: 38, startGameweek: 8 });
    const qf = cup.rounds[0];
    expect(qf.matches.map((m) => m.winnerId)).toEqual([8, 7, 3, 4]);
    // Standard bracket: SF pairs QF-winner-1 v QF-winner-4, QF-winner-2 v
    // QF-winner-3 — so (8 v 4) and (7 v 3) here.
    const sf = cup.rounds[1];
    expect([sf.matches[0].a.id, sf.matches[0].b.id]).toEqual([8, 4]);
    expect([sf.matches[1].a.id, sf.matches[1].b.id]).toEqual([7, 3]);
    // SFs not yet played → final slots are TBD.
    expect(sf.matches.every((m) => !m.decided)).toBe(true);
    expect(cup.champion).toBeNull();
  });

  it('respects transfer-cost hits when scoring the tie', () => {
    // 1 and 8 both score 50 raw, but 8 took a 4-point hit → 1 advances.
    const table = [gwTable(8, { 1: 50, 2: 50, 3: 50, 4: 50, 5: 50, 6: 50, 7: 50, 8: 50 }, { 8: 4 })];
    const cup = buildCupBracket(standings, table, { totalGameweeks: 38, startGameweek: 8 });
    expect(cup.rounds[0].matches[0].winnerId).toBe(1);
  });

  it('breaks a net-points tie with season total, then seed order', () => {
    // All eight tie at 50 net with no hits — season total (seed order)
    // decides every match, i.e. all top seeds advance.
    const table = [gwTable(8, { 1: 50, 2: 50, 3: 50, 4: 50, 5: 50, 6: 50, 7: 50, 8: 50 })];
    const cup = buildCupBracket(standings, table, { totalGameweeks: 38, startGameweek: 8 });
    expect(cup.rounds[0].matches.map((m) => m.winnerId)).toEqual([1, 2, 3, 4]);
  });

  it('cascades TBD through later rounds until each GW is played', () => {
    const table = [gwTable(8, { 1: 50, 2: 50, 3: 50, 4: 50, 5: 50, 6: 50, 7: 50, 8: 50 })];
    const cup = buildCupBracket(standings, table, { totalGameweeks: 38, startGameweek: 8 });
    expect(cup.rounds[1].matches.flatMap((m) => [m.a, m.b]).every((p) => p && p.id)).toBe(true); // SF slots known
    expect(cup.rounds[2].matches[0].a).toBeNull(); // final still TBD
  });

  it('crowns a champion once the final is decided', () => {
    // Play all three rounds (8, 23, 38): top seeds win every round.
    const table = [
      gwTable(8, { 1: 50, 2: 50, 3: 50, 4: 50, 5: 50, 6: 50, 7: 50, 8: 50 }),
      gwTable(23, { 1: 50, 2: 50, 3: 50, 4: 50 }),
      gwTable(38, { 1: 60, 2: 55 }),
    ];
    const cup = buildCupBracket(standings, table, { totalGameweeks: 38, startGameweek: 8 });
    expect(cup.champion?.id).toBe(1);
    expect(cup.rounds[2].matches[0].winnerId).toBe(1);
  });

  it('handles an odd-numbered league (7 managers → 4-team cup)', () => {
    const seven = standings.slice(0, 7);
    const cup = buildCupBracket(seven, [], { totalGameweeks: 38, startGameweek: 8 });
    expect(cup.bracketSize).toBe(4);
    expect(cup.rounds).toHaveLength(2);
    expect(cup.rounds[0].matches.map(({ a, b }) => [a.id, b.id])).toEqual([[1, 4], [2, 3]]);
  });

  it('returns an empty bracket for an empty league', () => {
    const cup = buildCupBracket([], []);
    expect(cup.bracketSize).toBe(0);
    expect(cup.rounds).toEqual([]);
  });
});