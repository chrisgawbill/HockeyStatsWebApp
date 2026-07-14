export interface BoxscorePlayerName {
  default: string;
}

export interface BoxscoreSkater {
  playerId: number;
  sweaterNumber: number;
  name: BoxscorePlayerName;
  position: string; // "L" | "R" | "C" | "D"
  goals: number;
  assists: number;
  points: number;
  plusMinus: number;
  pim: number;
  hits: number;
  powerPlayGoals: number;
  sog: number; // shots on goal — NOT "shots"
  faceoffWinningPctg: number;
  toi: string; // "MM:SS"
  blockedShots: number;
  shifts: number;
  giveaways: number;
  takeaways: number;
}

export interface BoxscoreGoalie {
  playerId: number;
  sweaterNumber: number;
  name: BoxscorePlayerName;
  position: 'G';
  saveShotsAgainst?: string; // "31/34" (saves/shots)
  savePctg?: number;
  goalsAgainst: number;
  toi: string;
  starter: boolean;
  decision?: string; // "W" | "L"
  shotsAgainst: number;
  saves: number;
  evenStrengthShotsAgainst?: string;
  powerPlayShotsAgainst?: string;
  shorthandedShotsAgainst?: string;
}

export interface BoxscoreTeamStats {
  forwards: BoxscoreSkater[];
  defense: BoxscoreSkater[];
  goalies: BoxscoreGoalie[];
}

export interface BoxscoreTeam {
  id: number;
  abbrev: string;
  commonName: { default: string };
  score: number;
  sog: number;
  logo: string; // light-mode logo URL
  darkLogo: string; // dark-mode logo URL (use directly, no replacement needed)
}

export interface GameDetailBoxscore {
  id: number;
  gameState: string; // "OFF" | "LIVE" | "FUT" | "PRE"
  gameDate: string; // "YYYY-MM-DD"
  startTimeUTC: string;
  venue: { default: string };
  homeTeam: BoxscoreTeam;
  awayTeam: BoxscoreTeam;
  periodDescriptor: { number: number; periodType: string };
  gameOutcome?: { lastPeriodType: string }; // "REG" | "OT" | "SO"
  playerByGameStats?: {
    homeTeam: BoxscoreTeamStats;
    awayTeam: BoxscoreTeamStats;
  };
}

export interface LandingGoalAssist {
  playerId: number;
  name: BoxscorePlayerName;
  sweaterNumber: number;
  assistsToDate: number;
}

export interface LandingGoal {
  strength: string; // "ev" | "pp" | "sh"
  name: BoxscorePlayerName;
  teamAbbrev: { default: string };
  headshot: string;
  timeInPeriod: string; // "MM:SS"
  goalModifier: string; // "none" | "empty-net"
  awayScore: number;
  homeScore: number;
  isHome: boolean;
  assists: LandingGoalAssist[];
}

export interface LandingScoringPeriod {
  periodDescriptor: { number: number; periodType: string };
  goals: LandingGoal[];
}

export interface LandingThreeStar {
  star: number; // 1 | 2 | 3
  playerId: number;
  teamAbbrev: string;
  headshot: string;
  name: BoxscorePlayerName;
  sweaterNo: number; // NOTE: "sweaterNo" not "sweaterNumber"
  position: string;
  goals?: number;
  assists?: number;
  points?: number;
  goalsAgainstAverage?: number;
  savePctg?: number;
}

export interface GameLandingSummary {
  scoring: LandingScoringPeriod[];
  threeStars: LandingThreeStar[];
  penalties?: any[];
}

export interface GameLanding {
  id: number;
  gameState: string;
  summary: GameLandingSummary;
}
