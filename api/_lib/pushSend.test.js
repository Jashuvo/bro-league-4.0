import { describe, it, expect } from 'vitest';
import { pickDueMessages, DEADLINE_WINDOW_HOURS } from './pushSend';

// Fixed "now": Sat 2026-09-19 13:00 UTC (19:00 Dhaka) — mid-afternoon before
// a typical Saturday-night gameweek.
const NOW = Date.UTC(2026, 8, 19, 13, 0);

// Two gameweeks: GW6 settled, GW7 upcoming with a deadline ~23h out.
const GAMEWEEKS = [
  { id: 6, deadline_time: '2026-09-12T10:30:00Z', data_checked: true },
  { id: 7, deadline_time: '2026-09-20T10:30:00Z' },
];

const TABLE = [
  {
    gameweek: 6,
    managers: [
      { id: 1, name: 'A', managerName: 'Alpha', teamName: 'A FC', points: 70, transferCost: 4 },
      { id: 2, name: 'B', managerName: 'Bravo', teamName: 'B FC', points: 55, transferCost: 0 },
    ],
  },
];

describe('pickDueMessages — results', () => {
  it('announces the latest settled gameweek winner with net points', () => {
    const due = pickDueMessages({ gameweeks: GAMEWEEKS, gameweekTable: TABLE, now: NOW });
    const results = due.find((m) => m.flagKey === 'push_sent_results_gw6');
    expect(results).toBeDefined();
    // Net of the 4-point hit: 70 - 4 = 66 beats Bravo's 55.
    expect(results.title).toBe('GW6 results are in');
    expect(results.body).toContain('Alpha');
    expect(results.body).toContain('66 pts');
  });

  it('stays silent once the results flag is already sent', () => {
    const due = pickDueMessages({
      gameweeks: GAMEWEEKS,
      gameweekTable: TABLE,
      sentKeys: new Set(['push_sent_results_gw6']),
      now: NOW,
    });
    expect(due.find((m) => m.flagKey === 'push_sent_results_gw6')).toBeUndefined();
  });

  it('ignores gameweeks whose bonus points are not settled yet', () => {
    const unsettled = [{ id: 6, deadline_time: '2026-09-12T10:30:00Z', data_checked: false }];
    const due = pickDueMessages({ gameweeks: unsettled, gameweekTable: TABLE, now: NOW });
    expect(due).toHaveLength(0);
  });

  it('picks the LATEST settled gameweek, not the first', () => {
    const two = [
      ...GAMEWEEKS,
      {
        id: 8,
        deadline_time: '2026-09-28T10:30:00Z',
        data_checked: true, // contrived: a later GW already settled
      },
    ];
    const table8 = [{ gameweek: 8, managers: TABLE[0].managers }];
    const due = pickDueMessages({
      gameweeks: two,
      gameweekTable: [...TABLE, ...table8],
      now: NOW,
    });
    expect(due.find((m) => m.flagKey?.startsWith('push_sent_results'))?.flagKey).toBe('push_sent_results_gw8');
  });
});

describe('pickDueMessages — deadline', () => {
  it('fires when the next deadline is inside the window, in Dhaka time', () => {
    const due = pickDueMessages({ gameweeks: GAMEWEEKS, gameweekTable: TABLE, now: NOW });
    const deadline = due.find((m) => m.flagKey === 'push_sent_deadline_gw7');
    expect(deadline).toBeDefined();
    // 10:30 UTC on a Sunday = 16:30 Dhaka.
    expect(deadline.body).toContain('GW7 deadline');
    expect(deadline.body).toContain('Dhaka time');
  });

  it('stays silent when the deadline is outside the window', () => {
    const far = [{ id: 7, deadline_time: new Date(NOW + 72 * 3600_000).toISOString() }];
    const due = pickDueMessages({ gameweeks: far, gameweekTable: TABLE, now: NOW });
    expect(due).toHaveLength(0);
  });

  it('stays silent for deadlines already in the past', () => {
    const past = [{ id: 7, deadline_time: new Date(NOW - 3600_000).toISOString() }];
    const due = pickDueMessages({ gameweeks: past, gameweekTable: TABLE, now: NOW });
    expect(due).toHaveLength(0);
  });

  it('matches the exported window constant (guards against silent drift)', () => {
    expect(DEADLINE_WINDOW_HOURS).toBe(36);
  });
});

describe('pickDueMessages — ordering and edge cases', () => {
  it('returns results first, deadline second, when both are due', () => {
    const due = pickDueMessages({ gameweeks: GAMEWEEKS, gameweekTable: TABLE, now: NOW });
    expect(due.map((m) => m.flagKey)).toEqual([
      'push_sent_results_gw6',
      'push_sent_deadline_gw7',
    ]);
  });

  it('is empty with no gameweek metadata at all', () => {
    expect(pickDueMessages({ gameweeks: [], gameweekTable: TABLE, now: NOW })).toEqual([]);
  });

  it('is empty when the table has no settled rows and nothing is due', () => {
    const far = [{ id: 7, deadline_time: new Date(NOW + 72 * 3600_000).toISOString() }];
    expect(pickDueMessages({ gameweeks: far, gameweekTable: [], now: NOW })).toEqual([]);
  });
});
