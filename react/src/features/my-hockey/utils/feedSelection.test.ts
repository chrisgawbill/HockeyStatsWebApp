import type { FavoritePlayer } from '@/features/favorite-players/types/favoritePlayers';
import type { FeedBoxscore } from '@/features/my-hockey/types/myHockey';
import {
  buildLastResults,
  buildMyHockeyFeed,
  buildUpNext,
  listGamesToRecheck,
  selectLastResult,
  selectNextGame,
} from '@/features/my-hockey/utils/feedSelection';
import { makeFeedGame as game } from '@/test/fixtures/feed';
import { data, team } from '@/test/fixtures/feed';
import { describe, expect, it } from 'vitest';

const NOW = Date.parse('2026-10-21T20:00:00Z');
const HOUR_MS = 60 * 60 * 1000;

function hoursFromNow(hours: number): string {
  return new Date(NOW + hours * HOUR_MS).toISOString();
}

describe('next and last game selection', () => {
  const games = [
    game({ gameId: 1, startTime: hoursFromNow(-50), gameState: 'OFF' }),
    game({ gameId: 2, startTime: hoursFromNow(-26), gameState: 'FINAL' }),
    game({ gameId: 3, startTime: hoursFromNow(3) }),
    game({ gameId: 4, startTime: hoursFromNow(48) }),
  ];

  it('picks the first game that is not final and the latest final', () => {
    expect(selectNextGame(games, NOW)?.gameId).toBe(3);
    expect(selectLastResult(games)?.gameId).toBe(2);
  });

  it('returns null before the first final and after the last game', () => {
    expect(selectLastResult([games[2]])).toBeNull();
    expect(selectNextGame(games.slice(0, 2), NOW)).toBeNull();
  });

  it('skips a long-past game the schedule never marked final', () => {
    const stale = game({ gameId: 9, startTime: hoursFromNow(-20) });
    expect(selectNextGame([stale, games[2]], NOW)?.gameId).toBe(3);
  });

  it('rechecks started games that are not final, newest two at most', () => {
    const started = [
      game({ gameId: 5, startTime: hoursFromNow(-30) }),
      game({ gameId: 6, startTime: hoursFromNow(-6), gameState: 'LIVE' }),
      game({ gameId: 7, startTime: hoursFromNow(-1) }),
      game({ gameId: 8, startTime: hoursFromNow(2) }),
    ];
    expect(listGamesToRecheck(started, NOW).map((g) => g.gameId)).toEqual([
      6, 7,
    ]);
  });
});

describe('section ordering', () => {
  const gamesByTeam = new Map([
    [
      'MTL',
      [
        game({ gameId: 10, startTime: hoursFromNow(-24), gameState: 'OFF' }),
        game({ gameId: 11, startTime: hoursFromNow(5) }),
      ],
    ],
    [
      'TOR',
      [
        game({
          gameId: 20,
          startTime: hoursFromNow(-2),
          gameState: 'OFF',
          homeTeam: 'TOR',
          awayTeam: 'OTT',
        }),
        game({
          gameId: 21,
          startTime: hoursFromNow(-1),
          gameState: 'LIVE',
          homeTeam: 'OTT',
          awayTeam: 'TOR',
        }),
      ],
    ],
    // Plays MTL in the same game 11, and was in game 10 too.
    [
      'BOS',
      [
        game({ gameId: 10, startTime: hoursFromNow(-24), gameState: 'OFF' }),
        game({ gameId: 11, startTime: hoursFromNow(5) }),
      ],
    ],
    [
      'SEA',
      [
        game({
          gameId: 30,
          startTime: hoursFromNow(1),
          homeTeam: 'SEA',
          awayTeam: 'VGK',
        }),
      ],
    ],
  ]);
  const teams = [
    team('MTL', 'diehard'),
    team('BOS'),
    team('TOR'),
    team('SEA', 'curious'),
  ];

  it('puts live games first, then by start time, showing a shared game once', () => {
    const upNext = buildUpNext(teams, gamesByTeam, NOW);
    expect(upNext.map((item) => [item.game.gameId, item.team.triCode])).toEqual(
      [
        [21, 'TOR'],
        [30, 'SEA'],
        [11, 'MTL'],
      ],
    );
  });

  it('lists the newest final first, told from the higher-tier favorite', () => {
    const lastResults = buildLastResults(teams, gamesByTeam);
    expect(
      lastResults.map((item) => [item.game.gameId, item.team.triCode]),
    ).toEqual([
      [20, 'TOR'],
      [10, 'MTL'],
    ]);
  });

  it('leaves out a team whose schedule failed to load', () => {
    const upNext = buildUpNext([team('NYR'), ...teams], gamesByTeam, NOW);
    expect(upNext.some((item) => item.team.triCode === 'NYR')).toBe(false);
  });
});

describe('buildMyHockeyFeed', () => {
  const player: FavoritePlayer = {
    league: 'nhl',
    playerId: 8481540,
    name: 'Cole Caufield',
    teamTriCode: 'MTL',
    position: 'R',
    headshot: null,
    since: '2026-10-01T00:00:00Z',
    tier: 'diehard',
    label: null,
    pushMuted: false,
  };

  it('applies box scores so a game the schedule still has upcoming shows as final', () => {
    const cachedGame = game({ gameId: 40, startTime: hoursFromNow(-4) });
    const finalBoxscore: FeedBoxscore = {
      game: {
        ...cachedGame,
        gameState: 'OFF',
        homeScore: 4,
        awayScore: 2,
        periodType: 'REG',
      },
      playerLines: new Map([
        [8481540, { type: 'skater', goals: 1, assists: 1 }],
      ]),
    };
    const feed = buildMyHockeyFeed(
      [team('MTL')],
      [player],
      data({
        gamesByTeam: new Map([['MTL', [cachedGame]]]),
        boxscoresByGameId: new Map([[40, finalBoxscore]]),
      }),
      NOW,
    );
    expect(feed.upNext).toEqual([]);
    expect(feed.lastResults[0].game.homeScore).toBe(4);
    expect(feed.players[0].latestGame?.line).toEqual({
      type: 'skater',
      goals: 1,
      assists: 1,
    });
  });

  it('gives a player no latest game without a box score or a team', () => {
    const feed = buildMyHockeyFeed(
      [],
      [player, { ...player, playerId: 1, teamTriCode: null }],
      data({
        gamesByTeam: new Map([
          [
            'MTL',
            [
              game({
                gameId: 41,
                startTime: hoursFromNow(-30),
                gameState: 'OFF',
              }),
            ],
          ],
        ]),
      }),
      NOW,
    );
    expect(feed.players.map((item) => item.latestGame)).toEqual([null, null]);
  });
});
