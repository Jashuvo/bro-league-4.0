// api/warm-cache.js - Cron job to keep cache warm
import { fetchWithRetry } from './_lib/helpers.js';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const leagueId = process.env.VITE_FPL_LEAGUE_ID;

  if (!leagueId) {
    return res.status(400).json({
      success: false,
      error: 'VITE_FPL_LEAGUE_ID is not set — nothing to warm the cache for.'
    });
  }

  try {
    // VERCEL_URL is a bare hostname with no protocol — has to be prefixed.
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    // Trigger a cache refresh by calling the main API
    const response = await fetchWithRetry(
      `${baseUrl}/api/league-complete?leagueId=${leagueId}&force=true`,
      { timeout: 55000 },
      0
    );
    
    await response.json();

    console.log('✅ Cache warmed successfully');
    
    return res.status(200).json({
      success: true,
      message: 'Cache warmed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Cache warming failed:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}