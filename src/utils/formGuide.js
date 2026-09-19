// src/utils/formGuide.js
//
// Per-manager recent form, derived from the gameweekTable the app already
// holds — no fetching. A gameweek is "up" when the manager's net-of-hits
// score beat that gameweek's league average by more than FORM_THRESHOLD
// points, "down" when it fell short by more, "flat" otherwise. Pure
// functions, tested in formGuide.test.js.
import { getNetPoints } from './h2hSchedule';

export const FORM_THRESHOLD = 1;

/**
 * Returns the manager's last `lastN` gameweeks (oldest first):
 * `[{ gameweek, net, leagueAvg, delta, trend }]`. An empty result simply
 * means the manager has no played gameweeks yet.
 */
export function computeRecentForm(gameweekTable = [], managerId, lastN = 5) {
  const rows = [];

  gameweekTable.forEach((gw) => {
    const managers = gw.managers || [];
    const me = managers.find((m) => m.id === managerId);
    if (!me) return;
    const leagueAvg = managers.length
      ? managers.reduce((sum, m) => sum + getNetPoints(m), 0) / managers.length
      : 0;
    const net = getNetPoints(me);
    rows.push({
      gameweek: gw.gameweek,
      net,
      leagueAvg: Math.round(leagueAvg * 10) / 10,
      delta: Math.round((net - leagueAvg) * 10) / 10
    });
  });

  return rows.slice(-lastN).map((r) => ({
    ...r,
    trend:
      r.delta > FORM_THRESHOLD ? 'up'
        : r.delta < -FORM_THRESHOLD ? 'down'
          : 'flat'
  }));
}

/** One-word summary for tooltips / aria-labels. */
export function formLabel(trend) {
  return trend === 'up' ? 'above the league average'
    : trend === 'down' ? 'below the league average'
      : 'around the league average';
}