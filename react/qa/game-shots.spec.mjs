const { test, expect } = await import(process.env.SPOTTER_TEST_MODULE);

// The game page against a synthetic API: BOS at TOR, TOR wins 4-3 in
// overtime. Play-by-play follows the API-PBP-01 contract (home shoots toward
// +x, missing locations are null).
test.use({ spotterSession: 'anonymous' });

const API = 'http://api.spotter.test';
const GAME_ID = 2026020123;
const MATTHEWS = 8478483;

const ROSTERS = {
  TOR: [
    [MATTHEWS, 'Auston Matthews'],
    [8477939, 'William Nylander'],
    [8482720, 'Matthew Knies'],
    [8476853, 'Morgan Rielly'],
  ],
  BOS: [
    [8477956, 'David Pastrnak'],
    [8478398, 'Elias Lindholm'],
    [8479325, 'Charlie McAvoy'],
  ],
};

/** "MM:SS" within the period for a second of the game. */
function clockFor(elapsedSeconds) {
  const intoPeriod = elapsedSeconds % 1200;
  const minutes = String(Math.floor(intoPeriod / 60)).padStart(2, '0');
  return `${minutes}:${String(intoPeriod % 60).padStart(2, '0')}`;
}

let nextEventId = 1;

/** One play-by-play event; home (TOR) shots sit at +x, away (BOS) at -x. */
function event(team, shooterIndex, elapsedSeconds, type, overrides = {}) {
  const period = Math.min(4, Math.floor(elapsedSeconds / 1200) + 1);
  const [shooterId, shooterName] = ROSTERS[team][shooterIndex];
  const side = team === 'TOR' ? 1 : -1;
  return {
    eventId: nextEventId++,
    period,
    periodType: period === 4 ? 'OT' : 'REG',
    timeInPeriod: clockFor(elapsedSeconds),
    elapsedSeconds,
    type,
    teamTriCode: team,
    shooterId,
    shooterName,
    goalieId: type === 'block' ? null : 1,
    x: side * (40 + ((elapsedSeconds * 7) % 50)),
    y: ((elapsedSeconds * 13) % 70) - 35,
    shotType: type === 'block' ? null : 'wrist',
    strength: 'ev',
    ...overrides,
  };
}

const TYPES = ['shot', 'shot', 'miss', 'block', 'shot'];

/** A recorded-shape overtime game: seven goals, steady attempts, two power plays, one shot with no location. */
function overtimeGameEvents() {
  const goals = [
    event('BOS', 1, 372, 'goal'),
    event('TOR', 0, 880, 'goal', { strength: 'pp', shotType: 'snap' }),
    event('TOR', 2, 1385, 'goal', { shotType: 'tip-in' }),
    event('BOS', 0, 1890, 'goal', { strength: 'pp' }),
    event('TOR', 1, 2710, 'goal'),
    event('BOS', 2, 3531, 'goal'),
    event('TOR', 0, 3734, 'goal'),
  ];
  const attempts = [];
  for (let second = 60; second < 3600; second += 90) {
    attempts.push(
      event(
        'TOR',
        ((second / 90) % 4) | 0,
        second,
        TYPES[((second / 90) % 5) | 0],
        {
          strength: second > 2000 && second < 2120 ? 'pp' : 'ev',
        },
      ),
    );
    if (second % 180 === 60) {
      attempts.push(
        event(
          'BOS',
          ((second / 180) % 3) | 0,
          second + 30,
          TYPES[((second / 180) % 5) | 0],
          {
            strength: second > 3000 && second < 3200 ? 'sh' : 'ev',
          },
        ),
      );
    }
  }
  attempts.push(event('TOR', 3, 3650, 'shot'));
  attempts[5] = { ...attempts[5], type: 'shot', x: null, y: null };
  return [...goals, ...attempts].sort(
    (first, second) => first.elapsedSeconds - second.elapsedSeconds,
  );
}

const EVENTS = overtimeGameEvents();

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

function boxscore(gameState) {
  return {
    id: GAME_ID,
    gameState,
    gameDate: '2026-10-24',
    startTimeUTC: '2026-10-24T23:00:00Z',
    venue: { default: 'Scotiabank Arena' },
    homeTeam: team(10, 'TOR', 'Maple Leafs', 4),
    awayTeam: team(6, 'BOS', 'Bruins', 3),
    periodDescriptor: {
      number: gameState === 'LIVE' ? 1 : 4,
      periodType: 'REG',
    },
    gameOutcome: gameState === 'OFF' ? { lastPeriodType: 'OT' } : undefined,
  };
}

function playByPlay(gameState, events) {
  return {
    gameId: GAME_ID,
    gameState,
    homeTeam: { id: 10, triCode: 'TOR' },
    awayTeam: { id: 6, triCode: 'BOS' },
    events,
  };
}

/**
 * Routes the game page's three game calls. `playByPlayStatus` 404 stands for
 * an API without the play-by-play route.
 */
