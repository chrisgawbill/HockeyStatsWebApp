import { createHash } from 'node:crypto';
const { test, expect } = await import(process.env.SPOTTER_TEST_MODULE);
const email = 'member@example.test';
const token = 'synthetic-session';
const tokenKey = 'rinkquest-auth-token';
// The home Up next strip has its own "Sign in" button; these checks use the header's.
const headerSignIn = (page) =>
  page
    .getByRole('navigation', { name: 'Site' })
    .getByRole('button', { name: 'Sign in', exact: true });

// Login flows must start signed out, even when the runner has saved sessions.
test.use({ spotterSession: 'anonymous' });

// Only tests using signedInTest receive this synthetic app session.
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
    '/api/auth/me': { email },
    '/api/push/config': { enabled: false, publicKey: '' },
    '/api/favorites': { favorites: [] },
    '/api/favorite-players': { favorites: [] },
    '/api/after-action-reports': { reports: [], unreadCount: 0 },
    '/api/weekly-player-reports': { reports: [], unreadCount: 0 },
    '/api/push/weekly-report': { enabled: false },
  };
  await context.route('http://api.spotter.test/api/**', (route) => {
    const response = responses[new URL(route.request().url()).pathname];
    return response ? route.fulfill({ json: response }) : route.fallback();
  });
  // Neither Google's SDK nor Discord's authorization page is needed in controlled checks.
  await context.route('https://accounts.google.com/**', (route) =>
    route.fulfill({ body: '' }),
  );
});

for (const width of [375, 1280])
  for (const colorScheme of ['light', 'dark']) {
    test.describe(`${width} ${colorScheme}`, () => {
      test.use({ viewport: { width, height: 900 }, colorScheme });
      test('SIGNIN-01 Verify: dialog names, keyboard close and focus return', async ({
        page,
      }) => {
        await page.goto('./');
        const trigger = headerSignIn(page);
        await trigger.focus();
        await page.keyboard.press('Enter');
        const dialog = page.getByRole('dialog', {
          name: 'Sign in',
          exact: true,
        });
        await expect(dialog).toBeVisible();
        await expect(
          dialog.getByRole('button', { name: 'Sign in with Discord' }),
        ).toBeVisible();
        await dialog
          .getByRole('button', { name: 'Close', exact: true })
          .focus();
        await page.keyboard.press('Enter');
        await expect(dialog).not.toBeVisible();
        await expect(trigger).toBeFocused();
      });
      for (const outcome of [
        'success',
        'cancel',
        'mismatched-state',
        'rejected',
      ]) {
        test(`API-AUTH-02 Verify: Discord ${outcome}, PKCE and callback cleanup`, async ({
          page,
          context,
        }) => {
          let pending;
          let capture;
          let exchanges = 0;
          const ready = new Promise((resolve) => {
            capture = resolve;
          });
          await context.exposeBinding('captureDiscordPending', (_, raw) => {
            pending = JSON.parse(raw);
            capture();
          });
          await context.addInitScript(() => {
            const setItem = Storage.prototype.setItem;
            Storage.prototype.setItem = function (name, value) {
              setItem.call(this, name, value);
              if (name === 'discord-sign-in-pending')
                void window.captureDiscordPending(value);
            };
          });
          await context.route(
            'http://api.spotter.test/api/auth/discord',
            (route) => {
              exchanges++;
              expect(route.request().method()).toBe('POST');
              expect(route.request().postDataJSON()).toEqual({
                code: 'synthetic-code',
                codeVerifier: pending.codeVerifier,
                redirectUri: pending.redirectUri,
              });
              return route.fulfill({
                status: outcome === 'rejected' ? 401 : 200,
                json:
                  outcome === 'rejected'
                    ? { error: 'Invalid credential' }
                    : { token, email },
              });
            },
          );
          await context.route('https://discord.com/**', async (route) => {
            await ready;
            const query = new URL(route.request().url()).searchParams;
            expect(query.get('response_type')).toBe('code');
            expect(query.get('scope')).toBe('identify email');
            expect(query.get('state')).toBe(pending.state);
            expect(query.get('code_challenge_method')).toBe('S256');
            expect(query.get('code_challenge')).toBe(
              createHash('sha256')
                .update(pending.codeVerifier)
                .digest('base64url'),
            );
            expect(query.get('redirect_uri')).toBe(pending.redirectUri);
            const callback = new URL(pending.redirectUri);
            callback.searchParams.set(
              'state',
              outcome === 'mismatched-state' ? 'wrong' : pending.state,
            );
            callback.searchParams.set(
              outcome === 'cancel' ? 'error' : 'code',
              outcome === 'cancel' ? 'access_denied' : 'synthetic-code',
            );
            await route.fulfill({
              status: 302,
              headers: { location: callback.href },
            });
          });
          await page.goto('./');
          await headerSignIn(page).click();
          await page
            .getByRole('button', { name: 'Sign in with Discord' })
            .click();
          if (outcome === 'success') {
            const avatar = page.getByRole('button', {
              name: `Signed in as ${email}`,
            });
            await expect(avatar).toBeVisible();
            await page.reload();
            await expect(avatar).toBeVisible();
            await avatar.focus();
            await page.keyboard.press('Enter');
            await page.getByRole('menuitem', { name: 'Sign out' }).click();
            await page.reload();
          }
          await expect(headerSignIn(page)).toBeVisible();
          await expect.poll(() => new URL(page.url()).search).toBe('');
          expect(exchanges).toBe(
            ['success', 'rejected'].includes(outcome) ? 1 : 0,
          );
          expect(
            await page.evaluate(() =>
              sessionStorage.getItem('discord-sign-in-pending'),
            ),
          ).toBeNull();
          expect(
            await page.evaluate((key) => localStorage.getItem(key), tokenKey),
          ).toBeNull();
        });
      }
      signedInTest(
        'SIGNIN-01 Verify: saved session restores the account menu',
        async ({ page }) => {
          await page.goto('./');
          const account = page.getByRole('button', {
            name: `Signed in as ${email}`,
          });
          await expect(account).toBeVisible();
          await expect(headerSignIn(page)).not.toBeVisible();
          await page.reload();
          await expect(account).toBeVisible();
        },
      );
      signedInTest(
        'SIGNIN-01 Verify: sign-out clears the saved session after reload',
        async ({ page }) => {
          await page.goto('./');
          await page
            .getByRole('button', { name: `Signed in as ${email}` })
            .hover();
          await page.getByRole('menuitem', { name: 'Sign out' }).click();
          await expect(headerSignIn(page)).toBeVisible();
          await expect
            .poll(() =>
              page.evaluate((key) => localStorage.getItem(key), tokenKey),
            )
            .toBeNull();
          await page.reload();
          await expect(headerSignIn(page)).toBeVisible();
        },
      );
      test('API-AUTH-02 Verify: expired session returns to signed out', async ({
        page,
        context,
      }) => {
        await context.addInitScript(
          (key) => localStorage.setItem(key, 'expired-session'),
          tokenKey,
        );
        await context.route('http://api.spotter.test/api/auth/me', (route) =>
          route.fulfill({ status: 401, json: { error: 'Expired session' } }),
        );
        await page.goto('./');
        await expect(headerSignIn(page)).toBeVisible();
        await expect
          .poll(() =>
            page.evaluate((key) => localStorage.getItem(key), tokenKey),
          )
          .toBeNull();
      });
    });
  }
