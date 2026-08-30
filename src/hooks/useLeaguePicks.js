// src/hooks/useLeaguePicks.js
//
// Fetches every manager's picks for one gameweek — extracted out of
// CaptainWatch so any consumer that needs the same data can read it without
// re-deriving the fetch loop. Goes through fplApi.getTeamPicks, which
// caches per manager+gameweek (see `status` below for how long), so two
// consumers reading the same gameweek still cost one network round trip
// per manager, not two.
import { useEffect, useState } from 'react';
import fplApi from '../services/fplApi';

// `enabled` should be false for a gameweek with no picks yet (upcoming) —
// there's nothing to fetch and every call would just 404.
//
// `status` ('current' | 'completed' | anything else) decides how long the
// result is worth trusting: a gameweek that has already finished has picks
// that cannot change again, so it's cached for the rest of the week rather
// than re-fetched on every visit — the whole point of this hook existing is
// that it fans out to every manager in the league, which is the single
// most expensive thing this app does.
export function useLeaguePicks(standings = [], gameweek, enabled = true, status = 'current') {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!enabled || !gameweek || standings.length === 0) {
      setLoading(false);
      setRows([]);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    const ttlMinutes = status === 'completed' ? 60 * 24 * 7 : 5;

    const load = async () => {
      const results = await Promise.all(
        standings.map(async (manager) => {
          const id = manager.id || manager.entry;
          const picks = await fplApi.getTeamPicks(id, gameweek, { ttlMinutes });
          if (!picks) return null;
          return {
            id,
            managerName: manager.managerName || manager.player_name,
            captain: picks.captain,
            allPicks: picks.picks || [],
          };
        })
      );

      if (cancelled) return;
      setRows(results.filter(Boolean));
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [enabled, gameweek, standings, status]);

  return { loading, rows };
}
