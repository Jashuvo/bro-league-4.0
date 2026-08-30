import { Standings, Whistle, CornerFlags, Coins, MoreDots } from './ui/Doodles';

// ─── THE APP'S FOUR DESTINATIONS ────────────────────────────────────────────
//
// This array is the single source of truth for primary navigation. Both
// presentations in AppNav — the persistent desktop sidebar and the docked
// mobile bottom bar — render from it, so a destination can never exist in one
// and not the other. CommandBar reads the same entries for the title strip.
//
// It replaced a seven-entry horizontal pill row that was identical on desktop
// and mobile: Monthly Prizes + Prize Distribution now live behind `prizes`
// (segmented Weekly/Monthly/Season), and Chip Tracker + Head-to-Head +
// Season Awards behind `more`.
//
// It lives in its own module rather than in AppNav.jsx because a file that
// exports components can't also export constants and functions without
// breaking Fast Refresh (react-refresh/only-export-components).
export const DESTINATIONS = [
  { id: 'standings', name: 'Standings', short: 'Table', icon: Standings, tone: 'bg-sunflower', blurb: 'Who is winning' },
  { id: 'gameweeks', name: 'Gameweeks', short: 'Weeks', icon: Whistle, tone: 'bg-sky', blurb: 'Week by week' },
  { id: 'fixtures', name: 'Fixtures', short: 'Fixtures', icon: CornerFlags, tone: 'bg-tangerine', blurb: 'Live scores' },
  { id: 'prizes', name: 'Prizes', short: 'Prizes', icon: Coins, tone: 'bg-mint', blurb: 'Money on the table' },
  { id: 'more', name: 'More', short: 'More', icon: MoreDots, tone: 'bg-bubblegum', blurb: 'Chips, H2H, awards' },
];

export const getDestination = (id) => DESTINATIONS.find((d) => d.id === id) || DESTINATIONS[0];
