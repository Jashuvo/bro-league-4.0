-- Fix: the original unique index used coalesce(period, -1) to let
-- `final_standing` rows (which have no natural period) dedupe correctly.
-- But an ON CONFLICT target has to textually match the index's expression,
-- and PostgREST/supabase-js's `onConflict` option only accepts a plain
-- column list — an upsert naming (league_id, season, category, period,
-- manager_id) would fail with "no unique or exclusion constraint matching
-- the ON CONFLICT specification" against an index built on the coalesce
-- expression, not the raw column. Making `period` NOT NULL with the same
-- -1 sentinel baked in as its default sidesteps this entirely: the unique
-- index (and every upsert's onConflict target) can now name the plain
-- column list.
alter table season_archive alter column period set default -1;
update season_archive set period = -1 where period is null;
alter table season_archive alter column period set not null;

drop index if exists season_archive_dedupe;
create unique index if not exists season_archive_dedupe
  on season_archive (league_id, season, category, period, manager_id);
