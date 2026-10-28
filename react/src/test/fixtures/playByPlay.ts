import type { ShotEvent } from '@/features/game-detail/types/playByPlay';

/** A TOR wrist shot on goal at five minutes in regulation. */
export function makeShotEvent(overrides: Partial<ShotEvent> = {}): ShotEvent {
  return {
    eventId: 1,
    period: 1,
    periodType: 'REG',
    timeInPeriod: '05:00',
    elapsedSeconds: 300,
    type: 'shot',
    teamTriCode: 'TOR',
    shooterId: 8478483,
    shooterName: 'Auston Matthews',
    goalieId: 1,
    x: 70,
    y: 10,
    shotType: 'wrist',
    strength: 'ev',
    ...overrides,
  };
}
