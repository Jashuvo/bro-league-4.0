// api/league-complete.js - works with or without the Supabase-backed cache
import { fetchWithRetry, setCorsHeaders, ConcurrencyLimiter, isValidId } from './_lib/helpers.js';
import { kv } from './_lib/kv.js';
import { shapeManager, buildGameweekTable, buildLeagueStats, MAX_MANAGERS } from './_lib/leagueShape.js';

if (kv) {
  console.log('✅ Cache available (kv_cache table)');
} else {
  console.log('⚠️ Supabase not configured, running without cache');
}

// Try to import waitUntil, but don't fail if it's not available (e.g. local
// `vercel dev` on an older CLI, or a runtime that doesn't support it) — the
// background-refresh path below just falls back to blocking in that case.
let waitUntil = null;
try {
  const functionsModule = await import('@vercel/functions');
  waitUntil = functionsModule.waitUntil;
} catch (error) {
  console.log('⚠️ @vercel/functions not available, background refresh will block instead');
}

// Classic league IDs persist across seasons, and the cache below is keyed
// off it — but on the exact rollover day a fetch error could otherwise
// still serve a last-second stale-cache read as if it were this season's
// data. Bump CACHE_VERSION whenever the season rolls over (or the cached
// shape changes) so an old entry can never satisfy a new-season lookup.
const CACHE_VERSION = 'season-2026-27';

// This used to be the KV entry's own expiry (`ex`), which meant every
// request more than 120s after the last one paid the full ~20-manager fetch
// fan-out synchronously — for a low-traffic private league, that was most
// requests. Now KV keeps entries for much longer (see KV_SAFETY_TTL below)
// and freshness is judged from the payload's own `timestamp` instead:
// under this threshold, serve the cache as-is; over it, still serve the
// cache immediately (so the requester never waits) but kick off a
// background refetch via `waitUntil` so the NEXT request gets fresh data.
const FRESH_MS = 90 * 1000;
// Upper bound on how old a cache entry we'll still serve at all before
// falling back to a blocking fetch — a safety valve in case the background
// refresh path itself has been failing silently for a while.
const STALE_MAX_MS = 30 * 60 * 1000;
// How long KV keeps an entry around at all. Generous on purpose: eviction
// isn't what keeps data fresh any more (the timestamp check above is), this
// just bounds how long a dead cache entry can linger if nothing's been
// fetched in a long time (e.g. between seasons).
const KV_SAFETY_TTL_SECONDS = 6 * 60 * 60;

/**
 * Does the actual work: fetches bootstrap + standings + up to 20 managers'
 * detail from the live FPL API, reshapes it, and returns the response
 * payload. Doesn't touch KV — callers decide whether/when to cache it.
 */
