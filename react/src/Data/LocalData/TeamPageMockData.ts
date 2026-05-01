export interface MockTeam {
  name: string;
  triCode: string;
  wins: number;
  losses: number;
  otLosses: number;
  points: number;
  divisionRank: number;
  division: string;
  conference: string;
  founded: number;
  arena: string;
  stanleyCups: number;
  conferenceChampionships: number;
  hallOfFamers: number;
}

export interface MockScheduleGame {
  gameId: number;
  opponent: string;
  opponentTriCode: string;
  date: string;
  isHome: boolean;
}

export interface MockStatItem {
  label: string;
  value: string;
}

export type Position = "Center" | "Left Wing" | "Right Wing" | "Defenseman" | "Goalie";

export interface RosterPlayer {
  id: number;
  name: string;
  number: number;
  stat: string;
}

export const MOCK_TEAM: MockTeam = {
  name: "Philadelphia Flyers",
  triCode: "PHI",
  wins: 44,
  losses: 28,
  otLosses: 10,
  points: 98,
  divisionRank: 2,
  division: "Metropolitan",
  conference: "Eastern",
  founded: 1967,
  arena: "Wells Fargo Center",
  stanleyCups: 2,
  conferenceChampionships: 8,
  hallOfFamers: 12,
};

export const MOCK_SCHEDULE: MockScheduleGame[] = [
  { gameId: 1, opponent: "Carolina Hurricanes", opponentTriCode: "CAR", date: "May 3, 2026",  isHome: true },
  { gameId: 2, opponent: "Carolina Hurricanes", opponentTriCode: "CAR", date: "May 5, 2026",  isHome: true },
  { gameId: 3, opponent: "Carolina Hurricanes", opponentTriCode: "CAR", date: "May 8, 2026",  isHome: false },
  { gameId: 4, opponent: "Carolina Hurricanes", opponentTriCode: "CAR", date: "May 10, 2026", isHome: false },
  { gameId: 5, opponent: "Carolina Hurricanes", opponentTriCode: "CAR", date: "May 12, 2026", isHome: true },
  { gameId: 6, opponent: "Carolina Hurricanes", opponentTriCode: "CAR", date: "May 14, 2026", isHome: false },
];

export const MOCK_STATS: MockStatItem[] = [
  { label: "Goals For / GP",     value: "3.24" },
  { label: "Goals Against / GP", value: "2.89" },
  { label: "Power Play %",       value: "22.4%" },
  { label: "Penalty Kill %",     value: "83.1%" },
  { label: "Shots / GP",         value: "31.2" },
];

export const POSITIONS: Position[] = ["Center", "Left Wing", "Right Wing", "Defenseman", "Goalie"];

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

export type StatCategoryKey = "goals" | "assists" | "points" | "plusMinus" | "penaltyMinutes" | "faceoffWinPct" | "corsiPct";

export interface StatCategory {
  key: StatCategoryKey;
  label: string;
  shortLabel: string;
  format: (val: number) => string;
  higherIsBetter: boolean;
}

export const STAT_CATEGORIES: StatCategory[] = [
  { key: "goals",          label: "Goals",           shortLabel: "G",      format: (v) => String(v),              higherIsBetter: true  },
  { key: "assists",        label: "Assists",          shortLabel: "A",      format: (v) => String(v),              higherIsBetter: true  },
  { key: "points",         label: "Points",           shortLabel: "P",      format: (v) => String(v),              higherIsBetter: true  },
  { key: "plusMinus",      label: "Plus / Minus",     shortLabel: "+/-",    format: (v) => (v > 0 ? `+${v}` : String(v)), higherIsBetter: true },
  { key: "penaltyMinutes", label: "Penalty Minutes",  shortLabel: "PIM",    format: (v) => String(v),              higherIsBetter: false },
  { key: "faceoffWinPct",  label: "Faceoff Win %",    shortLabel: "FO%",    format: (v) => `${(v * 100).toFixed(1)}%`, higherIsBetter: true },
  { key: "corsiPct",       label: "Corsi For %",      shortLabel: "CF%",    format: (v) => `${(v * 100).toFixed(1)}%`, higherIsBetter: true },
];

