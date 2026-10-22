import { describe, expect, it } from 'vitest';
import { ScheduledGame } from '@/features/schedule/types/scheduledGame';
import {
  findMatchupGame,
  parseGameIdParam,
} from '@/features/matchup/utils/matchupGameContext';

const game = (gameId: number, awayTeam: string, homeTeam: string) =>
  ({ gameId, awayTeam, homeTeam, gameState: 'FUT' }) as ScheduledGame;

const SEASON = [game(2026020123, 'NYR', 'BOS'), game(2026020124, 'TOR', 'MTL')];

describe('parseGameIdParam', () => {
  it('reads a numeric id, ignoring surrounding spaces', () => {
    expect(parseGameIdParam('2026020123')).toBe(2026020123);
    expect(parseGameIdParam(' 2026020123 ')).toBe(2026020123);
  });

  it('returns null for a missing, empty or non-numeric value', () => {
    expect(parseGameIdParam(null)).toBeNull();
    expect(parseGameIdParam('')).toBeNull();
    expect(parseGameIdParam('abc')).toBeNull();
    expect(parseGameIdParam('12a')).toBeNull();
    expect(parseGameIdParam('-5')).toBeNull();
    expect(parseGameIdParam('1.5')).toBeNull();
  });
});

describe('findMatchupGame', () => {
  it('finds the named game between the selected teams', () => {
    expect(findMatchupGame(SEASON, '2026020123', 'NYR', 'BOS')?.gameId).toBe(
      2026020123,
    );
  });

  it('matches the teams in either order and any letter case', () => {
    expect(findMatchupGame(SEASON, '2026020123', 'bos', 'nyr')?.gameId).toBe(
      2026020123,
    );
  });

  it('ignores a game that is not between the selected teams', () => {
    expect(findMatchupGame(SEASON, '2026020124', 'NYR', 'BOS')).toBeNull();
    expect(findMatchupGame(SEASON, '2026020123', 'NYR', 'TOR')).toBeNull();
  });

  it('returns null without a usable id or when the season lacks the game', () => {
    expect(findMatchupGame(SEASON, null, 'NYR', 'BOS')).toBeNull();
    expect(findMatchupGame(SEASON, 'next', 'NYR', 'BOS')).toBeNull();
    expect(findMatchupGame(SEASON, '2026029999', 'NYR', 'BOS')).toBeNull();
    expect(findMatchupGame([], '2026020123', 'NYR', 'BOS')).toBeNull();
  });
});
