import { describe, expect, it } from 'vitest';
import type { ShotEvent } from '@/features/game-detail/types/playByPlay';
import { makeShotEvent } from '@/test/fixtures/playByPlay';
import {
  ALL_SHOTS,
  countTeamShots,
  countUnlocatedShots,
  describeEmptyShotResult,
  filterShotEvents,
  isMappedShot,
  listGamePeriods,
  listShootersByTeam,
  summarizeShotsByPeriod,
} from '@/features/game-detail/utils/shotMapHelper';

const MATTHEWS = { shooterId: 8478483, shooterName: 'Auston Matthews' };
const NYLANDER = { shooterId: 8477939, shooterName: 'William Nylander' };
const PASTRNAK = { shooterId: 8477956, shooterName: 'David Pastrnak' };

let nextEventId = 1;

/** A shot event with sensible defaults: a TOR wrist shot on goal in the 1st at even strength. */
function shot(overrides: Partial<ShotEvent> = {}): ShotEvent {
  return makeShotEvent({
    eventId: nextEventId++,
    ...overrides,
  });
}

const events: ShotEvent[] = [
  shot({ type: 'goal', strength: 'pp' }),
  shot({ period: 2, ...NYLANDER, type: 'miss' }),
  shot({ period: 2, type: 'block', strength: 'sh' }),
  shot({ period: 3, teamTriCode: 'BOS', ...PASTRNAK, x: -70, strength: null }),
  shot({ period: 4, periodType: 'OT', type: 'goal' }),
  shot({ period: 3, teamTriCode: 'BOS', ...PASTRNAK, x: null, y: null }),
];

describe('filterShotEvents', () => {
  it('keeps every event when every filter is "all"', () => {
    expect(filterShotEvents(events, ALL_SHOTS)).toEqual(events);
  });

  it('filters by period, overtime included', () => {
    expect(
      filterShotEvents(events, { ...ALL_SHOTS, period: 4 }).map(
        (event) => event.type,
      ),
    ).toEqual(['goal']);
    expect(filterShotEvents(events, { ...ALL_SHOTS, period: 2 })).toHaveLength(
      2,
    );
  });

  it('filters by strength; events with no strength only show under "all"', () => {
    expect(
      filterShotEvents(events, { ...ALL_SHOTS, strength: 'ev' }),
    ).toHaveLength(3);
    expect(
      filterShotEvents(events, { ...ALL_SHOTS, strength: 'pp' }),
    ).toHaveLength(1);
    expect(
      filterShotEvents(events, { ...ALL_SHOTS, strength: 'sh' }),
    ).toHaveLength(1);
  });

  it('filters to one player', () => {
    const pastrnak = filterShotEvents(events, {
      ...ALL_SHOTS,
      shooterId: PASTRNAK.shooterId,
    });
    expect(pastrnak).toHaveLength(2);
    expect(pastrnak.every((event) => event.teamTriCode === 'BOS')).toBe(true);
  });

  it('combines the filters: all three must match', () => {
    expect(
      filterShotEvents(events, {
        period: 1,
        strength: 'pp',
        shooterId: MATTHEWS.shooterId,
      }),
    ).toHaveLength(1);
    expect(
      filterShotEvents(events, {
        period: 2,
        strength: 'ev',
        shooterId: MATTHEWS.shooterId,
      }),
    ).toHaveLength(0);
  });
});

describe('map and counts', () => {
  it('leaves blocked shots and events with no location off the map', () => {
    expect(events.filter(isMappedShot)).toHaveLength(4);
    expect(countUnlocatedShots(events)).toBe(1);
  });

  it('counts goals inside shots on goal and every event as an attempt', () => {
    expect(countTeamShots(events, 'TOR')).toEqual({
      goals: 2,
      shotsOnGoal: 2,
      missed: 1,
      blocked: 1,
      attempts: 4,
    });
    // The shot with no location still counts.
    expect(countTeamShots(events, 'BOS').shotsOnGoal).toBe(2);
  });

  it('summarizes each period for both teams', () => {
    const rows = summarizeShotsByPeriod(
      events,
      listGamePeriods(events),
      'BOS',
      'TOR',
    );
    expect(rows.map((row) => row.period.label)).toEqual([
      '1st',
      '2nd',
      '3rd',
      'OT',
    ]);
    expect(rows[2].away.shotsOnGoal).toBe(2);
    expect(rows[3].home.goals).toBe(1);
  });
});

describe('listGamePeriods', () => {
  it('always lists regulation and adds overtime periods that have events', () => {
    expect(listGamePeriods([]).map((period) => period.label)).toEqual([
      '1st',
      '2nd',
      '3rd',
    ]);
    expect(
      listGamePeriods([
        shot({ period: 5, periodType: 'OT' }),
        shot({ period: 4, periodType: 'OT' }),
      ]).map((period) => period.label),
    ).toEqual(['1st', '2nd', '3rd', 'OT', '2OT']);
  });
});

describe('listShootersByTeam', () => {
  it('groups shooters by team, away first, sorted by last name, once each', () => {
    expect(listShootersByTeam(events, 'BOS', 'TOR')).toEqual([
      { teamTriCode: 'BOS', shooters: [PASTRNAK] },
      { teamTriCode: 'TOR', shooters: [MATTHEWS, NYLANDER] },
    ]);
  });
});

describe('describeEmptyShotResult', () => {
  it('names the player, period and strength', () => {
    expect(
      describeEmptyShotResult(
        { period: 2, strength: 'sh', shooterId: MATTHEWS.shooterId },
        MATTHEWS.shooterName,
      ),
    ).toBe('No shots by Auston Matthews in the 2nd period shorthanded.');
    expect(describeEmptyShotResult({ ...ALL_SHOTS, period: 4 }, null)).toBe(
      'No shots by either team in OT.',
    );
  });
});
