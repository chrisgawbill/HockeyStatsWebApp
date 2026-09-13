import type { ReactNode } from 'react';
import type { Coord, Puck, Skater } from '@/features/board-game/types/game';
import { BOARD_COLS, BOARD_ROWS } from '@/features/board-game/data/balance';
import { TEAM_NAME } from '@/features/board-game/data/teams';
import { useIsNarrow } from '@/features/board-game/hooks/useIsNarrow';
import { gridPositionFor } from '@/features/board-game/utils/rinkGridPosition';
import RinkTile from '@/features/board-game/components/RinkTile';
import PuckToken from '@/features/board-game/components/PuckToken';
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
  const boardClassName = [styles.board, narrow ? styles.boardNarrow : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={boardClassName}
      style={{
        gridTemplateColumns: `repeat(${displayCols}, 1fr)`,
        gridTemplateRows: `repeat(${displayRows}, 1fr)`,
      }}
    >
      {tiles.map((coord) => (
        <RinkTile
          key={coordKey(coord)}
          coord={coord}
          highlighted={highlightedKeys.has(coordKey(coord))}
          narrow={narrow}
          onClick={() => onTileClick(coord)}
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
