/** Which summary list a player comes from; skaters and goalies are never compared together. */
export type PlayerGroup = 'skater' | 'goalie';

/** A skater's regular-season totals, as compared. */
export interface SkaterSeason {
  group: 'skater';
  playerId: number;
  name: string;
  /** Position code: C, L, R or D. */
  position: string;
  /** Latest team the NHL lists for the season, or null when unknown. */
  teamTriCode: string | null;
  gamesPlayed: number;
  goals: number;
  assists: number;
  points: number;
  plusMinus: number;
  shots: number;
  /** Fraction (0.173), or null with no shots. */
  shootingPct: number | null;
  /** Seconds per game. */
  toiPerGame: number | null;
}

/** A goalie's regular-season totals, as compared. */
export interface GoalieSeason {
  group: 'goalie';
  playerId: number;
  name: string;
  teamTriCode: string | null;
  gamesPlayed: number;
  wins: number;
  goalsAgainstAverage: number | null;
  savePct: number | null;
  shutouts: number;
}

export type ComparePlayer = SkaterSeason | GoalieSeason;

/** Every skater and goalie with a line in the season, for search and lookup by id. */
export interface SeasonPlayerPool {
  skaters: SkaterSeason[];
  goalies: GoalieSeason[];
  byId: Map<number, ComparePlayer>;
}

/** One column of the comparison, in URL order. */
export type CompareSlot =
  | { kind: 'player'; player: ComparePlayer }
  /** The id has no season line (wrong id, or no games this season). */
  | { kind: 'unknown'; playerId: number }
  /** A goalie among skaters or the reverse; shown, never compared. */
  | { kind: 'otherGroup'; player: ComparePlayer };
