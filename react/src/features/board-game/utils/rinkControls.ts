import type { KeyboardEvent } from 'react';
import type { Coord, Skater } from '@/features/board-game/types/game';
import { TEAM_NAME } from '@/features/board-game/data/teams';

/** Engine-coord step for each arrow key (row 0 is the top of the wide board). */
const ARROW_DIRECTIONS: Record<string, Coord> = {
  ArrowUp: { col: 0, row: -1 },
  ArrowDown: { col: 0, row: 1 },
  ArrowLeft: { col: -1, row: 0 },
  ArrowRight: { col: 1, row: 0 },
};

/** Stable string key for a coord, also used as the `data-rink-tile` value. */
export function coordKey(coord: Coord): string {
  return `${coord.col},${coord.row}`;
}

/**
 * The nearest candidate tile (Manhattan distance) lying in the arrow key's
 * direction from `from`, or null when the key is not an arrow or nothing
 * lies that way.
 */
export function nextTileInDirection(
  key: string,
  from: Coord,
  candidates: Coord[],
): Coord | null {
  const direction = ARROW_DIRECTIONS[key];
  if (!direction) return null;

  const distanceFrom = (coord: Coord) =>
    Math.abs(coord.col - from.col) + Math.abs(coord.row - from.row);
  const ahead = candidates.filter(
    (candidate) =>
      direction.col * (candidate.col - from.col) +
        direction.row * (candidate.row - from.row) >
      0,
  );
  ahead.sort((a, b) => distanceFrom(a) - distanceFrom(b));
  return ahead[0] ?? null;
}

/**
 * Arrow-key handler shared by both rink renderers: moves focus from the tile
 * button at `from` to the nearest highlighted tile button in that direction.
 */
export function focusNextRinkTile(
  event: KeyboardEvent<HTMLElement>,
  from: Coord,
  highlighted: Coord[],
): void {
  if (!(event.key in ARROW_DIRECTIONS)) return;
  event.preventDefault();
  const next = nextTileInDirection(event.key, from, highlighted);
  if (!next) return;
  document
    .querySelector<HTMLButtonElement>(`[data-rink-tile="${coordKey(next)}"]`)
    ?.focus();
}

/** Accessible name of a skater's button on either rink renderer. */
export function skaterControlLabel(skater: Skater, hasPuck: boolean): string {
  return `${TEAM_NAME[skater.team]} ${skater.role}${hasPuck ? ', has puck' : ''}`;
}