async function routeGameApi(
  page,
  { gameState = 'OFF', events = EVENTS, playByPlayStatus = 200 } = {},
) {
  await page.route(`${API}/schedule/${GAME_ID}`, (route) =>
    route.fulfill({ json: boxscore(gameState) }),
  );
  await page.route(`${API}/schedule/landing/${GAME_ID}`, (route) =>
    route.fulfill({
      json: {
        id: GAME_ID,
        gameState,
        summary: { scoring: [], threeStars: [] },
      },
    }),
  );
  await page.route(`${API}/schedule/playbyplay/${GAME_ID}`, (route) =>
    playByPlayStatus === 200
      ? route.fulfill({ json: playByPlay(gameState, events) })
      : route.fulfill({
          status: playByPlayStatus,
          json: { error: 'Not found' },
        }),
  );
}

async function openGame(page) {
  await page.goto(`./#/game/${GAME_ID}`);
  await expect(
    page.getByRole('heading', { name: 'BOS at TOR' }),
  ).toBeAttached();
}

const shotMap = (page) => page.getByRole('region', { name: 'Shot map' });
const gameFlow = (page) => page.getByRole('region', { name: 'Game flow' });
const markers = (page) =>
  page.locator('[data-testid="shot-rink"] [data-shot-type]');

/** Events the map should draw for a filter: not blocked, with a location. */
function expectedMarkers({ period, strength, shooterId } = {}) {
  return EVENTS.filter(
    (shot) =>
      shot.type !== 'block' &&
      shot.x !== null &&
      (period === undefined || shot.period === period) &&
      (strength === undefined || shot.strength === strength) &&
      (shooterId === undefined || shot.shooterId === shooterId),
  );
}

