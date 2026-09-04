# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

BRO League 5 — a React/Vite front end for a private Fantasy Premier League (FPL) mini-league, backed by Vercel serverless functions that proxy and aggregate the public FPL API (which blocks browser CORS). The functions cache responses in a `kv_cache` table in Supabase (see `api/_lib/kv.js`) and gracefully degrade to no-cache mode if Supabase isn't configured. (This was `@vercel/kv`, then a direct Redis connection, before both turned out to be non-functional in production — see the git history around `api/_lib/kv.js` if you're wondering why this isn't the "obvious" choice.)

## Commands

```bash
npm run dev          # Vite dev server (frontend only — API routes 404 unless run via `vercel dev`)
npm run vercel-dev    # Vercel CLI dev server — serves both frontend and /api/* serverless functions
npm run build         # Production build to dist/
npm run preview       # Preview the production build
npm run lint          # ESLint (flat config, eslint.config.js) — max-warnings 0
npm test              # Vitest, run once (unit tests — currently api/_lib/prizeConfig.test.js)
npm run test:watch    # Vitest, watch mode
npm run test-api      # Hits the deployed/local API routes and prints timing/status (scripts/test-api.js); set TEST_URL and VITE_FPL_LEAGUE_ID env vars to target a different deployment
npm run cache-status  # Inspect the Supabase-backed cache + recent cron runs (scripts/cache-status.js) — needs SUPABASE_SERVICE_ROLE_KEY
npm run analyze       # Build then run vite-bundle-analyzer on dist/
```

Unit tests (Vitest) are new and thin — only `api/_lib/prizeConfig.js`'s pure functions are covered so far (the prize/ranking logic, chosen because it's produced real production bugs — see that file's tests for what they're regression-testing against). `test-api` is a separate thing: an integration script that calls live endpoints, not part of the test runner.

CI (`.github/workflows/ci.yml`) runs lint + test + build on every push/PR — no secrets required, verified that `npm run build` succeeds with zero `VITE_*` env vars set. It doesn't deploy anything; that's still Vercel's own git integration (or `vercel deploy --prod` by hand — see Deployment below for how to tell which is actually wired up).

To exercise the serverless functions locally you must use `vercel dev`, not plain `vite dev`, since `/api/*.js` files are Vercel Functions, not part of the Vite app.

## Architecture

**Two-tier app: static SPA + serverless API proxy.**

- `src/` — React 18 SPA (Vite, Tailwind + daisyUI, framer-motion). No client-side router; a single `activeTab` state in [App.jsx](src/App.jsx) switches between six views (League Table, Weekly Results, Monthly Prizes, Chip Tracker, Head-to-Head, Prize Distribution).
- `api/` — Vercel serverless functions (Node, one file = one endpoint) that call `https://fantasy.premierleague.com/api/...` server-side (avoids browser CORS/blocking) and reshape the response for the frontend.
- The FPL API itself has no auth; "authenticated" in this codebase just means "we successfully reached the live FPL API" vs. falling back to cached/stale/empty data.

### Data flow

`src/services/fplApi.js` is the single client-side data-access layer (singleton `fplApi`). All components go through it — never call `/api/*` or the FPL API directly from a component. It:
- Has its own in-memory `Map`-based cache (2–5 min TTL depending on endpoint) with cache-key-per-resource, independent of the server-side KV cache in `api/`.
- Queues requests through a small concurrency limiter (`maxConcurrentRequests = 3`).
- Wraps fetches with timeout + exponential-backoff retry (`fetchWithRetry`).
- Falls back to stale cache, then to hardcoded fallback data (`getFallbackData`/`getFallbackBootstrap`), rather than throwing — components should expect possibly-empty/stale data rather than errors.
- `initializeWithAuth()` is the main entry point (called once on mount in `App.jsx`); `forceRefresh()` clears local cache and re-fetches with `force=true` (bypasses server KV cache too).

`GET /api/league-complete?leagueId=X` (see [api/league-complete.js](api/league-complete.js)) is the primary, "do everything in one call" endpoint and what the frontend uses by default:
1. Checks the cache for a response (`fpl:league:{id}:{season}:complete`) unless `force=true` or Supabase is unavailable. Stale-while-revalidate, not a hard TTL: a cache entry under ~90s old is served as-is; an older one is still served immediately but triggers a non-blocking background refresh (`waitUntil`) so the requester never pays for a cold fetch themselves — only a genuinely cold cache (nothing cached at all, or older than 30 min) blocks.
2. Otherwise fetches `bootstrap-static` and `leagues-classic/{id}/standings` in parallel, then fetches each manager's `entry/{id}` and `entry/{id}/history` (capped to the first 20 standings, 3-way concurrency limited).
3. Reshapes everything into `{ bootstrap, league, standings, gameweekTable, leagueStats }` and returns `{ success, data, performance, timestamp }`.
4. On error, tries to serve stale cache before returning a 500.

