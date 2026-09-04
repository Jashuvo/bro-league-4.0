import React, { createContext, useContext, useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import fplApi from '../services/fplApi';
import PinPrompt from '../components/PinPrompt';

const ExclusionContext = createContext();

// Who's "excluded from prizes" used to live only in this browser's own
// localStorage — every viewer could see a different table depending on
// their device, and api/warm-cache.js's archive cron had no way to know
// who was excluded when crowning weekly/monthly winners for the permanent
// record. This now sources from (and writes through to) the shared
// excluded_managers table in Supabase via api/season-archive.js — see
// that file and the excluded_managers migration.
export function ExclusionProvider({ children }) {
  const [excludedManagers, setExcludedManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  // The PIN prompt is a single shared modal (see PinPrompt.jsx), driven by
  // whichever exclude/restore/clear call is currently waiting on a PIN —
  // `{ title, action }` while one's open, `null` otherwise. `action(pin)`
  // is the actual write; PinPrompt owns showing/retrying on a wrong PIN,
  // so this context never needs its own error-handling branch for that.
  const [pinRequest, setPinRequest] = useState(null);

  useEffect(() => {
    fplApi.getExclusions().then((rows) => {
      setExcludedManagers(rows || []);
      setLoading(false);
    });
  }, []);

  const excludedTeamIds = excludedManagers.map((m) => Number(m.manager_id));

  // Writes are PIN-gated server-side (see api/season-archive.js) — not
  // real auth, just enough friction that this stays deliberate on a
  // private league nobody outside the group has a link to. The PIN itself
  // is cached in sessionStorage (by PinPrompt, on a successful submit) so
  // it isn't retyped for every single exclude/restore within one visit.
  //
  // `action` always takes the PIN as its one argument. If a cached PIN
  // exists, it's tried first, silently — only on failure (wrong PIN,
  // rate-limited, cache stale) does the modal actually appear, already
  // primed to retry via the same `action`.
  const withPin = (title, action) => {
    const cachedPin = sessionStorage.getItem('exclusionPin');
    if (cachedPin) {
      return action(cachedPin).catch(() => {
        sessionStorage.removeItem('exclusionPin');
        setPinRequest({ title, action });
      });
    }
    setPinRequest({ title, action });
    return Promise.resolve();
  };

  const excludeTeam = (id, name) => withPin(
    `Exclude ${name || `manager ${id}`}`,
    async (pin) => {
      await fplApi.addExclusion(id, name, pin);
      setExcludedManagers((prev) => {
        const numericId = Number(id);
        if (prev.some((m) => Number(m.manager_id) === numericId)) return prev;
        return [...prev, { manager_id: numericId, manager_name: name }];
      });
    }
  );

  const includeTeam = (id) => withPin(
    'Restore manager',
    async (pin) => {
      await fplApi.removeExclusion(id, pin);
      const numericId = Number(id);
      setExcludedManagers((prev) => prev.filter((m) => Number(m.manager_id) !== numericId));
    }
  );

  const isExcluded = (id) => excludedTeamIds.includes(Number(id));

  const clearExclusions = () => withPin(
    'Clear all exclusions',
    async (pin) => {
      await fplApi.clearAllExclusions(pin);
      setExcludedManagers([]);
    }
  );

  return (
    <ExclusionContext.Provider value={{
      excludedTeamIds,
      excludedManagers,
      excludeTeam,
      includeTeam,
      isExcluded,
      clearExclusions,
      loading
    }}>
      {children}
      <AnimatePresence>
        {pinRequest && <PinPrompt request={pinRequest} onDone={() => setPinRequest(null)} />}
      </AnimatePresence>
    </ExclusionContext.Provider>
  );
}

// Co-locating this hook with its provider is the standard React context
// pattern; disabling below only affects dev-mode Fast Refresh granularity,
// not correctness.
// eslint-disable-next-line react-refresh/only-export-components
export function useExclusion() {
  const context = useContext(ExclusionContext);
  if (context === undefined) {
    throw new Error('useExclusion must be used within an ExclusionProvider');
  }
  return context;
}
