-- Server-side response cache, replacing a dead Redis Cloud integration.
-- REDIS_URL (set ~a year ago) points at a Redis Cloud instance that no
-- longer resolves at all — not from outside Vercel, not from Vercel's own
-- production runtime either (confirmed via live logs: every kv.get/set
-- call was failing with ENOTFOUND). @vercel/kv before that never worked
-- either (wrong env var shape entirely). This table replaces both: no new
-- account/integration needed, reuses the Supabase project already wired
-- up for the season archive.
--
-- No RLS policies on purpose (RLS is still enabled, so anon/authenticated
-- get zero access by default) — every read/write goes through the
-- service-role key from api/_lib/kv.js only, server-side, never the
-- browser.
create table if not exists kv_cache (
  key         text primary key,
  value       jsonb       not null,
  expires_at  timestamptz,
  updated_at  timestamptz not null default now()
);

alter table kv_cache enable row level security;
