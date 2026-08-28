// api/team-picks.js - COMPLETE FIXED VERSION
import { fetchWithRetry, setCorsHeaders } from './_lib/helpers.js';

export default async function handler(req, res) {
  setCorsHeaders(res);

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { managerId, eventId } = req.query;

  if (!managerId || !eventId) {
    return res.status(400).json({
      success: false,
      error: 'Manager ID and Event ID are required'
    });
  }

  try {
    console.log(`⚽ Fetching team picks for manager ${managerId}, GW${eventId}...`);

    // Fetch team picks for specific gameweek
    const picksResponse = await fetchWithRetry(
      `https://fantasy.premierleague.com/api/entry/${managerId}/event/${eventId}/picks/`,
      { timeout: 10000 },
      1 // fewer retries — a 404 here (picks not in yet) is a real answer, not a transient failure
    );

    if (!picksResponse.ok) {
      if (picksResponse.status === 404) {
        return res.status(404).json({ error: 'Picks not found for this gameweek' });
      }
      throw new Error(`FPL Picks API responded with status: ${picksResponse.status}`);
    }

    const picksData = await picksResponse.json();

    // Fetch bootstrap data (player names/positions/teams — season-level
    // metadata) and this gameweek's live stats (actual points for THIS
    // event) in parallel. Player points must come from event/{id}/live/,
    // never from bootstrap-static's elements[].event_points: that field
    // only ever reflects whatever gameweek FPL currently considers
    // "current" — it reads as 0 for every player once viewing any other
    // gameweek (a past one, or the current one after FPL's is_current
    // pointer has already rolled over to the next event but this app's
    // own state hasn't caught up yet), which is exactly the "every
    // player shows 0 but the team total is correct" bug this used to have.
    const [bootstrapResponse, liveResponse] = await Promise.all([
      fetchWithRetry('https://fantasy.premierleague.com/api/bootstrap-static/', { timeout: 15000 }),
      fetchWithRetry(`https://fantasy.premierleague.com/api/event/${eventId}/live/`, { timeout: 15000 }, 1)
    ]);

    if (!bootstrapResponse.ok) {
      throw new Error(`FPL Bootstrap API responded with status: ${bootstrapResponse.status}`);
    }

    const bootstrapData = await bootstrapResponse.json();
    // A live/ 404 (gameweek far enough in the future that FPL has no row
    // for it yet) shouldn't fail the whole request — every player just
    // scores 0, same as before a gameweek's matches kick off.
    const liveData = liveResponse.ok ? await liveResponse.json() : { elements: [] };

    // Live per-player stats for this exact gameweek, keyed by player id.
    const liveStatsMap = new Map();
    (liveData.elements || []).forEach((el) => {
      liveStatsMap.set(el.id, el.stats || {});
    });

    // Create player lookup maps
    const playersMap = new Map();
    const teamsMap = new Map();

    // Process bootstrap elements (players) — metadata only, no points.
    if (bootstrapData.elements && Array.isArray(bootstrapData.elements)) {
      bootstrapData.elements.forEach(player => {
        playersMap.set(player.id, {
          id: player.id,
          name: player.web_name,
          fullName: `${player.first_name} ${player.second_name}`,
          team: player.team,
          teamCode: player.team_code,
          position: player.element_type,
          photo: player.photo,
          totalPoints: player.total_points || 0,
          nowCost: player.now_cost,
          status: player.status || 'a',
          chanceOfPlaying: player.chance_of_playing_next_round || 100,
          // Season-level context for the player-detail panel — none of
          // this was read anywhere in this codebase before now, it's all
          // sitting on the same bootstrap element already fetched above.
          news: player.news || '',
          form: player.form || '0.0',
          selectedByPercent: player.selected_by_percent || '0.0',
          pointsPerGame: player.points_per_game || '0.0',
          goalsScored: player.goals_scored || 0,
          assists: player.assists || 0,
          cleanSheets: player.clean_sheets || 0,
          bonusSeason: player.bonus || 0,
          minutesSeason: player.minutes || 0
        });
      });
    }

    // Process bootstrap teams
    if (bootstrapData.teams && Array.isArray(bootstrapData.teams)) {
      bootstrapData.teams.forEach(team => {
        teamsMap.set(team.id, {
          id: team.id,
          name: team.name,
          shortName: team.short_name,
          code: team.code
        });
      });
    }

    // Map position types
    const positionTypes = {
      1: 'GKP',
      2: 'DEF',
      3: 'MID',
      4: 'FWD'
    };

    // Process picks data with enhanced player information
    const enrichedPicks = [];

    if (picksData.picks && Array.isArray(picksData.picks)) {
      picksData.picks.forEach(pick => {
        const playerInfo = playersMap.get(pick.element) || {};
        const teamInfo = teamsMap.get(playerInfo.team) || {};
        const liveStats = liveStatsMap.get(pick.element) || {};
        const eventPoints = liveStats.total_points || 0;

        // Calculate actual points with multipliers
        let finalPoints = eventPoints;

        // Apply captain/vice-captain multiplier
        if (pick.multiplier && pick.multiplier > 1) {
          finalPoints *= pick.multiplier;
        }

        const enrichedPick = {
          id: pick.element || 0,
          position: pick.position || 0,
          name: playerInfo.name || 'Unknown',
          fullName: playerInfo.fullName || playerInfo.name || 'Unknown',
          team: teamInfo.shortName || 'UNK',
          teamName: teamInfo.name || 'Unknown',
          positionType: positionTypes[playerInfo.position] || 'UNK',
          isCaptain: Boolean(pick.is_captain),
          isViceCaptain: Boolean(pick.is_vice_captain),
          multiplier: pick.multiplier || 1,
          points: finalPoints,  // This gameweek's points, with captain multiplier applied
          eventPoints,          // Raw points without multiplier, this gameweek
          bonus: liveStats.bonus || 0,
          bps: liveStats.bps || 0,
          minutes: liveStats.minutes || 0,
          // FPL's official Team of the Week for this exact gameweek — it's
          // right there in the live stats already fetched above, just never
          // read before now.
          inDreamTeam: Boolean(liveStats.in_dreamteam),
          totalPoints: playerInfo.totalPoints || 0,
          photo: playerInfo.photo || '',
          nowCost: playerInfo.nowCost || 0,
          status: playerInfo.status || 'a',
          chanceOfPlaying: playerInfo.chanceOfPlaying || 100,
          // Season-level context for the player-detail panel — these were
          // added to playerInfo above but never actually copied onto the
          // object sent to the frontend, which is why the panel showed
          // blanks/dashes for all of them.
          news: playerInfo.news || '',
          form: playerInfo.form || '0.0',
          selectedByPercent: playerInfo.selectedByPercent || '0.0',
          pointsPerGame: playerInfo.pointsPerGame || '0.0',
          goalsScored: playerInfo.goalsScored || 0,
          assists: playerInfo.assists || 0,
          cleanSheets: playerInfo.cleanSheets || 0,
          bonusSeason: playerInfo.bonusSeason || 0,
          minutesSeason: playerInfo.minutesSeason || 0
        };

        enrichedPicks.push(enrichedPick);
      });
    }

    // Apply automatic substitutions so the pitch/list view shows who
    // actually played, not just the pre-deadline selection. FPL applies
    // a sub when a starter (position 1-11) didn't play (0 minutes) and a
    // bench player of a legal replacement position did — automatic_subs
    // is FPL's own record of exactly which swaps it made, so just mirror
    // those swaps by position rather than re-deriving the eligibility
    // rules ourselves.
    (picksData.automatic_subs || []).forEach(sub => {
      const outPick = enrichedPicks.find(p => p.id === sub.element_out);
      const inPick = enrichedPicks.find(p => p.id === sub.element_in);
      if (!outPick || !inPick) return;
      // Swap their pitch positions (1-11 vs 12-15) so the starter who
      // didn't play moves to the bench slot and the sub who came on
      // takes their spot in the XI.
      const outPosition = outPick.position;
      outPick.position = inPick.position;
      inPick.position = outPosition;
      outPick.wasSubbedOut = true;
      inPick.wasSubbedIn = true;
    });

    // Separate starting XI and bench — position 1-11 after the swaps
    // above reflects who actually played this gameweek. Bench Boost
    // (bboost) counts all 15 regardless, so the XI/bench split is purely
    // cosmetic in that case (auto-subs also don't apply — everyone
    // already scores).
    const sortedPicks = [...enrichedPicks].sort((a, b) => a.position - b.position);
    const startingXI = sortedPicks.slice(0, 11);
    const bench = sortedPicks.slice(11, 15);

    // Get formation from starting XI
    const formation = {
      gkp: startingXI.filter(p => p.positionType === 'GKP').length,
      def: startingXI.filter(p => p.positionType === 'DEF').length,
      mid: startingXI.filter(p => p.positionType === 'MID').length,
      fwd: startingXI.filter(p => p.positionType === 'FWD').length
    };

    const formationString = `${formation.def}-${formation.mid}-${formation.fwd}`;

    // Process entry history
    const entryHistory = picksData.entry_history || {};

    // Enrich automatic substitutions with readable player names — the raw
    // FPL payload only gives player IDs (element_in/element_out), and the
    // player lookup we need is already built above for the picks list.
    const automaticSubs = (picksData.automatic_subs || []).map(sub => ({
      playerOut: playersMap.get(sub.element_out)?.name || 'Unknown',
      playerIn: playersMap.get(sub.element_in)?.name || 'Unknown',
      event: sub.event
    }));

    // Build response
    const responseData = {
      managerId: parseInt(managerId),
      eventId: parseInt(eventId),
      activeChip: picksData.active_chip || null,
      automaticSubs,
      entryHistory: {
        event: entryHistory.event || parseInt(eventId),
        points: entryHistory.points || 0,
        totalPoints: entryHistory.total_points || 0,
        rank: entryHistory.rank || 0,
        overallRank: entryHistory.overall_rank || 0,
        bank: entryHistory.bank || 0,
        value: entryHistory.value || 1000,
        eventTransfers: entryHistory.event_transfers || 0,
        eventTransfersCost: entryHistory.event_transfers_cost || 0,
        pointsOnBench: entryHistory.points_on_bench || 0
      },
      picks: enrichedPicks,
      startingXI: startingXI,
      bench: bench,
      formation: formationString,
      captain: enrichedPicks.find(p => p.isCaptain) || null,
      viceCaptain: enrichedPicks.find(p => p.isViceCaptain) || null,
      liveDataAvailable: liveResponse.ok
    };

    // Enhanced logging for debugging
    console.log(`✅ Team picks processed for manager ${managerId}, GW${eventId}`);
    console.log(`📊 Points sample: ${startingXI.slice(0, 3).map(p => `${p.name}:${p.points}`).join(', ')}`);
    console.log(`⚡ Bootstrap players found: ${playersMap.size}, teams: ${teamsMap.size}, live stats found: ${liveStatsMap.size}`);

    // Set cache headers
    res.setHeader('Cache-Control', 'public, max-age=120, stale-while-revalidate=300');

    return res.status(200).json({
      success: true,
      data: responseData,
      metadata: {
        playersProcessed: enrichedPicks.length,
        bootstrapPlayers: playersMap.size,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error fetching team picks:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch team picks data',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
