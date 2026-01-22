import React, { createContext, useContext, useState, useEffect } from 'react';

const ExclusionContext = createContext();

export function ExclusionProvider({ children }) {
  const [excludedTeamIds, setExcludedTeamIds] = useState(() => {
    try {
      const saved = localStorage.getItem('excludedTeamIds');
      return saved ? JSON.parse(saved).map(id => Number(id)) : [];
    } catch (e) {
      console.error('Error loading excludedTeamIds from localStorage', e);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('excludedTeamIds', JSON.stringify(excludedTeamIds));
  }, [excludedTeamIds]);

  const excludeTeam = (id) => {
    const numericId = Number(id);
    setExcludedTeamIds(prev => {
      if (prev.includes(numericId)) return prev;
      return [...prev, numericId];
    });
  };

  const includeTeam = (id) => {
    const numericId = Number(id);
    setExcludedTeamIds(prev => prev.filter(item => item !== numericId));
  };

  const isExcluded = (id) => {
    return excludedTeamIds.includes(Number(id));
  };

  const clearExclusions = () => {
    setExcludedTeamIds([]);
  };

  return (
    <ExclusionContext.Provider value={{
      excludedTeamIds,
      excludeTeam,
      includeTeam,
      isExcluded,
      clearExclusions
    }}>
      {children}
    </ExclusionContext.Provider>
  );
}

export function useExclusion() {
  const context = useContext(ExclusionContext);
  if (context === undefined) {
    throw new Error('useExclusion must be used within an ExclusionProvider');
  }
  return context;
}
