import type { CSSProperties } from 'react';
import type { Coord } from '@/features/board-game/types/game';
import {
  LINE_COLUMNS,
  UNPLAYABLE_CORNERS,
} from '@/features/board-game/data/rink';
import { isPlayable, sameCoord } from '@/features/board-game/engine/rink';
import { gridPositionFor } from '@/features/board-game/utils/rinkGridPosition';
import styles from '@/features/board-game/components/RinkBoard.module.css';

export interface RinkTileProps {
  coord: Coord;
  highlighted: boolean;
  narrow: boolean;
  onClick: () => void;
}

/** One rink tile: draws line/goal markings and hides unplayable corners. */
export default function RinkTile({
  coord,
  highlighted,
  narrow,
  onClick,
}: RinkTileProps) {
  const isCorner = UNPLAYABLE_CORNERS.some((c) => sameCoord(c, coord));
  const isGoal = !isCorner && !isPlayable(coord);
  const isBlueLine =
    LINE_COLUMNS.userBlueLine.includes(coord.col) ||
    LINE_COLUMNS.cpuBlueLine.includes(coord.col);
  const isRedLine = LINE_COLUMNS.redLine.includes(coord.col);

  const style: CSSProperties = gridPositionFor(coord, narrow);

  if (isCorner) {
    return <div className={styles.tile} style={style} aria-hidden="true" />;
  }

  const className = [
    styles.tile,
    highlighted ? styles.tileHighlighted : '',
    isBlueLine ? (narrow ? styles.tileBlueLineH : styles.tileBlueLine) : '',
    isRedLine ? (narrow ? styles.tileRedLineH : styles.tileRedLine) : '',
    isGoal ? styles.tileGoal : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={className}
      style={style}
      onClick={onClick}
      aria-label={`Tile ${coord.col},${coord.row}`}
    />
  );
}
