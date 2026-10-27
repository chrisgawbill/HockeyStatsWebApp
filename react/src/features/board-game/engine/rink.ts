import {
  BOARD_COLS,
  BOARD_ROWS,
  DEFENSE_RANGE_BONUS,
} from '@/features/board-game/data/balance';
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

export function orthNeighbors(coord: Coord): Coord[] {
  const candidates: Coord[] = [
    { col: coord.col + 1, row: coord.row },
    { col: coord.col - 1, row: coord.row },
    { col: coord.col, row: coord.row + 1 },
    { col: coord.col, row: coord.row - 1 },
  ];
  return candidates.filter(inBounds);
}

/** The up-to-eight in-bounds tiles touching `coord`, diagonals included. */
export function neighbors(coord: Coord): Coord[] {
  const candidates: Coord[] = [];
  for (let dCol = -1; dCol <= 1; dCol++)
    for (let dRow = -1; dRow <= 1; dRow++)
      if (dCol !== 0 || dRow !== 0)
        candidates.push({ col: coord.col + dCol, row: coord.row + dRow });
  return candidates.filter(inBounds);
}

/** True if `a` and `b` touch, diagonals included: the reach of pressure, checks and dekes. */
export function isAdjacent(a: Coord, b: Coord): boolean {
  return tileDistance(a, b) === 1;
}

/** Steps between two tiles when diagonal steps are allowed. */
export function tileDistance(a: Coord, b: Coord): number {
  return Math.max(Math.abs(a.col - b.col), Math.abs(a.row - b.row));
}

export function manhattan(a: Coord, b: Coord): number {
  return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
}

export function sameCoord(a: Coord, b: Coord): boolean {
  return a.col === b.col && a.row === b.row;
}

export function skaterAt(state: GameState, coord: Coord): Skater | undefined {
  return state.skaters.find((s) => sameCoord(s.pos, coord));
}

/** True if `coord` is in `team`'s offensive zone. */
export function isOffensiveZone(team: TeamId, coord: Coord): boolean {
  const bounds = OFFENSIVE_ZONE_COLS[team];
  return coord.col >= bounds.min && coord.col <= bounds.max;
}

/** True if `coord` is in `team`'s defensive zone (the opponent's offensive zone). */
export function isDefensiveZone(team: TeamId, coord: Coord): boolean {
  return isOffensiveZone(team === 'user' ? 'cpu' : 'user', coord);
}

/**
 * Tiles strictly between `a` and `b`, ordered from `a`, when they share a
 * row, column or straight diagonal. Returns null when they don't (including
 * when `a` equals `b`).
 */
export function laneBetween(a: Coord, b: Coord): Coord[] | null {
  const dCol = b.col - a.col;
  const dRow = b.row - a.row;
  const isStraight =
    dCol === 0 || dRow === 0 || Math.abs(dCol) === Math.abs(dRow);
  if (!isStraight || (dCol === 0 && dRow === 0)) return null;

  const stepCol = Math.sign(dCol);
  const stepRow = Math.sign(dRow);
  const tiles: Coord[] = [];
  for (let i = 1; i < tileDistance(a, b); i++)
    tiles.push({ col: a.col + i * stepCol, row: a.row + i * stepRow });
  return tiles;
}

/**
 * True if a diagonal step between `a` and `b` would cut a corner: either
 * side tile is unplayable (the boards or a crease), or both are occupied
 * (no squeezing between two players). Symmetric; false for straight steps.
 */
export function cutsCorner(state: GameState, a: Coord, b: Coord): boolean {
  if (a.col === b.col || a.row === b.row) return false;
  const sides: Coord[] = [
    { col: b.col, row: a.row },
    { col: a.col, row: b.row },
  ];
  if (!sides.every(isPlayable)) return true;
  return sides.every((side) => skaterAt(state, side) !== undefined);
}

/** True if a skater on `from` may step to the touching tile `to`: playable, empty, no corner cut. Ignores phase and activations. */
export function canStep(state: GameState, from: Coord, to: Coord): boolean {
  return isPlayable(to) && !skaterAt(state, to) && !cutsCorner(state, from, to);
}

/** True if `skater` is stunned (the single stun check — never re-implement). */
export function isStunned(skater: Skater): boolean {
  return skater.stunned;
}

/**
 * True if `skater` may take the current activation: on the active team, not
 * a goalie, not stunned, and either already the activation's skater or not
 * yet activated this shift. Ignores phase.
 */
export function canActivate(state: GameState, skater: Skater): boolean {
  if (skater.team !== state.activeTeam) return false;
  if (skater.role === 'G' || isStunned(skater)) return false;
  if (state.activeSkaterId !== null) return state.activeSkaterId === skater.id;
  return !state.activatedSkaterIds.includes(skater.id);
}

/**
 * True if `skater` still has a defenseman's extra range tile: an LD/RD whose
 * whole path this activation, start included, is in its defensive zone.
 */
function hasDefenseRange(state: GameState, skater: Skater): boolean {
  if (skater.role !== 'LD' && skater.role !== 'RD') return false;
  const path =
    state.activationPath.length > 0 ? state.activationPath : [skater.pos];
  return path.every((tile) => isDefensiveZone(skater.team, tile));
}

/** Tiles `skaterId` (or, with none chosen yet, any skater) may still move this activation, counting a defenseman's range tile. */
export function stepsRemaining(
  state: GameState,
  skaterId: string | null,
): number {
  const skater = state.skaters.find((s) => s.id === skaterId);
  if (!skater) return state.stepsLeft;
  const rangeTiles = hasDefenseRange(state, skater) ? DEFENSE_RANGE_BONUS : 0;
  return state.stepsLeft + rangeTiles;
}

/**
 * Tiles a skater may step onto now, in all eight directions: empty outside
 * the move phase, when it can't take this activation, or when the
 * activation has no tiles left. A defenseman's range tile must also land in
 * its defensive zone.
 */
export function legalSteps(state: GameState, skaterId: string): Coord[] {
  const skater = state.skaters.find((s) => s.id === skaterId);
  if (!skater) return [];
  if (state.phase !== 'move') return [];
  if (!canActivate(state, skater)) return [];
  if (stepsRemaining(state, skaterId) < 1) return [];
  const steps = neighbors(skater.pos).filter((to) =>
    canStep(state, skater.pos, to),
  );
  const isRangeTile = state.stepsLeft < 1;
  return isRangeTile
    ? steps.filter((to) => isDefensiveZone(skater.team, to))
    : steps;
}