async function fetchFreshLeagueData(leagueId) {
  const startTime = Date.now();

  // Fetch bootstrap and standings in parallel with retry
  const [bootstrapResponse, standingsResponse] = await Promise.all([
    fetchWithRetry('https://fantasy.premierleague.com/api/bootstrap-static/', {
      timeout: 15000
    }),
    fetchWithRetry(`https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/`, {
      timeout: 15000
    })
  ]);

  if (!bootstrapResponse.ok || !standingsResponse.ok) {
    throw new Error('Failed to fetch basic data from FPL API');
  }

  const [bootstrapData, standingsData] = await Promise.all([
    bootstrapResponse.json(),
    standingsResponse.json()
  ]);

  // Process bootstrap data
  // Pre-season (before GW1's deadline) has neither is_current nor
  // is_previous set yet — fall back to GW1, not an arbitrary later week.
  const currentGameweek = bootstrapData.events?.find(event => event.is_current)?.id ||
                         bootstrapData.events?.find(event => event.is_previous)?.id || 1;

  const optimizedBootstrap = {
    currentGameweek,
    totalGameweeks: bootstrapData.events?.length || 38,
    gameweeks: bootstrapData.events?.map(gw => ({
      id: gw.id,
      name: gw.name,
      deadline_time: gw.deadline_time,
      average_entry_score: gw.average_entry_score || 0,
      highest_score: gw.highest_score || 0,
      is_current: gw.is_current,
      is_previous: gw.is_previous,
      is_next: gw.is_next,
      finished: gw.finished,
      data_checked: gw.data_checked
    })) || []
  };

  // FPL's own /entry/{id}/history/ endpoint (fetched per manager below)
  // is a periodically-refreshed snapshot — while the current gameweek is
  // still being played (or its bonus points haven't been locked in yet,
  // i.e. `data_checked` is false), that snapshot's points/total_points/
  // points_on_bench for THIS gameweek can sit badly behind the live
  // totals the standings endpoint already has (same kind of FPL-side lag
  // FixturesView.jsx works around with finished vs finished_provisional —
  // confirmed here by curling FPL directly: standings already reported a
  // manager's correct 55-point gameweek while /history/ was still stuck
  // reporting 12, carried over from earlier in the live gameweek). The
  // standings endpoint used above already gives us a live, correct
  // points/total per manager, so gameweekTable below prefers that over
  // /history/ for the current row — but bench points have no standings
  // equivalent, so when the gameweek isn't finalized yet we also pull
  // each manager's live picks + this gameweek's live stats and recompute
  // points-left-on-the-bench ourselves (mirroring the auto-sub-aware
  // logic in api/team-picks.js) instead of trusting the stale snapshot.
  const currentGwMeta = bootstrapData.events?.find(event => event.id === currentGameweek);
  const currentGwIsFinal = Boolean(currentGwMeta?.data_checked);

  const currentGwLiveStatsMap = new Map();
  if (!currentGwIsFinal) {
    try {
      const liveResponse = await fetchWithRetry(
        `https://fantasy.premierleague.com/api/event/${currentGameweek}/live/`,
        { timeout: 15000 },
        1
      );
      if (liveResponse.ok) {
        const liveData = await liveResponse.json();
        (liveData.elements || []).forEach((el) => {
          currentGwLiveStatsMap.set(el.id, el.stats?.total_points || 0);
        });
      }
    } catch (err) {
      console.warn('⚠️ Could not fetch live stats for current-gameweek bench recompute:', err.message);
    }
  }

  // Cap the manager-detail fan-out so a large league can't blow the
  // function's time budget — standings above this cut are still counted
  // in totalManagers below but won't have per-manager history/chips data.
  // (MAX_MANAGERS comes from _lib/leagueShape.js.)
  const totalManagers = standingsData.standings.results.length;
  const managers = standingsData.standings.results.slice(0, MAX_MANAGERS);

  // Per-manager fan-out: ONE fetch per manager (/history/), down from up
  // to three. The old code also fetched /entry/{id} per manager, but every
  // field it provided that anyone reads (manager name, team name, overall
  // rank) is already on the classic-standings row — player_name,
  // entry_name and summary_overall_rank respectively — and the fields
  // nobody read (region, started_event, favourite_team) are simply gone.
  // The per-gameweek history itself can't come from anywhere else (FPL has
  // no league-wide per-GW endpoint), so /history/ stays.
  // Concurrency 6: safe for 20 fetches against FPL (their own frontend
  // fires far more in parallel), and with the fetch count down the wall
  // clock of a cold cache miss lands well under the old 3-concurrency/60-
  // fetch version.
  const limiter = new ConcurrencyLimiter(6);

  const managerPromises = managers.map(entry =>
    limiter.run(async () => {
      try {
        const fetchList = [
          fetchWithRetry(
            `https://fantasy.premierleague.com/api/entry/${entry.entry}/history/`,
            { timeout: 8000 },
            1
          )
        ];
        // Only fetched while the current gameweek's own numbers aren't
        // final yet — see the comment above currentGwIsFinal.
        if (!currentGwIsFinal) {
          fetchList.push(
            fetchWithRetry(
              `https://fantasy.premierleague.com/api/entry/${entry.entry}/event/${currentGameweek}/picks/`,
              { timeout: 8000 },
              1
            )
          );
        }

        const [historyResponse, picksResponse] = await Promise.all(fetchList);

        let historyData = null;
        let liveBenchPoints = null;

        if (historyResponse.ok) {
          const history = await historyResponse.json();
          historyData = {
            currentSeason: history.current?.map(gw => ({
              event: gw.event,
              points: gw.points,
              total_points: gw.total_points,
              rank: gw.rank,
              overall_rank: gw.overall_rank,
              bank: gw.bank / 10,
              value: gw.value / 10,
              event_transfers: gw.event_transfers,
              event_transfers_cost: gw.event_transfers_cost,
              points_on_bench: gw.points_on_bench
            })) || [],
            chips: history.chips || [],
            pastSeasons: history.past || []
          };
        }

        if (picksResponse?.ok) {
          try {
            const picksData = await picksResponse.json();
            // picks[].position already reflects the FINAL, post-auto-sub
            // lineup (1-11 = who actually played, 12-15 = who ended up
            // benched) — no need to interpret automatic_subs ourselves
            // here, see the comment in api/team-picks.js.
            liveBenchPoints = (picksData.picks || [])
              .filter(p => p.position >= 12 && p.position <= 15)
              .reduce((sum, p) => sum + (currentGwLiveStatsMap.get(p.element) || 0), 0);
          } catch (err) {
            console.warn(`⚠️ Could not recompute live bench points for manager ${entry.entry}:`, err.message);
          }
        }

        return {
          ...entry,
          historyData,
          liveBenchPoints
        };
      } catch (error) {
        console.warn(`⚠️ Partial data for manager ${entry.entry}:`, error.message);
        return {
          ...entry,
          historyData: null,
          liveBenchPoints: null
        };
      }
    })
  );

  // Wait for all manager data
  const managersWithData = await Promise.all(managerPromises);

  // Transform standings with enhanced data — the field mapping lives in
  // _lib/leagueShape.js so it can be unit-tested in isolation.
  const transformedStandings = managersWithData.map((entry) =>
    shapeManager(entry, entry.historyData, currentGameweek)
  );

  // Build the per-gameweek table (see _lib/leagueShape.js).
  const liveBenchByManager = new Map(
    managersWithData
      .filter((m) => m.liveBenchPoints != null)
      .map((m) => [m.entry, m.liveBenchPoints])
  );
  const gameweekTable = buildGameweekTable(managersWithData, new Map(
    managersWithData.map((m) => [m.entry, m.historyData?.currentSeason || []])
  ), {
    currentGameweek,
    currentGwIsFinal,
    liveBenchByManager
  });

    // (standings transform + gameweek table + league stats are built above
  // via _lib/leagueShape.js.)

  // Calculate league statistics (guarded against an empty standings list —
  // the guard itself lives in buildLeagueStats)
  const leagueStats = buildLeagueStats(transformedStandings, totalManagers);

  const processingTime = Date.now() - startTime;

  return {
    success: true,
    data: {
      authenticated: true,
      bootstrap: optimizedBootstrap,
      league: {
        id: standingsData.league.id,
        name: standingsData.league.name,
        created: standingsData.league.created,
        closed: standingsData.league.closed,
        rank: standingsData.league.rank,
        max_entries: standingsData.league.max_entries,
        league_type: standingsData.league.league_type,
        scoring: standingsData.league.scoring,
        admin_entry: standingsData.league.admin_entry,
        start_event: standingsData.league.start_event
      },
      standings: transformedStandings,
      gameweekTable: gameweekTable,
      leagueStats: leagueStats
    },
    performance: {
      processingTime: `${processingTime}ms`,
      managersProcessed: transformedStandings.length,
      managersTruncated: totalManagers > transformedStandings.length,
      gameweeksAnalyzed: gameweekTable.length,
      dataCompleteness: transformedStandings.length === 0 ? 0 : Math.round(
        (transformedStandings.filter(m => m.hasData).length / transformedStandings.length) * 100
      ),
      // Vercel sets this automatically for every deployment — no config
      // needed. Exists so "is production actually running the commit I
      // just shipped" is a response field, not a guess from a deploy
      // dashboard.
      buildSha: (process.env.VERCEL_GIT_COMMIT_SHA || 'unknown').slice(0, 7),
      cacheEnabled: !!kv
    },
    timestamp: new Date().toISOString(),
    fromCache: false
  };
}

