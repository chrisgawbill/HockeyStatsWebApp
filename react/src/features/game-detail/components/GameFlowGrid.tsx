import styles from '@/features/game-detail/components/GameShots.module.css';
import { FlowPeriodSpan } from '@/features/game-detail/utils/gameFlowHelper';

interface GameFlowGridProps {
  /** Attempt counts to label on the y-axis, from 0. */
  ticks: number[];
  timeline: FlowPeriodSpan[];
  /** The plot area's edges in pixels. */
  plot: { left: number; right: number; top: number; bottom: number };
  height: number;
  toX: (seconds: number) => number;
  toY: (attempts: number) => number;
}

/**
 * The game flow's frame: hairline gridlines with attempt ticks, a divider at
 * the start of each period after the first, a shaded overtime band, and the
 * period names under the plot.
 */
function GameFlowGrid({
  ticks,
  timeline,
  plot,
  height,
  toX,
  toY,
}: GameFlowGridProps) {
  return (
    <g>
      {ticks.map((tick) => (
        <g key={tick}>
          <line
            className={styles.gridline}
            x1={plot.left}
            x2={plot.right}
            y1={toY(tick)}
            y2={toY(tick)}
          />
          <text
            className={styles['axis-text']}
            x={plot.left - 6}
            y={toY(tick) + 4}
            textAnchor="end"
          >
            {tick}
          </text>
        </g>
      ))}
      {timeline.map((span) => (
        <g key={span.period} data-period={span.label}>
          {span.isOvertime && (
            <rect
              className={styles['overtime-band']}
              data-testid="overtime-band"
              x={toX(span.startSeconds)}
              y={plot.top}
              width={toX(span.endSeconds) - toX(span.startSeconds)}
              height={plot.bottom - plot.top}
            />
          )}
          {span.startSeconds > 0 && (
            <line
              className={styles['period-divider']}
              data-testid="period-divider"
              x1={toX(span.startSeconds)}
              x2={toX(span.startSeconds)}
              y1={plot.top - 6}
              y2={plot.bottom}
            />
          )}
          <text
            className={styles['period-label']}
            x={(toX(span.startSeconds) + toX(span.endSeconds)) / 2}
            y={height - 8}
            textAnchor="middle"
          >
            {span.label}
          </text>
        </g>
      ))}
    </g>
  );
}

export default GameFlowGrid;
