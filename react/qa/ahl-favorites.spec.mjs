const { test, expect } = await import(process.env.SPOTTER_TEST_MODULE);
import { token } from '../src/test/fixtures/account.mjs';
import { SEASON, routeAhlApi } from '../src/test/fixtures/ahlLeague.mjs';

// AHL favorites in the shared favorites list. AHL pages come from the
// synthetic AHL league; the favorites API below is a small stateful fake with
// the API-AHL-03 shared 5-team limit. Toronto is on purpose: the Marlies and
// the Maple Leafs share `TOR`.
test.use({ spotterSession: 'anonymous' });

const signedInTest = test.extend({
  storageState: async ({ baseURL, colorScheme }, use) => {
    await use({
      cookies: [],
      origins: [
        {
          origin: new URL(baseURL).origin,
          localStorage: [
            { name: 'rinkquest-auth-token', value: token },
            { name: 'theme', value: colorScheme },
          ],
        },
      ],
    });
  },
});

/** A favorite team row as the API returns it. */
function favoriteTeam(triCode, league = 'nhl') {
  return {
    league,
    triCode,
    since: '2026-10-01T00:00:00.000Z',
    pushMuted: false,
    tier: 'fan',
    label: null,
  };
}

/**
 * Signed-in account API with stateful favorite teams. Registered after the
 * AHL routes so `?league=ahl` favorites calls land here. Returns the list of
 * favorites writes (`METHOD path?query`).
 */
async function routeAccountApi(page, initialTeams) {
  const teams = [...initialTeams];
  const writes = [];
  await page.route('http://api.spotter.test/api/**', (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const team = url.pathname.match(/^\/api\/favorites\/([A-Z]+)$/);
    if (team && (method === 'PUT' || method === 'DELETE')) {
      writes.push(`${method} ${url.pathname}${url.search}`);
      const league = url.searchParams.get('league') ?? 'nhl';
      const index = teams.findIndex(
        (favorite) =>
          favorite.league === league && favorite.triCode === team[1],
      );
      if (method === 'DELETE' && index >= 0) teams.splice(index, 1);
      if (method === 'PUT' && index < 0) {
        if (teams.length >= 5) {
          return route.fulfill({ status: 409, json: { error: 'Limit' } });
        }
        teams.push(favoriteTeam(team[1], league));
      }
      return route.fulfill({ json: { favorites: teams } });
    }
    const fixed = {
      '/api/auth/me': { email: 'member@example.test' },
      '/api/push/config': { enabled: false, publicKey: '' },
      '/api/favorites': { favorites: teams },
      '/api/favorite-players': { favorites: [] },
      '/api/after-action-reports': { reports: [], unreadCount: 0 },
      '/api/weekly-player-reports': { reports: [], unreadCount: 0 },
      '/api/push/weekly-report': { enabled: false },
    };
    const response = fixed[url.pathname];
    return response ? route.fulfill({ json: response }) : route.fallback();
  });
  return writes;
}

const marliesPage = `./#/team/TOR?league=ahl&season=${SEASON}`;

signedInTest(
  'AHL-02 Verify: favoriting the AHL TOR keeps it apart from the NHL TOR, and unfavoriting removes only it',
  async ({ page }) => {
    await routeAhlApi(page);
    const writes = await routeAccountApi(page, [favoriteTeam('TOR')]);

    await page.goto(marliesPage);
    await page
      .getByRole('button', { name: 'Favorite Toronto Marlies', exact: true })
      .click();
    await expect(
      page.getByRole('button', {
        name: /Fan category and options for Toronto Marlies/,
      }),
    ).toBeVisible();
    expect(writes).toEqual(['PUT /api/favorites/TOR?league=ahl']);

    await page.goto('./#/my-hockey');
    const yourTeams = page.getByRole('region', { name: 'Your teams' });
    const leafs = yourTeams.getByRole('link', { name: /Toronto Maple Leafs/ });
    const marlies = yourTeams.getByRole('link', { name: /Toronto Marlies/ });
    await expect(leafs).toHaveAttribute('href', /team\/TOR\?league=nhl/);
    await expect(leafs).not.toContainText('AHL');
    await expect(marlies).toHaveAttribute('href', /team\/TOR\?league=ahl/);
    await expect(marlies).toContainText('AHL');

    await yourTeams
      .getByRole('button', {
        name: 'Fan category and options for Toronto Marlies',
      })
      .click();
    await page.getByRole('button', { name: 'Unfavorite' }).click();
    await expect(marlies).toHaveCount(0);
    await expect(leafs).toBeVisible();
    expect(writes).toEqual([
      'PUT /api/favorites/TOR?league=ahl',
      'DELETE /api/favorites/TOR?league=ahl',
    ]);
  },
);

signedInTest(
  'AHL-02 Verify: at 5 teams across both leagues, a sixth from either league shows the limit message',
  async ({ page }) => {
    await routeAhlApi(page);
    await routeAccountApi(page, [
      favoriteTeam('EDM'),
      favoriteTeam('MTL'),
      favoriteTeam('BOS'),
      favoriteTeam('LAV', 'ahl'),
      favoriteTeam('HER', 'ahl'),
    ]);
    const limitMessage = /up to 5 teams across the NHL and AHL/;

    await page.goto(marliesPage);
    await page
      .getByRole('button', { name: 'Favorite Toronto Marlies', exact: true })
      .click();
    await expect(page.getByRole('alert')).toHaveText(limitMessage);

    // The device now remembers the AHL, so the NHL page names its league.
    await page.goto('./#/team/TOR?league=nhl');
    await page
      .getByRole('button', {
        name: 'Favorite Toronto Maple Leafs for After Action Reports',
      })
      .click();
    await expect(page.getByRole('alert')).toHaveText(limitMessage);
  },
);
