import {
  GameLanding,
  LandingGoal,
} from '@/features/game-detail/types/gameDetail';

export type GameStoryGameState = 'tied' | 'away-lead' | 'home-lead';

export interface GameStoryScoringEvent {
  eventIndex: number;
  periodNumber: number;
  periodType: string;
  timeInPeriod: string;
  teamAbbrev: string;
  scorer: string;
  strength: string;
  goalModifier: string;
  isHome: boolean;
  awayScore: number | null;
  homeScore: number | null;
  scoreDifference: number | null;
  gameState: GameStoryGameState | null;
}

export interface GameStoryLeadChange {
  eventIndex: number;
  teamAbbrev: string;
  periodNumber: number;
  periodType: string;
  timeInPeriod: string;
  awayScore: number;
  homeScore: number;
}

export interface GameStoryTurningPoint {
  kind: 'first-lead' | 'largest-lead' | 'lead-change' | 'tied-game';
  eventIndex: number;
}

export interface GameStoryFacts {
  scoringEvents: GameStoryScoringEvent[];
  tiedEventIndexes: number[];
  leadChanges: GameStoryLeadChange[];
  firstLead: GameStoryLeadChange | null;
  largestLead: GameStoryLeadChange | null;
  turningPoints: GameStoryTurningPoint[];
}

function scoreOrNull(value: number | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function gameStateFor(
  awayScore: number | null,
  homeScore: number | null,
): GameStoryGameState | null {
  if (awayScore === null || homeScore === null) return null;
  if (awayScore === homeScore) return 'tied';
  return awayScore > homeScore ? 'away-lead' : 'home-lead';
}

function leadTeam(
  event: GameStoryScoringEvent,
  awayAbbrev: string,
  homeAbbrev: string,
): string | null {
  if (event.gameState === 'away-lead') return awayAbbrev;
  if (event.gameState === 'home-lead') return homeAbbrev;
  return null;
}

function toScoringEvent(
  goal: LandingGoal,
  periodNumber: number,
  periodType: string,
  eventIndex: number,
  homeAbbrev: string,
): GameStoryScoringEvent {
  const awayScore = scoreOrNull(goal.awayScore);
  const homeScore = scoreOrNull(goal.homeScore);
  return {
    eventIndex,
    periodNumber,
    periodType,
    timeInPeriod: goal.timeInPeriod ?? '',
    teamAbbrev: goal.teamAbbrev?.default ?? '',
    scorer: goal.name?.default ?? 'Unknown scorer',
    strength: goal.strength ?? 'unknown',
    goalModifier: goal.goalModifier ?? 'none',
    isHome: goal.teamAbbrev?.default === homeAbbrev,
    awayScore,
    homeScore,
    scoreDifference:
      awayScore === null || homeScore === null
        ? null
        : Math.abs(awayScore - homeScore),
    gameState: gameStateFor(awayScore, homeScore),
  };
}

/**
 * Derives only facts explicitly represented by the landing scoring feed.
 * The feed's period/goal order is treated as authoritative; no event timing
 * or causal interpretation is invented here.
 */
export function getGameStoryFacts(
  landing: GameLanding | null | undefined,
  awayAbbrev: string,
  homeAbbrev: string,
): GameStoryFacts {
  const scoringEvents: GameStoryScoringEvent[] = [];
  for (const period of landing?.summary?.scoring ?? []) {
    for (const goal of period.goals ?? []) {
      scoringEvents.push(
        toScoringEvent(
          goal,
          period.periodDescriptor?.number ?? 0,
          period.periodDescriptor?.periodType ?? 'REG',
          scoringEvents.length,
          homeAbbrev,
        ),
      );
    }
  }

  const tiedEventIndexes = scoringEvents
    .filter((event) => event.gameState === 'tied')
    .map((event) => event.eventIndex);

  const leadChanges: GameStoryLeadChange[] = [];
  let previousLeader: string | null = null;
  let firstLead: GameStoryLeadChange | null = null;
  let largestLead: GameStoryLeadChange | null = null;

  for (const event of scoringEvents) {
    const leader = leadTeam(event, awayAbbrev, homeAbbrev);
    if (
      leader === null ||
      event.awayScore === null ||
      event.homeScore === null
    ) {
      continue;
    }

    const lead: GameStoryLeadChange = {
      eventIndex: event.eventIndex,
      teamAbbrev: leader,
      periodNumber: event.periodNumber,
      periodType: event.periodType,
      timeInPeriod: event.timeInPeriod,
      awayScore: event.awayScore,
      homeScore: event.homeScore,
    };

    if (firstLead === null) firstLead = lead;
    if (
      largestLead === null ||
      event.scoreDifference! >
        Math.abs(largestLead.awayScore - largestLead.homeScore)
    ) {
      largestLead = lead;
    }
    if (previousLeader !== null && previousLeader !== leader) {
      leadChanges.push(lead);
    }
    previousLeader = leader;
  }

  const turningPoints: GameStoryTurningPoint[] = [];
  const addTurningPoint = (
    kind: GameStoryTurningPoint['kind'],
    eventIndex: number | undefined,
  ) => {
    if (
      eventIndex !== undefined &&
      !turningPoints.some((point) => point.eventIndex === eventIndex)
    ) {
      turningPoints.push({ kind, eventIndex });
    }
  };

  addTurningPoint('first-lead', firstLead?.eventIndex);
  addTurningPoint('largest-lead', largestLead?.eventIndex);
  addTurningPoint('lead-change', leadChanges[0]?.eventIndex);
  addTurningPoint(
    'tied-game',
    tiedEventIndexes.find((index) => index > 0),
  );

  return {
    scoringEvents,
    tiedEventIndexes,
    leadChanges,
    firstLead,
    largestLead,
    turningPoints,
  };
}
