// src/components/standings/rowDisplay.js
//
// The small formatting rules the standings rows share, lifted out of
// LeagueTable.jsx so the table file is about the table's behaviour rather
// than its string-juggling. The row MARKUP still lives in LeagueTable.jsx
// (it closes over a dozen pieces of table state, so moving it is only worth
// doing when that file is being reworked anyway) — these helpers are what the
// presentational pieces in ./RowPieces.jsx and the table both need, which is
// why they sit in a module of their own rather than inside either of them.

// FPL's chip ids, spelled the way a human would say them.
export const CHIP_LABELS = {
  bboost: 'Bench Boost',
  '3xc': 'Triple Captain',
  freehit: 'Free Hit',
  wildcard: 'Wildcard',
  manager: 'Assistant Manager',
};

export const chipLabel = (name) => CHIP_LABELS[name] || name;

// Short form for the mobile row, where a full "Triple Captain" pill would
// eat the manager's name.
export const CHIP_SHORT = {
  bboost: 'BB',
  '3xc': 'TC',
  freehit: 'FH',
  wildcard: 'WC',
  manager: 'AM',
};

// `teamValue` arrives from api/league-complete.js already converted out of
// FPL's raw tenths-of-a-million units (see the `value: gw.value / 10` line
// in league-complete.js) — it's already £m here (100.3, not 1003).
export const formatTeamValue = (value) =>
  value == null ? null : `£${value.toFixed(1)}m`;
