# BRO League 5

A live standings site for our private Fantasy Premier League mini-league — league table, weekly results, monthly prize competitions, and full prize-pool breakdown, all pulled straight from the official FPL API.

Built with React + Vite on the frontend and Vercel serverless functions on the backend (the FPL API blocks browser CORS, so requests are proxied server-side and optionally cached in Vercel KV).

## Getting started

```bash
npm install
npm run vercel-dev   # serves the app AND the /api/* serverless functions
```

Plain `npm run dev` also works, but only serves the frontend — `/api/*` routes will 404, so the app falls back to cached/placeholder data. Use `vercel-dev` (or deploy to Vercel) whenever you need real FPL data locally.

Copy `.env.local` and set at minimum:

```
VITE_FPL_LEAGUE_ID=<this season's classic league ID>
VITE_LEAGUE_NAME="BRO League 5"
VITE_ENTRY_FEE=800
VITE_TOTAL_PRIZE_POOL=12000
```

`VITE_FPL_LEAGUE_ID` has no fallback on purpose — leaving it unset fails loudly instead of silently showing an old season's league.

Prize-structure specifics (season/monthly/weekly amounts, gameweek windows) live in one place: [`src/data/leagueData.js`](src/data/leagueData.js). Update that file when the prize breakdown changes.

## Scripts

| Command | What it does |
|---|---|
| `npm run vercel-dev` | Local dev with working API routes (recommended) |
| `npm run dev` | Frontend-only Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run lint` | ESLint |
| `npm run test-api` | Hits the deployed/local API routes and reports timing |

## Deployment

Deploy to Vercel — see [DEPLOYMENT.md](DEPLOYMENT.md) for the full walkthrough. GitHub Pages can only serve the static build (no `/api/*` functions), so it isn't a supported target for live data.
