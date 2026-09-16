import { describe, expect, it } from 'vitest';
import { ScheduledGame } from '@/features/schedule/types/scheduledGame';
import {
  cumulativeGoalDiff,
  getTeamResults,
  homeRoadSplits,
  lastN,
  rollingPointsPct,
} from './teamFormHelper';

function game(
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

describe('teamFormHelper', () => {
  const games = [
    game('2025-10-03', 'COL', 'DAL', 4, 2),
    game('2025-10-05', 'MIN', 'COL', 3, 2, 'OT'),
    game('2025-10-07', 'COL', 'STL', 1, 3),
    game('2025-10-09', 'NSH', 'COL', 2, 5),
    game('2025-10-11', 'COL', 'WPG', 3, 1, 'SO'),
  ];

  it('derives chronological W/L/OTL results for the selected team', () => {
    const results = getTeamResults(games, 'col');

    expect(results.map((result) => result.outcome)).toEqual([
      'W',
      'OTL',
      'L',
      'W',
      'W',
    ]);
    expect(results[1].home).toBe(false);
    expect(results[3].gf).toBe(5);
  });

  it('calculates recent form, rolling points percentage, goal differential, and splits', () => {
    const results = getTeamResults(games, 'COL');
    expect(lastN(results, 3).map((result) => result.outcome)).toEqual([
      'L',
      'W',
      'W',
    ]);
    expect(rollingPointsPct(results, 2)).toEqual([1, 0.75, 0.25, 0.5, 1]);
    expect(cumulativeGoalDiff(results)).toBe(4);
    expect(homeRoadSplits(results)).toEqual({
      home: { games: 3, wins: 2, losses: 1, otl: 0, gf: 8, ga: 6 },
      road: { games: 2, wins: 1, losses: 0, otl: 1, gf: 7, ga: 5 },
    });
  });

  it('ignores future, incomplete, and unrelated games', () => {
    const incomplete = {
      ...game('2025-10-12', 'COL', 'ARI', 0, 0),
      gameState: 'FUT',
    } as ScheduledGame;
    const missingScore = {
      ...game('2025-10-13', 'COL', 'ARI', 0, 0),
      homeScore: null,
    } as unknown as ScheduledGame;

    expect(getTeamResults([...games, incomplete, missingScore], 'COL')).toHaveLength(5);
    expect(lastN(getTeamResults(games, 'COL'), 0)).toEqual([]);
  });
});
