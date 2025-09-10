// api/warm-cache.js - Cron job to keep cache warm
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const leagueId = process.env.VITE_FPL_LEAGUE_ID || '1858389';
  
  try {
    // Trigger a cache refresh by calling the main API
    const response = await fetch(
      `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/league-complete?leagueId=${leagueId}&force=true`
    );
    
    const data = await response.json();
    
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