export const MOCK_PLAYER_STATS: PlayerStatLine[] = [
  { playerId: 8479370, name: "Travis Konecny",     position: "RW", gamesPlayed: 82, goals: 41, assists: 52, points: 93, plusMinus: 15,  penaltyMinutes: 42,  faceoffWinPct: null, corsiPct: 0.532 },
  { playerId: 8484144, name: "Matvei Michkov",     position: "RW", gamesPlayed: 79, goals: 34, assists: 48, points: 82, plusMinus: 12,  penaltyMinutes: 28,  faceoffWinPct: null, corsiPct: 0.518 },
  { playerId: 8481528, name: "Sean Couturier",     position: "C",  gamesPlayed: 75, goals: 29, assists: 44, points: 73, plusMinus: 18,  penaltyMinutes: 30,  faceoffWinPct: 0.512, corsiPct: 0.524 },
  { playerId: 8478476, name: "Joel Farabee",       position: "LW", gamesPlayed: 79, goals: 27, assists: 35, points: 62, plusMinus: 9,   penaltyMinutes: 24,  faceoffWinPct: null, corsiPct: 0.506 },
  { playerId: 8480801, name: "Morgan Frost",       position: "C",  gamesPlayed: 72, goals: 24, assists: 38, points: 62, plusMinus: 10,  penaltyMinutes: 14,  faceoffWinPct: 0.498, corsiPct: 0.512 },
  { playerId: 8481600, name: "Tyson Foerster",     position: "RW", gamesPlayed: 80, goals: 26, assists: 30, points: 56, plusMinus: 8,   penaltyMinutes: 22,  faceoffWinPct: null, corsiPct: 0.501 },
  { playerId: 8482097, name: "Cam York",           position: "D",  gamesPlayed: 82, goals: 12, assists: 42, points: 54, plusMinus: 14,  penaltyMinutes: 20,  faceoffWinPct: null, corsiPct: 0.521 },
  { playerId: 8480371, name: "Owen Tippett",       position: "RW", gamesPlayed: 76, goals: 19, assists: 28, points: 47, plusMinus: 5,   penaltyMinutes: 18,  faceoffWinPct: null, corsiPct: 0.498 },
  { playerId: 8481533, name: "Noah Cates",         position: "C",  gamesPlayed: 80, goals: 17, assists: 22, points: 39, plusMinus: 6,   penaltyMinutes: 34,  faceoffWinPct: 0.482, corsiPct: 0.495 },
  { playerId: 8478476, name: "Travis Sanheim",     position: "D",  gamesPlayed: 78, goals: 7,  assists: 28, points: 35, plusMinus: 10,  penaltyMinutes: 32,  faceoffWinPct: null, corsiPct: 0.515 },
  { playerId: 8482699, name: "Ryan Poehling",      position: "C",  gamesPlayed: 68, goals: 13, assists: 15, points: 28, plusMinus: 4,   penaltyMinutes: 20,  faceoffWinPct: 0.505, corsiPct: 0.489 },
  { playerId: 8480771, name: "Sean Walker",        position: "D",  gamesPlayed: 70, goals: 6,  assists: 18, points: 24, plusMinus: 7,   penaltyMinutes: 14,  faceoffWinPct: null, corsiPct: 0.503 },
  { playerId: 8480312, name: "Nicolas Deslauriers",position: "LW", gamesPlayed: 75, goals: 9,  assists: 8,  points: 17, plusMinus: -2,  penaltyMinutes: 142, faceoffWinPct: null, corsiPct: 0.472 },
  { playerId: 8476460, name: "Nick Seeler",        position: "D",  gamesPlayed: 65, goals: 2,  assists: 8,  points: 10, plusMinus: 3,   penaltyMinutes: 54,  faceoffWinPct: null, corsiPct: 0.478 },
];

export const MOCK_ROSTER: Record<Position, RosterPlayer[]> = {
  Center: [
    { id: 8481528, name: "Sean Couturier", number: 14, stat: "29 G" },
    { id: 8480801, name: "Morgan Frost",   number: 48, stat: "24 G" },
    { id: 8482699, name: "Ryan Poehling",  number: 25, stat: "13 G" },
  ],
  "Left Wing": [
    { id: 8478476, name: "Joel Farabee",        number: 86, stat: "27 G" },
    { id: 8481533, name: "Noah Cates",          number: 49, stat: "17 G" },
    { id: 8480312, name: "Nicolas Deslauriers", number: 44, stat: "9 G"  },
  ],
  "Right Wing": [
    { id: 8479370, name: "Travis Konecny",  number: 11, stat: "41 G" },
    { id: 8484144, name: "Matvei Michkov",  number: 39, stat: "34 G" },
    { id: 8481600, name: "Tyson Foerster",  number: 71, stat: "26 G" },
    { id: 8480371, name: "Owen Tippett",    number: 74, stat: "19 G" },
  ],
  Defenseman: [
    { id: 8482097, name: "Cam York",       number: 8,  stat: "12 G" },
    { id: 8478476, name: "Travis Sanheim", number: 6,  stat: "7 G"  },
    { id: 8480771, name: "Sean Walker",    number: 26, stat: "6 G"  },
    { id: 8476460, name: "Nick Seeler",    number: 24, stat: "2 G"  },
  ],
  Goalie: [
    { id: 8482671, name: "Samuel Ersson", number: 33, stat: ".914 SV%" },
    { id: 8483452, name: "Ivan Fedotov",  number: 82, stat: ".906 SV%" },
  ],
};
