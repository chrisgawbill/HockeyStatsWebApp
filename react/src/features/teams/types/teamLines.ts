export type ForwardSlot = 'LW' | 'C' | 'RW';
export type DefenseSlot = 'LD' | 'RD';
export type LineSlot = ForwardSlot | DefenseSlot;

/** Game the real lines were derived from (`GET /team/lines/:triCode`). */
export interface TeamLinesGameDto {
  gameId: number;
  gameDate: string; // YYYY-MM-DD
  opponent: string;
  homeAway: 'home' | 'away';
}

export interface TeamLinesForwardLineDto {
  players: { id: number; slot: ForwardSlot }[];
  togetherSeconds: number;
}

export interface TeamLinesDefensePairDto {
  players: { id: number; slot: DefenseSlot }[];
  togetherSeconds: number;
}

/** Response of `GET /team/lines/:triCode?season=`. */
export interface TeamLinesDto {
  source: 'shifts' | 'none';
  game: TeamLinesGameDto | null;
  forwardLines: TeamLinesForwardLineDto[];
  defensePairs: TeamLinesDefensePairDto[];
  goalies: { starterId: number | null };
}
