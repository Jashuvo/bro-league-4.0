// scripts/cache-status.js
//
// Inspects the Supabase-backed cache (api/_lib/kv.js's `kv_cache` table)
// and the archive/cron health tables, so "is caching actually working
// right now" is one command instead of digging through Vercel logs or
// hand-writing curl calls (see the whole investigation in this project's
// history for why that question used to be so hard to answer).
//
// Usage:
//   node --env-file=.env.local scripts/cache-status.js
// (needs VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY — the service role
// key so this can read kv_cache/cron_runs, which anon can't per RLS)
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('❌ VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

function fmtBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function fmtAgo(iso) {
  if (!iso) return 'never';
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.round(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

async function main() {
  console.log(`🔎 Cache status for ${url}\n`);

  const { data: rows, error } = await supabase
    .from('kv_cache')
    .select('key, expires_at, updated_at, value')
    .order('updated_at', { ascending: false });
  if (error) throw error;

  if (!rows || rows.length === 0) {
    console.log('kv_cache: empty — nothing has been cached yet, or the table was just created.');
  } else {
    console.log(`kv_cache: ${rows.length} key(s)\n`);
    console.log('KEY'.padEnd(35), 'SIZE'.padEnd(10), 'UPDATED'.padEnd(12), 'EXPIRES');
    rows.forEach((r) => {
      const size = fmtBytes(JSON.stringify(r.value).length);
      const expired = r.expires_at && new Date(r.expires_at).getTime() < Date.now();
      const expiresLabel = r.expires_at ? `${fmtAgo(r.expires_at)}${expired ? ' (EXPIRED)' : ''}` : 'never';
      console.log(r.key.padEnd(35), size.padEnd(10), fmtAgo(r.updated_at).padEnd(12), expiresLabel);
    });
  }

  // cron_runs is optional — degrade quietly if the migration for it hasn't
  // been applied yet rather than crashing the whole report over it.
  const { data: runs, error: runsError } = await supabase
    .from('cron_runs')
    .select('*')
    .order('ran_at', { ascending: false })
    .limit(5);

  if (!runsError && runs) {
    console.log('\nRecent /api/warm-cache runs:');
    if (runs.length === 0) {
      console.log('  none recorded yet');
    } else {
      runs.forEach((r) => {
        const status = r.success ? '✅' : '❌';
        console.log(`  ${status} ${fmtAgo(r.ran_at)} — ${r.message || (r.success ? 'ok' : 'failed')}`);
      });
    }
  }
}

main().catch((error) => {
  console.error('❌ cache-status failed:', error);
  process.exit(1);
});
