const { test, expect } = await import(process.env.SPOTTER_TEST_MODULE);
const token = 'synthetic-session';
const tokenKey = 'rinkquest-auth-token';
const shareButton = (page) =>
  page.getByRole('button', { name: 'Share this page' });
const shareStatus = (page) =>
  page.getByRole('status').filter({ hasText: /Link copied|Couldn't share/ });

// Signed-out checks start without a saved session; signedInTest brings its own.
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

// Account responses are synthetic; ordinary hockey data still uses Spotter fixtures.
test.beforeEach(async ({ context }) => {
  const responses = {
    '/api/auth/me': { email: 'member@example.test' },
    '/api/push/config': { enabled: false, publicKey: '' },
    '/api/push/notifications': { enabled: false },
    '/api/push/weekly-report': { enabled: false },
    '/api/favorites': { favorites: [] },
    '/api/favorite-players': { favorites: [] },
    '/api/after-action-reports': { reports: [], unreadCount: 0 },
    '/api/weekly-player-reports': { reports: [], unreadCount: 0 },
  };
  await context.route('http://api.spotter.test/api/**', (route) => {
    const response = responses[new URL(route.request().url()).pathname];
    return response ? route.fulfill({ json: response }) : route.fallback();
  });
});

/**
 * Replaces the Web Share API and clipboard with in-page fakes that record
 * what was shared or copied. `share` is 'present', 'absent', or the name of
 * the error the share sheet rejects with.
 */
async function installFakeShare(context, share) {
  await context.addInitScript((shareMode) => {
    window.__shared = [];
    window.__copied = [];
    const fakeShare =
      shareMode === 'present'
        ? async (data) => {
            window.__shared.push(data);
          }
        : async () => {
            throw new DOMException('Share rejected', shareMode);
          };
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: shareMode === 'absent' ? undefined : fakeShare,
    });
    Object.defineProperty(navigator, 'canShare', {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (text) => {
          window.__copied.push(text);
        },
      },
    });
  }, share);
}

/** Reads what the fakes recorded. */
function readShareCalls(page) {
  return page.evaluate(() => ({
    shared: window.__shared,
    copied: window.__copied,
  }));
}

/** True when the page scrolls sideways. */
function hasHorizontalScroll(page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
}

for (const colorScheme of ['light', 'dark']) {
  test.describe(`375 ${colorScheme}`, () => {
    test.use({ viewport: { width: 375, height: 900 }, colorScheme });

    test('SHARE-01 Verify: the share sheet gets the current URL and page title', async ({
      page,
      context,
    }) => {
      await installFakeShare(context, 'present');
      await page.goto('./#/compare?players=8478402,8479318');
      await shareButton(page).click();

      const { shared } = await readShareCalls(page);
      expect(shared).toHaveLength(1);
      expect(shared[0].url).toBe(page.url());
      expect(shared[0].title).toMatch(/ · Hockey Stats$|^Hockey Stats$/);
      await expect(shareStatus(page)).toHaveCount(0);
    });

    test('SHARE-01 Verify: without the share sheet the link is copied and announced', async ({
      page,
      context,
    }) => {
      await installFakeShare(context, 'absent');
      await page.goto('./#/matchup?teamA=TOR&teamB=MTL');
      await shareButton(page).click();

      await expect(shareStatus(page)).toHaveText('Link copied');
      expect((await readShareCalls(page)).copied).toEqual([page.url()]);
    });

    test('SHARE-01 Verify: a cancelled share sheet shows nothing', async ({
      page,
      context,
    }) => {
      await installFakeShare(context, 'AbortError');
      await page.goto('./');
      await shareButton(page).click();

      await page.waitForTimeout(500);
      await expect(shareStatus(page)).toHaveCount(0);
      expect((await readShareCalls(page)).copied).toEqual([]);
    });

    test('SHARE-01 Verify: a failed share sheet shows an error', async ({
      page,
      context,
    }) => {
      await installFakeShare(context, 'DataError');
      await page.goto('./');
      await shareButton(page).click();

      await expect(shareStatus(page)).toHaveText(/Couldn't share this page/);
    });

    test('SHARE-01 Verify: no share button on diagnostics', async ({
      page,
    }) => {
      await page.goto('./#/diagnostics');
      await expect(page.locator('h1').first()).toBeVisible();
      await expect(shareButton(page)).toHaveCount(0);
    });
  });

  test.describe(`1280 ${colorScheme}`, () => {
    test.use({ viewport: { width: 1280, height: 900 }, colorScheme });

    test('SHARE-01 Verify: no share button in the desktop header', async ({
      page,
    }) => {
      await page.goto('./');
      await expect(page.locator('h1').first()).toBeVisible();
      await expect(shareButton(page)).toBeHidden();
    });
  });
}

for (const width of [320, 375, 430]) {
  test.describe(`${width} light`, () => {
    test.use({ viewport: { width, height: 900 }, colorScheme: 'light' });

    test('SHARE-01 Verify: the top bar fits signed out', async ({ page }) => {
      await page.goto('./');
      await expect(shareButton(page)).toBeVisible();
      expect(await hasHorizontalScroll(page)).toBe(false);
    });

    signedInTest(
      'SHARE-01 Verify: the top bar fits signed in',
      async ({ page }) => {
        await page.goto('./');
        // The bell (a menu button) shows once the saved session is restored.
        await expect(
          page.locator('button[aria-haspopup="menu"]').first(),
        ).toBeVisible();
        await expect(shareButton(page)).toBeVisible();
        expect(await hasHorizontalScroll(page)).toBe(false);
      },
    );
  });
}
