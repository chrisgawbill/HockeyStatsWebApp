import { describe, expect, it } from 'vitest';
import {
  getGamePath,
  getMatchupPreviewPath,
  isPreviewGame,
} from '@/lib/gamePath';

const NOW = new Date('2026-10-23T22:00:00Z');
const LATER = '2026-10-23T23:00:00Z';
const EARLIER = '2026-10-23T21:00:00Z';

const game = (gameState: string, startTime: string) => ({
  gameId: 2026020123,
  gameState,
  startTime,
  awayTeam: 'NYR',
  homeTeam: 'BOS',
});

describe('isPreviewGame', () => {
  it('is true for future and pregame games that start later', () => {
    expect(isPreviewGame('FUT', LATER, NOW)).toBe(true);
    expect(isPreviewGame('PRE', LATER, NOW)).toBe(true);
  });

  it('is false once the scheduled start has passed, even if the state lags', () => {
    expect(isPreviewGame('FUT', EARLIER, NOW)).toBe(false);
    expect(isPreviewGame('PRE', NOW.toISOString(), NOW)).toBe(false);
  });

  it('is false for live and final games', () => {
    expect(isPreviewGame('LIVE', LATER, NOW)).toBe(false);
    expect(isPreviewGame('CRIT', LATER, NOW)).toBe(false);
    expect(isPreviewGame('OFF', EARLIER, NOW)).toBe(false);
    expect(isPreviewGame('FINAL', EARLIER, NOW)).toBe(false);
  });

  it('treats a missing or unreadable start time as still ahead', () => {
    expect(isPreviewGame('FUT', '', NOW)).toBe(true);
    expect(isPreviewGame('FUT', 'TBD', NOW)).toBe(true);
  });

  it('accepts a Date start time', () => {
    expect(isPreviewGame('FUT', new Date(LATER), NOW)).toBe(true);
  });
});

describe('getMatchupPreviewPath', () => {
  it('puts the away team first and names the game', () => {
    expect(getMatchupPreviewPath(game('FUT', LATER))).toBe(
      '/matchup?teamA=NYR&teamB=BOS&game=2026020123',
    );
  });
});

describe('getGamePath', () => {
  it('sends a game that has not started to its matchup preview', () => {
    expect(getGamePath(game('FUT', LATER), NOW)).toBe(
      '/matchup?teamA=NYR&teamB=BOS&game=2026020123',
    );
  });

  it('sends live, final and past-start games to the game page', () => {
    expect(getGamePath(game('LIVE', EARLIER), NOW)).toBe('/game/2026020123');
    expect(getGamePath(game('OFF', EARLIER), NOW)).toBe('/game/2026020123');
    expect(getGamePath(game('PRE', EARLIER), NOW)).toBe('/game/2026020123');
  });
});
