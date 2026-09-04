import React, { createContext, useContext, useState, useEffect } from 'react';
import fplApi from '../services/fplApi';

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
  // is cached in sessionStorage after a correct entry so it isn't
  // retyped for every single exclude/restore within one visit.
  const getPin = () => {
    let pin = sessionStorage.getItem('exclusionPin');
    if (!pin) {
      pin = window.prompt('Enter the exclusion PIN to make this change:') || '';
      if (pin) sessionStorage.setItem('exclusionPin', pin);
    }
    return pin;
  };

  const forgetBadPin = () => sessionStorage.removeItem('exclusionPin');

  const excludeTeam = async (id, name) => {
    const pin = getPin();
    if (!pin) return;
    try {
      await fplApi.addExclusion(id, name, pin);
      setExcludedManagers((prev) => {
        const numericId = Number(id);
        if (prev.some((m) => Number(m.manager_id) === numericId)) return prev;
        return [...prev, { manager_id: numericId, manager_name: name }];
      });
    } catch (error) {
      forgetBadPin();
      window.alert(error.message || 'Failed to exclude manager — check the PIN and try again.');
    }
  };

  const includeTeam = async (id) => {
    const pin = getPin();
    if (!pin) return;
    try {
      await fplApi.removeExclusion(id, pin);
      const numericId = Number(id);
      setExcludedManagers((prev) => prev.filter((m) => Number(m.manager_id) !== numericId));
    } catch (error) {
      forgetBadPin();
      window.alert(error.message || 'Failed to restore manager — check the PIN and try again.');
    }
  };

  const isExcluded = (id) => excludedTeamIds.includes(Number(id));

  const clearExclusions = async () => {
    const pin = getPin();
    if (!pin) return;
    try {
      await fplApi.clearAllExclusions(pin);
      setExcludedManagers([]);
    } catch (error) {
      forgetBadPin();
      window.alert(error.message || 'Failed to clear exclusions — check the PIN and try again.');
    }
  };

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
