import type { Skater } from '@/features/board-game/types/game';
import {
  GOALIE_IDLE,
  SKATER_IDLE,
  SKATER_SKATE,
  type SpriteFrame,
} from '@/features/board-game/data/sprites';
import PuckToken from '@/features/board-game/components/PuckToken';
import styles from '@/features/board-game/components/SkaterSprite.module.css';

export interface SkaterSpriteProps {
  skater: Skater;
  hasPuck: boolean;
  selected: boolean;
  stunned: boolean;
  moving: boolean;
  /** Shows an idle "you can move this skater" ring cue. Never true while `selected` is true. */
  movable?: boolean;
}

const PALETTE: Record<string, string> = {
  H: 'var(--color-text)',
  S: 'var(--color-muted-text)',
  K: 'var(--color-text-secondary)',
  P: 'var(--color-text-secondary)',
  W: 'var(--color-text)',
};

interface Run {
  row: number;
  startCol: number;
  length: number;
  fill: string;
}

/** Merges each row's same-character runs into one rect per run, to keep the sprite's DOM small. */
function rowRuns(frame: SpriteFrame): Run[] {
  const runs: Run[] = [];
  frame.forEach((row, rowIndex) => {
    let col = 0;
    while (col < row.length) {
      const char = row[col];
      if (char === '.') {
        col++;
        continue;
      }
      let end = col + 1;
      while (end < row.length && row[end] === char) end++;
      runs.push({
        row: rowIndex,
        startCol: col,
        length: end - col,
        fill: char === 'J' ? 'currentColor' : PALETTE[char],
      });
      col = end;
    }
  });
  return runs;
}

/** Pixel-art skater/goalie sprite. Jersey color comes from the team token via `currentColor`. */
export default function SkaterSprite({
  skater,
  hasPuck,
  selected,
  stunned,
  moving,
  movable = false,
}: SkaterSpriteProps) {
  const frame: SpriteFrame =
    skater.role === 'G' ? GOALIE_IDLE : moving ? SKATER_SKATE : SKATER_IDLE;
  const runs = rowRuns(frame);

  const className = [
    styles.wrapper,
    selected ? styles.selected : '',
    !selected && movable ? styles.movable : '',
    stunned ? styles.stunned : '',
  ]
    .filter(Boolean)
    .join(' ');

  const svgClassName = [
    styles.svg,
    skater.team === 'user' ? styles.teamUser : styles.teamCpu,
  ].join(' ');

  return (
    <div className={className}>
      {hasPuck && <span className={styles.puckGlow} aria-hidden="true" />}
      <svg
        viewBox="0 0 16 16"
        width="100%"
        height="100%"
        shapeRendering="crispEdges"
        className={svgClassName}
        role="presentation"
      >
        {runs.map((run, i) => (
          <rect
            key={i}
            x={run.startCol}
            y={run.row}
            width={run.length}
            height={1}
            fill={run.fill}
          />
        ))}
      </svg>
      <span className={styles.roleLabel}>{skater.role}</span>
      {hasPuck && (
        <span className={styles.puckBadge}>
          <PuckToken loose={false} />
        </span>
      )}
      {stunned && (
        <span className={styles.stunBadge} aria-hidden="true">
          💫
        </span>
      )}
    </div>
  );
}
