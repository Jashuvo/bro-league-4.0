import { describe, it, expect } from 'vitest';
import {
  shapeManager,
  buildGameweekTable,
  buildLeagueStats,
  formSummary,
  getNetPoints
} from './leagueShape.js';

// Synthetic classic-standings rows in the exact shape FPL returns — these
// tests double as the regression net for the fan-out slim-down, where the
// /entry/{id}/ per-manager fetch was deleted and every one of its consumed
// fields had to be sourced from the standings row instead.
const entry = (over = {}) => ({
  entry: 101,
  player_name: 'Jubayed Shuvo',
  entry_name: 'Plastic er Bou ektai',
  event_total: 55,
  total: 290,
  rank: 812345,
  last_rank: 820000,
  ...over
});

const historyRow = (event, over = {}) => ({
  event,
  points: 50,
  total_points: 100,
  overall_rank: 900000,
  event_transfers: 1,
  event_transfers_cost: 0,
  points_on_bench: 5,
  ...over
});

describe('shapeManager', () => {
  it('sources name/team from standings and hits/transfers/rank from /history/', () => {
    const historyData = {
      currentSeason: [
        historyRow(1, { overall_rank: 900100, event_transfers: 3, event_transfers_cost: 8 }),
        historyRow(2, { overall_rank: 812345, event_transfers: 2, event_transfers_cost: 4 }),
      ],
      chips: [{ name: 'wildcard', event: 2 }],
    };
    const shaped = shapeManager(entry(), historyData, 2);

    expect(shaped.id).toBe(101);
    expect(shaped.managerName).toBe('Jubayed Shuvo');        // standings row, no /entry/{id} fetch
    expect(shaped.teamName).toBe('Plastic er Bou ektai');     // standings entry_name
    expect(shaped.overallRank).toBe(812345);                  // /history/'s CURRENT-gw overall_rank
    expect(shaped.totalPoints).toBe(290);                     // standings (live)
    expect(shaped.gameweekPoints).toBe(55);                   // standings (live)
    expect(shaped.gameweekHits).toBe(4);                      // /history/ current-gw row
    expect(shaped.gameweekTransfers).toBe(2);
    expect(shaped.rankChange).toBe(820000 - 812345);
    expect(shaped.chips).toEqual([{ name: 'wildcard', event: 2 }]);
    expect(shaped.hasData).toBe(true);
  });

  it('survives a failed /history/ fetch (no chips, defaults, hasData false)', () => {
    const shaped = shapeManager(entry(), null);
    expect(shaped.chips).toEqual([]);
    expect(shaped.teamValue).toBe(100);
    expect(shaped.bankValue).toBe(0);
    expect(shaped.form).toBe('N/A');
    expect(shaped.hasData).toBe(false);
  });

  it('falls back to a placeholder name when the standings row is anonymous', () => {
    expect(shapeManager(entry({ player_name: '' }), null).managerName).toBe('Manager 101');
  });

  it('computes the form string net of hits, from the last five rows only', () => {
    const rows = [
      historyRow(1, { points: 100, event_transfers_cost: 0 }),
      historyRow(2, { points: 60, event_transfers_cost: 20 }),
      historyRow(3, { points: 50, event_transfers_cost: 0 }),
      historyRow(4, { points: 50, event_transfers_cost: 0 }),
      historyRow(5, { points: 50, event_transfers_cost: 0 }),
      historyRow(6, { points: 50, event_transfers_cost: 0 }),
    ];
    // (50+40+50+50+50)/5 = 48 — GW1's 100 must NOT count (slice(-5)).
    expect(formSummary(rows)).toBe('48 pts avg');
  });
});

