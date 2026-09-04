-- Two small, unrelated additions bundled in one migration since both are
-- pure ops/security plumbing with no user-facing shape:

-- 1. Rate limiting for EXCLUSION_PIN attempts. A 6-digit numeric PIN is
-- scriptable (1M combinations) with no lockout — this caps repeated wrong
-- guesses instead of raising the response indefinitely on every request.
create table if not exists rate_limits (
  key           text primary key,
  attempt_count int         not null default 0,
  window_start  timestamptz not null default now()
);

alter table rate_limits enable row level security;
-- No policies at all — service-role key only (api/season-archive.js),
-- same as kv_cache. Nothing here is ever meant to reach the browser.

-- 2. A record of every api/warm-cache cron run, so "is the daily archive
-- job actually succeeding" is a query instead of trawling Vercel logs —
-- scripts/cache-status.js reads this.
create table if not exists cron_runs (
  id         bigint generated always as identity primary key,
  ran_at     timestamptz not null default now(),
  success    boolean     not null,
  message    text
);

create index if not exists cron_runs_ran_at on cron_runs (ran_at desc);

alter table cron_runs enable row level security;
-- Same as above — service-role only, no anon/authenticated policy.
