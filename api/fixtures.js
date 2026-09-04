// api/fixtures.js
//
// The fixture list + full per-match stat breakdown for one gameweek —
// scores, kickoff times, and (once a match has started) every goal,
// assist, card, save, bonus point and BPS entry, each tagged with which
// player it belongs to. Sourced from `/api/fixtures/?event=N`, whose
// per-fixture `stats` array carries all of that already; bootstrap-static
// resolves player ids to names and team ids to names/crests. Powers the
// Fixtures tab's match list and its per-match detail drill-down.
import { fetchWithRetry, setCorsHeaders, isValidId } from './_lib/helpers.js';
import { kv } from './_lib/kv.js';

// Without this, every single fixtures request (live or long-finished)
// re-fetched the ENTIRE bootstrap-static payload from FPL just to resolve
// player/team names, relying solely on the CDN-level Cache-Control header
// below to avoid redoing that work — which only helps repeat hits on the
// same Vercel edge node, not the first request after it expires. See the
// comment in _lib/kv.js for why this isn't `@vercel/kv`.

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

  if (!isValidId(event)) {
    return res.status(400).json({ success: false, error: 'event (gameweek) is required and must be a positive integer' });
  }

  const cacheKey = `fpl:fixtures:${event}`;

  try {
    if (kv) {
      try {
        const cached = await kv.get(cacheKey);
        if (cached) {
          res.setHeader(
            'Cache-Control',
            cached.finished
              ? 'public, s-maxage=3600, stale-while-revalidate=86400'
              : 'public, s-maxage=30, stale-while-revalidate=60'
          );
          return res.status(200).json({ success: true, data: cached });
        }
      } catch (cacheError) {
        console.error('Fixtures cache read error:', cacheError);
      }
    }

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
    // `finished` only flips once bonus points are officially locked in,
    // which can lag the final whistle by hours. `finishedProvisional`
    // flips the moment each match actually ends, so "every fixture is at
    // least provisionally over" is the right signal for "is this gameweek
    // actually done", as opposed to "has FPL finished processing it".
    const allFinishedProvisional =
      shapedFixtures.length > 0 && shapedFixtures.every((f) => f.finished || f.finishedProvisional);
    res.setHeader(
      'Cache-Control',
      allFinished
        ? 'public, s-maxage=3600, stale-while-revalidate=86400'
        : 'public, s-maxage=30, stale-while-revalidate=60'
    );

    const responseBody = {
      gameweek: parseInt(event, 10),
      deadline_time: gwMeta?.deadline_time || null,
      finished: allFinished,
      finishedProvisional: allFinishedProvisional,
      fixtures: shapedFixtures,
    };

    if (kv) {
      try {
        // Once every fixture is finished this data never changes again —
        // keep it a long time. While live, a short TTL matching the
        // Cache-Control freshness window above so KV never serves scores
        // staler than the header already promises.
        await kv.set(cacheKey, responseBody, { ex: allFinished ? 86400 : 25 });
      } catch (cacheError) {
        console.error('Fixtures cache write error:', cacheError);
      }
    }

    return res.status(200).json({
      success: true,
      data: responseBody
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
