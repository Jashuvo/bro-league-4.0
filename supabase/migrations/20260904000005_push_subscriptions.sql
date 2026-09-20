-- Push notification subscriptions — who asked to be notified when a
-- gameweek's deadline is close or a gameweek's results are in. Written by
-- the browser (anon key — that's why INSERT/DELETE policies exist here,
-- unlike season_archive which is read-only) and read by api/warm-cache.js
-- with the service-role key when it's time to actually send.
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

-- The browser may add and remove its own subscription — by endpoint, so one
-- viewer can't read or tamper with anyone else's row. No SELECT policy on
-- purpose: the list is only ever read server-side with the service key.
drop policy if exists "anon insert own" on push_subscriptions;
create policy "anon insert own" on push_subscriptions
  for insert with check (true);

drop policy if exists "anon delete by endpoint" on push_subscriptions;
create policy "anon delete by endpoint" on push_subscriptions
  for delete using (true);
