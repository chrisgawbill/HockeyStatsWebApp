const { test, expect } = await import(process.env.SPOTTER_TEST_MODULE);

// The game page's links out: header teams open their team page; a three-star
// card or a box score row opens the player's season stats dialog.
test.use({ spotterSession: 'anonymous' });

const API = 'http://api.spotter.test';
const GAME_ID = 2026020124;
const MATTHEWS = 8478483;
const PASTRNAK = 8477956;
const SWAYMAN = 8480280;

function team(id, abbrev, name, score) {
  return {
    id,
    abbrev,
    commonName: { default: name },
    score,
    sog: 30,
    logo: '',
    darkLogo: '',
  };
}

function skater(playerId, name, position, goals) {
  return {
    playerId,
    sweaterNumber: 34,
    name: { default: name },
    position,
    goals,
    assists: 1,
    points: goals + 1,
    plusMinus: 1,
    pim: 0,
    hits: 2,
    powerPlayGoals: 0,
    sog: 4,
    faceoffWinningPctg: 0.5,
    toi: '19:30',
    blockedShots: 1,
  };
}

const BOXSCORE = {
  id: GAME_ID,
  gameState: 'OFF',
  gameDate: '2026-10-25',
  startTimeUTC: '2026-10-25T23:00:00Z',
  venue: { default: 'Scotiabank Arena' },
  homeTeam: team(10, 'TOR', 'Maple Leafs', 4),
  awayTeam: team(6, 'BOS', 'Bruins', 2),
  periodDescriptor: { number: 3, periodType: 'REG' },
  gameOutcome: { lastPeriodType: 'REG' },
  playerByGameStats: {
    homeTeam: {
      forwards: [skater(MATTHEWS, 'Auston Matthews', 'C', 2)],
      defense: [],
      goalies: [],
    },
    awayTeam: {
      forwards: [skater(PASTRNAK, 'David Pastrnak', 'R', 1)],
      defense: [],
      goalies: [
        {
          playerId: SWAYMAN,
          sweaterNumber: 1,
          name: { default: 'Jeremy Swayman' },
          position: 'G',
          saveShotsAgainst: '26/30',
          savePctg: 0.867,
          goalsAgainst: 4,
          toi: '59:00',
          starter: true,
          decision: 'L',
          shotsAgainst: 30,
          saves: 26,
        },
      ],
    },
  },
};

const THREE_STARS = [
  {
    star: 1,
    playerId: MATTHEWS,
    teamAbbrev: 'TOR',
    headshot: '',
    name: { default: 'Auston Matthews' },
    sweaterNo: 34,
    position: 'C',
    goals: 2,
    assists: 1,
    points: 3,
  },
];

/** Routes the game page's calls and the season summaries the dialog loads. */
async function routeGameApi(page) {
  await page.route(`${API}/schedule/${GAME_ID}`, (route) =>
    route.fulfill({ json: BOXSCORE }),
  );
  await page.route(`${API}/schedule/landing/${GAME_ID}`, (route) =>
    route.fulfill({
      json: {
        id: GAME_ID,
        gameState: 'OFF',
        summary: { scoring: [], threeStars: THREE_STARS },
      },
    }),
  );
  await page.route(`${API}/schedule/playbyplay/${GAME_ID}`, (route) =>
    route.fulfill({ status: 404, json: { error: 'Not found' } }),
  );
  await page.route(`${API}/player/skater/summary**`, (route) =>
    route.fulfill({
      json: [MATTHEWS, PASTRNAK].map((playerId) => ({
        playerId,
        name: 'Player',
        position: 'C',
        gamesPlayed: 10,
        goals: 7,
        assists: 5,
        points: 12,
        plusMinus: 3,
        penaltyMinutes: 2,
      })),
    }),
  );
}

async function openGame(page) {
  await routeGameApi(page);
  await page.goto(`./#/game/${GAME_ID}`);
  await expect(
    page.getByRole('heading', { name: 'BOS at TOR' }),
  ).toBeAttached();
}

