import { describe, expect, it } from 'vitest';
import { ScheduledGame } from '@/features/schedule/types/scheduledGame';
import { getSeasonSeries } from '@/features/matchup/utils/seasonSeriesHelper';

const game = (id: number, date: string, homeTeam: string, awayTeam: string, homeScore: number | null, awayScore: number | null, gameState = 'OFF') => ({
  gameId: id, date: new Date(date), homeTeam, awayTeam, homeScore, awayScore, gameState,
} as ScheduledGame);

describe('getSeasonSeries', () => {
  it('separates meetings and aggregates goals from team A perspective', () => {
    const result = getSeasonSeries([
      game(2, '2026-11-02', 'BOS', 'MTL', 1, 4),
      game(1, '2026-10-02', 'MTL', 'BOS', 3, 2),
      game(3, '2027-01-02', 'BOS', 'MTL', null, null, 'FUT'),
      game(4, '2026-11-03', 'TOR', 'MTL', 4, 1),
    ], 'MTL', 'BOS');
    expect(result.played.map(({ gameId }) => gameId)).toEqual([1, 2]);
    expect(result.upcoming.map(({ gameId }) => gameId)).toEqual([3]);
    expect(result.summary).toEqual({ teamAwins: 2, teamBwins: 0, ties: 0, teamAGoals: 7, teamBGoals: 3 });
  });
});
