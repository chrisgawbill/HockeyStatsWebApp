import {
  FeedGame,
  FeedTeam,
  MyHockeyData,
} from '@/features/my-hockey/types/myHockey';

export function makeFeedGame(overrides: Partial<FeedGame>): FeedGame {
  return {
    gameId: 1,
    startTime: '2026-10-21T23:00:00.000Z',
    gameState: 'FUT',
    homeTeam: 'MTL',
    awayTeam: 'BOS',
    homeScore: null,
    awayScore: null,
    periodType: null,
    period: null,
    ...overrides,
  };
}

export function team(
  triCode: string,
  tier: FeedTeam['tier'] = 'fan',
): FeedTeam {
  return { triCode, tier, label: null };
}
export function data(overrides: Partial<MyHockeyData>): MyHockeyData {
  return {
    gamesByTeam: new Map(),
    boxscoresByGameId: new Map(),
    seasonTotalsByPlayerId: new Map(),
    ...overrides,
  };
}