Other endpoints (`manager-history.js`, `team-picks.js`, `price-watch.js`, `league-transfers.js`, `fixture-alerts.js`) are narrower single-purpose proxies used for drill-down views (e.g. viewing one team's picks for a gameweek), all backed by the same `_lib/kv.js` cache; `season-archive.js` doubles as the read/write API for the season archive AND the shared exclusion list (`?resource=exclusions`, PIN-gated writes — see the Season archive section below); `warm-cache.js` is the daily cron that pre-warms `league-complete`'s cache and captures this season's results into the archive. Shared logic (`fetchWithRetry`, `ConcurrencyLimiter`, CORS headers) lives once in `api/_lib/helpers.js` — if you're duplicating any of that into a new endpoint, import it from there instead. `api/bootstrap.js`, `api/league.js`, and `api/live-stats.js` used to exist but were dead code (nothing in the frontend called them) and got removed — don't recreate them without checking `src/services/fplApi.js` actually needs them, given Vercel Hobby's 12-Serverless-Function-per-deployment cap (currently at 9 — run `find api -maxdepth 1 -name "*.js" | wc -l` to check the live count before adding a new one).

The cache (`api/_lib/kv.js`) is optional everywhere: every endpoint that uses it checks `if (kv)` and continues without caching if `VITE_SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` aren't set. Don't assume `kv` is non-null.

### Season archive

`season_archive` (Supabase) is this project's own permanent record of the current season's weekly winners, monthly winners, and full per-gameweek standings — captured daily by `warm-cache.js`'s cron, independent of the FPL API (which drops a season's per-gameweek detail once it ends). `excluded_managers` (same Supabase project) is the shared "excluded from prizes" list — it used to be browser-localStorage-only, which meant the archive cron had no way to know who was excluded; now `warm-cache.js` filters them out before computing anything. Writes to either the archive (never, from the app — only `warm-cache.js` and the one-off scripts below write it) or exclusions (`api/season-archive.js?resource=exclusions`, POST/DELETE) require the `EXCLUSION_PIN` header/env var; repeated wrong guesses are rate-limited (`rate_limits` table, 10 attempts / 15 min).

Two one-time local scripts fill in what the daily cron can't reconstruct after the fact: `scripts/backfill-last-season.js` (past-season final standings, using CURRENT league members' own `entry/{id}/history/` — FPL entry IDs are permanent per manager regardless of which mini-league groups them in a given season, so this doesn't need the old league's ID) and the now-removed `scripts/seed-season-archive.js` (superseded by the above). See `SUPABASE_ARCHIVE_PLAN.md` for the fuller design history, including two real bugs caught live before shipping (global rank vs. league rank; premature season-end crowning) — both are now regression-tested in `api/_lib/prizeConfig.test.js`.

### Frontend structure

- [src/App.jsx](src/App.jsx) owns all top-level state (`standings`, `gameweekTable`, `leagueStats`, `bootstrap`, `authStatus`, etc.) and passes it down as props — there's no global store (no Redux/Zustand/Context for data, only `ThemeContext` for light/dark).
- `src/components/` — one component per tab/section (`LeagueTable`, `GameweekTable`, `MonthlyPrizes`, `ChipTracker`, `HeadToHead`, `PrizeDistribution`, `LivePointsTable`, `LiveTotalPointsTable`, `TeamView`, `PrizeBreakdown`, ...) plus shared chrome (`Layout`, `Footer`, `StickyHeader`, `TabNavigation`, `LoadingSpinner`, `ErrorMessage`, `ErrorBoundary`, `PWAUpdate`).
- `src/components/ui/` — small generic primitives (`Button`, `Card`, `Badge`); `src/utils/cn.js` wraps `clsx` + `tailwind-merge` for conditional classNames — use it rather than string-concatenating class names.
- `src/context/ThemeContext.jsx` — light/dark theme, persisted to `localStorage`, driven via `data-theme` attribute (daisyUI) and a `.dark` class (Tailwind `darkMode: 'class'`) applied to `<html>`.
- `src/data/leagueData.js` — static league config (entry fee, prize pool amounts/breakdown, monthly gameweek windows). Participant count is deliberately *not* here — it's live headcount, read from `leagueStats.totalManagers` / `standings.length` in components (`Footer.jsx`, `CompactHero.jsx`), not a hardcoded number. Update this file's prize amounts when the league's prize structure changes.

### Deployment

Vercel (`vercel.json`, see [DEPLOYMENT.md](DEPLOYMENT.md)) is the only deployment target — it serves both the static build and the `/api/*` functions. A GitHub Pages workflow used to exist but was removed: it could only ever serve a degraded static build with no live API data.

Required env vars (see `.env.local` for the full list) include `VITE_FPL_LEAGUE_ID`, `VITE_LEAGUE_NAME`, `VITE_ENTRY_FEE`, `VITE_TOTAL_PRIZE_POOL`, `VITE_SEASON` (bump by hand every rollover, alongside `leagueConfig.season` in `src/data/leagueData.js` — used to tag rows written into `season_archive`), `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` (the cache + season archive), `CRON_SECRET` (Vercel signs the daily cron's request with this automatically once it's set — without it, `warm-cache.js` accepts unsigned requests), and `EXCLUSION_PIN` (gates writes to the shared exclusion list). `VITE_FPL_LEAGUE_ID` has no fallback on purpose — unset it and the app fails loudly instead of silently showing a stale league.

The Vercel project IS linked to this GitHub repo (`productionBranch: master`) — but confirm empirically whether that link is actually *pushing* auto-deploys (vs. metadata left over from initial project creation) before assuming `git push` alone ships a change: compare `vercel ls` right after a push against right before. If it isn't auto-deploying, `vercel deploy --prod` (or `vercel --prod`) after pushing is currently how every fix in this project's history actually reached production.
