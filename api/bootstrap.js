// api/bootstrap.js - Vercel Serverless Function for FPL Bootstrap Data
import { fetchWithRetry, setCorsHeaders } from './_lib/helpers.js';

export default async function handler(req, res) {
  setCorsHeaders(res);

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔥 Fetching FPL bootstrap data server-side...');

    const response = await fetchWithRetry('https://fantasy.premierleague.com/api/bootstrap-static/', {
      timeout: 15000
    });

    if (!response.ok) {
      throw new Error(`FPL API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Process and optimize the data
    const optimizedData = {
      // Pre-season (before GW1's deadline) has neither is_current nor
      // is_previous set yet — fall back to GW1, not an arbitrary later week.
      currentGameweek: data.events?.find(event => event.is_current)?.id
        || data.events?.find(event => event.is_previous)?.id
        || 1,
      totalGameweeks: data.events?.length || 38,
      gameweeks: data.events?.map(gw => ({
        id: gw.id,
        name: gw.name,
        deadline_time: gw.deadline_time,
        average_entry_score: gw.average_entry_score,
        is_current: gw.is_current,
        is_previous: gw.is_previous,
        is_next: gw.is_next,
        finished: gw.finished
      })) || [],
      teams: data.teams?.map(team => ({
        id: team.id,
        name: team.name,
        short_name: team.short_name,
        code: team.code
      })) || [],
      totalPlayers: data.elements?.length || 0,
      lastUpdated: new Date().toISOString()
    };

    console.log(`✅ Bootstrap data processed successfully - GW${optimizedData.currentGameweek}`);
    
    // Cache for 5 minutes
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    
    return res.status(200).json({
      success: true,
      data: optimizedData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching bootstrap data:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch FPL bootstrap data',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}