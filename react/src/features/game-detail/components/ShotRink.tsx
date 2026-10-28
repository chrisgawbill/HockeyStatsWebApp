import { ReactNode, useRef, useState } from 'react';
import styles from '@/features/game-detail/components/GameShots.module.css';
import ChartTooltip from '@/features/game-detail/components/ChartTooltip';
import RinkOutline from '@/features/game-detail/components/RinkOutline';
import { useElementWidth } from '@/features/game-detail/hooks/useElementWidth';
import { ShotEvent } from '@/features/game-detail/types/playByPlay';
import { createRinkScale } from '@/features/game-detail/utils/rinkGeometry';
import {
  STRENGTH_LABELS,
  getPeriodLabel,
} from '@/features/game-detail/utils/shotMapHelper';

interface ShotRinkProps {
  /** Shots to draw; each must have coordinates (see `isMappedShot`). */
  shots: ShotEvent[];
  homeTriCode: string;
  awayTriCode: string;
  /** Shown over a faded rink in place of the markers, e.g. for an empty result. */
  message?: ReactNode;
}

const PHONE_WIDTH = 500;
const HIT_RADIUS = 12;
/** Goals draw last so they sit on top of the other markers. */
const DRAW_ORDER: ShotEvent['type'][] = ['miss', 'shot', 'goal'];
const TYPE_LABELS: Record<ShotEvent['type'], string> = {
  goal: 'Goal',
  shot: 'Shot on goal',
  miss: 'Missed',
  block: 'Blocked',
};

/** "Wrist" from "wrist", "Tip-In" from "tip-in". */
function formatShotType(shotType: string): string {
  return shotType.replace(/(^|-)(\w)/g, (letter) => letter.toUpperCase());
}

/** The tooltip's detail line: period and clock, shot type, strength. */
function describeShot(shot: ShotEvent): string {
  return [
    `${getPeriodLabel(shot.period)} ${shot.timeInPeriod ?? ''}`.trim(),
    shot.shotType ? formatShotType(shot.shotType) : null,
    shot.strength ? STRENGTH_LABELS[shot.strength] : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

/** One marker: a filled dot for a goal, a ring for a shot on goal, an × for a miss. */
function ShotMarker({
  shot,
  cx,
  cy,
  radius,
  colorVar,
}: {
  shot: ShotEvent;
  cx: number;
  cy: number;
  radius: number;
  colorVar: string;
}) {
  if (shot.type === 'goal') {
    return (
      <circle
        className={styles['shot-marker--goal']}
        cx={cx}
        cy={cy}
        r={radius + 1.5}
        fill={colorVar}
      />
    );
  }
  if (shot.type === 'shot') {
    return (
      <circle
        className={styles['shot-marker--shot']}
        cx={cx}
        cy={cy}
        r={radius}
        stroke={colorVar}
      />
    );
  }
  const arm = radius * 0.75;
  return (
    <path
      className={styles['shot-marker--miss']}
      d={`M${cx - arm} ${cy - arm} L${cx + arm} ${cy + arm} M${cx - arm} ${
        cy + arm
      } L${cx + arm} ${cy - arm}`}
      stroke={colorVar}
    />
  );
}

/**
 * The full rink with one marker per shot, home attacking right. Hovering or
 * tapping a marker shows the shooter, time, shot type and strength. Hidden
 * from assistive technology; the summary table carries the numbers.
 */
function ShotRink({ shots, homeTriCode, awayTriCode, message }: ShotRinkProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const width = useElementWidth(frameRef);
  const [activeShotId, setActiveShotId] = useState<number | null>(null);
  const scale = createRinkScale(width);
  const markerRadius = width < PHONE_WIDTH ? 4 : 5;
  const directionLabelSize = width < PHONE_WIDTH ? 10 : 11;
  const activeShot = message
    ? undefined
    : shots.find((shot) => shot.eventId === activeShotId);
  const colorFor = (shot: ShotEvent) =>
    shot.teamTriCode === homeTriCode ? 'var(--shot-home)' : 'var(--shot-away)';
  const orderedShots = DRAW_ORDER.flatMap((type) =>
    shots.filter((shot) => shot.type === type),
  );

  return (
    <div
      ref={frameRef}
      className={`${styles['chart-frame']} ${
        message ? styles['chart-frame--faded'] : ''
      }`}
      data-testid="shot-rink"
    >
      {width > 0 && (
        <svg
          viewBox={`0 0 ${scale.width} ${scale.height}`}
          width={scale.width}
          height={scale.height}
          aria-hidden="true"
          onPointerLeave={() => setActiveShotId(null)}
        >
          <RinkOutline scale={scale} />
          <text
            className={styles['axis-text']}
            x={scale.toPixelX(-4)}
            y={scale.toPixelY(-37)}
            textAnchor="end"
            fontSize={directionLabelSize}
          >
            {`◀ ${awayTriCode} shoots`}
          </text>
          <text
            className={styles['axis-text']}
            x={scale.toPixelX(4)}
            y={scale.toPixelY(-37)}
            fontSize={directionLabelSize}
          >
            {`${homeTriCode} shoots ▶`}
          </text>
          {!message &&
            orderedShots.map((shot) => {
              const cx = scale.toPixelX(shot.x!);
              const cy = scale.toPixelY(shot.y!);
              return (
                <g
                  key={shot.eventId}
                  data-shot-type={shot.type}
                  data-team={shot.teamTriCode}
                  onPointerEnter={() => setActiveShotId(shot.eventId)}
                  onPointerDown={() => setActiveShotId(shot.eventId)}
                >
                  <ShotMarker
                    shot={shot}
                    cx={cx}
                    cy={cy}
                    radius={markerRadius}
                    colorVar={colorFor(shot)}
                  />
                  <circle
                    className={styles['shot-hit-area']}
                    cx={cx}
                    cy={cy}
                    r={HIT_RADIUS}
                  />
                </g>
              );
            })}
          {activeShot && (
            <circle
              className={styles['shot-marker--active']}
              cx={scale.toPixelX(activeShot.x!)}
              cy={scale.toPixelY(activeShot.y!)}
              r={markerRadius + 5}
            />
          )}
        </svg>
      )}
      {activeShot && (
        <ChartTooltip
          anchorX={scale.toPixelX(activeShot.x!)}
          anchorY={scale.toPixelY(activeShot.y!)}
          frameWidth={width}
        >
          <strong>
            {`${TYPE_LABELS[activeShot.type]} · ${activeShot.shooterName ?? activeShot.teamTriCode ?? ''}`}
          </strong>
          {describeShot(activeShot)}
        </ChartTooltip>
      )}
      {message && <div className={styles['chart-message']}>{message}</div>}
    </div>
  );
}

export default ShotRink;
