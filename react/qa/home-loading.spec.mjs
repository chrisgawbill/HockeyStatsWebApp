const { test, expect } = await import(process.env.SPOTTER_TEST_MODULE);

// One home endpoint at a time is failed or held back; every other call falls
// through to Spotter's recorded fixtures. Draft lottery and standings share
// the one standings call, so they fail and recover together.
test.use({ spotterSession: 'anonymous' });

const ENDPOINTS = {
  skaters: {
    pattern: /\/player\/skater\/statLeaders\//,
    errorText: "Couldn't load skater leaders.",
    loadingText: 'Loading skater leaders',
  },
  goalies: {
    pattern: /\/player\/goalie\/statLeaders\//,
    errorText: "Couldn't load goalie leaders.",
    loadingText: 'Loading goalie leaders',
  },
  standings: {
    pattern: /\/standings(\?|$)/,
    errorText: "Couldn't load standings.",
    loadingText: 'Loading standings',
  },
};

// apiClient retries a 500 three times (1s, 2s, 4s) before a section errors.
const ERROR_TIMEOUT = { timeout: 15_000 };

const isPhone = (page) => page.viewportSize().width < 768;

/**
 * Makes one endpoint fail with a 500 until `recover()` is called; afterwards
 * its calls fall through to the recorded fixtures again.
 */
async function failEndpoint(page, pattern) {
  let failing = true;
  await page.route(pattern, (route) =>
    failing
      ? route.fulfill({ status: 500, json: { error: 'down' } })
      : route.fallback(),
  );
  return {
    recover: () => {
      failing = false;
    },
  };
}

/** Holds one endpoint's calls until `release()` is called. */
async function delayEndpoint(page, pattern) {
  let release;
  const released = new Promise((resolve) => {
    release = resolve;
  });
  await page.route(pattern, async (route) => {
    await released;
    await route.fallback();
  });
  return { release };
}

/** Shows the goalie grid on phones, where it sits behind the group switch. */
async function showGoalies(page) {
  if (isPhone(page)) {
    await page.getByRole('button', { name: 'Goalies', exact: true }).click();
  }
}

/** The leader card list for skaters (default phone group) or goalies. */
function leaderList(page, group) {
  const name = isPhone(page)
    ? 'Stat leaders'
    : group === 'skaters'
      ? 'Skater leaders'
      : 'Goalie leaders';
  return page.getByRole('list', { name, exact: true });
}

const sectionError = (page, text) =>
  page.getByRole('alert').filter({ hasText: text });
const sectionLoading = (page, text) =>
  page.getByRole('status').filter({ hasText: text });
const lotteryBoard = (page) =>
  page.getByRole('button', { name: 'Simulate the draft lottery' });
const standingsTables = (page) =>
  page.getByRole('button', { name: 'Conference', exact: true });

/** The intro and the Up next strip, which never wait on any section. */
async function expectIntroAndUpNext(page) {
  await expect(
    page.getByRole('heading', { level: 1, name: /at a glance/ }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Up next', exact: true }),
  ).toBeVisible();
}

test.describe('Home sections load and fail on their own', () => {
  test('HOME-LOAD-01 Verify: failed skater leaders retry alone while the rest of home shows', async ({
    page,
  }) => {
    const skaters = await failEndpoint(page, ENDPOINTS.skaters.pattern);
    await page.goto('./');

    const error = sectionError(page, ENDPOINTS.skaters.errorText);
    await expect(error).toBeVisible(ERROR_TIMEOUT);
    await expectIntroAndUpNext(page);
    await expect(lotteryBoard(page)).toBeVisible();
    await expect(standingsTables(page)).toBeVisible();
    await showGoalies(page);
    await expect(
      leaderList(page, 'goalies').getByRole('listitem').first(),
    ).toBeVisible();

    // On phones the skater error sits behind the switch again.
    if (isPhone(page)) {
      await page.getByRole('button', { name: 'Skaters', exact: true }).click();
    }
    skaters.recover();
    await error.getByRole('button', { name: 'Try again' }).click();
    await expect(
      leaderList(page, 'skaters').getByRole('listitem').first(),
    ).toBeVisible();
    await expect(error).toHaveCount(0);
  });

  test('HOME-LOAD-01 Verify: failed goalie leaders retry alone while skaters still show', async ({
    page,
  }) => {
    const goalies = await failEndpoint(page, ENDPOINTS.goalies.pattern);
    await page.goto('./');

    await expect(
      leaderList(page, 'skaters').getByRole('listitem').first(),
    ).toBeVisible();
    await expectIntroAndUpNext(page);
    await expect(lotteryBoard(page)).toBeVisible();
    await expect(standingsTables(page)).toBeVisible();
    await showGoalies(page);
    const error = sectionError(page, ENDPOINTS.goalies.errorText);
    await expect(error).toBeVisible(ERROR_TIMEOUT);

    goalies.recover();
    await error.getByRole('button', { name: 'Try again' }).click();
    await expect(
      leaderList(page, 'goalies').getByRole('listitem').first(),
    ).toBeVisible();
    await expect(error).toHaveCount(0);
  });

  test('HOME-LOAD-01 Verify: failed standings show an error in the lottery and standings, and one retry restores both', async ({
    page,
  }) => {
    const standings = await failEndpoint(page, ENDPOINTS.standings.pattern);
    await page.goto('./');

    const errors = sectionError(page, ENDPOINTS.standings.errorText);
    await expect(errors).toHaveCount(2, ERROR_TIMEOUT);
    await expectIntroAndUpNext(page);
    await expect(
      leaderList(page, 'skaters').getByRole('listitem').first(),
    ).toBeVisible();
    await expect(lotteryBoard(page)).toHaveCount(0);

    standings.recover();
    await errors.last().getByRole('button', { name: 'Try again' }).click();
    await expect(lotteryBoard(page)).toBeVisible();
    await expect(standingsTables(page)).toBeVisible();
    await expect(errors).toHaveCount(0);
  });

  for (const [group, endpoint] of Object.entries(ENDPOINTS)) {
    test(`HOME-LOAD-01 Verify: slow ${group} keep only their own section loading`, async ({
      page,
    }) => {
      const slowCall = await delayEndpoint(page, endpoint.pattern);
      await page.goto('./');

      if (group === 'goalies') await showGoalies(page);
      await expect(sectionLoading(page, endpoint.loadingText)).toBeVisible();
      await expectIntroAndUpNext(page);
      if (group === 'standings') {
        await expect(
          sectionLoading(page, 'Loading draft lottery'),
        ).toBeVisible();
        await expect(
          leaderList(page, 'skaters').getByRole('listitem').first(),
        ).toBeVisible();
      } else {
        await expect(lotteryBoard(page)).toBeVisible();
        await expect(standingsTables(page)).toBeVisible();
      }
      if (group === 'skaters' && !isPhone(page)) {
        await expect(
          leaderList(page, 'goalies').getByRole('listitem').first(),
        ).toBeVisible();
      }

      slowCall.release();
      await expect(sectionLoading(page, endpoint.loadingText)).toHaveCount(0);
      if (group === 'standings') {
        await expect(standingsTables(page)).toBeVisible();
      } else {
        await expect(
          leaderList(page, group).getByRole('listitem').first(),
        ).toBeVisible();
      }
    });
  }
});
