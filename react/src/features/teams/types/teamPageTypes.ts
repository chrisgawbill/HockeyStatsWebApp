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

/**
 * AI-generated franchise history fields (year founded, arena, etc). Sourced
 * from the AI chat subprocess, NOT from the NHL API — kept as its own type so
 * it is never silently merged into an official-stats view model.
 */
export interface TeamAiHistory {
  arena: string;
  founded: number;
  stanleyCups: number;
  conferenceChampionships: number;
  hallOfFamers: number;
}

export type AiHistoryStatus = 'loading' | 'ready' | 'error';

export interface StatItem {
  label: string;
  value: string;
}

/** Anchor sections of the team detail page (`#stats`, `#roster`, etc). */
export type TeamSection =
  | 'stats'
  | 'leaders'
  | 'roster'
  | 'schedule'
  | 'skaters'
  | 'goalies'
  | 'history';

export const TEAM_SECTIONS: { key: TeamSection; label: string }[] = [
  { key: 'stats', label: 'Stats' },
  { key: 'leaders', label: 'Leaders' },
  { key: 'roster', label: 'Roster' },
  { key: 'schedule', label: 'Schedule' },
  { key: 'skaters', label: 'Skaters' },
  { key: 'goalies', label: 'Goalies' },
  { key: 'history', label: 'History' },
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
  | 'corsiPct';

export interface StatCategory {
  key: StatCategoryKey;
  label: string;
  shortLabel: string;
  format: (val: number) => string;
  higherIsBetter: boolean;
  requiresMinGames?: boolean;
}

export const STAT_CATEGORIES: StatCategory[] = [
  {
    key: 'goals',
    label: 'Goals',
    shortLabel: 'G',
    format: (v) => String(v),
    higherIsBetter: true,
  },
  {
    key: 'assists',
    label: 'Assists',
    shortLabel: 'A',
    format: (v) => String(v),
    higherIsBetter: true,
  },
  {
    key: 'points',
    label: 'Points',
    shortLabel: 'P',
    format: (v) => String(v),
    higherIsBetter: true,
  },
  {
    key: 'plusMinus',
    label: 'Plus / Minus',
    shortLabel: '+/-',
    format: (v) => (v > 0 ? `+${v}` : String(v)),
    higherIsBetter: true,
    requiresMinGames: true,
  },
  {
    key: 'penaltyMinutes',
    label: 'Penalty Minutes',
    shortLabel: 'PIM',
    format: (v) => String(v),
    higherIsBetter: true,
    requiresMinGames: true,
  },
  {
    key: 'faceoffWinPct',
    label: 'Faceoff Win %',
    shortLabel: 'FO%',
    format: (v) => `${(v * 100).toFixed(1)}%`,
    higherIsBetter: true,
    requiresMinGames: true,
  },
  {
    key: 'corsiPct',
    label: 'Corsi For %',
    shortLabel: 'CF%',
    format: (v) => `${(v * 100).toFixed(1)}%`,
    higherIsBetter: true,
    requiresMinGames: true,
  },
];
