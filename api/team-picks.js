// api/team-picks.js - FIXED VERSION (Points Issue Resolved)
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

  const { managerId, eventId } = req.query;
  
  if (!managerId || !eventId) {
    return res.status(400).json({ 
      success: false, 
      error: 'Manager ID and Event ID are required' 
    });
  }

  try {
    console.log(`⚽ Fetching team picks for manager ${managerId}, GW${eventId}...`);
    
    // Fetch team picks for specific gameweek
    const picksResponse = await fetch(
      `https://fantasy.premierleague.com/api/entry/${managerId}/event/${eventId}/picks/`,
      {
        headers: {
          'User-Agent': 'BRO-League-4.0/1.0',
          'Accept': 'application/json',
        },
        timeout: 15000
      }
    );

    if (!picksResponse.ok) {
      throw new Error(`FPL Picks API responded with status: ${picksResponse.status}`);
    }

    const picksData = await picksResponse.json();
    
    // Fetch bootstrap data to get player information
    const bootstrapResponse = await fetch(
      'https://fantasy.premierleague.com/api/bootstrap-static/',
      {
        headers: {
          'User-Agent': 'BRO-League-4.0/1.0',
          'Accept': 'application/json',
        },
        timeout: 15000
      }
    );

    if (!bootstrapResponse.ok) {
      throw new Error(`FPL Bootstrap API responded with status: ${bootstrapResponse.status}`);
    }

    const bootstrapData = await bootstrapResponse.json();
    
    // Create player lookup maps
    const playersMap = new Map();
    const teamsMap = new Map();
    
    bootstrapData.elements?.forEach(player => {
      playersMap.set(player.id, {
        id: player.id,
        name: player.web_name,
        fullName: `${player.first_name} ${player.second_name}`,
        team: player.team,
        teamCode: player.team_code,
        position: player.element_type,
        photo: player.photo,
        eventPoints: player.event_points || 0,  // Current gameweek points
        totalPoints: player.total_points || 0,
        nowCost: player.now_cost,
        status: player.status,
        chanceOfPlaying: player.chance_of_playing_next_round
      });
    });
    
    bootstrapData.teams?.forEach(team => {
      teamsMap.set(team.id, {
        id: team.id,
        name: team.name,
        shortName: team.short_name,
        code: team.code
      });
    });
    
    // Map position types
    const positionTypes = {
      1: 'GKP',
      2: 'DEF', 
      3: 'MID',
      4: 'FWD'
    };
    
    // Process picks data with player information
    const enrichedPicks = picksData.picks?.map(pick => {
      const playerInfo = playersMap.get(pick.element) || {};
      const teamInfo = teamsMap.get(playerInfo.team) || {};
      
      // FIXED: Use eventPoints from bootstrap data instead of pick.points
      let playerPoints = playerInfo.eventPoints || 0;
      
      // Apply captain/vice-captain multiplier
      if (pick.multiplier > 1) {
        playerPoints *= pick.multiplier;
      }
      
      return {
        id: pick.element,
        position: pick.position,
        name: playerInfo.name || 'Unknown',
        fullName: playerInfo.fullName || playerInfo.name || 'Unknown',
        team: teamInfo.shortName || 'UNK',
        teamName: teamInfo.name || 'Unknown',
        positionType: positionTypes[playerInfo.position] || 'UNK',
        isCaptain: pick.is_captain,
        isViceCaptain: pick.is_vice_captain,
        multiplier: pick.multiplier,
        points: playerPoints,  // FIXED: Now uses actual gameweek points with multiplier
        eventPoints: playerInfo.eventPoints || 0,  // Raw points without multiplier
        photo: playerInfo.photo,
        nowCost: playerInfo.nowCost,
        status: playerInfo.status,
        chanceOfPlaying: playerInfo.chanceOfPlaying
      };
    }) || [];
    
    // Separate starting XI and bench
    const startingXI = enrichedPicks.slice(0, 11);
    const bench = enrichedPicks.slice(11, 15);
    
    // Get formation from starting XI
    const formation = {
      gkp: startingXI.filter(p => p.positionType === 'GKP').length,
      def: startingXI.filter(p => p.positionType === 'DEF').length,
      mid: startingXI.filter(p => p.positionType === 'MID').length,
      fwd: startingXI.filter(p => p.positionType === 'FWD').length
    };
    
    const formationString = `${formation.def}-${formation.mid}-${formation.fwd}`;
    
    // Process entry history
    const entryHistory = picksData.entry_history || {};
    
    // Build response
    const responseData = {
      managerId: parseInt(managerId),
      eventId: parseInt(eventId),
      activeChip: picksData.active_chip || null,
      automaticSubs: picksData.automatic_subs || [],
      entryHistory: {
        event: entryHistory.event,
        points: entryHistory.points || 0,
        totalPoints: entryHistory.total_points || 0,
        rank: entryHistory.rank || 0,
        overallRank: entryHistory.overall_rank || 0,
        bank: entryHistory.bank || 0,
        value: entryHistory.value || 0,
        eventTransfers: entryHistory.event_transfers || 0,
        eventTransfersCost: entryHistory.event_transfers_cost || 0,
        pointsOnBench: entryHistory.points_on_bench || 0
      },
      picks: enrichedPicks,
      startingXI: startingXI,
      bench: bench,
      formation: formationString,
      captain: startingXI.find(p => p.isCaptain),
      viceCaptain: startingXI.find(p => p.isViceCaptain)
    };

    console.log(`✅ Team picks processed successfully for manager ${managerId}, GW${eventId}`);
    console.log(`📊 Sample player points: ${startingXI.slice(0, 3).map(p => `${p.name}: ${p.points}`).join(', ')}`);
    
    // Cache for 2 minutes
    res.setHeader('Cache-Control', 'public, max-age=120, stale-while-revalidate=300');
    
    return res.status(200).json({
      success: true,
      data: responseData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching team picks:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch team picks data',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}