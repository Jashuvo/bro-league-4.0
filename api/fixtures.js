// api/fixtures.js
//
// The fixture list + full per-match stat breakdown for one gameweek —
// scores, kickoff times, and (once a match has started) every goal,
// assist, card, save, bonus point and BPS entry, each tagged with which
// player it belongs to. Sourced from `/api/fixtures/?event=N`, whose
// per-fixture `stats` array carries all of that already; bootstrap-static
// resolves player ids to names and team ids to names/crests. Powers the
// Fixtures tab's match list and its per-match detail drill-down.
import { fetchWithRetry, setCorsHeaders } from './_lib/helpers.js';

// identifier -> the label FPL's own app uses. Order here is the order
// sections render in on the frontend. An identifier FPL adds later that
// isn't in this list still comes through (see the fallback below) rather
// than silently vanishing — just with a less polished label.
const STAT_LABELS = {
  goals_scored: 'Goals scored',
  assists: 'Assists',
  own_goals: 'Own goals',
  penalties_saved: 'Penalties saved',
  penalties_missed: 'Penalties missed',
  yellow_cards: 'Yellow cards',
  red_cards: 'Red cards',
  saves: 'Saves',
  bonus: 'Bonus',
  bps: 'Bonus Points System',
  defensive_contribution: 'Defensive Contribution',
};

const STAT_ORDER = Object.keys(STAT_LABELS);

// "own_goals" -> "Own goals" for anything FPL adds that isn't in
// STAT_LABELS yet.
const humanize = (identifier) =>
  identifier.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

// FPL's own crest CDN — the same one fantasy.premierleague.com itself
// points <img> tags at, keyed by each team's stable `code` (not `id`,
// which is competition-scoped and does change season to season).
const crestUrl = (code) => `https://resources.premierleague.com/premierleague/badges/70/t${code}.png`;

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { event } = req.query;

  if (!event) {
    return res.status(400).json({ success: false, error: 'event (gameweek) is required' });
  }

  try {
    const [fixturesResponse, bootstrapResponse] = await Promise.all([
      fetchWithRetry(`https://fantasy.premierleague.com/api/fixtures/?event=${event}`, { timeout: 15000 }),
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
    const teamById = new Map((bootstrap.teams || []).map((t) => [t.id, t]));

    const toTeam = (id) => {
      const t = teamById.get(id);
      return {
        id,
        name: t?.name || 'Unknown',
        short_name: t?.short_name || '???',
        crest: t ? crestUrl(t.code) : null,
      };
    };

    const shapedFixtures = fixtures
      .map((fixture) => {
        const stats = (fixture.stats || [])
          .map((stat) => ({
            identifier: stat.identifier,
            label: STAT_LABELS[stat.identifier] || humanize(stat.identifier),
            home: (stat.h || []).map((entry) => ({
              playerId: entry.element,
              name: playerById.get(entry.element) || 'Unknown',
              value: entry.value,
            })),
            away: (stat.a || []).map((entry) => ({
              playerId: entry.element,
              name: playerById.get(entry.element) || 'Unknown',
              value: entry.value,
            })),
          }))
          // A category FPL sent with nothing in it either side isn't worth
          // a section on screen.
          .filter((s) => s.home.length > 0 || s.away.length > 0)
          .sort((a, b) => {
            const orderA = STAT_ORDER.indexOf(a.identifier);
            const orderB = STAT_ORDER.indexOf(b.identifier);
            return (orderA === -1 ? STAT_ORDER.length : orderA) - (orderB === -1 ? STAT_ORDER.length : orderB);
          });

        return {
          id: fixture.id,
          kickoff_time: fixture.kickoff_time,
          started: fixture.started,
          finished: fixture.finished,
          finishedProvisional: fixture.finished_provisional,
          minutes: fixture.minutes,
          homeTeam: toTeam(fixture.team_h),
          awayTeam: toTeam(fixture.team_a),
          homeScore: fixture.team_h_score,
          awayScore: fixture.team_a_score,
          stats,
        };
      })
      .sort((a, b) => new Date(a.kickoff_time) - new Date(b.kickoff_time));

    const gwMeta = (bootstrap.events || []).find((e) => e.id === parseInt(event, 10));

    // Live while the gameweek's still in play (matches can update by the
    // minute), much longer once every fixture in it is finished — that
    // data isn't going to change again.
    const allFinished = shapedFixtures.length > 0 && shapedFixtures.every((f) => f.finished);
    res.setHeader(
      'Cache-Control',
      allFinished
        ? 'public, s-maxage=3600, stale-while-revalidate=86400'
        : 'public, s-maxage=30, stale-while-revalidate=60'
    );

    return res.status(200).json({
      success: true,
      data: {
        gameweek: parseInt(event, 10),
        deadline_time: gwMeta?.deadline_time || null,
        finished: allFinished,
        fixtures: shapedFixtures,
      }
    });
  } catch (error) {
    console.error('❌ Error fetching fixtures:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch fixtures',
      details: error.message
    });
  }
}
