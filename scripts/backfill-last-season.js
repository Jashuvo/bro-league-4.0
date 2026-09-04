// scripts/backfill-last-season.js
//
// One-time local backfill of last season's final standings into
// `season_archive` — the thing the original plan (SUPABASE_ARCHIVE_PLAN.md)
// was blocked on: it assumed the manager ID list for last season had to
// come from somewhere else (the old league ID that 404s). It didn't need
// to — FPL entry IDs are permanent per manager, independent of which
// mini-league groups them in any given season, so THIS season's current
// league membership already IS that list. Whoever's currently in the
// league, we ask their own entry history for last season's number.
//
// Usage:
//   node --env-file=.env.local scripts/backfill-last-season.js
// (or export the vars yourself first — needs VITE_FPL_LEAGUE_ID,
// VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
//
// Anyone who joined the league only this season won't have a 2025/26 row
// here (their history has no 2025/26 entry to find) — that's correct, not
// a bug: they weren't part of last season, current membership can only
// backfill people who were actually playing FPL last season too.
import { createClient } from '@supabase/supabase-js';
import { seasonPrizes } from '../api/_lib/prizeConfig.js';

const LEAGUE_ID = process.env.VITE_FPL_LEAGUE_ID;
const LAST_SEASON = '2025/26';

async function main() {
  if (!LEAGUE_ID) {
    console.error('❌ VITE_FPL_LEAGUE_ID is not set.');
    process.exit(1);
  }
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error('❌ VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
    process.exit(1);
  }

  console.log(`🔎 Fetching current members of league ${LEAGUE_ID}...`);
  const standingsRes = await fetch(`https://fantasy.premierleague.com/api/leagues-classic/${LEAGUE_ID}/standings/`);
  if (!standingsRes.ok) throw new Error(`Standings fetch failed: ${standingsRes.status}`);
  const standings = await standingsRes.json();
  const members = standings.standings.results;
  console.log(`   ${members.length} current member(s)${standings.standings.has_next ? ' (more than one page — only the first is fetched, extend this script if the league ever exceeds one page)' : ''}`);

  const rows = [];
  const skipped = [];

  for (const member of members) {
    const historyRes = await fetch(`https://fantasy.premierleague.com/api/entry/${member.entry}/history/`);
    if (!historyRes.ok) {
      skipped.push(`${member.player_name} (history fetch failed: ${historyRes.status})`);
      continue;
    }
    const history = await historyRes.json();
    const lastSeasonEntry = (history.past || []).find((p) => p.season_name === LAST_SEASON);
    if (!lastSeasonEntry) {
      skipped.push(`${member.player_name} (no ${LAST_SEASON} history — wasn't playing FPL last season)`);
      continue;
    }
    rows.push({
      league_id: String(LEAGUE_ID),
      season: LAST_SEASON,
      category: 'final_standing',
      manager_id: member.entry,
      manager_name: member.player_name,
      team_name: member.entry_name,
      total_points: lastSeasonEntry.total_points,
    });
  }

  if (rows.length === 0) {
    console.error('❌ Nothing to backfill — no current member has 2025/26 history.');
    process.exit(1);
  }

  rows.sort((a, b) => b.total_points - a.total_points);
  rows.forEach((r, i) => {
    r.final_rank = i + 1;
    const prize = seasonPrizes.find((p) => p.position === r.final_rank);
    if (prize) { r.prize_label = prize.label; r.prize_amount = prize.amount; }
  });

  console.log(`\n📋 ${LAST_SEASON} final table (reconstructed from current members' own history):`);
  rows.forEach((r) => console.log(`   ${r.final_rank}. ${r.manager_name} (${r.team_name}) — ${r.total_points} pts${r.prize_label ? ` — ${r.prize_label} ৳${r.prize_amount}` : ''}`));
  if (skipped.length > 0) {
    console.log(`\n⏭️  Skipped (not in ${LAST_SEASON}):`);
    skipped.forEach((s) => console.log(`   - ${s}`));
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // Delete-and-replace this season+category, not upsert — same reasoning
  // as api/warm-cache.js: re-running this script (e.g. someone rejoins,
  // a rank needs correcting) shouldn't ever leave a stale row behind for
  // a manager who no longer belongs in the recomputed set.
  const { error: deleteError } = await supabase
    .from('season_archive')
    .delete()
    .eq('league_id', String(LEAGUE_ID))
    .eq('season', LAST_SEASON)
    .eq('category', 'final_standing');
  if (deleteError) throw deleteError;

  const { error: insertError } = await supabase.from('season_archive').insert(rows);
  if (insertError) throw insertError;

  console.log(`\n✅ Inserted ${rows.length} row(s) for ${LAST_SEASON}.`);
}

main().catch((error) => {
  console.error('❌ Backfill failed:', error);
  process.exit(1);
});
