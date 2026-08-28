// api/price-watch.js
//
// Player price movement — `cost_change_event` (today's rise/fall, in 0.1m
// steps) and `cost_change_start` (season-to-date) — plus this gameweek's
// most-transferred-in/out players (`transfers_in_event`/
// `transfers_out_event`). All four sit on every element in bootstrap-static
// and none had ever been read anywhere in this codebase. This reshapes just
// the movers into a small payload rather than shipping all ~700 players to
// the client.
import { fetchWithRetry, setCorsHeaders } from './_lib/helpers.js';

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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

    const transfersIn = [...elements]
      .filter((el) => (el.transfers_in_event || 0) > 0)
      .sort((a, b) => b.transfers_in_event - a.transfers_in_event)
      .slice(0, 8)
      .map((el) => ({
        id: el.id,
        name: el.web_name,
        team: teamsMap.get(el.team) || 'UNK',
        count: el.transfers_in_event
      }));

    const transfersOut = [...elements]
      .filter((el) => (el.transfers_out_event || 0) > 0)
      .sort((a, b) => b.transfers_out_event - a.transfers_out_event)
      .slice(0, 8)
      .map((el) => ({
        id: el.id,
        name: el.web_name,
        team: teamsMap.get(el.team) || 'UNK',
        count: el.transfers_out_event
      }));

    // Price changes land once a day (~1:30am UK); transfer counts move all
    // week, right up to the deadline, so this is a compromise rather than a
    // perfect cache window for that half of the payload — see fplApi.js's
    // getPriceWatch() for the matching client-side TTL and why it's set
    // where it is.
    res.setHeader('Cache-Control', 'public, max-age=1800, stale-while-revalidate=3600');

    return res.status(200).json({
      success: true,
      data: { risers, fallers, transfersIn, transfersOut, asOf: new Date().toISOString() }
    });
  } catch (error) {
    console.error('❌ Error fetching price watch:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch price movement',
      details: error.message
    });
  }
}
