> **This is the original planning doc, kept for design history — it does not describe the shipped feature.** For what's actually implemented, see CLAUDE.md's "Season archive" section. The biggest departures: `PrizeDistribution.jsx` referenced throughout no longer exists (this app went through an unrelated restructure — Season is now a segment of `PrizesHub.jsx`); the "previous season" focus below was reversed and then un-reversed (past-season backfill ships too, via `scripts/backfill-last-season.js`, using current league members' own entry history rather than the old league ID this doc assumes is needed); and weekly/monthly/standings capture for the *current* season shipped as the primary feature, not just an "onward" afterthought (§8 below).

# Season Archive via Supabase — Implementation Spec

**Goal:** persist one past season's final standings + prize payout so it survives forever (unlike the FPL API, which drops per-GW/per-month detail once a season ends), while keeping it fully separate from live current-season data — it never merges into `standings`, `gameweekTable`, or any of the live prize math in [PrizeDistribution.jsx](src/components/PrizeDistribution.jsx).

**Chosen UI placement:** collapsed "Previous Season" panel inside Prize Distribution, closed by default. Not a new tab.

**Cost:** Supabase free tier (500MB DB, 2 projects) is massively more than enough — this is ~20 rows, updated once a year.

---

## 1. Known limitation (carried over from earlier discussion)

This spec covers *storage + display*. It does **not** by itself solve populating real 2025/26 numbers — that still depends on getting last season's manager (entry) IDs, since the live league (`1858389`) currently 404s. Weekly/monthly breakdowns for 2025/26 specifically are very likely unrecoverable (FPL never retains per-GW detail past season-end) — only final total points + rank can be reconstructed via `entry/{id}/history`. Once IDs are available, a one-time seed script (§4) computes and inserts the row set; until then this can be built and merged empty.

Going forward (2026/27 onward), this same table lets you snapshot weekly/monthly winners *during* the season instead of relying on FPL's API after the fact.

## 2. Schema

One table, season-scoped, holds both the final standings row and (optionally, going forward) weekly/monthly award rows, distinguished by `category`.

```sql
create table season_archive (
  id            bigint generated always as identity primary key,
  league_id     text        not null,          -- VITE_FPL_LEAGUE_ID at the time, e.g. '1858389'
  season        text        not null,           -- '2025/26'
  category      text        not null default 'final_standing',
                             -- 'final_standing' | 'weekly_winner' | 'monthly_winner'
  period        int,                            -- gameweek number or month id; null for final_standing
  manager_id    bigint      not null,            -- FPL entry id (permanent, survives league changes)
  manager_name  text        not null,
  team_name     text,
  total_points  int,
  final_rank    int,                             -- final position in the mini-league (final_standing rows)
  prize_label   text,                            -- e.g. 'Champion', 'GW14 Winner', 'Month 3 Winner'
  prize_amount  numeric,
  created_at    timestamptz not null default now()
);

create index season_archive_lookup on season_archive (league_id, season, category);

-- One row per (manager, period) within a category — lets the cron job
-- upsert safely: reruns for a GW that's already archived update it in place
-- (FPL sometimes revises bonus points a day or two after a GW "finishes")
-- instead of creating duplicate rows.
create unique index season_archive_dedupe
  on season_archive (league_id, season, category, coalesce(period, -1), manager_id);

alter table season_archive enable row level security;

-- Public, read-only: the frontend uses the anon key and can only SELECT.
create policy "public read" on season_archive
  for select using (true);
-- No insert/update/delete policy for anon/authenticated — writes only ever
-- happen via the service-role key from the seed script, never from the app.
```

## 3. Env vars

Add to `.env.local` / Vercel project settings:

```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon/public key>       # safe to ship to the browser — RLS restricts it to SELECT
SUPABASE_SERVICE_ROLE_KEY=<service role key>   # server-only, NEVER prefixed with VITE_, never committed
```

The service-role key is only ever used locally (or in a one-off script), not by any `api/*.js` function or the client — this keeps the write path out of the deployed surface entirely.

## 4. One-time seed script (`scripts/seed-season-archive.js`)

Not a Vercel function — a local Node script, run by hand once you have the manager ID list:

```js
// Usage: node scripts/seed-season-archive.js
// Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in the environment.
import { createClient } from '@supabase/supabase-js';
import { prizeStructure } from '../src/data/leagueData.js';

const MANAGER_IDS = [/* fill in once known */];
const SEASON = '2025/26';
const LEAGUE_ID = '1858389';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const rows = [];
  for (const id of MANAGER_IDS) {
    const res = await fetch(`https://fantasy.premierleague.com/api/entry/${id}/history/`);
    const { past } = await res.json();
    const seasonEntry = past.find((p) => p.season_name === '2025/26');
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
    const prize = prizeStructure.season.prizes.find((p) => p.position === r.final_rank);
    if (prize) { r.prize_label = prize.label; r.prize_amount = prize.amount; }
  });

  const { error } = await supabase.from('season_archive').insert(rows);
  if (error) throw error;
  console.log(`Inserted ${rows.length} rows for ${SEASON}`);
}

