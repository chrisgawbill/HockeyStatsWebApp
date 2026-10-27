import { PointerEvent, useMemo, useRef, useState } from 'react';
import shared from '@/styles/shared.module.css';
import styles from '@/features/game-detail/components/GameShots.module.css';
import ChartTooltip from '@/features/game-detail/components/ChartTooltip';
import GameFlowGrid from '@/features/game-detail/components/GameFlowGrid';
import { useElementWidth } from '@/features/game-detail/hooks/useElementWidth';
import { ShotEvent } from '@/features/game-detail/types/playByPlay';
import {
  FlowPeriodSpan,
  FlowSeries,
  buildFlowSeries,
  countAttemptsAt,
  formatGameMoment,
} from '@/features/game-detail/utils/gameFlowHelper';

interface GameFlowChartProps {
  events: ShotEvent[];
  timeline: FlowPeriodSpan[];
  endSeconds: number;
  homeTriCode: string;
  awayTriCode: string;
}

interface TeamLine {
  series: FlowSeries;
  colorVar: string;
  role: 'away' | 'home';
}

const MARGIN = { left: 32, right: 56, top: 16, bottom: 26 };
const PHONE_WIDTH = 500;
const MIN_END_LABEL_GAP = 14;
const TICK_STEPS = [5, 10, 20, 25, 50];
const MAX_TICKS = 5;

/** A round y-axis maximum and tick step for the larger team's attempts (at most five ticks). */
function chooseAttemptScale(maxAttempts: number): {
  max: number;
  step: number;
} {
  const step =
    TICK_STEPS.find((candidate) => maxAttempts / candidate <= MAX_TICKS) ??
    TICK_STEPS[TICK_STEPS.length - 1];
  return { max: Math.max(step, Math.ceil(maxAttempts / step) * step), step };
}

/** Pushes two end labels apart just enough to not overlap; returns their y positions. */
function separateEndLabels(firstY: number, secondY: number): [number, number] {
  const gap = Math.abs(firstY - secondY);
  if (gap >= MIN_END_LABEL_GAP) return [firstY, secondY];
  const shift = (MIN_END_LABEL_GAP - gap) / 2;
  return firstY <= secondY
    ? [firstY - shift, secondY + shift]
    : [firstY + shift, secondY - shift];
}

/**
 * Game flow: each team's cumulative shot attempts as a step line over game
 * time, with goal dots, period dividers, a shaded overtime band and end
 * labels. A crosshair reads both teams' attempts at any moment. Hidden from
 * assistive technology; the shot map's summary table carries the numbers.
 */
