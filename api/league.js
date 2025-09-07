// api/league.js - Vercel Serverless Function for FPL League Data

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
    console.log(`🏆 Fetching league ${leagueId} data server-side...`);
    
    // Fetch league standings
    const standingsResponse = await fetch(
      `https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/`,
      {
        headers: {
          'User-Agent': 'BRO-League-4.0/1.0',
          'Accept': 'application/json',
        },
        timeout: 15000
      }
    );

    if (!standingsResponse.ok) {
      throw new Error(`FPL League API responded with status: ${standingsResponse.status}`);
    }

    const standingsData = await standingsResponse.json();
    
    // Fetch detailed manager data for each entry (parallel requests for better performance)
    const managerPromises = standingsData.standings.results.map(async (entry) => {
      try {
        const managerResponse = await fetch(
          `https://fantasy.premierleague.com/api/entry/${entry.entry}/`,
          {
            headers: {
              'User-Agent': 'BRO-League-4.0/1.0',
              'Accept': 'application/json',
            },
            timeout: 10000
          }
        );

        if (managerResponse.ok) {
          const managerData = await managerResponse.json();
          return {
            ...entry,
            managerData: {
              firstName: managerData.player_first_name || '',
              lastName: managerData.player_last_name || '',
              teamName: managerData.name || entry.entry_name || 'Unknown Team',
              region: managerData.player_region_name || '',
              startedEvent: managerData.started_event || 1,
              overallRank: managerData.summary_overall_rank || 0
            }
          };
        } else {
          return entry; // Return original entry if manager data fetch fails
        }
      } catch (error) {
        console.warn(`⚠️ Failed to fetch manager data for entry ${entry.entry}:`, error);
        return entry; // Return original entry if manager data fetch fails
      }
    });

    // Wait for all manager data to be fetched (with timeout)
    const managersWithData = await Promise.allSettled(managerPromises);
    const processedStandings = managersWithData.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        // Fallback to original entry data
        return standingsData.standings.results[index];
      }
    });

    // Transform the data for the frontend
    const transformedStandings = processedStandings.map((entry, index) => {
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
        overallRank: entry.managerData?.overallRank || 0
      };
    });

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

    console.log(`✅ League data processed successfully - ${transformedStandings.length} managers`);
    
    // Cache for 2 minutes (league data updates more frequently)
    res.setHeader('Cache-Control', 'public, max-age=120, stale-while-revalidate=300');
    
    return res.status(200).json({
      success: true,
      data: {
        league: standingsData.league,
        standings: transformedStandings,
        leagueStats: leagueStats,
        hasNext: standingsData.standings.has_next || false
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching league data:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch FPL league data',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}