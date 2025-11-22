import { kv } from '@vercel/kv';

// Helper for fetch with retry
async function fetchWithRetry(url, options = {}, retries = 2) {
    const timeout = options.timeout || 10000;

    for (let i = 0; i <= retries; i++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
                headers: {
                    'User-Agent': 'BRO-League-4.0/1.0',
                    'Accept': 'application/json',
                    ...options.headers
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok && i < retries) {
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
                continue;
            }

            return response;
        } catch (error) {
            if (i === retries) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
}

// Concurrency limiter
class ConcurrencyLimiter {
    constructor(maxConcurrent) {
        this.maxConcurrent = maxConcurrent;
        this.running = 0;
        this.queue = [];
    }

    async run(fn) {
        while (this.running >= this.maxConcurrent) {
            await new Promise(resolve => this.queue.push(resolve));
        }

        this.running++;
        try {
            return await fn();
        } finally {
            this.running--;
            const resolve = this.queue.shift();
            if (resolve) resolve();
        }
    }
}

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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
            `https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/`
        );

        if (!standingsResponse.ok) {
            throw new Error('Failed to fetch league standings');
        }

        const standingsData = await standingsResponse.json();
        // Limit to top 50 to avoid timeouts
        const managers = standingsData.standings.results.slice(0, 50);

        // 2. Fetch Live Stats for the Gameweek
        const liveStatsResponse = await fetchWithRetry(
            `https://fantasy.premierleague.com/api/event/${gameweek}/live/`
        );

        if (!liveStatsResponse.ok) {
            throw new Error('Failed to fetch live stats');
        }

        const liveStatsData = await liveStatsResponse.json();
        const elements = liveStatsData.elements; // Array of player stats

        // Helper to get player stats by ID
        const getPlayerStats = (id) => elements.find(e => e.id === id)?.stats;

        // 3. Fetch Picks for each manager (Concurrent)
        const limiter = new ConcurrencyLimiter(5); // 5 concurrent requests

        const managerPromises = managers.map(manager =>
            limiter.run(async () => {
                try {
                    const picksResponse = await fetchWithRetry(
                        `https://fantasy.premierleague.com/api/entry/${manager.entry}/event/${gameweek}/picks/`
                    );

                    if (!picksResponse.ok) return null;

                    const picksData = await picksResponse.json();
                    const activeChip = picksData.active_chip; // '3xc', 'bboost', 'freehit', 'wildcard'

                    let totalPoints = 0;
                    let captainId = null;
                    let viceCaptainId = null;
                    let captainMultiplier = 1;

                    // Calculate points
                    const picksWithPoints = picksData.picks.map(pick => {
                        const stats = getPlayerStats(pick.element);
                        let points = stats ? stats.total_points : 0;

                        // Handle Captain/Vice Captain
                        if (pick.is_captain) {
                            captainId = pick.element;
                            captainMultiplier = pick.multiplier;
                            points *= pick.multiplier;
                        } else if (pick.is_vice_captain) {
                            viceCaptainId = pick.element;
                        }

                        return {
                            ...pick,
                            points,
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
