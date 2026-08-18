import { fetchWithRetry, setCorsHeaders, ConcurrencyLimiter } from './_lib/helpers.js';

export default async function handler(req, res) {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { leagueId, gameweek } = req.query;

    if (!leagueId || !gameweek) {
        return res.status(400).json({ error: 'League ID and Gameweek are required' });
    }

    try {
        // 1. Fetch League Standings (to get manager IDs)
        const standingsResponse = await fetchWithRetry(
            `https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/`,
            {},
            1
        );

        if (!standingsResponse.ok) {
            throw new Error('Failed to fetch league standings');
        }

        const standingsData = await standingsResponse.json();
        // Capped well under the 60s function budget: with a 5-wide
        // concurrency limit and a single-attempt 8s picks fetch per manager,
        // 30 managers is ~48s worst case. Raise cautiously if this league
        // ever grows past that.
        const MAX_MANAGERS = 30;
        const managers = standingsData.standings.results.slice(0, MAX_MANAGERS);

        // 2. Fetch Live Stats for the Gameweek + bootstrap (for player names —
        // the live/ endpoint only returns stats keyed by player ID, no names)
        const [liveStatsResponse, bootstrapResponse] = await Promise.all([
            fetchWithRetry(`https://fantasy.premierleague.com/api/event/${gameweek}/live/`, {}, 1),
            fetchWithRetry('https://fantasy.premierleague.com/api/bootstrap-static/', {}, 1)
        ]);

        if (!liveStatsResponse.ok) {
            throw new Error('Failed to fetch live stats');
        }

        const liveStatsData = await liveStatsResponse.json();
        const elements = liveStatsData.elements; // Array of player stats

        // Player id -> { name, positionType } lookup, built once and reused
        // for every manager's picks below. Falls back to an empty map if
        // bootstrap failed — player names just won't be shown, nothing else
        // breaks.
        const playerInfoMap = new Map();
        if (bootstrapResponse.ok) {
            const bootstrapData = await bootstrapResponse.json();
            const positionTypes = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' };
            (bootstrapData.elements || []).forEach((el) => {
                playerInfoMap.set(el.id, {
                    name: el.web_name,
                    positionType: positionTypes[el.element_type] || 'UNK'
                });
            });
        }

        // Helper to get player stats by ID
        const getPlayerStats = (id) => elements.find(e => e.id === id)?.stats;

        // 3. Fetch Picks for each manager (Concurrent)
        const limiter = new ConcurrencyLimiter(5); // 5 concurrent requests

        const managerPromises = managers.map(manager =>
            limiter.run(async () => {
                try {
                    // No retries here on purpose — this is fanned out over
                    // every manager, so a retry per manager is what turns a
                    // slow FPL API into a 60s-function timeout.
                    const picksResponse = await fetchWithRetry(
                        `https://fantasy.premierleague.com/api/entry/${manager.entry}/event/${gameweek}/picks/`,
                        { timeout: 8000 },
                        0
                    );

                    if (!picksResponse.ok) return null;

                    const picksData = await picksResponse.json();
                    const activeChip = picksData.active_chip; // '3xc', 'bboost', 'freehit', 'wildcard'

                    // Calculate points
                    const picksWithPoints = picksData.picks.map(pick => {
                        const stats = getPlayerStats(pick.element);
                        const playerInfo = playerInfoMap.get(pick.element);
                        let points = stats ? stats.total_points : 0;

                        // Captain's score counts double (multiplier is 2, or
                        // 3 with Triple Captain) — vice-captain is already
                        // carried through via the `...pick` spread below.
                        if (pick.is_captain) {
                            points *= pick.multiplier;
                        }

                        return {
                            ...pick,
                            name: playerInfo?.name || 'Unknown',
                            positionType: playerInfo?.positionType || 'UNK',
                            points,
                            bonus: stats?.bonus || 0,
                            bps: stats?.bps || 0,
                            stats
                        };
                    });

                    // Filter starting XI (positions 1-11) unless Bench Boost is active
                    // Note: API positions are 1-15. 1-11 are starters, 12-15 are bench.
                    // If Bench Boost is active, all 15 count.

                    let liveScore = 0;

                    if (activeChip === 'bboost') {
                        liveScore = picksWithPoints.reduce((sum, p) => sum + p.points, 0);
                    } else {
                        // Sum only starters (1-11)
                        // However, auto-subs happen later. For "Live" score, we usually just show starters + captain.
                        // Auto-sub logic is complex to replicate exactly live. 
                        // Standard "Live" usually just sums current starters.
                        liveScore = picksWithPoints
                            .filter(p => p.position <= 11)
                            .reduce((sum, p) => sum + p.points, 0);
                    }

                    // Deduct transfer hits
                    const transferCost = picksData.entry_history.event_transfers_cost || 0;
                    const netScore = liveScore - transferCost;

                    return {
                        id: manager.entry,
                        name: manager.player_name,
                        teamName: manager.entry_name,
                        livePoints: netScore,
                        rawPoints: liveScore,
                        transferCost: transferCost,
                        activeChip: activeChip,
                        picks: picksWithPoints
                    };

                } catch (e) {
                    console.error(`Error fetching for ${manager.entry}:`, e);
                    return null;
                }
            })
        );

        const results = (await Promise.all(managerPromises)).filter(Boolean);

        // Sort by live points
        results.sort((a, b) => b.livePoints - a.livePoints);

        return res.status(200).json({
            success: true,
            gameweek: parseInt(gameweek),
            managers: results,
            timestamp: Date.now()
        });

    } catch (error) {
        console.error('Live stats error:', error);
        return res.status(500).json({ error: 'Failed to fetch live stats' });
    }
}
