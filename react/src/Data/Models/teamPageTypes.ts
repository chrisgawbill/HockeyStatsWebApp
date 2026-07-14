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

export type Position =
  'Center' | 'Left Wing' | 'Right Wing' | 'Defenseman' | 'Goalie';

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
