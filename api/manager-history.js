// api/manager-history.js - Vercel Serverless Function for Manager History Data

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

  const { managerId } = req.query;
  
  if (!managerId) {
    return res.status(400).json({ 
      success: false, 
      error: 'Manager ID is required' 
    });
  }

  try {
    console.log(`📈 Fetching history for manager ${managerId} server-side...`);
    
    const response = await fetch(
      `https://fantasy.premierleague.com/api/entry/${managerId}/history/`,
      {
        headers: {
          'User-Agent': 'BRO-League-4.0/1.0',
          'Accept': 'application/json',
        },
        timeout: 15000
      }
    );

    if (!response.ok) {
      throw new Error(`FPL Manager History API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Process gameweek history
    const gameweekHistory = data.current?.map(gw => ({
      gameweek: gw.event,
      points: gw.points,
      totalPoints: gw.total_points,
      rank: gw.overall_rank,
      gameweekRank: gw.rank,
      transfers: gw.event_transfers,
      transferCost: gw.event_transfers_cost,
      bench: gw.points_on_bench,
      value: gw.value / 10, // Convert from pence to pounds
      bankBalance: gw.bank / 10 // Convert from pence to pounds
    })) || [];

    // Process chips used
    const chipsUsed = data.chips?.map(chip => ({
      name: chip.name,
      gameweek: chip.event,
      time: chip.time
    })) || [];

    // Process season history
    const seasonHistory = data.past?.map(season => ({
      season: season.season_name,
      totalPoints: season.total_points,
      rank: season.rank
    })) || [];

    console.log(`✅ Manager history processed - ${gameweekHistory.length} gameweeks`);
    
    // Cache for 5 minutes (history data doesn't change often)
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    
    return res.status(200).json({
      success: true,
      data: {
        managerId: parseInt(managerId),
        gameweeks: gameweekHistory,
        chips: chipsUsed,
        seasonHistory: seasonHistory
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching manager history:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch manager history',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}