async function expectNoHorizontalScroll(page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

test.describe('game shots', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('GAME-SHOTS-01 Verify: shot map marker counts match the events for the period, strength and player filters', async ({
    page,
  }) => {
    await routeGameApi(page);
    await openGame(page);
    const map = shotMap(page);
    await expect(map).toBeVisible();

    await expect(markers(page)).toHaveCount(expectedMarkers().length);
    await expect(
      page.locator('[data-testid="shot-rink"] [data-shot-type="goal"]'),
    ).toHaveCount(7);
    await expect(
      map.getByText('1 shot has no recorded location'),
    ).toBeVisible();

    const periods = map.getByRole('group', { name: 'Period' });
    await expect(periods.getByRole('button')).toHaveText([
      'All',
      '1st',
      '2nd',
      '3rd',
      'OT',
    ]);
    await periods.getByRole('button', { name: '2nd' }).click();
    await expect(markers(page)).toHaveCount(
      expectedMarkers({ period: 2 }).length,
    );
    await periods.getByRole('button', { name: 'OT' }).click();
    await expect(markers(page)).toHaveCount(
      expectedMarkers({ period: 4 }).length,
    );
    await periods.getByRole('button', { name: 'All' }).click();

    await map.getByLabel('Strength').selectOption({ label: 'Power play' });
    await expect(markers(page)).toHaveCount(
      expectedMarkers({ strength: 'pp' }).length,
    );
    await map.getByLabel('Strength').selectOption({ label: 'All strengths' });

    const player = map.getByLabel('Player');
    await expect(player.locator('optgroup')).toHaveCount(2);
    await player.selectOption({ label: 'Auston Matthews' });
    const matthews = expectedMarkers({ shooterId: MATTHEWS });
    await expect(markers(page)).toHaveCount(matthews.length);
    await expect(
      page.locator('[data-testid="shot-rink"] [data-team="BOS"]'),
    ).toHaveCount(0);
    await expect(page.getByTestId('tally-TOR')).toContainText(
      `${matthews.filter((shot) => shot.type === 'goal').length} G`,
    );

    // Combined: Matthews, 1st period, power play.
    await periods.getByRole('button', { name: '1st' }).click();
    await map.getByLabel('Strength').selectOption({ label: 'Power play' });
    await expect(markers(page)).toHaveCount(
      expectedMarkers({ period: 1, strength: 'pp', shooterId: MATTHEWS })
        .length,
    );

    // An empty combination says so and resets.
    await map.getByLabel('Strength').selectOption({ label: 'Shorthanded' });
    await expect(markers(page)).toHaveCount(0);
    await expect(
      map.getByText(
        'No shots by Auston Matthews in the 1st period shorthanded.',
      ),
    ).toBeVisible();
    await map.getByRole('button', { name: 'Reset filters' }).click();
    await expect(markers(page)).toHaveCount(expectedMarkers().length);
  });

  test('GAME-SHOTS-01 Verify: goals, period dividers and overtime render on the game flow and in the text summary', async ({
    page,
  }) => {
    await routeGameApi(page);
    await openGame(page);
    const flow = gameFlow(page);
    await expect(flow).toBeVisible();

    await expect(flow.getByTestId('flow-goal')).toHaveCount(7);
    await expect(flow.getByTestId('period-divider')).toHaveCount(3);
    await expect(flow.getByTestId('overtime-band')).toHaveCount(1);
    await expect(
      flow.locator('[data-team="TOR"] [data-testid="flow-goal"]'),
    ).toHaveCount(4);
    const torAttempts = EVENTS.filter(
      (shot) => shot.teamTriCode === 'TOR',
    ).length;
    const bosAttempts = EVENTS.filter(
      (shot) => shot.teamTriCode === 'BOS',
    ).length;
    await expect(
      flow.getByText(`TOR ${torAttempts}`, { exact: true }),
    ).toBeAttached();
    await expect(
      flow.getByText(`BOS ${bosAttempts}`, { exact: true }),
    ).toBeAttached();
    await expect(flow.getByText('OT winner 02:14')).toBeAttached();

    // Home markers sit on the right half of the rink, away on the left.
    const rinkBox = await page.getByTestId('shot-rink').boundingBox();
    const centerX = rinkBox.x + rinkBox.width / 2;
    for (const [teamCode, isRight] of [
      ['TOR', true],
      ['BOS', false],
    ]) {
      const box = await page
        .locator(`[data-testid="shot-rink"] [data-team="${teamCode}"]`)
        .first()
        .boundingBox();
      expect(box.x + box.width / 2 > centerX).toBe(isRight);
    }

    // The text summary: one row per period including OT, then totals.
    const map = shotMap(page);
    await map.getByText('Shots and goals by period (table)').click();
    const table = map.getByRole('table');
    await expect(table.getByRole('rowheader')).toHaveText([
      '1st',
      '2nd',
      '3rd',
      'OT',
      'Total',
    ]);
    const overtimeRow = table.getByRole('row').filter({
      has: page.getByRole('rowheader', { name: 'OT', exact: true }),
    });
    // BOS G, SOG, Att., then TOR G, SOG, Att.
    await expect(overtimeRow.getByRole('cell')).toHaveText([
      '0',
      '0',
      '0',
      '1',
      '2',
      '2',
    ]);
    const totalRow = table.getByRole('row').filter({
      has: page.getByRole('rowheader', { name: 'Total', exact: true }),
    });
    await expect(totalRow.getByRole('cell').nth(0)).toHaveText('3');
    await expect(totalRow.getByRole('cell').nth(2)).toHaveText(
      String(bosAttempts),
    );
    await expect(totalRow.getByRole('cell').nth(3)).toHaveText('4');
    await expect(totalRow.getByRole('cell').nth(5)).toHaveText(
      String(torAttempts),
    );
  });

  test('GAME-SHOTS-01 Verify: a 404 from play-by-play hides both views', async ({
    page,
  }) => {
    await routeGameApi(page, { playByPlayStatus: 404 });
    const answered = page.waitForResponse(
      `${API}/schedule/playbyplay/${GAME_ID}`,
    );
    await openGame(page);
    await answered;
    await expect(
      page.getByRole('heading', { name: 'BOS at TOR' }),
    ).toBeAttached();
    await expect(page.getByRole('heading', { name: 'Game flow' })).toHaveCount(
      0,
    );
    await expect(page.getByRole('heading', { name: 'Shot map' })).toHaveCount(
      0,
    );
    await expect(page.getByText("Couldn't load the shot data.")).toHaveCount(0);
  });

  test('GAME-SHOTS-01 Verify: a live game with no events yet shows empty views', async ({
    page,
  }) => {
    await routeGameApi(page, { gameState: 'LIVE', events: [] });
    await openGame(page);
    await expect(
      gameFlow(page).getByText(
        'No shots yet. The game flow fills in as the game goes.',
      ),
    ).toBeVisible();
    await expect(
      shotMap(page).getByText(
        'No shots yet. The shot map fills in as the game goes.',
      ),
    ).toBeVisible();
    await expect(markers(page)).toHaveCount(0);
    await expect(shotMap(page).getByLabel('Player')).toHaveCount(0);
    await expect(gameFlow(page).getByTestId('flow-goal')).toHaveCount(0);
  });
});

for (const width of [375, 1280]) {
  for (const colorScheme of ['light', 'dark']) {
    test.describe(`${width} ${colorScheme}`, () => {
      test.use({ viewport: { width, height: 900 }, colorScheme });

      test('GAME-SHOTS-01 Verify: game flow and shot map lay out without horizontal page scroll', async ({
        page,
      }) => {
        await page.addInitScript((theme) => {
          localStorage.setItem('theme', theme);
        }, colorScheme);
        await routeGameApi(page);
        await openGame(page);
        const flow = gameFlow(page);
        const map = shotMap(page);
        await expect(flow).toBeVisible();
        await expect(map).toBeVisible();
        await expect(markers(page)).toHaveCount(expectedMarkers().length);
        await expect(page.locator('html')).toHaveAttribute(
          'data-theme',
          colorScheme,
        );

        const flowBox = await flow.boundingBox();
        const mapBox = await map.boundingBox();
        if (width < 900) {
          expect(mapBox.y).toBeGreaterThanOrEqual(flowBox.y + flowBox.height);
        } else {
          expect(mapBox.x).toBeGreaterThanOrEqual(flowBox.x + flowBox.width);
        }
        await map
          .getByLabel('Player')
          .selectOption({ label: 'Auston Matthews' });
        await expectNoHorizontalScroll(page);
        await map.getByText('Shots and goals by period (table)').click();
        await expectNoHorizontalScroll(page);
      });
    });
  }
}
