import {
  BLUE_LINE_X,
  CORNER_RADIUS,
  CREASE_RADIUS,
  FACEOFF_CIRCLE_RADIUS,
  FACEOFF_DOT_X,
  FACEOFF_DOT_Y,
  GOAL_LINE_X,
  NET_DEPTH,
  NET_HALF_WIDTH,
  RINK_HALF_LENGTH,
  RINK_HALF_WIDTH,
  RinkScale,
} from '@/features/game-detail/utils/rinkGeometry';
import styles from '@/features/game-detail/components/GameShots.module.css';

/** Where a goal line meets the rounded corner boards, so it stops at the boards. */
const GOAL_LINE_INSET = 6;

/** A full NHL rink in muted lines: boards, center/blue/goal lines, circles, creases and nets. */
function RinkOutline({ scale }: { scale: RinkScale }) {
  const { toPixelX, toPixelY, pixelsPerFoot } = scale;
  const feet = (length: number) => length * pixelsPerFoot;

  /** A full-width line across the ice at `x`, shortened at the corners when asked. */
  const crossLine = (
    x: number,
    className: string,
    width: number,
    inset = 0,
  ) => (
    <line
      key={`${className}-${x}`}
      className={className}
      x1={toPixelX(x)}
      x2={toPixelX(x)}
      y1={toPixelY(RINK_HALF_WIDTH - inset)}
      y2={toPixelY(-RINK_HALF_WIDTH + inset)}
      strokeWidth={width}
    />
  );

  return (
    <g>
      <rect
        className={styles['rink-ice']}
        x={toPixelX(-RINK_HALF_LENGTH)}
        y={toPixelY(RINK_HALF_WIDTH)}
        width={feet(2 * RINK_HALF_LENGTH)}
        height={feet(2 * RINK_HALF_WIDTH)}
        rx={feet(CORNER_RADIUS)}
      />
      {crossLine(0, styles['rink-red'], 2)}
      {crossLine(-BLUE_LINE_X, styles['rink-blue'], 2.5)}
      {crossLine(BLUE_LINE_X, styles['rink-blue'], 2.5)}
      {crossLine(-GOAL_LINE_X, styles['rink-red'], 1, GOAL_LINE_INSET)}
      {crossLine(GOAL_LINE_X, styles['rink-red'], 1, GOAL_LINE_INSET)}
      <circle
        className={styles['rink-blue']}
        cx={toPixelX(0)}
        cy={toPixelY(0)}
        r={feet(FACEOFF_CIRCLE_RADIUS)}
        strokeWidth={1}
      />
      {[-FACEOFF_DOT_X, FACEOFF_DOT_X].flatMap((dotX) =>
        [-FACEOFF_DOT_Y, FACEOFF_DOT_Y].map((dotY) => (
          <g key={`${dotX},${dotY}`}>
            <circle
              className={styles['rink-red']}
              cx={toPixelX(dotX)}
              cy={toPixelY(dotY)}
              r={feet(FACEOFF_CIRCLE_RADIUS)}
              strokeWidth={1}
            />
            <circle
              className={styles['rink-dot']}
              cx={toPixelX(dotX)}
              cy={toPixelY(dotY)}
              r={1.5}
            />
          </g>
        )),
      )}
      {[-GOAL_LINE_X, GOAL_LINE_X].map((goalX) => {
        const isRightEnd = goalX > 0;
        return (
          <g key={goalX}>
            <path
              className={styles['rink-crease']}
              strokeWidth={1}
              d={`M${toPixelX(goalX)} ${toPixelY(CREASE_RADIUS)} A ${feet(
                CREASE_RADIUS,
              )} ${feet(CREASE_RADIUS)} 0 0 ${isRightEnd ? 0 : 1} ${toPixelX(
                goalX,
              )} ${toPixelY(-CREASE_RADIUS)} Z`}
            />
            <rect
              className={styles['rink-net']}
              x={toPixelX(isRightEnd ? goalX : goalX - NET_DEPTH)}
              y={toPixelY(NET_HALF_WIDTH)}
              width={feet(NET_DEPTH)}
              height={feet(2 * NET_HALF_WIDTH)}
            />
          </g>
        );
      })}
    </g>
  );
}

export default RinkOutline;
