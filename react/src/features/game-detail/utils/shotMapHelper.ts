import {
  ShotEvent,
  ShotStrength,
} from '@/features/game-detail/types/playByPlay';

/**
 * Filtering and counting for the shot map and its text summary. Filters
 * combine: an event is shown only when it matches all three. `'all'` means no
 * restriction for that filter (every period including overtime, every
 * strength including events with no strength, both teams' shooters).
 */
export interface ShotFilters {
  period: number | 'all';
  strength: ShotStrength | 'all';
  shooterId: number | 'all';
}

export const ALL_SHOTS: ShotFilters = {
  period: 'all',
  strength: 'all',
  shooterId: 'all',
};

export interface GamePeriod {
  period: number;
  label: string; // "1st", "2nd", "3rd", "OT", "2OT"
  isOvertime: boolean;
}

export interface Shooter {
  shooterId: number;
  shooterName: string;
}

export interface TeamShooters {
  teamTriCode: string;
  shooters: Shooter[];
}

export interface TeamShotCounts {
  goals: number;
  shotsOnGoal: number; // goals included
  missed: number;
  blocked: number;
  attempts: number; // every shot event
}

export interface PeriodShotSummary {
  period: GamePeriod;
  away: TeamShotCounts;
  home: TeamShotCounts;
}

const REGULATION_PERIODS = 3;
const REGULATION_LABELS = ['1st', '2nd', '3rd'];

export const STRENGTH_LABELS: Record<ShotStrength, string> = {
  ev: 'Even',
  pp: 'Power play',
  sh: 'Shorthanded',
};

/** Whether the period is overtime, from the feed's period type or, when missing, its number. */
function isOvertimePeriod(period: number, periodType: string | null): boolean {
  return periodType ? periodType === 'OT' : period > REGULATION_PERIODS;
}

/** Display label for a period: 1st–3rd, then OT, 2OT, 3OT… */
export function getPeriodLabel(period: number): string {
  if (period <= REGULATION_PERIODS) return REGULATION_LABELS[period - 1];
  const overtimeNumber = period - REGULATION_PERIODS;
  return overtimeNumber === 1 ? 'OT' : `${overtimeNumber}OT`;
}

/**
 * The game's periods for filters and the summary: the three regulation
 * periods always, then each overtime period that has an event.
 */
export function listGamePeriods(events: ShotEvent[]): GamePeriod[] {
  const overtimePeriods = new Set(
    events
      .filter((event) => isOvertimePeriod(event.period, event.periodType))
      .map((event) => event.period),
  );
  const periodNumbers = [
    ...Array.from({ length: REGULATION_PERIODS }, (_, index) => index + 1),
    ...[...overtimePeriods].sort((first, second) => first - second),
  ];
  return periodNumbers.map((period) => ({
    period,
    label: getPeriodLabel(period),
    isOvertime: period > REGULATION_PERIODS,
  }));
}

/** The events that match every filter. */
export function filterShotEvents(
  events: ShotEvent[],
  filters: ShotFilters,
): ShotEvent[] {
  return events.filter(
    (event) =>
      (filters.period === 'all' || event.period === filters.period) &&
      (filters.strength === 'all' || event.strength === filters.strength) &&
      (filters.shooterId === 'all' || event.shooterId === filters.shooterId),
  );
}

/**
 * Whether an event is drawn on the rink: it has a location and is not a
 * blocked shot (a block's location is where it was blocked, not where the
 * shot came from).
 */
export function isMappedShot(event: ShotEvent): boolean {
  return event.type !== 'block' && event.x !== null && event.y !== null;
}

/** Shots that would be on the map but have no recorded location. */
export function countUnlocatedShots(events: ShotEvent[]): number {
  return events.filter(
    (event) => event.type !== 'block' && (event.x === null || event.y === null),
  ).length;
}

/** Sort key for a player name: last name, then the full name. */
function lastNameFirst(name: string): string {
  const parts = name.trim().split(/\s+/);
  return `${parts[parts.length - 1]} ${name}`;
}

/**
 * Everyone who took a shot in the game, grouped by team (away first, as in
 * the scoreboard) and sorted by last name. Built from all events so a player
 * stays selectable whatever the other filters are.
 */
export function listShootersByTeam(
  events: ShotEvent[],
  awayTriCode: string,
  homeTriCode: string,
): TeamShooters[] {
  return [awayTriCode, homeTriCode].map((teamTriCode) => {
    const shootersById = new Map<number, string>();
    events.forEach((event) => {
      if (
        event.teamTriCode === teamTriCode &&
        event.shooterId !== null &&
        event.shooterName
      ) {
        shootersById.set(event.shooterId, event.shooterName);
      }
    });
    const shooters = [...shootersById]
      .map(([shooterId, shooterName]) => ({ shooterId, shooterName }))
      .sort((first, second) =>
        lastNameFirst(first.shooterName).localeCompare(
          lastNameFirst(second.shooterName),
        ),
      );
    return { teamTriCode, shooters };
  });
}

/** Goals, shots on goal, misses, blocks and attempts for one team. */
export function countTeamShots(
  events: ShotEvent[],
  teamTriCode: string,
): TeamShotCounts {
  const teamEvents = events.filter(
    (event) => event.teamTriCode === teamTriCode,
  );
  const countType = (type: ShotEvent['type']) =>
    teamEvents.filter((event) => event.type === type).length;
  const goals = countType('goal');
  return {
    goals,
    shotsOnGoal: goals + countType('shot'),
    missed: countType('miss'),
    blocked: countType('block'),
    attempts: teamEvents.length,
  };
}

/** Per-period counts for both teams, for the text summary. */
export function summarizeShotsByPeriod(
  events: ShotEvent[],
  periods: GamePeriod[],
  awayTriCode: string,
  homeTriCode: string,
): PeriodShotSummary[] {
  return periods.map((period) => {
    const periodEvents = events.filter(
      (event) => event.period === period.period,
    );
    return {
      period,
      away: countTeamShots(periodEvents, awayTriCode),
      home: countTeamShots(periodEvents, homeTriCode),
    };
  });
}

/** The message for a filter combination with no shots, e.g. "No shots by Auston Matthews in the 2nd period shorthanded." */
export function describeEmptyShotResult(
  filters: ShotFilters,
  shooterName: string | null,
): string {
  const who = shooterName ? `by ${shooterName}` : 'by either team';
  const when =
    filters.period === 'all'
      ? ''
      : filters.period > REGULATION_PERIODS
        ? ` in ${getPeriodLabel(filters.period)}`
        : ` in the ${getPeriodLabel(filters.period)} period`;
  const strength =
    filters.strength === 'all'
      ? ''
      : ` ${
          {
            ev: 'at even strength',
            pp: 'on the power play',
            sh: 'shorthanded',
          }[filters.strength]
        }`;
  return `No shots ${who}${when}${strength}.`;
}
