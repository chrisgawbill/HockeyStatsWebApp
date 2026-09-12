export interface TeamOverview {
  name: string;
  triCode: string;
  wins: number;
  losses: number;
  otLosses: number;
  points: number;
  divisionRank: number;
  division: string;
  conference: string;
  conferenceRank: number;
  playoffLineDelta: number;
  founded: number;
  arena: string;
  stanleyCups: number;
  conferenceChampionships: number;
  hallOfFamers: number;
}

export interface StatItem {
  label: string;
  value: string;
}

/** Anchor sections of the team detail page (`#stats`, `#roster`, etc). */
export type TeamSection = 'stats' | 'leaders' | 'roster' | 'schedule';

export const TEAM_SECTIONS: { key: TeamSection; label: string }[] = [
  { key: 'stats', label: 'Stats' },
  { key: 'leaders', label: 'Leaders' },
  { key: 'roster', label: 'Roster' },
  { key: 'schedule', label: 'Schedule' },
];

export type Position =
  | 'Center'
  | 'Left Wing'
  | 'Right Wing'
  | 'Defenseman'
  | 'Goalie';

export interface RosterPlayer {
  id: number;
  name: string;
  number: number;
  stat: string;
  headshot?: string;
}

export const POSITIONS: Position[] = [
  'Center',
  'Left Wing',
  'Right Wing',
  'Defenseman',
  'Goalie',
];

/** Coarse roster grouping used by the Roster tab (built on top of {@link Position}). */
export type PositionGroup = 'Forwards' | 'Defense' | 'Goalies';

export const POSITION_GROUPS: PositionGroup[] = [
  'Forwards',
  'Defense',
  'Goalies',
];

/** Normalized roster player contract (ticket 2.2), as returned by `/team/roster/:triCode`. */
export interface RosterPlayerContract {
  id: number;
  name: string;
  number: number;
  position: string; // raw NHL position code: C | L | R | D | G
  headshot: string;
}

/** Normalized skater summary contract (ticket 2.2), as returned by `/player/skater/summary`. */
export interface SkaterSummaryContract {
  playerId: number;
  name: string;
  position: string;
  gamesPlayed: number;
  goals: number;
  assists: number;
  points: number;
  plusMinus: number;
  penaltyMinutes: number;
  faceoffWinPct: number | null;
  toiPerGame: number | null;
}

/** Normalized goalie summary contract (ticket 2.2), as returned by `/player/goalie/summary`. */
export interface GoalieSummaryContract {
  goalieId: number;
  name: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  savePctg: number | null;
  goalsAgainstAverage: number | null;
  shutouts: number;
  toiPerGame: number | null;
}

/** One row of the separate skater Corsi (SAT%) endpoint, merged in by playerId. */
export interface SkaterCorsiEntry {
  playerId: number;
  satPercentage: number | null;
}

/** Fields TeamPage reads off the team summary response (`/team/:teamId`). */
export interface TeamStatsContract {
  name: string;
  points?: number;
  wins?: number;
  losses?: number;
  otLosses?: number;
  goalsForPerGame?: number;
  goalsAgainstPerGame?: number;
  powerPlayPct?: number;
  penaltyKillPct?: number;
  shotsForPerGame?: number;
}

export interface PlayerStatLine {
  playerId: number;
  name: string;
  position: string;
  gamesPlayed: number;
  goals: number;
  assists: number;
  points: number;
  plusMinus: number;
  penaltyMinutes: number;
  faceoffWinPct: number | null;
  corsiPct: number | null;
}

/** View model backing the sortable Goalies tab table. */
export interface GoalieStatLine {
  goalieId: number;
  name: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  savePctg: number | null;
  goalsAgainstAverage: number | null;
  shutouts: number;
}

export type SortDirection = 'asc' | 'desc';

export type StatCategoryKey =
  | 'goals'
  | 'assists'
  | 'points'
  | 'plusMinus'
  | 'penaltyMinutes'
  | 'faceoffWinPct'
  | 'corsiPct'
  | 'savePctg'
  | 'goalsAgainstAverage';

export interface StatCategory {
  key: StatCategoryKey;
  label: string;
  shortLabel: string;
  format: (val: number) => string;
  higherIsBetter: boolean;
  requiresMinGames?: boolean;
  /**
   * Which view model this category's values come from. Skater categories read
   * off `PlayerStatLine`, goalie categories off `GoalieStatLine` — the two are
   * separate arrays with different shapes (and different max-games-played,
   * which matters for `requiresMinGames`), so the leaderboard needs to know
   * which one to pull from before it can look up a value by key.
   */
  source: 'skater' | 'goalie';
}

export const STAT_CATEGORIES: StatCategory[] = [
  {
    key: 'goals',
    label: 'Goals',
    shortLabel: 'G',
    format: (v) => String(v),
    higherIsBetter: true,
    source: 'skater',
  },
  {
    key: 'assists',
    label: 'Assists',
    shortLabel: 'A',
    format: (v) => String(v),
    higherIsBetter: true,
    source: 'skater',
  },
  {
    key: 'points',
    label: 'Points',
    shortLabel: 'P',
    format: (v) => String(v),
    higherIsBetter: true,
    source: 'skater',
  },
  {
    key: 'plusMinus',
    label: 'Plus / Minus',
    shortLabel: '+/-',
    format: (v) => (v > 0 ? `+${v}` : String(v)),
    higherIsBetter: true,
    requiresMinGames: true,
    source: 'skater',
  },
  {
    key: 'penaltyMinutes',
    label: 'Penalty Minutes',
    shortLabel: 'PIM',
    format: (v) => String(v),
    higherIsBetter: true,
    requiresMinGames: true,
    source: 'skater',
  },
  {
    key: 'faceoffWinPct',
    label: 'Faceoff Win %',
    shortLabel: 'FO%',
    format: (v) => `${(v * 100).toFixed(1)}%`,
    higherIsBetter: true,
    requiresMinGames: true,
    source: 'skater',
  },
  {
    key: 'corsiPct',
    label: 'Corsi For %',
    shortLabel: 'CF%',
    format: (v) => `${(v * 100).toFixed(1)}%`,
    higherIsBetter: true,
    requiresMinGames: true,
    source: 'skater',
  },
  {
    key: 'savePctg',
    label: 'Save %',
    shortLabel: 'SV%',
    // NHL convention: three decimals with the leading zero stripped
    // (0.915 -> ".915"), never a percentage.
    format: (v) => v.toFixed(3).replace(/^0\./, '.'),
    higherIsBetter: true,
    requiresMinGames: true,
    source: 'goalie',
  },
  {
    key: 'goalsAgainstAverage',
    label: 'Goals Against Average',
    shortLabel: 'GAA',
    format: (v) => v.toFixed(2),
    // Lower is better for GAA — fewer goals allowed per game wins, unlike
    // every other leaderboard category here.
    higherIsBetter: false,
    requiresMinGames: true,
    source: 'goalie',
  },
];
