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
// 1. Cache warming — force-refreshes api/league-complete.js's cache so the
//    first visitor of the day never pays for a cold fetch themselves.
// 2. Season-archive snapshot — captures this season's weekly winners,
//    monthly winners, and the full per-gameweek standings table (all net
//    of transfer hits, all straight from FPL's own numbers) into
//    `season_archive`, permanently — so none of it is lost the way last
//    season's per-GW detail was once the season ended and FPL's API
//    stopped exposing it. A no-op until Supabase is configured
//    (VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).
import { fetchWithRetry } from './_lib/helpers.js';
import { monthlyWindows, weeklyPrize, monthlyRegularPrizes, monthlyFinalPrizes, seasonPrizes, getWeeklyWinner, getMonthlyTop, getInLeagueRanks, isSeasonFinalGameweek } from './_lib/prizeConfig.js';

// So "is the daily archive job actually succeeding" is a query
// (scripts/cache-status.js) instead of trawling Vercel logs — this is the
// only visibility into cron health this project has (no external
// monitoring/alerting service is wired up). Best-effort: a logging
// failure here is swallowed rather than failing the cron run it's trying
// to record.
async function logCronRun(success, message) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return;
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, serviceKey);
    await supabase.from('cron_runs').insert({ success, message });
  } catch (error) {
    console.error('⚠️ Failed to log cron run (non-fatal):', error.message);
  }
}

async function snapshotResults({ leagueId, season, bootstrap, gameweekTable: rawGameweekTable }) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return { skipped: 'Supabase not configured' };
  }

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, serviceKey);

  // Exclusions apply here exactly like they do live in the app (App.jsx's
  // filteredStandings/filteredGameweekTable) — "completely excluded from
  // all rankings, statistics, and prize calculations", per LeagueTable.jsx's
  // own copy for the feature. Filtering the raw gameweekTable before ANY of
  // the computations below means an excluded manager can never end up
  // recorded as a weekly/monthly/season winner — or even show up in
  // total_standing — matching what every viewer already sees live. This is
  // also why exclusions had to stop being browser-only localStorage: this
  // cron has no browser, so it needs a shared, server-visible list.
  const { data: excludedRows, error: exclusionError } = await supabase
    .from('excluded_managers')
    .select('manager_id')
    .eq('league_id', String(leagueId));
  if (exclusionError) throw exclusionError;
  const excludedIds = new Set((excludedRows || []).map((r) => Number(r.manager_id)));

  const gameweekTable = excludedIds.size === 0
    ? rawGameweekTable
    : rawGameweekTable.map((gw) => ({
      ...gw,
      managers: (gw.managers || []).filter((m) => !excludedIds.has(Number(m.id))),
    }));

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

  // Total standing — one row PER MANAGER PER GAMEWEEK, for every gameweek
  // played so far (not gated on data_checked like the two categories
  // above — the daily rerun naturally overwrites an earlier estimate once
  // bonus points do settle, via the same upsert). This is this project's
  // own permanent, gameweek-by-gameweek record of the full table: FPL's
  // API only ever exposes a season's per-GW detail while that season is
  // in progress — once it ends, that granularity is gone for good, the
  // same loss this project hit trying to backfill last season. Every
  // number here is already net of transfer hits, straight from FPL's own
  // official cumulative total_points.
  //
  // On the actual final gameweek, once it's finalized, the top 3 also get
  // tagged with the season-end prize they've now actually won — turning
  // this cron into the season-end capture too, instead of needing a
  // separate one-off script the way last season's backfill did.
  // The season's actual final gameweek (38) — NOT the highest gameweek
  // currently in gameweekTable, which early in the season is just "the
  // most recent one played so far" and would otherwise crown a season
  // Champion after gameweek 2.
  const finalGwNumber = bootstrap.totalGameweeks || 38;
  gameweekTable.forEach((gw) => {
    const isFinalGameweek = isSeasonFinalGameweek(gw.gameweek, finalGwNumber, gwByNumber.get(gw.gameweek)?.data_checked);
    const inLeagueRanks = getInLeagueRanks(gw.managers);

    (gw.managers || []).forEach((m) => {
      const inLeagueRank = inLeagueRanks.get(m.id);
      const prize = isFinalGameweek && seasonPrizes.find((p) => p.position === inLeagueRank);
      rows.push({
        league_id: String(leagueId),
        season,
        category: 'total_standing',
        period: gw.gameweek,
        manager_id: m.id,
        manager_name: m.managerName || m.name,
        team_name: m.teamName,
        total_points: m.totalPoints,
        final_rank: inLeagueRank,
        prize_label: prize?.label || null,
        prize_amount: prize?.amount || null,
      });
    });
  });

  if (rows.length === 0) {
    return { rowsWritten: 0 };
  }

  // Delete-and-replace this SEASON's rows, not upsert — caught live in
  // testing: upsert only ever adds/updates a row for the exact manager_id
  // it's given, so when the actual winner for a period CHANGES (an
  // exclusion added, a bonus-point correction reshuffling rank), the
  // previous winner's row for that same period just sits there forever as
  // a second, stale "winner" — there's no unique constraint stopping two
  // different managers both holding a weekly_winner row for the same
  // gameweek. At this data volume (well under a season's ~700 rows, see
  // SUPABASE_ARCHIVE_PLAN.md's storage math) a full wipe-and-reinsert of
  // just this season's rows is cheap and can't drift out of sync with
  // whatever gameweekTable says right now — it never has to reconcile
  // against what was written yesterday. Other seasons' rows are untouched
  // (the league_id+season filter is load-bearing here).
  const { error: deleteError } = await supabase
    .from('season_archive')
    .delete()
    .eq('league_id', String(leagueId))
    .eq('season', season);
  if (deleteError) throw deleteError;

  const { error: insertError } = await supabase.from('season_archive').insert(rows);
  if (insertError) throw insertError;

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

    const snapshotSummary = snapshot.error
      ? `cache warmed, archive failed: ${snapshot.error}`
      : `cache warmed, ${snapshot.rowsWritten ?? 0} archive row(s) written`;
    await logCronRun(!snapshot.error, snapshotSummary);

    return res.status(200).json({
      success: true,
      message: 'Cache warmed',
      snapshot,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Cache warming failed:', error);
    await logCronRun(false, error.message);

    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
