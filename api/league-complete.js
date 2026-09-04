// api/league-complete.js - Fixed version that works with or without Redis/KV
import { fetchWithRetry, setCorsHeaders, ConcurrencyLimiter } from './_lib/helpers.js';
import { kv } from './_lib/kv.js';

if (kv) {
  console.log('✅ Redis available for caching');
} else {
  console.log('⚠️ REDIS_URL not set, running without cache');
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
  const MAX_MANAGERS = 20;
  const totalManagers = standingsData.standings.results.length;
  const managers = standingsData.standings.results.slice(0, MAX_MANAGERS);

  // Use concurrency limiter for manager data fetching
  const limiter = new ConcurrencyLimiter(3); // Max 3 concurrent requests

  const managerPromises = managers.map(entry =>
    limiter.run(async () => {
      try {
        const fetchList = [
          fetchWithRetry(
            `https://fantasy.premierleague.com/api/entry/${entry.entry}/`,
            { timeout: 8000 },
            1 // Less retries for individual managers
          ),
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

        const [managerResponse, historyResponse, picksResponse] = await Promise.all(fetchList);

        let managerData = null;
        let historyData = null;
        let liveBenchPoints = null;

        if (managerResponse.ok) {
          const manager = await managerResponse.json();
          managerData = {
            firstName: manager.player_first_name || '',
            lastName: manager.player_last_name || '',
            teamName: manager.name || entry.entry_name || 'Unknown Team',
            region: manager.player_region_name || '',
            startedEvent: manager.started_event || 1,
            overallRank: manager.summary_overall_rank || 0,
            favoriteTeam: manager.favourite_team || null
          };
        }

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
          managerData,
          historyData,
          liveBenchPoints
        };
      } catch (error) {
        console.warn(`⚠️ Partial data for manager ${entry.entry}:`, error.message);
        return {
          ...entry,
          managerData: null,
          historyData: null,
          liveBenchPoints: null
        };
      }
    })
  );

  // Wait for all manager data
  const managersWithData = await Promise.all(managerPromises);

  // Transform standings with enhanced data
  const transformedStandings = managersWithData.map((entry) => {
    const managerName = entry.managerData
      ? `${entry.managerData.firstName} ${entry.managerData.lastName}`.trim() || `Manager ${entry.entry}`
      : entry.player_name || `Manager ${entry.entry}`;

    const teamName = entry.managerData?.teamName || entry.entry_name || 'Unknown Team';

    // Get current gameweek hits
    const currentGWHits = entry.historyData?.currentSeason?.find(h => h.event === currentGameweek)?.event_transfers_cost || 0;

    // Calculate form (last 5 gameweeks)
    let form = 'N/A';
    let avgPoints = 0;
    if (entry.historyData?.currentSeason?.length > 0) {
      const recentGames = entry.historyData.currentSeason.slice(-5);
      if (recentGames.length > 0) {
        const totalPoints = recentGames.reduce((sum, gw) => sum + gw.points, 0);
        avgPoints = Math.round(totalPoints / recentGames.length);
        form = `${avgPoints} pts avg`;
      }
    }

    return {
      id: entry.entry,
      managerName: managerName,
      teamName: teamName,
      totalPoints: entry.total,
      gameweekPoints: entry.event_total || 0,
      gameweekHits: currentGWHits,
      rank: entry.rank,
      lastRank: entry.last_rank,
      rankChange: (entry.last_rank || entry.rank) - entry.rank,
      form: form,
      avgPoints: avgPoints,
      overallRank: entry.managerData?.overallRank || 0,
      hasData: !!entry.managerData,
      chips: entry.historyData?.chips || [],
      bankValue: entry.historyData?.currentSeason?.[entry.historyData.currentSeason.length - 1]?.bank || 0,
      teamValue: entry.historyData?.currentSeason?.[entry.historyData.currentSeason.length - 1]?.value || 100
    };
  });

  // Calculate gameweek history table
  const gameweekTable = [];
  const maxGameweek = Math.max(
    ...managersWithData
      .filter(m => m.historyData?.currentSeason?.length > 0)
      .map(m => m.historyData.currentSeason.length),
    0
  );

  for (let gw = 1; gw <= maxGameweek; gw++) {
    const gwData = {
      gameweek: gw,
      managers: []
    };

    managersWithData.forEach(manager => {
      const gwHistory = manager.historyData?.currentSeason?.find(h => h.event === gw);
      if (gwHistory) {
        // This row is the live, in-progress gameweek — prefer the
        // already-fresh standings/entry figures (and our own recomputed
        // bench points) over the /history/ snapshot for it. See the
        // currentGwIsFinal comment above managerPromises.
        const isLiveCurrentGw = gw === currentGameweek && !currentGwIsFinal;
        gwData.managers.push({
          id: manager.entry,
          name: manager.entry_name || manager.player_name,
          managerName: manager.player_name || manager.entry_name,
          teamName: manager.entry_name,
          points: isLiveCurrentGw ? (manager.event_total ?? gwHistory.points) : gwHistory.points,
          totalPoints: isLiveCurrentGw ? (manager.total ?? gwHistory.total_points) : gwHistory.total_points,
          rank: isLiveCurrentGw ? (manager.managerData?.overallRank || gwHistory.overall_rank) : gwHistory.overall_rank,
          transfers: gwHistory.event_transfers,
          transferCost: gwHistory.event_transfers_cost,
          benchPoints: isLiveCurrentGw && manager.liveBenchPoints != null
            ? manager.liveBenchPoints
            : gwHistory.points_on_bench
        });
      }
    });

    if (gwData.managers.length > 0) {
      // Sort by gameweek points for ranking
      gwData.managers.sort((a, b) => b.points - a.points);
      gwData.winner = gwData.managers[0]?.name || 'N/A';
      gwData.highestScore = gwData.managers[0]?.points || 0;
      gwData.averageScore = Math.round(
        gwData.managers.reduce((sum, m) => sum + m.points, 0) / gwData.managers.length
      );
      gameweekTable.push(gwData);
    }
  }

  // Calculate league statistics (guarded against an empty standings list,
  // which would otherwise turn these into NaN/-Infinity/Infinity and flow
  // straight into the UI instead of erroring visibly).
  const managerCount = transformedStandings.length;
  const leagueStats = managerCount === 0 ? {
    totalManagers,
    averageScore: 0,
    highestTotal: 0,
    lowestTotal: 0,
    averageGameweekScore: 0,
    highestGameweekScore: 0,
    totalChipsUsed: 0,
    averageTeamValue: 0
  } : {
    totalManagers,
    averageScore: Math.round(
      transformedStandings.reduce((sum, m) => sum + m.totalPoints, 0) / managerCount
    ),
    highestTotal: Math.max(...transformedStandings.map(m => m.totalPoints)),
    lowestTotal: Math.min(...transformedStandings.map(m => m.totalPoints)),
    averageGameweekScore: Math.round(
      transformedStandings.reduce((sum, m) => sum + m.gameweekPoints, 0) / managerCount
    ),
    highestGameweekScore: Math.max(...transformedStandings.map(m => m.gameweekPoints)),
    totalChipsUsed: transformedStandings.reduce((sum, m) => sum + m.chips.length, 0),
    averageTeamValue: Math.round(
      transformedStandings.reduce((sum, m) => sum + m.teamValue, 0) / managerCount * 10
    ) / 10
  };

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

  if (!leagueId) {
    return res.status(400).json({
      success: false,
      error: 'League ID is required'
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
