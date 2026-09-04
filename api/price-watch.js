// api/price-watch.js
//
// Player price movement — `cost_change_event` (today's rise/fall, in 0.1m
// steps) and `cost_change_start` (season-to-date). Both sit on every
// element in bootstrap-static and had never been read anywhere in this
// codebase. This reshapes just the movers into a small payload rather than
// shipping all ~700 players to the client.
//
// Most-transferred-in/out used to live here too, sourced from
// `transfers_in_event`/`transfers_out_event` — but those are FPL-wide
// counts across ~10M managers, which drowns out anything specific to an
// 18-manager private league. That's api/league-transfers.js now, scoped to
// just this league's managers.
import { fetchWithRetry, setCorsHeaders } from './_lib/helpers.js';
import { kv } from './_lib/kv.js';

const CACHE_KEY = 'fpl:price-watch';

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Price changes land once a day (~1:30am UK) — no need to hit FPL again
  // until the next one plausibly could have happened.
  res.setHeader('Cache-Control', 'public, max-age=1800, stale-while-revalidate=3600');

  try {
    if (kv) {
      try {
        const cached = await kv.get(CACHE_KEY);
        if (cached) return res.status(200).json({ success: true, data: cached, fromCache: true });
      } catch (cacheError) {
        console.error('Price-watch cache read error:', cacheError);
      }
    }

    const response = await fetchWithRetry('https://fantasy.premierleague.com/api/bootstrap-static/', {
      timeout: 15000
    });

    if (!response.ok) {
      throw new Error(`FPL Bootstrap API responded with status: ${response.status}`);
    }

    const data = await response.json();

    const teamsMap = new Map((data.teams || []).map((t) => [t.id, t.short_name]));

    const elements = data.elements || [];

    const shaped = elements
      .filter((el) => (el.cost_change_event || 0) !== 0)
      .map((el) => ({
        id: el.id,
        name: el.web_name,
        team: teamsMap.get(el.team) || 'UNK',
        nowCost: el.now_cost / 10,
        changeToday: el.cost_change_event / 10,
        changeSeason: el.cost_change_start / 10,
        selectedByPercent: Number(el.selected_by_percent) || 0,
        totalPoints: el.total_points || 0
      }));

    const risers = shaped
      .filter((p) => p.changeToday > 0)
      .sort((a, b) => b.changeToday - a.changeToday || b.selectedByPercent - a.selectedByPercent)
      .slice(0, 8);

    const fallers = shaped
      .filter((p) => p.changeToday < 0)
      .sort((a, b) => a.changeToday - b.changeToday || b.selectedByPercent - a.selectedByPercent)
      .slice(0, 8);

    const responseData = { risers, fallers, asOf: new Date().toISOString() };

    if (kv) {
      try {
        await kv.set(CACHE_KEY, responseData, { ex: 1800 });
      } catch (cacheError) {
        console.error('Price-watch cache write error:', cacheError);
      }
    }

    return res.status(200).json({ success: true, data: responseData });
  } catch (error) {
    console.error('❌ Error fetching price watch:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch price movement',
      details: error.message
    });
  }
}
