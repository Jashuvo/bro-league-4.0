// api/warm-cache.js - Daily cron job
//
// Two jobs in one function (not two separate ones) on purpose: Vercel's
// Hobby plan caps a deployment at 12 Serverless Functions total, and this
// project was already at 11 before the season-archive work — a second
// standalone cron function would have pushed it over. Both jobs also want
// the exact same force-refreshed league-complete payload, so merging them
// means one live FPL fetch instead of two separate crons each doing their
// own full ~20-manager fan-out.
//
// 1. Cache warming — force-refreshes api/league-complete.js's KV cache so
//    the first visitor of the day never pays for a cold fetch themselves.
// 2. Season-archive snapshot — captures each finalized gameweek's winner
//    and each completed month's top 3 into `season_archive`, going
//    forward (see SUPABASE_ARCHIVE_PLAN.md §8). A no-op until Supabase is
//    configured (VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).
import { fetchWithRetry } from './_lib/helpers.js';
import { monthlyWindows, weeklyPrize, monthlyRegularPrizes, monthlyFinalPrizes, getWeeklyWinner, getMonthlyTop } from './_lib/prizeConfig.js';

async function snapshotResults({ leagueId, season, bootstrap, gameweekTable }) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return { skipped: 'Supabase not configured' };
  }

  const gwByNumber = new Map((bootstrap.gameweeks || []).map((gw) => [gw.id, gw]));
  const rows = [];

  // Weekly — one row per gameweek whose bonus points are officially locked
  // in (`data_checked`, not `finished` — see the same reasoning in
  // league-complete.js/fixtures.js: `finished` flips before bonus settles).
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
    return { rowsWritten: 0 };
  }

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, serviceKey);

  // The dedupe unique index makes this idempotent — a rerun on a GW/month
  // that's already archived just updates it in place. period is always set
  // on every row above, and the unique index is a plain column list (see
  // migration 20260904000001) — no coalesce expression to worry about.
  const { error } = await supabase
    .from('season_archive')
    .upsert(rows, { onConflict: 'league_id,season,category,period,manager_id' });
  if (error) throw error;

  return { rowsWritten: rows.length };
}

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Vercel signs cron-triggered requests with this header automatically.
  // The archive-write half of this job is destructive enough to guard even
  // though the cache-warm half is harmless — reject anything unsigned so
  // this endpoint can't be used to force writes from outside.
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers['authorization'] !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const leagueId = process.env.VITE_FPL_LEAGUE_ID;
  const season = process.env.VITE_SEASON || '2026/27';

  if (!leagueId) {
    return res.status(400).json({
      success: false,
      error: 'VITE_FPL_LEAGUE_ID is not set — nothing to warm the cache for.'
    });
  }

  try {
    // VERCEL_URL is a bare hostname with no protocol — has to be prefixed.
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    // Trigger a cache refresh by calling the main API
    const response = await fetchWithRetry(
      `${baseUrl}/api/league-complete?leagueId=${leagueId}&force=true`,
      { timeout: 55000 },
      0
    );

    const { success, data } = await response.json();
    if (!success || !data) throw new Error('league-complete returned no data');

    console.log('✅ Cache warmed successfully');

    let snapshot = { skipped: 'error before snapshot' };
    try {
      snapshot = await snapshotResults({ leagueId, season, bootstrap: data.bootstrap, gameweekTable: data.gameweekTable });
    } catch (snapshotError) {
      // Cache warming already succeeded — don't fail the whole cron over
      // the archive half being broken, just report it.
      console.error('⚠️ snapshotResults failed:', snapshotError);
      snapshot = { error: snapshotError.message };
    }

    return res.status(200).json({
      success: true,
      message: 'Cache warmed',
      snapshot,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Cache warming failed:', error);

    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
