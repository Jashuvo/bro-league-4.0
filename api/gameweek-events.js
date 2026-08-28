// api/gameweek-events.js
//
// A flat "what just happened" feed for one gameweek — goals, assists, own
// goals, penalty misses, red cards and (once final) bonus — sourced from
// `/api/fixtures/?event=N`, whose per-fixture `stats` array carries each
// occurrence keyed by player id. That per-fixture breakdown is never used
// anywhere else in this codebase; the rest of the app only reads the
// aggregated per-player totals from `event/{id}/live/`.
import { fetchWithRetry, setCorsHeaders } from './_lib/helpers.js';

// identifier -> { label, icon key the frontend maps to a doodle, points a
// goal/assist/etc is worth is NOT reconstructed here — this is an events
// feed, not a scorer, so it only reports what happened, not who it swung.
const STAT_META = {
  goals_scored: { label: 'Goal', priority: 0 },
  assists: { label: 'Assist', priority: 1 },
  own_goals: { label: 'Own goal', priority: 2 },
  penalties_missed: { label: 'Penalty missed', priority: 3 },
  red_cards: { label: 'Red card', priority: 4 },
  saves: { label: 'Save', priority: 5, minValue: 3 }, // only worth surfacing in bunches
  bonus: { label: 'Bonus', priority: 6 },
};

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { gameweek } = req.query;

  if (!gameweek) {
    return res.status(400).json({ success: false, error: 'gameweek is required' });
  }

  try {
    const [fixturesResponse, bootstrapResponse] = await Promise.all([
      fetchWithRetry(`https://fantasy.premierleague.com/api/fixtures/?event=${gameweek}`, { timeout: 15000 }),
      fetchWithRetry('https://fantasy.premierleague.com/api/bootstrap-static/', { timeout: 15000 })
    ]);

    if (!fixturesResponse.ok) {
      throw new Error(`FPL Fixtures API responded with status: ${fixturesResponse.status}`);
    }
    if (!bootstrapResponse.ok) {
      throw new Error(`FPL Bootstrap API responded with status: ${bootstrapResponse.status}`);
    }

    const fixtures = await fixturesResponse.json();
    const bootstrap = await bootstrapResponse.json();

    const playerById = new Map((bootstrap.elements || []).map((el) => [el.id, el.web_name]));
    const teamById = new Map((bootstrap.teams || []).map((t) => [t.id, t.short_name]));

    const events = [];

    fixtures.forEach((fixture) => {
      const homeName = teamById.get(fixture.team_h) || 'UNK';
      const awayName = teamById.get(fixture.team_a) || 'UNK';

      (fixture.stats || []).forEach((stat) => {
        const meta = STAT_META[stat.identifier];
        if (!meta) return;

        ['h', 'a'].forEach((side) => {
          (stat[side] || []).forEach((entry) => {
            if (meta.minValue && entry.value < meta.minValue) return;
            events.push({
              fixtureId: fixture.id,
              type: stat.identifier,
              label: meta.label,
              priority: meta.priority,
              playerId: entry.element,
              playerName: playerById.get(entry.element) || 'Unknown',
              value: entry.value,
              team: side === 'h' ? homeName : awayName,
              opponent: side === 'h' ? awayName : homeName,
              finished: fixture.finished
            });
          });
        });
      });
    });

    events.sort((a, b) => a.priority - b.priority || a.fixtureId - b.fixtureId);

    // Live during the gameweek — short cache, matches the rest of the app's
    // live-data TTLs (live-stats.js has none at all; this at least avoids
    // hammering FPL on every render).
    res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');

    return res.status(200).json({
      success: true,
      data: { gameweek: parseInt(gameweek, 10), events }
    });
  } catch (error) {
    console.error('❌ Error fetching gameweek events:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch gameweek events',
      details: error.message
    });
  }
}
