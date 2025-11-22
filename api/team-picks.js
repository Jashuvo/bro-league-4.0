// api/team-picks.js - COMPLETE FIXED VERSION 
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

    const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

    // Fetch team picks for specific gameweek
    const picksResponse = await fetch(
      `https://fantasy.premierleague.com/api/entry/${managerId}/event/${eventId}/picks/`,
      {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'application/json',
        },
      }
    );

    if (!picksResponse.ok) {
      if (picksResponse.status === 404) {
        return res.status(404).json({ error: 'Picks not found for this gameweek' });
      }
      throw new Error(`FPL Picks API responded with status: ${picksResponse.status}`);
    }

    const picksData = await picksResponse.json();

    // Fetch bootstrap data to get player information
    const bootstrapResponse = await fetch(
      'https://fantasy.premierleague.com/api/bootstrap-static/',
      {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'application/json',
        },
      }
    );

    if (!bootstrapResponse.ok) {
      throw new Error(`FPL Bootstrap API responded with status: ${bootstrapResponse.status}`);
    }

    const bootstrapData = await bootstrapResponse.json();

    // Create player lookup maps
    const playersMap = new Map();
    const teamsMap = new Map();

    // Process bootstrap elements (players)
    if (bootstrapData.elements && Array.isArray(bootstrapData.elements)) {
      bootstrapData.elements.forEach(player => {
        playersMap.set(player.id, {
          id: player.id,
          name: player.web_name,
          fullName: `${player.first_name} ${player.second_name}`,
          team: player.team,
          teamCode: player.team_code,
          position: player.element_type,
          photo: player.photo,
          eventPoints: player.event_points || 0,  // Actual gameweek points
          totalPoints: player.total_points || 0,
          nowCost: player.now_cost,
          status: player.status || 'a',
          chanceOfPlaying: player.chance_of_playing_next_round || 100
        });
      });
    }

    // Process bootstrap teams
    if (bootstrapData.teams && Array.isArray(bootstrapData.teams)) {
      bootstrapData.teams.forEach(team => {
        teamsMap.set(team.id, {
          id: team.id,
          name: team.name,
          shortName: team.short_name,
          code: team.code
        });
      });
    }

    // Map position types
    const positionTypes = {
      1: 'GKP',
      2: 'DEF',
      3: 'MID',
      4: 'FWD'
    };

    // Process picks data with enhanced player information
    const enrichedPicks = [];

    if (picksData.picks && Array.isArray(picksData.picks)) {
      picksData.picks.forEach(pick => {
        const playerInfo = playersMap.get(pick.element) || {};
        const teamInfo = teamsMap.get(playerInfo.team) || {};

        // Calculate actual points with multipliers
        let finalPoints = playerInfo.eventPoints || 0;

        // Apply captain/vice-captain multiplier
        if (pick.multiplier && pick.multiplier > 1) {
          finalPoints *= pick.multiplier;
        }

        const enrichedPick = {
          id: pick.element || 0,
          position: pick.position || 0,
          name: playerInfo.name || 'Unknown',
          fullName: playerInfo.fullName || playerInfo.name || 'Unknown',
          team: teamInfo.shortName || 'UNK',
          teamName: teamInfo.name || 'Unknown',
          positionType: positionTypes[playerInfo.position] || 'UNK',
          isCaptain: Boolean(pick.is_captain),
          isViceCaptain: Boolean(pick.is_vice_captain),
          multiplier: pick.multiplier || 1,
          points: finalPoints,  // FIXED: Now uses actual eventPoints with multiplier
          eventPoints: playerInfo.eventPoints || 0,  // Raw points without multiplier
          totalPoints: playerInfo.totalPoints || 0,
          photo: playerInfo.photo || '',
          nowCost: playerInfo.nowCost || 0,
          status: playerInfo.status || 'a',
          chanceOfPlaying: playerInfo.chanceOfPlaying || 100
        };

        enrichedPicks.push(enrichedPick);
      });
    }

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
        event: entryHistory.event || parseInt(eventId),
        points: entryHistory.points || 0,
        totalPoints: entryHistory.total_points || 0,
        rank: entryHistory.rank || 0,
        overallRank: entryHistory.overall_rank || 0,
        bank: entryHistory.bank || 0,
        value: entryHistory.value || 1000,
        eventTransfers: entryHistory.event_transfers || 0,
        eventTransfersCost: entryHistory.event_transfers_cost || 0,
        pointsOnBench: entryHistory.points_on_bench || 0
      },
      picks: enrichedPicks,
      startingXI: startingXI,
      bench: bench,
      formation: formationString,
      captain: startingXI.find(p => p.isCaptain) || null,
      viceCaptain: startingXI.find(p => p.isViceCaptain) || null
    };

    // Enhanced logging for debugging
    console.log(`✅ Team picks processed for manager ${managerId}, GW${eventId}`);
    console.log(`📊 Points sample: ${startingXI.slice(0, 3).map(p => `${p.name}:${p.points}`).join(', ')}`);
    console.log(`⚡ Bootstrap players found: ${playersMap.size}, teams: ${teamsMap.size}`);

    // Set cache headers
    res.setHeader('Cache-Control', 'public, max-age=120, stale-while-revalidate=300');

    return res.status(200).json({
      success: true,
      data: responseData,
      metadata: {
        playersProcessed: enrichedPicks.length,
        bootstrapPlayers: playersMap.size,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error fetching team picks:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch team picks data',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}