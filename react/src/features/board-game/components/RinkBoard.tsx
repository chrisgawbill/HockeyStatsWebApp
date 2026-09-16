import type { KeyboardEvent, ReactNode } from 'react';
import type { Coord, Puck, Skater } from '@/features/board-game/types/game';
import { BOARD_COLS, BOARD_ROWS } from '@/features/board-game/data/balance';
import { RINK_CORNER_RADIUS } from '@/features/board-game/data/rink';
import { TEAM_NAME } from '@/features/board-game/data/teams';
import { useIsNarrow } from '@/features/board-game/hooks/useIsNarrow';
import { gridPositionFor } from '@/features/board-game/utils/rinkGridPosition';
import RinkTile from '@/features/board-game/components/RinkTile';
import PuckToken from '@/features/board-game/components/PuckToken';
import RinkOverlay from '@/features/board-game/components/RinkOverlay';
import styles from '@/features/board-game/components/RinkBoard.module.css';

export interface RinkBoardProps {
  skaters: Skater[];
  puck: Puck;
  highlighted: Coord[];
  selectedId: string | null;
  onTileClick: (coord: Coord) => void;
  onSkaterClick: (id: string) => void;
  renderSkater: (skater: Skater) => ReactNode;
}

function coordKey(c: Coord): string {
  return `${c.col},${c.row}`;
}

/**
 * CSS grid rink board. Tiles, skaters, and a loose puck are layered via grid
 * placement. On narrow screens (`useIsNarrow`) the board rotates to a
 * 7x15 vertical layout with Blue's net at the bottom; engine coords never
 * change, only their display grid placement (`gridPositionFor`).
 */
export default function RinkBoard({
  skaters,
  puck,
  highlighted,
  selectedId,
  onTileClick,
  onSkaterClick,
  renderSkater,
}: RinkBoardProps) {
  const narrow = useIsNarrow();
  const highlightedKeys = new Set(highlighted.map(coordKey));
  const tiles: Coord[] = [];
  for (let row = 0; row < BOARD_ROWS; row++) {
    for (let col = 0; col < BOARD_COLS; col++) {
      tiles.push({ col, row });
    }
  }

  const loosePuckCoord = puck.kind === 'loose' ? puck.pos : null;
  const carrierId = puck.kind === 'carried' ? puck.skaterId : null;

  const displayCols = narrow ? BOARD_ROWS : BOARD_COLS;
  const displayRows = narrow ? BOARD_COLS : BOARD_ROWS;
  // Rounded ends as percentages of the board box, from the same radius the
  // engine uses to decide which corner tiles are unplayable.
  const radiusAlongPct = (RINK_CORNER_RADIUS.x / BOARD_COLS) * 100;
  const radiusAcrossPct = (RINK_CORNER_RADIUS.y / BOARD_ROWS) * 100;
  const borderRadius = narrow
    ? `${radiusAcrossPct}% / ${radiusAlongPct}%`
    : `${radiusAlongPct}% / ${radiusAcrossPct}%`;
  const boardClassName = [styles.board, narrow ? styles.boardNarrow : '']
    .filter(Boolean)
    .join(' ');

  function handleTileKeyDown(
    coord: Coord,
    event: KeyboardEvent<HTMLButtonElement>,
  ) {
    if (
      !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)
    )
      return;
    event.preventDefault();

    const direction = {
      ArrowUp: { col: 0, row: -1 },
      ArrowDown: { col: 0, row: 1 },
      ArrowLeft: { col: -1, row: 0 },
      ArrowRight: { col: 1, row: 0 },
    }[event.key];
    if (!direction) return;

    const candidates = highlighted.filter((candidate) => {
      const col = candidate.col - coord.col;
      const row = candidate.row - coord.row;
      return direction.col * col + direction.row * row > 0;
    });
    candidates.sort((a, b) => {
      const aDistance =
        Math.abs(a.col - coord.col) + Math.abs(a.row - coord.row);
      const bDistance =
        Math.abs(b.col - coord.col) + Math.abs(b.row - coord.row);
      return aDistance - bDistance;
    });
    const next = candidates[0];
    if (!next) return;
    const button = document.querySelector<HTMLButtonElement>(
      `[data-rink-tile="${coordKey(next)}"]`,
    );
    button?.focus();
  }

  return (
    <div
      className={boardClassName}
      style={{
        gridTemplateColumns: `repeat(${displayCols}, 1fr)`,
        gridTemplateRows: `repeat(${displayRows}, 1fr)`,
        borderRadius,
      }}
    >
      <RinkOverlay narrow={narrow} />
      {tiles.map((coord) => (
        <RinkTile
          key={coordKey(coord)}
          coord={coord}
          highlighted={highlightedKeys.has(coordKey(coord))}
          narrow={narrow}
          actionable={highlightedKeys.has(coordKey(coord))}
          onClick={() => onTileClick(coord)}
          onKeyDown={(event) => handleTileKeyDown(coord, event)}
        />
      ))}
      {loosePuckCoord && (
        <div
          className={styles.puckSlot}
          style={gridPositionFor(loosePuckCoord, narrow)}
        >
          <PuckToken loose />
        </div>
      )}
      {skaters.map((skater) => {
        const hasPuck = skater.id === carrierId;
        const label = `${TEAM_NAME[skater.team]} ${skater.role}${hasPuck ? ', has puck' : ''}`;
        return (
          <button
            key={skater.id}
            type="button"
            className={styles.skaterSlot}
            style={gridPositionFor(skater.pos, narrow)}
            aria-pressed={skater.id === selectedId}
            aria-label={label}
            onClick={() => onSkaterClick(skater.id)}
          >
            {renderSkater(skater)}
          </button>
        );
      })}
    </div>
  );
}
