import { describe, expect, it } from 'vitest';
import { ShotEvent } from '@/features/game-detail/types/playByPlay';
import {
  buildFlowSeries,
  buildFlowTimeline,
  countAttemptsAt,
  formatGameMoment,
  getFlowEndSeconds,
  isPlayoffGame,
} from '@/features/game-detail/utils/gameFlowHelper';
import { listGamePeriods } from '@/features/game-detail/utils/shotMapHelper';

let nextEventId = 1;

/** A TOR shot on goal at the given elapsed second. */
function shotAt(
  elapsedSeconds: number | null,
  overrides: Partial<ShotEvent> = {},
): ShotEvent {
  const period =
    elapsedSeconds === null ? 1 : Math.floor(elapsedSeconds / 1200) + 1;
  return {
    eventId: nextEventId++,
    period,
    periodType: period > 3 ? 'OT' : 'REG',
    timeInPeriod: null,
    elapsedSeconds,
    type: 'shot',
    teamTriCode: 'TOR',
    shooterId: 1,
    shooterName: 'Auston Matthews',
    goalieId: 1,
    x: 70,
    y: 0,
    shotType: 'wrist',
    strength: 'ev',
    ...overrides,
  };
}

const overtimeGame: ShotEvent[] = [
  shotAt(900, { type: 'goal' }),
  shotAt(100),
  shotAt(400, { teamTriCode: 'BOS', type: 'block' }),
  shotAt(2500, { type: 'miss', x: null, y: null }),
  shotAt(3734, { type: 'goal' }),
  shotAt(null),
];

describe('buildFlowTimeline', () => {
  it('places regulation periods every 20 minutes and a 5-minute regular-season overtime', () => {
    const timeline = buildFlowTimeline(listGamePeriods(overtimeGame), false);
    expect(
      timeline.map(({ label, startSeconds, endSeconds }) => [
        label,
        startSeconds,
        endSeconds,
      ]),
    ).toEqual([
      ['1st', 0, 1200],
      ['2nd', 1200, 2400],
      ['3rd', 2400, 3600],
      ['OT', 3600, 3900],
    ]);
  });

  it('gives playoff overtime 20 minutes', () => {
    const timeline = buildFlowTimeline(listGamePeriods(overtimeGame), true);
    expect(timeline[3].endSeconds).toBe(4800);
    expect(isPlayoffGame(2025030411)).toBe(true);
    expect(isPlayoffGame(2026020123)).toBe(false);
  });
});

describe('getFlowEndSeconds', () => {
  const timeline = buildFlowTimeline(listGamePeriods(overtimeGame), false);

  it('ends a final at the overtime winner', () => {
    expect(getFlowEndSeconds(overtimeGame, timeline, true)).toBe(3734);
  });

  it('ends a regulation final at 60:00 and a live game at its latest event', () => {
    const regulation = overtimeGame.slice(0, 4);
    const regulationTimeline = buildFlowTimeline(
      listGamePeriods(regulation),
      false,
    );
    expect(getFlowEndSeconds(regulation, regulationTimeline, true)).toBe(3600);
    expect(getFlowEndSeconds(regulation, regulationTimeline, false)).toBe(2500);
  });
});

describe('buildFlowSeries', () => {
  it("counts a team's attempts cumulatively in time order, misses with no location included", () => {
    const series = buildFlowSeries(overtimeGame, 'TOR', 3734);
    expect(
      series.points.map(({ elapsedSeconds, attempts }) => [
        elapsedSeconds,
        attempts,
      ]),
    ).toEqual([
      [0, 0],
      [100, 1],
      [900, 2],
      [2500, 3],
      [3734, 4],
      [3734, 4],
    ]);
    expect(series.totalAttempts).toBe(4);
  });

  it('marks goals at their place on the line', () => {
    const series = buildFlowSeries(overtimeGame, 'TOR', 3734);
    expect(
      series.goals.map(({ elapsedSeconds, attempts }) => [
        elapsedSeconds,
        attempts,
      ]),
    ).toEqual([
      [900, 2],
      [3734, 4],
    ]);
  });

  it('counts blocked shots for the shooting team', () => {
    expect(buildFlowSeries(overtimeGame, 'BOS', 3734).totalAttempts).toBe(1);
  });

  it('is a flat line at zero for a game with no events', () => {
    expect(buildFlowSeries([], 'TOR', 0).points).toEqual([
      { elapsedSeconds: 0, attempts: 0 },
      { elapsedSeconds: 0, attempts: 0 },
    ]);
  });
});

describe('crosshair readout', () => {
  const timeline = buildFlowTimeline(listGamePeriods(overtimeGame), false);
  const series = buildFlowSeries(overtimeGame, 'TOR', 3734);

  it('reads attempts so far at a moment', () => {
    expect(countAttemptsAt(series, 50)).toBe(0);
    expect(countAttemptsAt(series, 900)).toBe(2);
    expect(countAttemptsAt(series, 3000)).toBe(3);
  });

  it('formats the moment as period and clock', () => {
    expect(formatGameMoment(1695, timeline)).toBe('2nd 08:15');
    expect(formatGameMoment(3734, timeline)).toBe('OT 02:14');
  });
});
