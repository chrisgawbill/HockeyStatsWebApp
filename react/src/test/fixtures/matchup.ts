import { ScheduledGame } from '@/features/schedule/types/scheduledGame';
import { GameLanding } from '@/features/game-detail/types/gameDetail';

export const makeMatchupGame = (
  gameId: number,
  awayTeam: string,
  homeTeam: string,
) => ({ gameId, awayTeam, homeTeam, gameState: 'FUT' }) as ScheduledGame;
export const SEASON = [
  makeMatchupGame(2026020123, 'NYR', 'BOS'),
  makeMatchupGame(2026020124, 'TOR', 'MTL'),
];

export const makeSeriesGame = (
  id: number,
  date: string,
  homeTeam: string,
  awayTeam: string,
  homeScore: number | null,
  awayScore: number | null,
  gameState = 'OFF',
) =>
  ({
    gameId: id,
    date: new Date(date),
    homeTeam,
    awayTeam,
    homeScore,
    awayScore,
    gameState,
  }) as ScheduledGame;

export const makeRouteGame = (gameState: string, startTime: string) => ({
  gameId: 2026020123,
  gameState,
  startTime,
  awayTeam: 'NYR',
  homeTeam: 'BOS',
});

export function makeFormGame(
  date: string,
  homeTeam: string,
  awayTeam: string,
  homeScore: number,
  awayScore: number,
  periodType: string | null = null,
): ScheduledGame {
  return {
    date: new Date(`${date}T12:00:00`),
    homeTeam,
    awayTeam,
    homeScore,
    awayScore,
    periodType,
    gameState: 'FINAL',
  } as ScheduledGame;
}

export function landingWithGoals(
  goals: Array<{
    team: string;
    awayScore: number;
    homeScore: number;
    period?: number;
    time?: string;
  }>,
): GameLanding {
  return {
    id: 1,
    gameState: 'FINAL',
    summary: {
      scoring: [
        {
          periodDescriptor: { number: 1, periodType: 'REG' },
          goals: goals
            .filter((goal) => (goal.period ?? 1) === 1)
            .map((goal) => ({
              playerId: 1,
              strength: 'ev',
              name: { default: `${goal.team} scorer` },
              teamAbbrev: { default: goal.team },
              headshot: '',
              timeInPeriod: goal.time ?? '10:00',
              goalModifier: 'none',
              awayScore: goal.awayScore,
              homeScore: goal.homeScore,
              isHome: goal.team === 'HOM',
              assists: [],
            })),
        },
        {
          periodDescriptor: { number: 2, periodType: 'REG' },
          goals: goals
            .filter((goal) => goal.period === 2)
            .map((goal) => ({
              playerId: 2,
              strength: 'pp',
              name: { default: `${goal.team} scorer` },
              teamAbbrev: { default: goal.team },
              headshot: '',
              timeInPeriod: goal.time ?? '10:00',
              goalModifier: 'none',
              awayScore: goal.awayScore,
              homeScore: goal.homeScore,
              isHome: goal.team === 'HOM',
              assists: [],
            })),
        },
      ],
      threeStars: [],
    },
  };
}
