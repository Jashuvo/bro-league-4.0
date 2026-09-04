// scripts/seed-season-archive.js
//
// One-time local seed script — NOT a Vercel function, never run in
// production. Fills `season_archive` with a past season's final standings
// so it survives forever (see SUPABASE_ARCHIVE_PLAN.md).
//
// Usage:
//   node scripts/seed-season-archive.js
//
// Requires VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in the environment
// (both already sit in .env.local — `node --env-file=.env.local` picks them
// up on Node 20.6+, or `export $(grep -v '^#' .env.local | xargs)` first).
//
// STILL BLOCKED: MANAGER_IDS below needs the manager (entry) ID list for
// the season being archived — the original league ID this refers to
// (1858389) currently 404s on FPL's API. Nothing below can run until that
// list exists; see "Still blocked on" in SUPABASE_ARCHIVE_PLAN.md.
import { createClient } from '@supabase/supabase-js';

// NOTE: can't import src/data/leagueData.js here — it reads
// `import.meta.env.VITE_LEAGUE_NAME` at module-eval time, which is a Vite
// build-time feature that doesn't exist under plain `node` (throws
// "Cannot read properties of undefined" the instant the module loads).
// Season-podium prizes duplicated from there instead — keep in sync with
// `prizeStructure.season.prizes` in src/data/leagueData.js by hand.
const SEASON_PRIZES = [
  { position: 1, amount: 800, label: 'Champion' },
  { position: 2, amount: 600, label: 'Runner-up' },
  { position: 3, amount: 400, label: 'Third Place' },
];

const MANAGER_IDS = [/* fill in once known */];
const SEASON = '2025/26';
const LEAGUE_ID = process.env.VITE_FPL_LEAGUE_ID || '1278540';

async function main() {
  if (MANAGER_IDS.length === 0) {
    console.error(
      '❌ MANAGER_IDS is empty — fill it in with this season\'s entry IDs ' +
      'before running this script. See "Still blocked on" in SUPABASE_ARCHIVE_PLAN.md.'
    );
    process.exit(1);
  }

  const url = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error('❌ VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the environment.');
    process.exit(1);
  }
  const supabase = createClient(url, serviceKey);

  const rows = [];
  for (const id of MANAGER_IDS) {
    const res = await fetch(`https://fantasy.premierleague.com/api/entry/${id}/history/`);
    const { past } = await res.json();
    const seasonEntry = past.find((p) => p.season_name === SEASON);
    if (!seasonEntry) continue;
    const entryRes = await fetch(`https://fantasy.premierleague.com/api/entry/${id}/`);
    const entry = await entryRes.json();
    rows.push({
      league_id: LEAGUE_ID,
      season: SEASON,
      category: 'final_standing',
      manager_id: id,
      manager_name: `${entry.player_first_name} ${entry.player_last_name}`,
      team_name: entry.name,
      total_points: seasonEntry.total_points,
    });
  }

  rows.sort((a, b) => b.total_points - a.total_points);
  rows.forEach((r, i) => {
    r.final_rank = i + 1;
    const prize = SEASON_PRIZES.find((p) => p.position === r.final_rank);
    if (prize) { r.prize_label = prize.label; r.prize_amount = prize.amount; }
  });

  const { error } = await supabase.from('season_archive').upsert(rows, {
    onConflict: 'league_id,season,category,period,manager_id',
  });
  if (error) throw error;
  console.log(`✅ Inserted/updated ${rows.length} rows for ${SEASON}`);
}

main().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
