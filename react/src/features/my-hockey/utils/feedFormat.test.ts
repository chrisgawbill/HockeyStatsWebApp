import { makeFeedGame } from '@/test/fixtures/feed';
const game = (overrides: Partial<FeedGame>) =>
  makeFeedGame({
    startTime: '2026-10-19T23:00:00Z',
    gameState: 'OFF',
    homeTeam: 'TOR',
    awayTeam: 'MTL',
    homeScore: 2,
    awayScore: 4,
    periodType: 'REG',
    period: 3,
    ...overrides,
  });
import { describe, expect, it } from 'vitest';
import type { FeedGame } from '@/features/my-hockey/types/myHockey';
import {
  describeMatchup,
  formatGameDay,
  formatGameLine,
  formatLatestGameLine,
  formatLivePeriod,
  formatSeasonLine,
  getResultLetter,
} from '@/features/my-hockey/utils/feedFormat';

describe('feed formatting', () => {
  it('names the day relative to now', () => {
    const now = new Date(2026, 9, 21, 12, 0);
    expect(formatGameDay(new Date(2026, 9, 21, 19, 0).toISOString(), now)).toBe(
      'Tonight',
    );
    expect(formatGameDay(new Date(2026, 9, 21, 13, 0).toISOString(), now)).toBe(
      'Today',
    );
    expect(formatGameDay(new Date(2026, 9, 22, 19, 0).toISOString(), now)).toBe(
      'Tomorrow',
    );
    expect(formatGameDay(new Date(2026, 9, 23, 19, 0).toISOString(), now)).toBe(
      'Fri, Oct 23',
    );
  });

  it('tells a game from either side', () => {
    expect(describeMatchup(game({}), 'MTL')).toBe('MTL at TOR');
    expect(describeMatchup(game({}), 'TOR')).toBe('TOR vs MTL');
    expect(getResultLetter(game({}), 'MTL')).toBe('W');
    expect(getResultLetter(game({}), 'TOR')).toBe('L');
    expect(getResultLetter(game({ periodType: 'SO' }), 'TOR')).toBe('OTL');
  });

  it('labels the live period', () => {
    expect(formatLivePeriod(game({ gameState: 'LIVE', period: 2 }))).toBe(
      '2nd',
    );
    expect(
      formatLivePeriod(
        game({ gameState: 'LIVE', periodType: 'OT', period: 4 }),
      ),
    ).toBe('OT');
    expect(formatLivePeriod(game({ gameState: 'LIVE', period: null }))).toBe(
      '',
    );
  });

  it('formats skater and goalie season lines', () => {
    expect(
      formatSeasonLine({
        type: 'skater',
        gamesPlayed: 8,
        goals: 6,
        assists: 3,
        points: 9,
      }),
    ).toBe('8 GP · 6 G · 3 A · 9 P');
    expect(
      formatSeasonLine({
        type: 'goalie',
        gamesPlayed: 5,
        wins: 4,
        losses: 1,
        otLosses: 0,
        savePct: 0.912,
        goalsAgainstAverage: 2.41,
      }),
    ).toBe('5 GP · 4-1-0 · .912 · 2.41');
    expect(
      formatSeasonLine({
        type: 'goalie',
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        otLosses: null,
        savePct: null,
        goalsAgainstAverage: null,
      }),
    ).toBe('0 GP · 0-0');
  });

  it('formats a player game line', () => {
    expect(formatGameLine({ type: 'skater', goals: 1, assists: 1 })).toBe(
      '1G 1A',
    );
    expect(formatGameLine({ type: 'skater', goals: 0, assists: 2 })).toBe('2A');
    expect(formatGameLine({ type: 'skater', goals: 0, assists: 0 })).toBe(
      'No points',
    );
    expect(formatGameLine({ type: 'goalie', saves: 31, decision: 'W' })).toBe(
      'W, 31 saves',
    );
    expect(formatGameLine({ type: 'goalie', saves: 1, decision: null })).toBe(
      '1 save',
    );
  });

  it('formats the latest game line, live or final, played or not', () => {
    const line = { type: 'skater', goals: 1, assists: 0 } as const;
    expect(formatLatestGameLine(game({}), line, 'MTL', false)).toMatch(
      /^Last game: 1G at TOR, Oct 1[89]$/,
    );
    expect(formatLatestGameLine(game({}), line, 'TOR', true)).toBe(
      'Live: 1G vs MTL',
    );
    expect(formatLatestGameLine(game({}), null, 'MTL', false)).toMatch(
      /^Did not play at TOR, Oct 1[89]$/,
    );
  });
});