main();
```

## 5. Read API — `api/season-archive.js`

Follows the same shape as the other `api/*.js` files (own CORS headers, soft-fails to `{ data: [] }` if Supabase isn't configured — mirrors the existing KV "optional everywhere" pattern):

```js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { leagueId, season } = req.query;
  const url = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return res.status(200).json({ success: true, data: [] }); // no archive configured — not an error
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(url, anonKey);
    let query = supabase.from('season_archive').select('*').eq('league_id', leagueId);
    if (season) query = query.eq('season', season);

    const { data, error } = await query.order('final_rank', { ascending: true });
    if (error) throw error;
    return res.status(200).json({ success: true, data: data || [] });
  } catch (err) {
    return res.status(200).json({ success: true, data: [] }); // degrade, don't break the page
  }
}
```

## 6. Client + UI wiring

- `src/services/fplApi.js`: add `getSeasonArchive()` — same `fetchWithRetry` + cache pattern as `getBootstrapData()`, hitting `/api/season-archive?leagueId=${this.leagueId}`. Returns `[]` on any failure, never throws.
- `src/App.jsx`: fetch once alongside the existing `initializeWithAuth()` call, pass down as a new `seasonArchive` prop — does **not** touch `standings`/`gameweekTable`/`leagueStats`, so nothing about the live season's rendering path changes.
- `PrizeDistribution.jsx`: add a collapsed `<details>`/accordion section, closed by default, titled with the archived season label pulled from the data itself (e.g. "📜 2025/26 Final Results") — never "this season" — rendering the sorted `final_standing` rows with rank/points/prize. **If `seasonArchive` is empty, render nothing** (no placeholder, no empty state) so it's invisible until real data exists.

This satisfies "won't show when a new season starts": the archive is a distinct, explicitly-labeled, collapsed block driven by its own `season` field — it's never auto-merged into `distributionStats`, `standings`, or any current-season calculation, so a new season starting has zero effect on it either way (it stays exactly as archived, always available on demand).

## 7. Dependency to add

```bash
npm install @supabase/supabase-js
```

## 8. Ongoing weekly/monthly capture (2026/27 onward) — new

This is the actual fix for "next season I want proper weekly/monthly results too": a scheduled job that snapshots each GW's winner and each month's top 3 into `season_archive` **as the season progresses**, so nothing is lost when 2027/28 starts.

**New endpoint — `api/snapshot-results.js`:**

- Runs on a daily Vercel Cron trigger (`vercel.json` → `crons`). Vercel's Hobby (free) plan only allows daily-granularity cron schedules — that's fine here, since a GW only finalizes once a day at most.
- On each run:
  1. Calls the existing `/api/league-complete?leagueId=X&force=true` internally (same pattern `warm-cache.js` already uses) to get fresh `bootstrap` + `gameweekTable` — **no new FPL-fetching logic, reuses what's already built and tested.**
  2. **Weekly:** for every gameweek where `bootstrap.events[gw].data_checked === true` (bonus points finalized — more reliable than `finished`, which flips before bonus points settle), find that GW's top net-points scorer using the *exact same* sort already in [PrizeDistribution.jsx](src/components/PrizeDistribution.jsx) (`gameweekPoints - transfersCost`), and upsert one `weekly_winner` row (`period` = GW number, `prize_amount` = `prizeStructure.weekly.perWeek`).
  3. **Monthly:** for every `monthlyWindows` entry whose *every* GW has `data_checked === true`, sum net points per manager across that window — the same aggregation [MonthlyPrizes.jsx](src/components/MonthlyPrizes.jsx) already does — take the top 3 (or whatever `regularPrizes`/`finalMonth` length is), and upsert `monthly_winner` rows (`period` = month id, prize label/amount from `prizeStructure.monthly`).
  4. The DB's unique index (§2) makes every upsert idempotent — reruns on a GW that already has correct data just no-op/update, they never duplicate.
- To avoid recomputing the same weekly/monthly math a third time (component, cron job), factor the pure "given a gameweekTable + window, return ranked winners" logic into `api/_lib/helpers.js` as a shared function — the component can eventually import the same logic too, closing the drift risk called out at the top of `leagueData.js` about duplicated prize logic.
- Guard the endpoint so only Vercel's own cron can trigger it: check `req.headers['authorization'] === \`Bearer ${process.env.CRON_SECRET}\`` (Vercel auto-injects `CRON_SECRET` and signs cron-triggered requests with it) — otherwise anyone could hit the URL and force writes.

**`vercel.json` addition:**

```json
"crons": [
  { "path": "/api/snapshot-results", "schedule": "0 6 * * *" }
]
```

**Result:** the collapsed "Previous Season" panel (§6) will, from 2027/28 onward, show a *real*, complete weekly-winner list and monthly top-3 table for 2026/27 — not just the final standings — because it was captured live instead of reconstructed after the fact.

---

## Still blocked on

Real data for 2025/26 needs the manager ID list (see earlier conversation — the original league ID 1858389 currently 404s on FPL's API). Everything above can be built and merged with an empty table; running the seed script is the only step waiting on that.
