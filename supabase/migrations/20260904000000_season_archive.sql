-- Season archive: persists one past season's final standings + (from
-- 2026/27 onward) weekly/monthly winners, so it survives forever instead of
-- being dropped by the FPL API once a season ends. Fully separate from live
-- current-season data — never merged into standings/gameweekTable/prize math.
-- See SUPABASE_ARCHIVE_PLAN.md for the full spec.

create table if not exists season_archive (
  id            bigint generated always as identity primary key,
  league_id     text        not null,          -- VITE_FPL_LEAGUE_ID at the time
  season        text        not null,          -- '2025/26'
  category      text        not null default 'final_standing',
                             -- 'final_standing' | 'weekly_winner' | 'monthly_winner'
  period        int,                           -- gameweek number or month id; null for final_standing
  manager_id    bigint      not null,           -- FPL entry id (permanent, survives league changes)
  manager_name  text        not null,
  team_name     text,
  total_points  int,
  final_rank    int,                            -- final position in the mini-league (final_standing rows)
  prize_label   text,                           -- e.g. 'Champion', 'GW14 Winner', 'Month 3 Winner'
  prize_amount  numeric,
  created_at    timestamptz not null default now()
);

create index if not exists season_archive_lookup on season_archive (league_id, season, category);

-- One row per (manager, period) within a category — lets a cron job upsert
-- safely: reruns for a GW that's already archived update it in place instead
-- of creating duplicate rows.
create unique index if not exists season_archive_dedupe
  on season_archive (league_id, season, category, coalesce(period, -1), manager_id);

alter table season_archive enable row level security;

-- Public, read-only: the frontend uses the anon key and can only SELECT.
drop policy if exists "public read" on season_archive;
create policy "public read" on season_archive
  for select using (true);
-- No insert/update/delete policy for anon/authenticated — writes only ever
-- happen via the service-role key from the seed script, never from the app.
