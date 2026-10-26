const { test, expect } = await import(process.env.SPOTTER_TEST_MODULE);
const token = 'synthetic-session';
const tokenKey = 'rinkquest-auth-token';
const weekStart = '2026-10-19';

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

const opponents = ['MTL', 'BOS', 'OTT', 'DET', 'FLA', 'TBL', 'BUF', 'NYR'];

/**
 * A team's completed games in October, alternating home and road. The team
 * wins the even games 4-2 and loses the odd ones 1-3, the fourth in overtime.
 */
function seasonGames(triCode, count) {
  return Array.from({ length: count }, (_, index) => {
    const home = index % 2 === 0;
    const opponent = opponents[index % opponents.length];
    const won = index % 2 === 0;
    const [teamScore, opponentScore] = won ? [4, 2] : [1, 3];
    return {
      gameId: 2026020000 + index,
      date: `2026-10-${String(1 + index).padStart(2, '0')}`,
      gameTime: '19:00',
      dayOfWeek: 'MON',
      venue: 'Arena',
      homeTeam: home ? triCode : opponent,
      awayTeam: home ? opponent : triCode,
      homeLogo: '',
      awayLogo: '',
      homeScore: home ? teamScore : opponentScore,
      awayScore: home ? opponentScore : teamScore,
      periodType: index === 3 ? 'OT' : 'REG',
      gameState: 'OFF',
      ticketLink: '',
      gameCenter: '',
    };
  });
}

function weekGame(gameId, date, opponent, isHome, score, outcome) {
  const [teamScore, opponentScore] = score;
  return { gameId, date, opponent, isHome, teamScore, opponentScore, outcome };
}

function reportTeam(triCode, name, tier, weekGames, formGameCount) {
  const formGames = seasonGames(triCode, formGameCount).map(
    ({
      date,
      gameState,
      homeTeam,
      awayTeam,
      homeScore,
      awayScore,
      periodType,
    }) => ({
      date,
      gameState,
      homeTeam,
      awayTeam,
      homeScore,
      awayScore,
      periodType,
    }),
  );
  return { triCode, name, logo: null, tier, label: null, weekGames, formGames };
}

// Sent out of tier order: the page must show COL (Diehard), TOR, DAL.
const teams = [
  reportTeam('DAL', 'Dallas Stars', 'curious', [], 12),
  reportTeam(
    'TOR',
    'Toronto Maple Leafs',
    'fan',
    [
      weekGame(2026020110, '2026-10-21', 'MTL', true, [4, 2], 'W'),
      weekGame(2026020120, '2026-10-24', 'BOS', false, [1, 3], 'L'),
    ],
    14,
  ),
  reportTeam(
    'COL',
    'Colorado Avalanche',
    'diehard',
    [
      weekGame(2026020111, '2026-10-20', 'DAL', true, [5, 2], 'W'),
      weekGame(2026020121, '2026-10-22', 'VGK', false, [3, 4], 'OTL'),
      weekGame(2026020131, '2026-10-25', 'SEA', false, [4, 1], 'W'),
    ],
    13,
  ),
];

function buildReport({ withTeams }) {
  return {
    weekStart,
    weekEnd: '2026-10-25',
    label: 'Oct 19–25',
    headline: withTeams
      ? 'Connor McDavid led your favorites with 6 points. Teams: COL 2-0-1, TOR 1-1-0.'
      : 'Connor McDavid led your favorites with 6 points.',
    createdAt: '2026-10-26T13:00:00.000Z',
    read: false,
    players: [
      {
        playerId: 8478402,
        name: 'Connor McDavid',
        position: 'C',
        headshot: null,
        team: 'EDM',
        teams: ['EDM'],
        played: true,
        teamGames: 3,
        type: 'skater',
        stats: {
          gp: 3,
          goals: 2,
          assists: 4,
          points: 6,
          plusMinus: 3,
          shots: 11,
          toiPerGame: '21:40',
          bestGame: { gameId: 2026020101, text: '1G 2A vs CGY, Oct 21' },
        },
      },
    ],
    ...(withTeams ? { teams } : {}),
  };
}

