import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addFavorite,
  fetchFavorites,
  removeFavorite,
  setFavoritePushMuted,
  updateFavoriteTeamCategory,
} from '@/features/after-action-reports/api/afterActionReportsApi';
import {
  addFavoritePlayer,
  fetchFavoritePlayers,
  removeFavoritePlayer,
  setFavoritePlayerPushMuted,
  updateFavoritePlayerCategory,
} from '@/features/favorite-players/api/favoritePlayersApi';
import { token } from '@/test/fixtures/account.mjs';

const API = 'http://localhost:9000';
const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockImplementation(
    async () => new Response(JSON.stringify({ favorites: [] })),
  );
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

/** `METHOD url` of every request sent, in order. */
function sentRequests(): string[] {
  return fetchMock.mock.calls.map(
    ([url, init]) => `${(init as RequestInit).method} ${url}`,
  );
}

describe('league-aware favorites API', () => {
  it('sends league=ahl on AHL team and player routes and leaves NHL routes unchanged', async () => {
    const category = { tier: 'fan', label: null } as const;
    await addFavorite(token, 'TOR', 'nhl');
    await addFavorite(token, 'TOR', 'ahl');
    await removeFavorite(token, 'CV', 'ahl');
    await updateFavoriteTeamCategory(token, 'TOR', 'ahl', category);
    await setFavoritePushMuted(token, 'TOR', 'ahl', true);
    await addFavoritePlayer(token, 42, 'nhl');
    await addFavoritePlayer(token, 42, 'ahl');
    await removeFavoritePlayer(token, 42, 'ahl');
    await updateFavoritePlayerCategory(token, 42, 'ahl', category);
    await setFavoritePlayerPushMuted(token, 42, 'ahl', true);

    expect(sentRequests()).toEqual([
      `PUT ${API}/api/favorites/TOR`,
      `PUT ${API}/api/favorites/TOR?league=ahl`,
      `DELETE ${API}/api/favorites/CV?league=ahl`,
      `PATCH ${API}/api/favorites/TOR?league=ahl`,
      `PUT ${API}/api/favorites/TOR/push-mute?league=ahl`,
      `PUT ${API}/api/favorite-players/42`,
      `PUT ${API}/api/favorite-players/42?league=ahl`,
      `DELETE ${API}/api/favorite-players/42?league=ahl`,
      `PATCH ${API}/api/favorite-players/42?league=ahl`,
      `PUT ${API}/api/favorite-players/42/push-mute?league=ahl`,
    ]);
  });

  it('keeps the same tri-code and player id once per league, reading a missing league as NHL', async () => {
    const team = { since: '2026-10-29T00:00:00Z', pushMuted: false };
    const player = {
      playerId: 42,
      name: 'Sam Skater',
      teamTriCode: 'TOR',
      position: 'C',
      headshot: null,
      since: '2026-10-29T00:00:00Z',
    };
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            favorites: [
              { ...team, triCode: 'TOR' },
              { ...team, triCode: 'TOR', league: 'ahl' },
            ],
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            favorites: [player, { ...player, league: 'ahl' }],
          }),
        ),
      );

    const teams = await fetchFavorites(token);
    const players = await fetchFavoritePlayers(token);

    expect(teams.map((t) => `${t.league} ${t.triCode}`)).toEqual([
      'nhl TOR',
      'ahl TOR',
    ]);
    expect(players.map((p) => `${p.league} ${p.playerId}`)).toEqual([
      'nhl 42',
      'ahl 42',
    ]);
  });
});
