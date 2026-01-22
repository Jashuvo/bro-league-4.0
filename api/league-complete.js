// api/league-complete.js - Fixed version that works with or without Redis/KV

// Try to import KV, but don't fail if it's not available
let kv = null;
try {
  const kvModule = await import('@vercel/kv');
  kv = kvModule.kv;
  console.log('✅ Redis/KV available for caching');
} catch (error) {
  console.log('⚠️ Redis/KV not available, running without cache');
}

// Helper function for fetch with timeout and retry
async function fetchWithRetry(url, options = {}, retries = 2) {
  const timeout = options.timeout || 10000;
  
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'User-Agent': 'BRO-League-4.0/1.0',
          'Accept': 'application/json',
          ...options.headers
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok && i < retries) {
        console.log(`Retry ${i + 1} for ${url}`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }
      
      return response;
    } catch (error) {
      if (i === retries) throw error;
      console.log(`Retry ${i + 1} after error: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

// Concurrency limiter
class ConcurrencyLimiter {
  constructor(maxConcurrent) {
    this.maxConcurrent = maxConcurrent;
    this.running = 0;
    this.queue = [];
  }

  async run(fn) {
    while (this.running >= this.maxConcurrent) {
      await new Promise(resolve => this.queue.push(resolve));
    }
    
    this.running++;
    try {
      return await fn();
    } finally {
      this.running--;
      const resolve = this.queue.shift();
      if (resolve) resolve();
    }
  }
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
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

  const cacheKey = `fpl:league:${leagueId}:complete`;
  const startTime = Date.now();

  try {
    // Check cache first if KV is available (unless force refresh)
    if (kv && !force) {
      try {
        const cached = await kv.get(cacheKey);
        if (cached) {
          console.log(`✅ Cache hit for league ${leagueId}`);
          
          // Add cache metadata
          cached.fromCache = true;
          cached.cacheAge = Date.now() - new Date(cached.timestamp).getTime();
          
          const processingTime = Date.now() - startTime;
          cached.performance = {
            ...cached.performance,
            totalTime: `${processingTime}ms`,
            cacheHit: true
          };
          
          return res.status(200).json(cached);
        }
      } catch (cacheError) {
        console.error('Cache read error:', cacheError);
        // Continue without cache
      }
    }

    console.log(`🚀 Fetching fresh data for league ${leagueId}...`);
    
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
    const currentGameweek = bootstrapData.events?.find(event => event.is_current)?.id || 
                           bootstrapData.events?.find(event => event.is_previous)?.id || 3;
    
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

    // Limit to 15 managers for your league
    const managers = standingsData.standings.results.slice(0, 20);
    
    // Use concurrency limiter for manager data fetching
    const limiter = new ConcurrencyLimiter(3); // Max 3 concurrent requests
    
    const managerPromises = managers.map(entry => 
      limiter.run(async () => {
        try {
          const [managerResponse, historyResponse] = await Promise.all([
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
          ]);

          let managerData = null;
          let historyData = null;

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

          return {
            ...entry,
            managerData,
            historyData
          };
        } catch (error) {
          console.warn(`⚠️ Partial data for manager ${entry.entry}:`, error.message);
          return {
            ...entry,
            managerData: null,
            historyData: null
          };
        }
      })
    );

    // Wait for all manager data
    const managersWithData = await Promise.all(managerPromises);

    // Transform standings with enhanced data
    const transformedStandings = managersWithData.map((entry, index) => {
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
          gwData.managers.push({
            id: manager.entry,
            name: manager.entry_name || manager.player_name,
            managerName: manager.player_name || manager.entry_name,
            teamName: manager.entry_name,
            points: gwHistory.points,
            totalPoints: gwHistory.total_points,
            rank: gwHistory.overall_rank,
            transfers: gwHistory.event_transfers,
            transferCost: gwHistory.event_transfers_cost,
            benchPoints: gwHistory.points_on_bench
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

    // Calculate league statistics
    const leagueStats = {
      averageScore: Math.round(
        transformedStandings.reduce((sum, m) => sum + m.totalPoints, 0) / transformedStandings.length
      ),
      highestTotal: Math.max(...transformedStandings.map(m => m.totalPoints)),
      lowestTotal: Math.min(...transformedStandings.map(m => m.totalPoints)),
      averageGameweekScore: Math.round(
        transformedStandings.reduce((sum, m) => sum + m.gameweekPoints, 0) / transformedStandings.length
      ),
      highestGameweekScore: Math.max(...transformedStandings.map(m => m.gameweekPoints)),
      totalChipsUsed: transformedStandings.reduce((sum, m) => sum + m.chips.length, 0),
      averageTeamValue: Math.round(
        transformedStandings.reduce((sum, m) => sum + m.teamValue, 0) / transformedStandings.length * 10
      ) / 10
    };

    const processingTime = Date.now() - startTime;
    
    const responseData = {
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
        gameweeksAnalyzed: gameweekTable.length,
        dataCompleteness: Math.round(
          (transformedStandings.filter(m => m.hasData).length / transformedStandings.length) * 100
        ),
        cacheEnabled: !!kv
      },
      timestamp: new Date().toISOString(),
      fromCache: false
    };

    // Try to store in cache if KV is available
    if (kv) {
      try {
        await kv.set(cacheKey, responseData, {
          ex: 120 // 2 minutes expiry
        });
        console.log(`✅ Data cached for league ${leagueId}`);
      } catch (cacheError) {
        console.error('Cache write error:', cacheError);
        // Continue without caching
      }
    }

    console.log(`✅ Complete league data processed in ${processingTime}ms`);
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