/** Synthetic signed-in account API serving one weekly report. */
async function routeReportApi(context, { withTeams }) {
  const report = buildReport({ withTeams });
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

/** Synthetic team page data for TOR: 14 completed games, empty roster and stats. */
async function routeTeamPageApi(context) {
  const games = { games: seasonGames('TOR', 14) };
  await context.route('http://api.spotter.test/**', (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/schedule/' || path === '/team/schedule/TOR') {
      return route.fulfill({ json: games });
    }
    if (path === '/team/10') {
      return route.fulfill({
        json: { data: [{ teamFullName: 'Toronto Maple Leafs', teamId: 10 }] },
      });
    }
    if (path === '/team/roster/TOR') {
      return route.fulfill({ json: { players: [] } });
    }
    if (
      path === '/player/skater/summary' ||
      path === '/player/goalie/summary'
    ) {
      return route.fulfill({ json: [] });
    }
    if (path === '/player/skater/corsi' || path === '/player/skater/faceoffs') {
      return route.fulfill({ json: { data: [] } });
    }
    return route.fallback();
  });
}

async function openReport(page) {
  await page.goto(`./#/weekly-report/${weekStart}`);
  await expect(page.getByRole('heading', { name: 'Oct 19–25' })).toBeVisible();
}

async function expectNoHorizontalScroll(page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

const teamSection = (page) =>
  page.getByRole('region', { name: 'Favorite teams' });
const teamCard = (page, name) =>
  teamSection(page)
    .getByRole('listitem')
    .filter({
      has: page.getByRole('heading', { name, exact: true }),
    });

for (const width of [375, 1280]) {
  for (const colorScheme of ['light', 'dark']) {
    test.describe(`${width} ${colorScheme}`, () => {
      test.use({ viewport: { width, height: 900 }, colorScheme });

      signedInTest(
        "WPR-02 Verify: favorite teams follow the players in fan-tier order with the week's results and Team Form",
        async ({ page, context }) => {
          await routeReportApi(context, { withTeams: true });
          await openReport(page);

          const section = teamSection(page);
          await expect(section).toBeVisible();
          // Below the players.
          const playerBox = await page
            .getByRole('heading', { name: 'Connor McDavid' })
            .boundingBox();
          const sectionBox = await section.boundingBox();
          expect(sectionBox.y).toBeGreaterThan(playerBox.y);

          await expect(section.getByRole('heading', { level: 3 })).toHaveText([
            'Colorado Avalanche',
            'Toronto Maple Leafs',
            'Dallas Stars',
          ]);

          const colorado = teamCard(page, 'Colorado Avalanche');
          await expect(colorado.getByText('2-0-1 this week')).toBeVisible();
          const results = colorado.getByRole('list', {
            name: 'Colorado Avalanche results this week',
          });
          await expect(results.getByRole('link')).toHaveText([
            /Tue, Oct 20\s*vs DAL\s*5–2\s*W/,
            /Thu, Oct 22\s*@ VGK\s*3–4\s*OTL/,
            /Sun, Oct 25\s*@ SEA\s*4–1\s*W/,
          ]);
          await expect(results.getByRole('link').first()).toHaveAttribute(
            'href',
            /#\/game\/2026020111$/,
          );

          const toronto = teamCard(page, 'Toronto Maple Leafs');
          await expect(toronto.getByText('1-1-0 this week')).toBeVisible();
          await expect(
            toronto
              .getByRole('list', {
                name: 'Toronto Maple Leafs results this week',
              })
              .getByRole('link'),
          ).toHaveCount(2);

          // One full Team Form panel per team, each with its own heading id.
          const panels = section.getByRole('region', { name: 'Team Form' });
          await expect(panels).toHaveCount(3);
          const panelIds = await panels.evaluateAll((elements) =>
            elements.map((element) => element.getAttribute('aria-labelledby')),
          );
          expect(panelIds).toEqual([
            'team-form-COL',
            'team-form-TOR',
            'team-form-DAL',
          ]);
          const coloradoForm = colorado.getByRole('region', {
            name: 'Team Form',
          });
          await expect(
            coloradoForm.getByText('13 completed games · goal differential'),
          ).toBeVisible();
          await expect(coloradoForm.getByText('Last 10')).toBeVisible();
          await expect(
            coloradoForm.getByRole('img', { name: /^Last 10: / }),
          ).toBeVisible();
          await expect(
            coloradoForm.getByRole('heading', {
              name: 'Rolling points percentage',
            }),
          ).toBeVisible();
          await expect(
            coloradoForm.getByRole('heading', { name: 'Home / Road' }),
          ).toBeVisible();

          await expectNoHorizontalScroll(page);
        },
      );

      signedInTest(
        'WPR-02 Verify: a team with no games that week shows "No games this week" with its form',
        async ({ page, context }) => {
          await routeReportApi(context, { withTeams: true });
          await openReport(page);

          const dallas = teamCard(page, 'Dallas Stars');
          await expect(dallas.getByText('No games this week')).toBeVisible();
          await expect(dallas.getByText(/this week$/)).toHaveText(
            'No games this week',
          );
          await expect(
            dallas.getByRole('list', {
              name: 'Dallas Stars results this week',
            }),
          ).toHaveCount(0);
          const form = dallas.getByRole('region', { name: 'Team Form' });
          await expect(form).toBeVisible();
          await expect(
            form.getByText('12 completed games · goal differential'),
          ).toBeVisible();
          await expect(
            form.getByRole('img', { name: /^Last 10: / }),
          ).toBeVisible();

          await expectNoHorizontalScroll(page);
        },
      );

      signedInTest(
        'WPR-02 Verify: a report without teams shows no team section',
        async ({ page, context }) => {
          await routeReportApi(context, { withTeams: false });
          await openReport(page);

          await expect(
            page.getByRole('heading', { name: 'Connor McDavid' }),
          ).toBeVisible();
          await expect(
            page.getByRole('heading', { name: 'Favorite teams' }),
          ).toHaveCount(0);
          await expect(
            page.getByRole('region', { name: 'Team Form' }),
          ).toHaveCount(0);
          await expect(
            page.getByRole('heading', { name: /^Favorite players/ }),
          ).toBeVisible();

          await expectNoHorizontalScroll(page);
        },
      );

      test.describe('TeamPage', () => {
        // The entry animation is part of what must stay unchanged.
        test.use({ reducedMotion: 'no-preference' });

        test("WPR-02 Verify: TeamPage's Team Form is unchanged after the move", async ({
          page,
          context,
        }) => {
          await routeTeamPageApi(context);
          await page.goto('./#/team/TOR');

          const panel = page.getByRole('region', { name: 'Team Form' });
          await expect(panel).toHaveCount(1);
          await expect(panel).toHaveAttribute(
            'aria-labelledby',
            'team-form-heading',
          );
          await expect(
            panel.getByRole('heading', { level: 2, name: 'Team Form' }),
          ).toHaveAttribute('id', 'team-form-heading');
          await expect(
            panel.getByText('14 completed games · goal differential 0'),
          ).toBeVisible();
          await expect(
            panel.getByRole('img', { name: 'Last 10: 5-5-0' }),
          ).toBeVisible();
          await expect(
            panel.getByRole('heading', {
              level: 3,
              name: 'Rolling points percentage',
            }),
          ).toBeVisible();
          await expect(
            panel.getByRole('heading', { level: 3, name: 'Home / Road' }),
          ).toBeVisible();
          await expect(
            panel.getByRole('img', {
              name: 'Rolling points percentage over completed games',
            }),
          ).toBeVisible();

          // TeamPage's own placement: margin under the panel and the entry animation.
          const placement = await panel.evaluate((element) => {
            const style = getComputedStyle(element);
            return {
              marginTop: style.marginTop,
              marginBottom: style.marginBottom,
              padding: style.paddingTop,
              animationName: style.animationName,
            };
          });
          expect(placement.marginTop).toBe('0px');
          expect(placement.marginBottom).not.toBe('0px');
          expect(placement.padding).toBe(width <= 576 ? '16px' : '24px');
          expect(placement.animationName).toMatch(/team-form-enter/);

          await expectNoHorizontalScroll(page);
        });
      });
    });
  }
}
