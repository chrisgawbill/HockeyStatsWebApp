/**
 * Play-by-play shot events from `GET /schedule/playbyplay/:gameID`
 * (API-PBP-01). Coordinates are normalized so the home team always shoots
 * toward +x and the away team toward -x; events without a recorded location
 * keep `x`/`y` null. Shootout attempts are not included.
 */
export type ShotEventType = 'goal' | 'shot' | 'miss' | 'block';

/** Strength from the shooting team's side. */
export type ShotStrength = 'ev' | 'pp' | 'sh';

export interface ShotEvent {
  eventId: number;
  period: number;
  periodType: 'REG' | 'OT' | null;
  timeInPeriod: string | null; // "MM:SS" elapsed in the period
  elapsedSeconds: number | null; // since puck drop, 20-minute periods
  type: ShotEventType;
  teamTriCode: string | null; // the shooting team, also on blocked shots
  shooterId: number | null;
  shooterName: string | null;
  goalieId: number | null;
  x: number | null; // feet, -100..100
  y: number | null; // feet, -42.5..42.5
  shotType: string | null; // "wrist", "slap", ...
  strength: ShotStrength | null;
}

export interface PlayByPlayTeam {
  id: number | null;
  triCode: string | null;
}

export interface GamePlayByPlay {
  gameId: number | null;
  gameState: string | null;
  homeTeam: PlayByPlayTeam;
  awayTeam: PlayByPlayTeam;
  events: ShotEvent[];
}