test.describe('game player links', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('GAME-LINKS Verify: a header team opens its team page', async ({
    page,
  }) => {
    await openGame(page);
    await page.getByRole('link', { name: 'TOR', exact: true }).click();
    await expect(page).toHaveURL(/#\/team\/TOR/);
  });

  test('GAME-LINKS Verify: a three-star card opens the player stats dialog', async ({
    page,
  }) => {
    await openGame(page);
    const stars = page.locator('section', {
      has: page.getByRole('heading', { name: 'Three Stars' }),
    });
    // The name button stretches over the card, so a click on the card's
    // label lands on it (force skips the "covered by" actionability check).
    await stars.getByText('1st Star').click({ force: true });
    const dialog = page.getByRole('dialog');
    await expect(
      dialog.getByRole('heading', { name: 'Auston Matthews' }),
    ).toBeVisible();
    await expect(dialog.getByText('TOR · C')).toBeVisible();
    await expect(dialog.getByText('12', { exact: true })).toBeVisible();
    await dialog.getByRole('button', { name: 'Close' }).click();
    await expect(dialog).toHaveCount(0);
  });

  test('GAME-LINKS Verify: box score rows open the player stats dialog by click and keyboard', async ({
    page,
  }) => {
    await openGame(page);
    const playerStats = page.locator('section', {
      has: page.getByRole('heading', { name: 'Player Stats' }),
    });
    await playerStats
      .getByRole('row', { name: /David Pastrnak/ })
      .getByRole('cell')
      .last()
      .click();
    const dialog = page.getByRole('dialog');
    await expect(
      dialog.getByRole('heading', { name: 'David Pastrnak' }),
    ).toBeVisible();
    await expect(dialog.getByText('BOS · R')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);

    await playerStats
      .getByRole('button', { name: 'Jeremy Swayman', exact: true })
      .focus();
    await page.keyboard.press('Enter');
    await expect(
      dialog.getByRole('heading', { name: 'Jeremy Swayman' }),
    ).toBeVisible();
  });
});

test.describe('team player stats', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('GAME-LINKS Verify: a team page Player Stats row opens the player stats dialog', async ({
    page,
  }) => {
    // The team page's season calls, empty apart from one skater; anything
    // else the page asks for is not needed here.
    await page.route(`${API}/**`, (route) =>
      route.fulfill({ status: 404, json: { error: 'Not found' } }),
    );
    const emptyResponses = {
      '/team/10?': { data: [{ teamFullName: 'Toronto Maple Leafs' }] },
      '/team/roster/TOR?': { players: [] },
      '/team/schedule/TOR?': { games: [] },
      '/player/skater/corsi?': { data: [] },
    };
    for (const [path, json] of Object.entries(emptyResponses)) {
      await page.route(`${API}${path}**`, (route) => route.fulfill({ json }));
    }
    await page.route(`${API}/player/skater/summary**`, (route) =>
      route.fulfill({
        json: [
          {
            playerId: MATTHEWS,
            name: 'Auston Matthews',
            position: 'C',
            gamesPlayed: 10,
            goals: 7,
            assists: 5,
            points: 12,
            plusMinus: 3,
            penaltyMinutes: 2,
          },
        ],
      }),
    );
    await page.goto('./#/team/TOR');
    const leaders = page.locator('section', {
      has: page.getByRole('heading', { name: 'Player Stats' }),
    });
    await leaders.getByText('Goals Leaders').waitFor();
    await leaders.getByText('10 GP').click();
    const dialog = page.getByRole('dialog');
    await expect(
      dialog.getByRole('heading', { name: 'Auston Matthews' }),
    ).toBeVisible();
    await expect(dialog.getByText('TOR · C')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);

    await leaders
      .getByRole('button', { name: 'Auston Matthews', exact: true })
      .focus();
    await page.keyboard.press('Enter');
    await expect(
      dialog.getByRole('heading', { name: 'Auston Matthews' }),
    ).toBeVisible();
  });
});
