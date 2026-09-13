import { BOARD_COLS, BOARD_ROWS } from '@/features/board-game/data/balance';
import {
  GOALIE_TILES,
  OFFENSIVE_ZONE_COLS,
  UNPLAYABLE_CORNERS,
} from '@/features/board-game/data/rink';
import type {
  Coord,
  GameState,
  Skater,
  TeamId,
} from '@/features/board-game/types/game';

/** True if the coord is within the rink bounds. */
export function inBounds(coord: Coord): boolean {
  return (
    coord.col >= 0 &&
    coord.col < BOARD_COLS &&
    coord.row >= 0 &&
    coord.row < BOARD_ROWS
  );
}

/** True if a skater could ever stand here: in bounds, not a corner, not a goalie tile. */
export function isPlayable(coord: Coord): boolean {
  if (!inBounds(coord)) return false;
  if (UNPLAYABLE_CORNERS.some((c) => sameCoord(c, coord))) return false;
  if (Object.values(GOALIE_TILES).some((c) => sameCoord(c, coord)))
    return false;
  return true;
}

/** The up-to-4 orthogonal neighbors that are in bounds. */
export function orthNeighbors(coord: Coord): Coord[] {
  const candidates: Coord[] = [
    { col: coord.col + 1, row: coord.row },
    { col: coord.col - 1, row: coord.row },
    { col: coord.col, row: coord.row + 1 },
    { col: coord.col, row: coord.row - 1 },
  ];
  return candidates.filter(inBounds);
}

/** True if `a` and `b` are one orthogonal step apart. */
export function isAdjacent(a: Coord, b: Coord): boolean {
  return manhattan(a, b) === 1;
}

export function manhattan(a: Coord, b: Coord): number {
  return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
}

export function sameCoord(a: Coord, b: Coord): boolean {
  return a.col === b.col && a.row === b.row;
}

/** The skater occupying `coord`, if any. */
export function skaterAt(state: GameState, coord: Coord): Skater | undefined {
  return state.skaters.find((s) => sameCoord(s.pos, coord));
}

/** True if `coord` is in `team`'s offensive zone. */
export function isOffensiveZone(team: TeamId, coord: Coord): boolean {
  const bounds = OFFENSIVE_ZONE_COLS[team];
  return coord.col >= bounds.min && coord.col <= bounds.max;
}

/**
 * Tiles strictly between `a` and `b` when they share a row or column.
 * Returns null when they don't (including when `a` equals `b`).
 */
export function laneBetween(a: Coord, b: Coord): Coord[] | null {
  if (a.row === b.row && a.col !== b.col) {
    const [lo, hi] = a.col < b.col ? [a.col, b.col] : [b.col, a.col];
    const tiles: Coord[] = [];
    for (let col = lo + 1; col < hi; col++) tiles.push({ col, row: a.row });
    return tiles;
  }
  if (a.col === b.col && a.row !== b.row) {
    const [lo, hi] = a.row < b.row ? [a.row, b.row] : [b.row, a.row];
    const tiles: Coord[] = [];
    for (let row = lo + 1; row < hi; row++) tiles.push({ col: a.col, row });
    return tiles;
  }
  return null;
}

/** True if `skater` is still stunned on `turn` (the single stun check — never re-implement). */
export function isStunned(skater: Skater, turn: number): boolean {
  return skater.stunnedUntilTurn !== null && turn <= skater.stunnedUntilTurn;
}

/**
 * Tiles a skater may step onto this turn: empty if it's the goalie, stunned,
 * not the move phase, not their team's turn, or they have no MP.
 */
export function legalSteps(state: GameState, skaterId: string): Coord[] {
  const skater = state.skaters.find((s) => s.id === skaterId);
  if (!skater) return [];
  if (skater.role === 'G') return [];
  if (isStunned(skater, state.turn)) return [];
  if (state.phase !== 'move') return [];
  if (state.activeTeam !== skater.team) return [];
  if (state.mp < 1) return [];
  return orthNeighbors(skater.pos)
    .filter(isPlayable)
    .filter((c) => !skaterAt(state, c));
}
