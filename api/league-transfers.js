// api/league-transfers.js
//
// Most-transferred-in/out players for ONE gameweek, scoped to just this
// league's managers — not FPL's ~10M-manager global pool. `entry/{id}/transfers/`
// (every transfer a manager has ever made, each carrying which gameweek it
// counted for) has never been called anywhere in this codebase; the only
// transfer figures used elsewhere are per-manager COUNTS
// (event_transfers/event_transfers_cost), never which players moved.
import { fetchWithRetry, setCorsHeaders, ConcurrencyLimiter, isValidId } from './_lib/helpers.js';
import { kv } from './_lib/kv.js';

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { leagueId, gameweek } = req.query;

  if (!isValidId(leagueId) || !isValidId(gameweek)) {
    return res.status(400).json({ success: false, error: 'leagueId and gameweek are required and must be positive integers' });
  }

  const cacheKey = `fpl:league-transfers:${leagueId}:${gameweek}`;

  try {
    if (kv) {
      try {
        const cached = await kv.get(cacheKey);
        if (cached) {
          res.setHeader('Cache-Control', 'public, max-age=600, stale-while-revalidate=1800');
          return res.status(200).json({ success: true, data: cached, fromCache: true });
        }
      } catch (cacheError) {
        console.error('League-transfers cache read error:', cacheError);
      }
    }

    const [standingsResponse, bootstrapResponse] = await Promise.all([
      fetchWithRetry(`https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/`, { timeout: 15000 }),
      fetchWithRetry('https://fantasy.premierleague.com/api/bootstrap-static/', { timeout: 15000 })
    ]);

    if (!standingsResponse.ok) {
      throw new Error(`FPL Standings API responded with status: ${standingsResponse.status}`);
    }
    if (!bootstrapResponse.ok) {
      throw new Error(`FPL Bootstrap API responded with status: ${bootstrapResponse.status}`);
    }

    const standingsData = await standingsResponse.json();
    const bootstrap = await bootstrapResponse.json();

    const playerById = new Map((bootstrap.elements || []).map((el) => [el.id, el.web_name]));
    const teamByPlayerId = new Map((bootstrap.elements || []).map((el) => [el.id, el.team]));
    const teamShortName = new Map((bootstrap.teams || []).map((t) => [t.id, t.short_name]));

    // Same cap as league-complete.js — protects the function's time budget
    // on a large league.
    const MAX_MANAGERS = 30;
    const managers = standingsData.standings.results.slice(0, MAX_MANAGERS);

    const limiter = new ConcurrencyLimiter(3);
    const gwNumber = parseInt(gameweek, 10);

    const perManagerTransfers = await Promise.all(
      managers.map((manager) =>
        limiter.run(async () => {
          try {
            const response = await fetchWithRetry(
              `https://fantasy.premierleague.com/api/entry/${manager.entry}/transfers/`,
              { timeout: 8000 },
              1
            );
            if (!response.ok) return { managerName: manager.player_name, transfers: [] };

            const transfers = await response.json();
            return {
              managerName: manager.player_name,
              transfers: (transfers || []).filter((t) => t.event === gwNumber)
            };
          } catch (error) {
            console.warn(`⚠️ Transfers fetch failed for manager ${manager.entry}:`, error.message);
            return { managerName: manager.player_name, transfers: [] };
          }
        })
      )
    );

    const inCounts = new Map();
    const outCounts = new Map();

    const record = (map, elementId, managerName) => {
      if (!map.has(elementId)) map.set(elementId, { count: 0, managers: [] });
      const entry = map.get(elementId);
      entry.count += 1;
      entry.managers.push(managerName);
    };

    perManagerTransfers.forEach(({ managerName, transfers }) => {
      transfers.forEach((t) => {
        record(inCounts, t.element_in, managerName);
        record(outCounts, t.element_out, managerName);
      });
    });

    const shape = (map) =>
      Array.from(map.entries())
        .map(([elementId, { count, managers: managerNames }]) => ({
          id: elementId,
          name: playerById.get(elementId) || 'Unknown',
          team: teamShortName.get(teamByPlayerId.get(elementId)) || 'UNK',
          count,
          managers: managerNames
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

    // Transfers land continuously through the week, right up to the
    // deadline — a shorter TTL than the global price-watch endpoint,
    // which only changes once a day.
    res.setHeader('Cache-Control', 'public, max-age=600, stale-while-revalidate=1800');

    const responseData = {
      gameweek: gwNumber,
      transfersIn: shape(inCounts),
      transfersOut: shape(outCounts)
    };

    if (kv) {
      try {
        await kv.set(cacheKey, responseData, { ex: 600 });
      } catch (cacheError) {
        console.error('League-transfers cache write error:', cacheError);
      }
    }

    return res.status(200).json({ success: true, data: responseData });
  } catch (error) {
    console.error('❌ Error fetching league transfers:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch league transfers',
      details: error.message
    });
  }
}
