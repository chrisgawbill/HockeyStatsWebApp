import type { Coord, TeamId } from '@/features/board-game/types/game';

/**
 * Radius of the rink's rounded ends, in tile units (horizontal along the
 * 15-col length, vertical across the 7-row width). The board's CSS
 * border-radius is derived from this, so the drawn boards and the playable
 * tiles can't drift apart.
 */
export const RINK_CORNER_RADIUS = { x: 2.7, y: 3.5 };

/**
 * Share of a tile's area that must sit inside the rounded boards for it to be
 * playable. Stricter than half: once the dasher border and inner rail are
 * drawn, a ~60% tile still reads as cut off and clips the sprite on it.
 */
export const MIN_PLAYABLE_TILE_COVERAGE = 0.75;

/**
 * Corner tiles no skater may ever occupy: every tile with less than
 * `MIN_PLAYABLE_TILE_COVERAGE` of its area inside the rounded boards drawn
 * from `RINK_CORNER_RADIUS` (rink.test.ts checks this list against that
 * geometry).
 */
export const UNPLAYABLE_CORNERS: Coord[] = [
  { col: 0, row: 0 },
  { col: 1, row: 0 },
  { col: 0, row: 1 },
  { col: 0, row: 5 },
  { col: 0, row: 6 },
  { col: 1, row: 6 },
  { col: 13, row: 0 },
  { col: 14, row: 0 },
  { col: 14, row: 1 },
  { col: 14, row: 5 },
  { col: 13, row: 6 },
  { col: 14, row: 6 },
];

/** Goalie-only tiles, keyed by team (user = Blue, cpu = Red). */
export const GOALIE_TILES: Record<TeamId, Coord> = {
  user: { col: 0, row: 3 },
  cpu: { col: 14, row: 3 },
};

/** Tile in front of each team's own crease, where rebounds/freezes land. */
export const CREASE_FRONT: Record<TeamId, Coord> = {
  user: { col: 1, row: 3 },
  cpu: { col: 13, row: 3 },
};

/** Column bounds (inclusive) of each team's offensive zone. */
export const OFFENSIVE_ZONE_COLS: Record<TeamId, { min: number; max: number }> =
  {
    user: { min: 10, max: 14 },
    cpu: { min: 0, max: 4 },
  };

/** Visual-only line columns for the UI. */
export const LINE_COLUMNS = {
  userBlueLine: [4, 5],
  redLine: [7],
  cpuBlueLine: [9, 10],
};

/** Faceoff spot locations on the board. Coordinates are Chris-tunable. */
export const FACEOFF_SPOTS = {
  /** Centre ice faceoff dot. */
  centreIce: { col: 7, row: 3 },
  /** End-zone faceoff dots (pair) for each team's defensive end, keyed by team. */
  defendingDots: {
    user: [
      { col: 2, row: 1 },
      { col: 2, row: 5 },
    ],
    cpu: [
      { col: 12, row: 1 },
      { col: 12, row: 5 },
    ],
  } as Record<TeamId, Coord[]>,
};
