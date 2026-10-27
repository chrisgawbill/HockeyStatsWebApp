import { ReactNode } from 'react';
import styles from '@/features/game-detail/components/GameShots.module.css';

interface ChartTooltipProps {
  /** Point the tooltip describes, in pixels from the chart frame's top-left. */
  anchorX: number;
  anchorY: number;
  frameWidth: number;
  children: ReactNode;
}

const ANCHOR_GAP = 12;

/**
 * Pointer readout beside a chart point: to the right of it on the left half
 * of the chart, to the left on the right half, so it stays inside the frame.
 * It only repeats values the text summary also gives.
 */
function ChartTooltip({
  anchorX,
  anchorY,
  frameWidth,
  children,
}: ChartTooltipProps) {
  const isOnRightHalf = anchorX > frameWidth / 2;
  const horizontal = isOnRightHalf
    ? { right: Math.max(0, frameWidth - anchorX + ANCHOR_GAP) }
    : { left: anchorX + ANCHOR_GAP };
  return (
    <div
      className={styles.tooltip}
      style={{ ...horizontal, top: Math.max(0, anchorY - ANCHOR_GAP) }}
      aria-hidden="true"
    >
      {children}
    </div>
  );
}

export default ChartTooltip;
