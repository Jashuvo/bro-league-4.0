-- Shared, server-visible "excluded from prizes" list — replaces the old
-- browser-localStorage-only version (src/context/ExclusionContext.jsx),
-- which meant different viewers could see different standings/prize math
-- depending on their own device, AND the archive cron (api/warm-cache.js)
-- had no way to know who was excluded when computing weekly/monthly
-- winners for the permanent record.
create table if not exists excluded_managers (
  league_id     text        not null,
  manager_id    bigint      not null,
  manager_name  text,
  created_at    timestamptz not null default now(),
  primary key (league_id, manager_id)
);

alter table excluded_managers enable row level security;

-- Public read (the anon key needs this so the live app can show the same
-- exclusion list to every viewer, matching season_archive's own policy).
-- No insert/update/delete policy for anon/authenticated — writes only ever
-- happen via api/exclusions.js using the service-role key, gated by
-- EXCLUSION_PIN. See that file for the write path.
drop policy if exists "public read" on excluded_managers;
create policy "public read" on excluded_managers
  for select using (true);
