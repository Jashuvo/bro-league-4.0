// api/snapshot-results.js
//
// Daily cron job (Vercel Hobby only allows daily-granularity crons) that
// captures each finalized gameweek's winner and each completed month's top
// 3 into the `season_archive` table AS THE SEASON PROGRESSES — see
// SUPABASE_ARCHIVE_PLAN.md §8. This is what makes next season's "Previous
// Season" panel show real weekly/monthly results instead of just the final
// standings reconstructed after the fact.
//
// Only Vercel's own cron may trigger this — see the Authorization check
// below — otherwise anyone could hit the URL and force writes.
import { fetchWithRetry, setCorsHeaders } from './_lib/helpers.js';
import { monthlyWindows, weeklyPrize, monthlyRegularPrizes, monthlyFinalPrizes, getWeeklyWinner, getMonthlyTop } from './_lib/prizeConfig.js';

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Vercel signs cron-triggered requests with this header automatically —
  // reject anything else so this endpoint can't be used to force writes.
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers['authorization'] !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const leagueId = process.env.VITE_FPL_LEAGUE_ID;
  const season = process.env.VITE_SEASON || '2026/27';
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!leagueId) {
    return res.status(400).json({ success: false, error: 'VITE_FPL_LEAGUE_ID is not set.' });
  }
  if (!supabaseUrl || !serviceKey) {
    // Archive not configured yet — a no-op, not an error, so the cron
    // doesn't show as failing before Supabase is wired up.
    return res.status(200).json({ success: true, skipped: 'Supabase not configured' });
  }

  try {
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';

    // Reuses the exact same, already-tested fetch + reshape logic as every
    // other view in the app — no new FPL-fetching here.
    const response = await fetchWithRetry(
      `${baseUrl}/api/league-complete?leagueId=${leagueId}&force=true`,
      { timeout: 55000 },
      0
    );
    const { success, data } = await response.json();
    if (!success || !data) throw new Error('league-complete returned no data');

    const { bootstrap, gameweekTable } = data;
    const gwByNumber = new Map((bootstrap.gameweeks || []).map((gw) => [gw.id, gw]));

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, serviceKey);

    const rows = [];

    // Weekly — one row per gameweek whose bonus points are officially
    // locked in (`data_checked`, not `finished` — see the same reasoning
    // in league-complete.js/fixtures.js: `finished` flips before bonus
    // settles).
    gameweekTable.forEach((gw) => {
      const meta = gwByNumber.get(gw.gameweek);
      if (!meta?.data_checked) return;
      const winner = getWeeklyWinner(gw);
      if (!winner) return;
      rows.push({
        league_id: String(leagueId),
        season,
        category: 'weekly_winner',
        period: gw.gameweek,
        manager_id: winner.managerId,
        manager_name: winner.managerName,
        team_name: winner.teamName,
        total_points: winner.netPoints,
        prize_label: `GW${gw.gameweek} Winner`,
        prize_amount: weeklyPrize,
      });
    });

    // Monthly — one window counts once every gameweek in it is finalized.
    monthlyWindows.forEach((window) => {
      const gwsInWindow = [];
      for (let gw = window.start; gw <= window.end; gw++) gwsInWindow.push(gw);
      const allFinal = gwsInWindow.every((gw) => gwByNumber.get(gw)?.data_checked);
      if (!allFinal) return;

      const prizes = window.isFinal ? monthlyFinalPrizes : monthlyRegularPrizes;
      const top = getMonthlyTop(gameweekTable, window, prizes.length);
      top.forEach((entry, index) => {
        rows.push({
          league_id: String(leagueId),
          season,
          category: 'monthly_winner',
          period: window.id,
          manager_id: entry.managerId,
          manager_name: entry.managerName,
          team_name: entry.teamName,
          total_points: entry.totalPoints,
          prize_label: `${window.name} — #${index + 1}`,
          prize_amount: prizes[index],
        });
      });
    });

    if (rows.length === 0) {
      return res.status(200).json({ success: true, message: 'Nothing finalized yet — no rows to snapshot.' });
    }

    // The dedupe unique index makes this idempotent — a rerun on a GW/month
    // that's already archived just updates it in place.
    // period is always set on every row above (gameweek or month id), and
    // the unique index is a plain column list (see migration
    // 20260904000001) — no coalesce expression to worry about here.
    const { error } = await supabase
      .from('season_archive')
      .upsert(rows, { onConflict: 'league_id,season,category,period,manager_id' });
    if (error) throw error;

    return res.status(200).json({ success: true, rowsWritten: rows.length });
  } catch (error) {
    console.error('❌ snapshot-results failed:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
