// api/fixture-alerts.js
//
// Blank and double gameweeks — the single most-planned-around thing in real
// FPL, and something this codebase has never touched: `/api/fixtures/` (the
// full-season list, with each fixture's `event`/`team_h`/`team_a`) isn't
// called anywhere else here. This counts fixtures per team per gameweek and
// flags any gameweek where a team has zero (blank) or two-plus (double).
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
    const [fixturesResponse, bootstrapResponse] = await Promise.all([
      fetchWithRetry('https://fantasy.premierleague.com/api/fixtures/', { timeout: 15000 }),
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

    const teams = bootstrap.teams || [];
    const teamNameById = new Map(teams.map((t) => [t.id, t.short_name]));
    const allTeamIds = teams.map((t) => t.id);

    const currentEvent = bootstrap.events?.find((e) => e.is_current)?.id
      || bootstrap.events?.find((e) => e.is_next)?.id
      || 1;

    // event -> teamId -> fixture count. Only counts fixtures FPL has already
    // assigned to a gameweek — postponed fixtures (`event: null`) are
    // deliberately excluded rather than guessed at.
    const countsByEvent = new Map();
    fixtures.forEach((f) => {
      if (!f.event) return;
      if (!countsByEvent.has(f.event)) countsByEvent.set(f.event, new Map());
      const counts = countsByEvent.get(f.event);
      counts.set(f.team_h, (counts.get(f.team_h) || 0) + 1);
      counts.set(f.team_a, (counts.get(f.team_a) || 0) + 1);
    });

    const alerts = [];
    Array.from(countsByEvent.keys())
      .sort((a, b) => a - b)
      .forEach((event) => {
        const counts = countsByEvent.get(event);
        const blanks = allTeamIds.filter((id) => !counts.get(id)).map((id) => teamNameById.get(id));
        const doubles = allTeamIds.filter((id) => (counts.get(id) || 0) >= 2).map((id) => teamNameById.get(id));
        if (blanks.length > 0 || doubles.length > 0) {
          alerts.push({ event, blanks, doubles });
        }
      });

    // Fixtures do get reshuffled (postponements, cup-replay clashes) —
    // stale-while-revalidate keeps this cheap without risking a stale alert
    // sitting for hours after a reschedule.
    res.setHeader('Cache-Control', 'public, max-age=1800, stale-while-revalidate=3600');

    return res.status(200).json({
      success: true,
      data: { currentEvent, alerts }
    });
  } catch (error) {
    console.error('❌ Error fetching fixture alerts:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch fixture alerts',
      details: error.message
    });
  }
}