describe('buildGameweekTable', () => {
  const standings = [
    entry(),
    entry({ entry: 102, player_name: 'Other', entry_name: 'Other FC', event_total: 70 }),
  ];
  const history = new Map([
    [101, [historyRow(1, { points: 60 }), historyRow(2, { points: 55, points_on_bench: 4 })]],
    [102, [historyRow(1, { points: 45 }), historyRow(2, { points: 80, points_on_bench: 2 })]],
  ]);

  it('emits one row per gameweek with the winner/highest/average fields', () => {
    const table = buildGameweekTable(standings, history, { currentGameweek: 2, currentGwIsFinal: true });
    expect(table.map((gw) => gw.gameweek)).toEqual([1, 2]);
    expect(table[0].managers.map((m) => m.id)).toEqual([101, 102]); // sorted by points desc
    expect(table[0].winner).toBe('Plastic er Bou ektai');
    expect(table[0].highestScore).toBe(60);
    expect(table[0].averageScore).toBe(53); // (60+45)/2 rounded
  });

  it('prefers the live standings figures for the unfinalized current gameweek', () => {
    const liveStandings = [entry({ event_total: 99, total: 999 }), standings[1]];
    const table = buildGameweekTable(liveStandings, history, { currentGameweek: 2, currentGwIsFinal: false });
    const m = table.find((gw) => gw.gameweek === 2).managers.find((x) => x.id === 101);
    expect(m.points).toBe(99);
    expect(m.totalPoints).toBe(999);
  });

  it('keeps /history/ figures for a finalized current gameweek', () => {
    const table = buildGameweekTable(standings, history, { currentGameweek: 2, currentGwIsFinal: true });
    const m = table.find((gw) => gw.gameweek === 2).managers.find((x) => x.id === 102);
    expect(m.points).toBe(80); // /history/, not the standings row
  });

  it('uses recomputed live bench points for the live GW and /history/ bench otherwise', () => {
    const bench = new Map([[101, 12]]);
    const table = buildGameweekTable(standings, history, { currentGameweek: 2, currentGwIsFinal: false, liveBenchByManager: bench });
    expect(table.find((g) => g.gameweek === 2).managers.find((m) => m.id === 101).benchPoints).toBe(12);
    expect(table.find((g) => g.gameweek === 1).managers.find((m) => m.id === 101).benchPoints).toBe(5);
  });

  it('omits managers without history instead of skipping whole gameweeks', () => {
    // FPL's /history/ rows are contiguous 1..N, so maxGameweek is the row
    // count; a manager with no /history/ at all just never appears in any
    // row (the old handler behaved the same way).
    const only101 = new Map([[101, [historyRow(1), historyRow(2)]]]);
    const table = buildGameweekTable(standings, only101, { currentGameweek: 2, currentGwIsFinal: true });
    expect(table.map((g) => g.gameweek)).toEqual([1, 2]);
    table.forEach((g) => {
      expect(g.managers.map((m) => m.id)).toEqual([101]);
    });
  });
});

describe('buildLeagueStats', () => {
  it('returns the zeroed shape for an empty league instead of NaN/Infinity', () => {
    expect(buildLeagueStats([], 18)).toEqual({
      totalManagers: 18,
      averageScore: 0,
      highestTotal: 0,
      lowestTotal: 0,
      averageGameweekScore: 0,
      highestGameweekScore: 0,
      totalChipsUsed: 0,
      averageTeamValue: 0
    });
  });

  it('aggregates over the shaped managers and keeps the untruncated headcount', () => {
    const standings = [
      { totalPoints: 300, gameweekPoints: 60, chips: [{}, {}], teamValue: 100.5 },
      { totalPoints: 200, gameweekPoints: 40, chips: [], teamValue: 99.5 },
    ];
    const stats = buildLeagueStats(standings, 25);
    expect(stats.totalManagers).toBe(25);
    expect(stats.averageScore).toBe(250);
    expect(stats.highestTotal).toBe(300);
    expect(stats.lowestTotal).toBe(200);
    expect(stats.averageGameweekScore).toBe(50);
    expect(stats.highestGameweekScore).toBe(60);
    expect(stats.totalChipsUsed).toBe(2);
    expect(stats.averageTeamValue).toBe(100);
  });
});

describe('getNetPoints', () => {
  it('subtracts transfer-cost hits', () => {
    expect(getNetPoints({ points: 55, transferCost: 8 })).toBe(47);
    expect(getNetPoints({ points: 55 })).toBe(55);
  });
});