/** Fetches fresh data and writes it to KV (if available). Shared by the
 * blocking cold-start path and the non-blocking background-refresh path. */
async function refreshAndCache(leagueId, cacheKey) {
  const responseData = await fetchFreshLeagueData(leagueId);
  if (kv) {
    try {
      await kv.set(cacheKey, responseData, { ex: KV_SAFETY_TTL_SECONDS });
      console.log(`✅ Data cached for league ${leagueId}`);
    } catch (cacheError) {
      console.error('Cache write error:', cacheError);
    }
  }
  return responseData;
}

export default async function handler(req, res) {
  setCorsHeaders(res);

  // Enable caching headers
  res.setHeader(
    'Cache-Control',
    'public, s-maxage=60, stale-while-revalidate=300'
  );

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { leagueId, force } = req.query;

  if (!isValidId(leagueId)) {
    return res.status(400).json({
      success: false,
      error: 'League ID is required and must be a positive integer'
    });
  }

  const cacheKey = `fpl:league:${leagueId}:${CACHE_VERSION}:complete`;
  const startTime = Date.now();

  try {
    let cached = null;
    if (kv && !force) {
      try {
        cached = await kv.get(cacheKey);
      } catch (cacheError) {
        console.error('Cache read error:', cacheError);
      }
    }

    if (cached) {
      const age = Date.now() - new Date(cached.timestamp).getTime();

      if (age < STALE_MAX_MS) {
        // Serve immediately either way — the requester never blocks on a
        // live FPL fetch as long as ANY reasonably-recent cache exists.
        // Past FRESH_MS it's still what we serve, but we also kick off a
        // background refresh (not awaited) so the NEXT request gets fresh
        // data instead of everyone riding the same stale copy forever.
        if (age >= FRESH_MS) {
          const refresh = refreshAndCache(leagueId, cacheKey).catch((err) =>
            console.error('Background refresh failed:', err)
          );
          if (waitUntil) waitUntil(refresh);
        }

        cached.fromCache = true;
        cached.cacheAge = age;
        cached.performance = {
          ...cached.performance,
          totalTime: `${Date.now() - startTime}ms`,
          cacheHit: true,
          stale: age >= FRESH_MS
        };
        return res.status(200).json(cached);
      }
      // Older than STALE_MAX_MS — treat as if there were no cache at all
      // and fall through to a blocking fetch below.
    }

    console.log(`🚀 Fetching fresh data for league ${leagueId}${force ? ' (forced)' : cached ? ' (cache too stale)' : ' (cold)'}...`);
    const responseData = await refreshAndCache(leagueId, cacheKey);
    responseData.performance.totalTime = `${Date.now() - startTime}ms`;
    return res.status(200).json(responseData);

  } catch (error) {
    console.error('❌ Error in league-complete:', error);

    const processingTime = Date.now() - startTime;

    // Try to return cached data even if stale (if KV available)
    if (kv) {
      try {
        const staleCache = await kv.get(cacheKey);
        if (staleCache) {
          console.log('⚠️ Returning stale cache due to error');
          staleCache.stale = true;
          staleCache.error = error.message;
          return res.status(200).json(staleCache);
        }
      } catch (cacheError) {
        console.error('Failed to retrieve stale cache:', cacheError);
      }
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch complete league data',
      message: error.message,
      processingTime: `${processingTime}ms`,
      timestamp: new Date().toISOString()
    });
  }
}
