import { ShotEvent } from '@/features/game-detail/types/playByPlay';
import { GamePeriod } from '@/features/game-detail/utils/shotMapHelper';

/**
 * Series for the game flow chart: each team's cumulative shot attempts
 * (goals, shots on goal, misses and blocks) against elapsed game time.
 * Events without a location still count; events without a time cannot be
 * placed on the timeline and are left out of the chart only.
 */
export interface FlowPoint {
  elapsedSeconds: number;
  attempts: number; // attempts so far, including this point's event
}

export interface FlowGoal extends FlowPoint {
  event: ShotEvent;
}

export interface FlowSeries {
  teamTriCode: string;
  /** Starts at (0, 0), one point per attempt, ends at the series end. */
  points: FlowPoint[];
  goals: FlowGoal[];
  totalAttempts: number;
}

export interface FlowPeriodSpan {
  period: number;
  label: string;
  startSeconds: number;
  endSeconds: number;
  isOvertime: boolean;
}

const PERIOD_SECONDS = 20 * 60;
const REGULAR_SEASON_OVERTIME_SECONDS = 5 * 60;
const PLAYOFF_GAME_TYPE = 3;

/** Whether an NHL game id (YYYYTTNNNN) is a playoff game, whose overtime periods last 20 minutes. */
export function isPlayoffGame(gameId: number): boolean {
  return Math.floor(gameId / 10_000) % 100 === PLAYOFF_GAME_TYPE;
}

/** Each period's place on the timeline; regular-season overtime is five minutes. */
export function buildFlowTimeline(
  periods: GamePeriod[],
  isPlayoff: boolean,
): FlowPeriodSpan[] {
  return periods.map(({ period, label, isOvertime }) => {
    const startSeconds = (period - 1) * PERIOD_SECONDS;
    const length =
      isOvertime && !isPlayoff
        ? REGULAR_SEASON_OVERTIME_SECONDS
        : PERIOD_SECONDS;
    return {
      period,
      label,
      startSeconds,
      endSeconds: startSeconds + length,
      isOvertime,
    };
  });
}

/** Events with a time, in time order. */
function sortTimedEvents(events: ShotEvent[]): ShotEvent[] {
  return events
    .filter((event) => event.elapsedSeconds !== null)
    .sort((first, second) => first.elapsedSeconds! - second.elapsedSeconds!);
}

/**
 * Where the lines stop: the latest event while the game is on; for a final,
 * the overtime winner when there is one, else the end of the last period.
 */
export function getFlowEndSeconds(
  events: ShotEvent[],
  timeline: FlowPeriodSpan[],
  isFinal: boolean,
): number {
  const timedEvents = sortTimedEvents(events);
  const lastEventSeconds =
    timedEvents[timedEvents.length - 1]?.elapsedSeconds ?? 0;
  if (!isFinal) return lastEventSeconds;
  const overtimeGoal = timedEvents.find(
    (event) =>
      event.type === 'goal' &&
      timeline.some((span) => span.isOvertime && span.period === event.period),
  );
  if (overtimeGoal) return overtimeGoal.elapsedSeconds!;
  return Math.max(
    lastEventSeconds,
    timeline[timeline.length - 1]?.endSeconds ?? 0,
  );
}

/** One team's cumulative attempts, from puck drop to `endSeconds`. */
export function buildFlowSeries(
  events: ShotEvent[],
  teamTriCode: string,
  endSeconds: number,
): FlowSeries {
  const teamEvents = sortTimedEvents(events).filter(
    (event) => event.teamTriCode === teamTriCode,
  );
  const points: FlowPoint[] = [{ elapsedSeconds: 0, attempts: 0 }];
  const goals: FlowGoal[] = [];
  teamEvents.forEach((event, index) => {
    const point = {
      elapsedSeconds: event.elapsedSeconds!,
      attempts: index + 1,
    };
    points.push(point);
    if (event.type === 'goal') goals.push({ ...point, event });
  });
  const totalAttempts = teamEvents.length;
  const lastSeconds = points[points.length - 1].elapsedSeconds;
  points.push({
    elapsedSeconds: Math.max(endSeconds, lastSeconds),
    attempts: totalAttempts,
  });
  return { teamTriCode, points, goals, totalAttempts };
}

/** A team's attempts so far at a moment in the game (for the crosshair readout). */
export function countAttemptsAt(series: FlowSeries, seconds: number): number {
  let attempts = 0;
  for (const point of series.points) {
    if (point.elapsedSeconds > seconds) break;
    attempts = point.attempts;
  }
  return attempts;
}

/** The period a moment falls in and the clock within it, e.g. "2nd 08:15". */
export function formatGameMoment(
  seconds: number,
  timeline: FlowPeriodSpan[],
): string {
  const span =
    timeline.find(
      (candidate) =>
        seconds >= candidate.startSeconds && seconds < candidate.endSeconds,
    ) ?? timeline[timeline.length - 1];
  if (!span) return '';
  const intoPeriod = Math.max(
    0,
    Math.min(seconds, span.endSeconds) - span.startSeconds,
  );
  const minutes = String(Math.floor(intoPeriod / 60)).padStart(2, '0');
  const remainder = String(Math.floor(intoPeriod % 60)).padStart(2, '0');
  return `${span.label} ${minutes}:${remainder}`;
}
