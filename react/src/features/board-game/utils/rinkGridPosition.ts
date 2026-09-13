import type { Coord } from '@/features/board-game/types/game';
import { BOARD_COLS } from '@/features/board-game/data/balance';

/**
 * Maps an engine coord to its CSS grid placement. Engine coordinates never
 * change — this is display-only. On narrow screens the board is rotated:
 * engine `row` becomes the horizontal axis and engine `col` becomes the
 * vertical axis, flipped so Blue's net (col 0) sits at the bottom.
 */
export function gridPositionFor(
  coord: Coord,
  narrow: boolean,
): { gridColumn: number; gridRow: number } {
  if (narrow) {
    return { gridColumn: coord.row + 1, gridRow: BOARD_COLS - coord.col };
  }
  return { gridColumn: coord.col + 1, gridRow: coord.row + 1 };
}
