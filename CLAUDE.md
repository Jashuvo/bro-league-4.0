# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

BRO League 4.0 — a React/Vite front end for a private Fantasy Premier League (FPL) mini-league, backed by Vercel serverless functions that proxy and aggregate the public FPL API (which blocks browser CORS). The functions optionally cache responses in Vercel KV (Redis) and gracefully degrade to no-cache mode if KV isn't configured.

## Commands

```bash
npm run dev          # Vite dev server (frontend only — API routes 404 unless run via `vercel dev`)
npm run vercel-dev    # Vercel CLI dev server — serves both frontend and /api/* serverless functions
npm run build         # Production build to dist/
npm run preview       # Preview the production build
npm run lint          # ESLint (flat config, eslint.config.js) — max-warnings 0
npm run test-api      # Hits the deployed/local API routes and prints timing/status (scripts/test-api.js); set TEST_URL and VITE_FPL_LEAGUE_ID env vars to target a different deployment
npm run cache-status  # Inspect KV cache status (scripts/cache-status.js)
npm run analyze       # Build then run vite-bundle-analyzer on dist/
```

There is no unit test suite/framework configured — `test-api` is an integration script that calls live endpoints, not a test runner.

To exercise the serverless functions locally you must use `vercel dev`, not plain `vite dev`, since `/api/*.js` files are Vercel Functions, not part of the Vite app.

## Architecture

**Two-tier app: static SPA + serverless API proxy.**

- `src/` — React 18 SPA (Vite, Tailwind + daisyUI, framer-motion). No client-side router; a single `activeTab` state in [App.jsx](src/App.jsx) switches between four views (League Table, Weekly Results, Monthly Prizes, Prize Distribution).
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
1. Checks Vercel KV for a cached response (`fpl:league:{id}:complete`, 120s TTL) unless `force=true` or KV is unavailable.
2. Otherwise fetches `bootstrap-static` and `leagues-classic/{id}/standings` in parallel, then fetches each manager's `entry/{id}` and `entry/{id}/history` (capped to the first 20 standings, 3-way concurrency limited).
3. Reshapes everything into `{ bootstrap, league, standings, gameweekTable, leagueStats }` and returns `{ success, data, performance, timestamp }`.
4. On error, tries to serve stale KV cache before returning a 500.

Other endpoints (`bootstrap.js`, `manager-history.js`, `team-picks.js`, `live-stats.js`) are narrower single-purpose proxies used for drill-down views (e.g. viewing one team's picks for a gameweek); `warm-cache.js` is a cron-style endpoint intended to pre-warm the KV cache. Every `api/*.js` file independently sets its own CORS headers and duplicates the same `fetchWithRetry`/concurrency-limiter helpers — if you fix a bug in one, check whether the same logic is copy-pasted into the others.

KV/Redis is optional everywhere: every API file does a soft `try { await import('@vercel/kv') }` and continues without caching if it's unavailable. Don't assume `kv` is defined.

### Frontend structure

- [src/App.jsx](src/App.jsx) owns all top-level state (`standings`, `gameweekTable`, `leagueStats`, `bootstrap`, `authStatus`, etc.) and passes it down as props — there's no global store (no Redux/Zustand/Context for data, only `ThemeContext` for light/dark).
- `src/components/` — one component per tab/section (`LeagueTable`, `GameweekTable`, `MonthlyPrizes`, `PrizeDistribution`, `LivePointsTable`, `LiveTotalPointsTable`, `TeamView`, `PrizeBreakdown`, ...) plus shared chrome (`Layout`, `Header`, `Footer`, `StickyHeader`, `TabNavigation`, `LoadingSpinner`, `ErrorMessage`, `ErrorBoundary`).
- `src/components/ui/` — small generic primitives (`Button`, `Card`, `Badge`); `src/utils/cn.js` wraps `clsx` + `tailwind-merge` for conditional classNames — use it rather than string-concatenating class names.
- `src/context/ThemeContext.jsx` — light/dark theme, persisted to `localStorage`, driven via `data-theme` attribute (daisyUI) and a `.dark` class (Tailwind `darkMode: 'class'`) applied to `<html>`.
- `src/data/leagueData.js` — static league configuration (participant count, entry fee, prize pool amounts/breakdown). This is season-specific config, not fetched data; update it when the league's prize structure changes.

### Deployment

Two deployment targets exist in this repo and they are **not equivalent**:
- **Vercel** (`vercel.json`, see [DEPLOYMENT.md](DEPLOYMENT.md)) — the intended target. Serves both the static build and the `/api/*` functions, so live FPL data works.
- **GitHub Pages** (`.github/workflows/deploy.yml`, triggers on push to `main`) — static-only. The `/api/*` serverless functions do **not** run there, so the app falls back to cached/fallback data. Be aware of this if the default branch is `main` (current repo default branch per git status is `master`) — don't assume GH Pages deploys have live data.

Required env vars (see `.env.local` for the full list) include `VITE_FPL_LEAGUE_ID`, `VITE_LEAGUE_NAME`, `VITE_TOTAL_PARTICIPANTS`, `VITE_ENTRY_FEE`, `VITE_TOTAL_PRIZE_POOL`; KV/Redis credentials are injected automatically by Vercel when a KV store is attached to the project.
