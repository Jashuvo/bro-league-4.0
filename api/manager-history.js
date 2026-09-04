// api/manager-history.js - Vercel Serverless Function for Manager History Data
import { fetchWithRetry, setCorsHeaders, isValidId } from './_lib/helpers.js';
import { kv } from './_lib/kv.js';

export default async function handler(req, res) {
  setCorsHeaders(res);

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { managerId } = req.query;

  if (!isValidId(managerId)) {
    return res.status(400).json({
      success: false,
      error: 'Manager ID is required and must be a positive integer'
    });
  }

  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
  const cacheKey = `fpl:manager-history:${managerId}`;

  try {
    if (kv) {
      try {
        const cached = await kv.get(cacheKey);
        if (cached) return res.status(200).json({ success: true, data: cached, fromCache: true });
      } catch (cacheError) {
        console.error('Manager-history cache read error:', cacheError);
      }
    }

    console.log(`📈 Fetching history for manager ${managerId} server-side...`);

    const response = await fetchWithRetry(
      `https://fantasy.premierleague.com/api/entry/${managerId}/history/`,
      { timeout: 15000 }
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

    const responseData = {
      managerId: parseInt(managerId),
      gameweeks: gameweekHistory,
      chips: chipsUsed,
      seasonHistory: seasonHistory
    };

    if (kv) {
      try {
        // 5 minutes, matching the Cache-Control header above.
        await kv.set(cacheKey, responseData, { ex: 300 });
      } catch (cacheError) {
        console.error('Manager-history cache write error:', cacheError);
      }
    }

    return res.status(200).json({
      success: true,
      data: responseData,
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
