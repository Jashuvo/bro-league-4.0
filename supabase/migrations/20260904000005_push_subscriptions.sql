-- Push notification subscriptions — who asked to be notified when a
-- gameweek's deadline is close or a gameweek's results are in. Writes go
-- through api/push.js with the service-role key (NOT the browser's anon
-- key — see below for why), and warm-cache.js reads with the service key
-- when it's time to actually send.
--
-- Why not anon-keyed writes: the API saves with .upsert(onConflict:
-- endpoint), which is INSERT ... ON CONFLICT — and Postgres 17 checks the
-- table's SELECT policy for any on-conflict statement, even a
-- non-conflicting one (verified live: a plain anon INSERT passes, the
-- upsert fails with "new row violates row-level security policy", and a
-- using(false) SELECT policy still fails while using(true) passes). The
-- subscriber list must stay server-side only, so no SELECT policy is ever
-- getting added; the write therefore happens server-side too. The anon
-- INSERT/DELETE policies below stay as defense-in-depth for direct REST
-- writes.
--
-- One row per subscription endpoint (the URL that identifies a push
-- subscription on the push service) — resubscribing from the same browser
-- upserts in place instead of piling up duplicates. `manager_id` is
-- optional and unused for now (the app has no login), kept so a future
-- "notify me about MY team" feature can scope per manager without another
-- migration.
create table if not exists push_subscriptions (
  id          bigint      generated always as identity primary key,
  league_id   text        not null,
  endpoint    text        not null unique,
  p256dh      text        not null,   -- subscription keys web-push needs to encrypt
  auth        text        not null,
  manager_id  bigint,
  created_at  timestamptz not null default now()
);

create index if not exists push_subscriptions_lookup on push_subscriptions (league_id);

alter table push_subscriptions enable row level security;

-- The browser can't write this table itself with the anon key (no upsert
-- without a SELECT policy — see the header) — the INSERT/DELETE policies
-- below only exist so a direct anon-keyed REST write can add or remove a
-- row if the API ever proxies it as a plain statement. Everything else is
-- anon-blind: no SELECT, no UPDATE.
drop policy if exists "anon insert own" on push_subscriptions;
create policy "anon insert own" on push_subscriptions
  for insert to anon, authenticated with check (true);

drop policy if exists "anon delete by endpoint" on push_subscriptions;
create policy "anon delete by endpoint" on push_subscriptions
  for delete to anon, authenticated using (true);
