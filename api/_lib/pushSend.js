// api/_lib/pushSend.js
//
// The decision half of warm-cache.js's matchday push: given the league
// payload and the set of already-sent flags, which notifications are due
// right now? Pure — no kv, no Supabase, no web-push — so the resend
// prevention (the part that could silently spam the whole league if it got
// a boundary wrong) is unit-testable. The IO half (flag reads, sending,
// pruning dead subscriptions) stays in warm-cache.js.
//
// Two message types, matching api/push.js's subscription store and
// public/push-listener.js's handler:
//
//   results  — the most recent gameweek whose bonus points are officially
//              in (`data_checked`, not `finished` — see the same reasoning
//              in league-complete.js), announcing its winner
//   deadline — the next gameweek's deadline, once it's inside
//              DEADLINE_WINDOW_HOURS (the cron runs at 06:00 daily, so in
//              practice this fires on the last run before the deadline —
//              anything from ~6 to ~30 hours ahead, never precise)
import { getWeeklyWinner } from './prizeConfig.js';

export const DEADLINE_WINDOW_HOURS = 36;

// Long past any resend window — a results flag for GW10 is worthless by GW12,
// but keeping it 14 days costs one tiny kv row and makes the intent obvious.
export const PUSH_FLAG_TTL_SECONDS = 14 * 24 * 60 * 60;

/**
 * Which pushes should go out on this run.
 *
 * @param {Array}  gameweeks    bootstrap.gameweeks — `{ id, deadline_time, data_checked }`
 * @param {Array}  gameweekTable league-complete rows — `{ gameweek, managers: [...] }`
 * @param {Set}    sentKeys     flag keys already sent (from kv)
 * @param {number} [now]        epoch ms override, for tests
 * @returns {Array<{ flagKey, title, body }>} in send order: results first,
 *          then the deadline reminder (whichever are actually due)
 */
export function pickDueMessages({ gameweeks = [], gameweekTable = [], sentKeys = new Set(), now = Date.now() } = {}) {
  const metaById = new Map(gameweeks.map((gw) => [gw.id, gw]));
  const due = [];

  // ── Results: latest gameweek with settled bonus points ──
  const finalized = gameweekTable.filter((gw) => metaById.get(gw.gameweek)?.data_checked);
  if (finalized.length > 0) {
    const lastFinalGw = Math.max(...finalized.map((gw) => gw.gameweek));
    const winner = getWeeklyWinner(finalized.find((gw) => gw.gameweek === lastFinalGw));
    const flagKey = `push_sent_results_gw${lastFinalGw}`;
    if (winner && !sentKeys.has(flagKey)) {
      due.push({
        flagKey,
        title: `GW${lastFinalGw} results are in`,
        body: `${winner.managerName}${winner.teamName ? ` (${winner.teamName})` : ''} topped the week with ${winner.netPoints} pts`,
      });
    }
  }

  // ── Deadline: next gameweek once it's inside the reminder window ──
  const upcoming = gameweeks
    .filter((gw) => gw.deadline_time && new Date(gw.deadline_time).getTime() > now)
    .sort((a, b) => new Date(a.deadline_time).getTime() - new Date(b.deadline_time).getTime())[0];

  if (upcoming) {
    const hoursUntil = (new Date(upcoming.deadline_time).getTime() - now) / 3_600_000;
    if (hoursUntil <= DEADLINE_WINDOW_HOURS) {
      // The league is Bangladesh-based (prizes in ৳) — show the deadline in
      // Dhaka time, not whichever timezone the cron server happens to sit in.
      const when = new Date(upcoming.deadline_time).toLocaleString('en-GB', {
        timeZone: 'Asia/Dhaka',
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
      const flagKey = `push_sent_deadline_gw${upcoming.id}`;
      if (!sentKeys.has(flagKey)) {
        due.push({
          flagKey,
          title: `GW${upcoming.id} deadline soon`,
          body: `GW${upcoming.id} deadline ${when} Dhaka time — lock in your transfers`,
        });
      }
    }
  }

  return due;
}
