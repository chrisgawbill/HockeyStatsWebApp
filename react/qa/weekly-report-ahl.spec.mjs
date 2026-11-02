const { test, expect } = await import(process.env.SPOTTER_TEST_MODULE);
const token = 'synthetic-session';
const tokenKey = 'rinkquest-auth-token';
const weekStart = '2026-10-26';

// These checks bring their own synthetic session and API.
test.use({ spotterSession: 'anonymous' });

const signedInTest = test.extend({
  storageState: async ({ baseURL, colorScheme }, use) => {
    await use({
      cookies: [],
      origins: [
        {
          origin: new URL(baseURL).origin,
          localStorage: [
            { name: tokenKey, value: token },
            { name: 'theme', value: colorScheme },
          ],
        },
      ],
    });
  },
});

function formGame(triCode, day, home, [teamScore, opponentScore]) {
  return {
    date: `2026-10-${day}`,
    gameState: 'OFF',
    homeTeam: home ? triCode : 'OPP',
    awayTeam: home ? 'OPP' : triCode,
    homeScore: home ? teamScore : opponentScore,
    awayScore: home ? opponentScore : teamScore,
    periodType: 'REG',
  };
}

function weekGame(gameId, date, opponent, isHome, score, outcome) {
  const [teamScore, opponentScore] = score;
  return { gameId, date, opponent, isHome, teamScore, opponentScore, outcome };
}

function skater({ league, playerId, name, team, toiPerGame, bestGameId }) {
  return {
    ...(league ? { league } : {}),
    playerId,
    name,
    position: 'C',
    headshot: null,
    team,
    teams: [team],
    played: true,
    teamGames: 2,
    type: 'skater',
    stats: {
      gp: 2,
      goals: 1,
      assists: 2,
      points: 3,
      plusMinus: 1,
      shots: 6,
      toiPerGame,
      bestGame: { gameId: bestGameId, text: '1G 1A vs OPP, Oct 28' },
    },
  };
}

// The same tri-code in both leagues: the Maple Leafs and the Marlies.
const report = {
  weekStart,
  weekEnd: '2026-11-01',
  label: 'Oct 26–Nov 1',
  headline: 'Auston Matthews: 1G 2A in 2 GP and 1 more.',
  createdAt: '2026-11-02T14:00:00.000Z',
  read: false,
  players: [
    skater({
      league: 'nhl',
      playerId: 8479318,
      name: 'Auston Matthews',
      team: 'TOR',
      toiPerGame: '20:51',
      bestGameId: 2026020150,
    }),
    skater({
      league: 'ahl',
      playerId: 8479318,
      name: 'Easton Cowan',
      team: 'TOR',
      toiPerGame: null,
      bestGameId: 1027001,
    }),
  ],
  teams: [
    {
      league: 'nhl',
      triCode: 'TOR',
      name: 'Toronto Maple Leafs',
      logo: null,
      tier: 'diehard',
      label: null,
      weekGames: [weekGame(2026020150, '2026-10-28', 'MTL', true, [4, 2], 'W')],
      formGames: [formGame('TOR', '28', true, [4, 2])],
    },
    {
      league: 'ahl',
      triCode: 'TOR',
      name: 'Toronto Marlies',
      logo: null,
      tier: 'fan',
      label: null,
      weekGames: [weekGame(1027001, '2026-10-31', 'BEL', false, [2, 3], 'L')],
      formGames: [formGame('TOR', '31', false, [2, 3])],
    },
  ],
};

/** Synthetic signed-in account API serving one mixed-league weekly report. */
async function routeReportApi(context) {
  const fixed = {
    '/api/auth/me': { email: 'member@example.test' },
    '/api/push/config': { enabled: false },
    '/api/favorites': { favorites: [] },
    '/api/after-action-reports': { reports: [], unreadCount: 0 },
    '/api/favorite-players': { favorites: [] },
    '/api/push/weekly-report': { enabled: true },
    '/api/weekly-player-reports': { reports: [report], unreadCount: 1 },
    [`/api/weekly-player-reports/${weekStart}`]: report,
  };
  await context.route('http://api.spotter.test/api/**', (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/read')) return route.fulfill({ status: 204 });
    const response = fixed[path];
    return response ? route.fulfill({ json: response }) : route.fallback();
  });
}

const playerCard = (page, name) =>
  page
    .getByRole('listitem')
    .filter({ has: page.getByRole('heading', { name, exact: true }) });

for (const width of [375, 1280]) {
  for (const colorScheme of ['light', 'dark']) {
    test.describe(`${width} ${colorScheme}`, () => {
      test.use({ viewport: { width, height: 900 }, colorScheme });

      signedInTest(
        'AHL-03 Verify: AHL players and teams show as AHL and link to AHL games',
        async ({ page, context }) => {
          await routeReportApi(context);
          await page.goto(`./#/weekly-report/${weekStart}`);
          await expect(
            page.getByRole('heading', { name: 'Oct 26–Nov 1' }),
          ).toBeVisible();

          // Players: the AHL one is tagged and has no TOI chip.
          const nhlPlayer = playerCard(page, 'Auston Matthews');
          await expect(nhlPlayer.getByText('TOR · C')).toBeVisible();
          await expect(nhlPlayer.getByText('20:51 TOI/GP')).toBeVisible();
          await expect(
            nhlPlayer.getByRole('link', { name: /Oct 28/ }),
          ).toHaveAttribute('href', /#\/game\/2026020150$/);

          const ahlPlayer = playerCard(page, 'Easton Cowan');
          await expect(ahlPlayer.getByText('AHL · TOR · C')).toBeVisible();
          await expect(ahlPlayer.getByText(/TOI\/GP/)).toHaveCount(0);
          await expect(
            ahlPlayer.getByRole('link', { name: /Oct 28/ }),
          ).toHaveAttribute('href', /#\/game\/1027001\?league=ahl$/);

          // Teams: two TOR cards told apart, each with its own ids and links.
          const section = page.getByRole('region', { name: 'Favorite teams' });
          await expect(section.getByRole('heading', { level: 3 })).toHaveText([
            'Toronto Maple Leafs',
            'Toronto Marlies',
          ]);
          await expect(section.getByText('1-0-0 this week')).toBeVisible();
          await expect(
            section.getByText('AHL · 0-1-0 this week'),
          ).toBeVisible();
          await expect(
            section
              .getByRole('list', { name: 'Toronto Marlies results this week' })
              .getByRole('link'),
          ).toHaveAttribute('href', /#\/game\/1027001\?league=ahl$/);
          await expect(
            section
              .getByRole('list', {
                name: 'Toronto Maple Leafs results this week',
              })
              .getByRole('link'),
          ).toHaveAttribute('href', /#\/game\/2026020150$/);

          const panelIds = await section
            .getByRole('region', { name: 'Team Form' })
            .evaluateAll((elements) =>
              elements.map((element) =>
                element.getAttribute('aria-labelledby'),
              ),
            );
          expect(panelIds).toEqual(['team-form-TOR', 'team-form-ahl-TOR']);

          const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth - window.innerWidth,
          );
          expect(overflow).toBeLessThanOrEqual(0);
        },
      );
    });
  }
}