function GameFlowChart({
  events,
  timeline,
  endSeconds,
  homeTriCode,
  awayTriCode,
}: GameFlowChartProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const width = useElementWidth(frameRef);
  const [hoveredSeconds, setHoveredSeconds] = useState<number | null>(null);

  const teamLines: TeamLine[] = useMemo(
    () => [
      {
        series: buildFlowSeries(events, awayTriCode, endSeconds),
        colorVar: 'var(--shot-away)',
        role: 'away',
      },
      {
        series: buildFlowSeries(events, homeTriCode, endSeconds),
        colorVar: 'var(--shot-home)',
        role: 'home',
      },
    ],
    [events, awayTriCode, homeTriCode, endSeconds],
  );

  const hasEvents = events.length > 0;
  const height = width < PHONE_WIDTH ? 220 : 260;
  const plotWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const plotBottom = height - MARGIN.bottom;
  const timelineEnd = timeline[timeline.length - 1]?.endSeconds ?? 3600;
  const attemptScale = chooseAttemptScale(
    Math.max(...teamLines.map((line) => line.series.totalAttempts)),
  );
  const toX = (seconds: number) =>
    MARGIN.left + (seconds / timelineEnd) * plotWidth;
  const toY = (attempts: number) =>
    plotBottom - (attempts / attemptScale.max) * (plotBottom - MARGIN.top);

  /** Step path: flat until each attempt, then up by one. */
  const describeStepLine = (series: FlowSeries) =>
    series.points
      .map((point, index) =>
        index === 0
          ? `M${toX(point.elapsedSeconds)} ${toY(point.attempts)}`
          : `H${toX(point.elapsedSeconds)} V${toY(point.attempts)}`,
      )
      .join(' ');

  const trackPointer = (event: PointerEvent<SVGRectElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const fraction = (event.clientX - bounds.left) / bounds.width;
    setHoveredSeconds(
      Math.max(0, Math.min(endSeconds, fraction * timelineEnd)),
    );
  };

  const [awayLabelY, homeLabelY] = separateEndLabels(
    toY(teamLines[0].series.totalAttempts),
    toY(teamLines[1].series.totalAttempts),
  );
  const endLabelYs = { away: awayLabelY, home: homeLabelY };
  const overtimeWinner = teamLines
    .flatMap((line) => line.series.goals)
    .find((goal) =>
      timeline.some(
        (span) => span.isOvertime && span.period === goal.event.period,
      ),
    );

  return (
    <section
      className={`${shared.section} ${shared.surface} ${styles['shot-card']}`}
      aria-labelledby="game-flow-heading"
    >
      <h2 id="game-flow-heading" className={shared.sectionTitle}>
        Game flow
      </h2>
      <p className={styles['shot-card__subtitle']}>
        Shot attempts over the game (on goal, missed and blocked). Dots mark
        goals.
        <span className="ds-visually-hidden">
          {' '}
          The table under the shot map lists shots and goals by period.
        </span>
      </p>
      <div
        ref={frameRef}
        className={`${styles['chart-frame']} ${
          hasEvents ? '' : styles['chart-frame--faded']
        }`}
        data-testid="game-flow-chart"
      >
        {width > 0 && (
          <svg
            viewBox={`0 0 ${width} ${height}`}
            width={width}
            height={height}
            aria-hidden="true"
          >
            <GameFlowGrid
              ticks={Array.from(
                { length: attemptScale.max / attemptScale.step + 1 },
                (_, index) => index * attemptScale.step,
              )}
              timeline={timeline}
              plot={{
                left: MARGIN.left,
                right: MARGIN.left + plotWidth,
                top: MARGIN.top,
                bottom: plotBottom,
              }}
              height={height}
              toX={toX}
              toY={toY}
            />
            {hasEvents &&
              teamLines.map(({ series, colorVar, role }) => (
                <g key={role} data-team={series.teamTriCode}>
                  <path
                    className={styles['flow-line']}
                    d={describeStepLine(series)}
                    stroke={colorVar}
                  />
                  {series.goals.map((goal) => (
                    <circle
                      key={goal.event.eventId}
                      className={styles['goal-dot']}
                      data-testid="flow-goal"
                      cx={toX(goal.elapsedSeconds)}
                      cy={toY(goal.attempts)}
                      r={5}
                      fill={colorVar}
                    />
                  ))}
                  <text
                    className={styles['end-label']}
                    x={toX(endSeconds) + 8}
                    y={endLabelYs[role] + 4}
                  >
                    {`${series.teamTriCode} ${series.totalAttempts}`}
                  </text>
                </g>
              ))}
            {overtimeWinner && (
              <text
                className={styles.annotation}
                x={toX(overtimeWinner.elapsedSeconds) - 10}
                y={toY(overtimeWinner.attempts) - 6}
                textAnchor="end"
              >
                {`OT winner ${overtimeWinner.event.timeInPeriod ?? ''}`}
              </text>
            )}
            {hoveredSeconds !== null && (
              <line
                className={styles.crosshair}
                x1={toX(hoveredSeconds)}
                x2={toX(hoveredSeconds)}
                y1={MARGIN.top}
                y2={plotBottom}
              />
            )}
            {hasEvents && (
              <rect
                x={MARGIN.left}
                y={MARGIN.top}
                width={plotWidth}
                height={plotBottom - MARGIN.top}
                fill="transparent"
                onPointerMove={trackPointer}
                onPointerDown={trackPointer}
                onPointerLeave={() => setHoveredSeconds(null)}
              />
            )}
          </svg>
        )}
        {hoveredSeconds !== null && (
          <ChartTooltip
            anchorX={toX(hoveredSeconds)}
            anchorY={MARGIN.top + 12}
            frameWidth={width}
          >
            <span>{formatGameMoment(hoveredSeconds, timeline)}</span>
            {[...teamLines].reverse().map(({ series, colorVar, role }) => (
              <span key={role} className={styles['tooltip-row']}>
                <span
                  className={styles['line-key']}
                  style={{ background: colorVar }}
                />
                <strong>{countAttemptsAt(series, hoveredSeconds)}</strong>
                {series.teamTriCode}
              </span>
            ))}
          </ChartTooltip>
        )}
        {!hasEvents && (
          <div className={styles['chart-message']}>
            <p>No shots yet. The game flow fills in as the game goes.</p>
          </div>
        )}
      </div>
      <ul className={styles.legend} aria-hidden="true">
        <li>
          <span className={`${styles['line-key']} ${styles['away-color']}`} />
          {awayTriCode} (away)
        </li>
        <li>
          <span className={`${styles['line-key']} ${styles['home-color']}`} />
          {homeTriCode} (home)
        </li>
        <li>
          <svg width="12" height="12">
            <circle className={styles['legend-mark']} cx="6" cy="6" r="4.5" />
          </svg>
          Goal
        </li>
      </ul>
    </section>
  );
}

export default GameFlowChart;
