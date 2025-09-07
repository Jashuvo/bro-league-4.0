// api/league-complete.js - Complete League Data with Optimized Performance

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { leagueId } = req.query;
  
  if (!leagueId) {
    return res.status(400).json({ 
      success: false, 
      error: 'League ID is required' 
    });
  }

  try {
    console.log(`🚀 Fetching complete league ${leagueId} data server-side...`);
    const startTime = Date.now();
    
    // Fetch bootstrap data and league standings in parallel
    const [bootstrapResponse, standingsResponse] = await Promise.all([
      fetch('https://fantasy.premierleague.com/api/bootstrap-static/', {
        headers: { 'User-Agent': 'BRO-League-4.0/1.0' },
        timeout: 15000
      }),
      fetch(`https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/`, {
        headers: { 'User-Agent': 'BRO-League-4.0/1.0' },
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
    const currentGameweek = bootstrapData.events?.find(event => event.is_current)?.id || 3;
    const optimizedBootstrap = {
      currentGameweek,
      totalGameweeks: bootstrapData.events?.length || 38,
      gameweeks: bootstrapData.events?.map(gw => ({
        id: gw.id,
        name: gw.name,
        deadline_time: gw.deadline_time,
        average_entry_score: gw.average_entry_score,
        is_current: gw.is_current,
        finished: gw.finished
      })) || []
    };

    // Fetch manager data and history in parallel (limited to improve performance)
    const managerPromises = standingsData.standings.results.slice(0, 20).map(async (entry) => {
      try {
        const [managerResponse, historyResponse] = await Promise.all([
          fetch(`https://fantasy.premierleague.com/api/entry/${entry.entry}/`, {
            headers: { 'User-Agent': 'BRO-League-4.0/1.0' },
            timeout: 10000
          }),
          fetch(`https://fantasy.premierleague.com/api/entry/${entry.entry}/history/`, {
            headers: { 'User-Agent': 'BRO-League-4.0/1.0' },
            timeout: 10000
          })
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
            overallRank: manager.summary_overall_rank || 0
          };
        }

        if (historyResponse.ok) {
          const history = await historyResponse.json();
          // Only get current season gameweeks (optimize data transfer)
          historyData = history.current?.slice(0, currentGameweek).map(gw => ({
            gameweek: gw.event,
            points: gw.points,
            totalPoints: gw.total_points,
            transfers: gw.event_transfers,
            transferCost: gw.event_transfers_cost
          })) || [];
        }

        return {
          ...entry,
          managerData,
          historyData
        };
      } catch (error) {
        console.warn(`⚠️ Failed to fetch data for manager ${entry.entry}:`, error);
        return entry;
      }
    });

    // Wait for all manager data (with timeout)
    const managersWithData = await Promise.allSettled(managerPromises);
    const processedManagers = managersWithData.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return standingsData.standings.results[index];
      }
    });

    // Transform standings data
    const transformedStandings = processedManagers.map((entry, index) => {
      const managerName = entry.managerData 
        ? `${entry.managerData.firstName} ${entry.managerData.lastName}`.trim() || `Manager ${entry.entry}`
        : `Manager ${entry.entry}`;

      const teamName = entry.managerData?.teamName || entry.entry_name || 'Unknown Team';

      return {
        id: entry.entry,
        managerName: managerName,
        teamName: teamName,
        totalPoints: entry.total,
        gameweekPoints: entry.event_total || 0,
        rank: index + 1,
        lastRank: entry.last_rank,
        avatar: entry.managerData 
          ? `${entry.managerData.firstName?.charAt(0) || 'M'}${entry.managerData.lastName?.charAt(0) || ''}` 
          : `M${entry.entry.toString().slice(-1)}`,
        region: entry.managerData?.region || '',
        startedEvent: entry.managerData?.startedEvent || 1,
        overallRank: entry.managerData?.overallRank || 0,
        historyData: entry.historyData || []
      };
    });

    // Generate optimized gameweek table
    const gameweekTable = [];
    for (let gw = 1; gw <= Math.min(currentGameweek, 10); gw++) {
      const gwData = {
        gameweek: gw,
        managers: []
      };

      transformedStandings.forEach(manager => {
        const gwHistory = manager.historyData?.find(h => h.gameweek === gw);
        if (gwHistory) {
          gwData.managers.push({
            id: manager.id,
            name: manager.managerName,
            teamName: manager.teamName,
            points: gwHistory.points,
            totalPoints: gwHistory.totalPoints,
            transfers: gwHistory.transfers,
            transferCost: gwHistory.transferCost
          });
        }
      });

      // Sort by points for this gameweek
      gwData.managers.sort((a, b) => b.points - a.points);
      gwData.winner = gwData.managers[0] || null;
      
      if (gwData.managers.length > 0) {
        gameweekTable.push(gwData);
      }
    }

    // Calculate league statistics
    const leagueStats = {
      totalManagers: transformedStandings.length,
      averageScore: Math.round(transformedStandings.reduce((sum, m) => sum + m.totalPoints, 0) / transformedStandings.length),
      highestTotal: Math.max(...transformedStandings.map(m => m.totalPoints)),
      averageGameweek: Math.round(transformedStandings.reduce((sum, m) => sum + m.gameweekPoints, 0) / transformedStandings.length),
      highestGameweek: Math.max(...transformedStandings.map(m => m.gameweekPoints)),
      veteranManagers: transformedStandings.filter(m => m.startedEvent === 1).length,
      newManagers: transformedStandings.filter(m => m.startedEvent > 1).length
    };

    const processingTime = Date.now() - startTime;
    console.log(`✅ Complete league data processed in ${processingTime}ms - ${transformedStandings.length} managers`);
    
    // Cache for 2 minutes
    res.setHeader('Cache-Control', 'public, max-age=120, stale-while-revalidate=300');
    
    return res.status(200).json({
      success: true,
      data: {
        authenticated: true,
        bootstrap: optimizedBootstrap,
        league: standingsData.league,
        standings: transformedStandings,
        gameweekTable: gameweekTable,
        leagueStats: leagueStats
      },
      performance: {
        processingTime: `${processingTime}ms`,
        managersProcessed: transformedStandings.length,
        gameweeksAnalyzed: gameweekTable.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching complete league data:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch complete league data',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}