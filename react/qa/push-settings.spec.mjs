const { test, expect } = await import(process.env.SPOTTER_TEST_MODULE);
const email = 'member@example.test';
const token = 'synthetic-session';
const tokenKey = 'rinkquest-auth-token';
const fakePushKey = 'spotter-fake-push';
const players = [
  { playerId: 8478402, name: 'Connor McDavid', teamTriCode: 'EDM' },
  { playerId: 8479318, name: 'Auston Matthews', teamTriCode: 'TOR' },
];

// These checks bring their own synthetic session.
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

/**
 * Replaces the browser's notification permission, service worker and push
 * subscription with an in-page fake (the runner blocks real service
 * workers). Its state lives in sessionStorage so it survives reloads.
 * `iPhoneTab` makes the page an iPhone Safari tab; otherwise iOS devices
 * (such as the iPhone project) report Home Screen mode, where push works.
 */
async function installFakePush(context, { permission, subscribed, iPhoneTab }) {
  await context.addInitScript(
    ({ key, initial }) => {
      const stored = sessionStorage.getItem(key);
      const state = stored ? JSON.parse(stored) : { ...initial, prompts: 0 };
      const save = () => sessionStorage.setItem(key, JSON.stringify(state));
      save();
      const makeSubscription = () => ({
        endpoint: 'https://push.example.test/device-1',
        toJSON: () => ({
          endpoint: 'https://push.example.test/device-1',
          keys: { p256dh: 'p', auth: 'a' },
        }),
        unsubscribe: async () => {
          state.subscribed = false;
          save();
          return true;
        },
      });
      const pushManager = {
        getSubscription: async () =>
          state.subscribed ? makeSubscription() : null,
        subscribe: async () => {
          state.subscribed = true;
          save();
          return makeSubscription();
        },
      };
      const registration = { pushManager, showNotification: async () => {} };
      const container = {
        register: async () => registration,
        ready: Promise.resolve(registration),
        controller: null,
        addEventListener() {},
        removeEventListener() {},
      };
      Object.defineProperty(Navigator.prototype, 'serviceWorker', {
        configurable: true,
        get: () => container,
      });
      window.PushManager ??= function PushManager() {};
      window.Notification = class FakeNotification {
        static get permission() {
          return state.permission;
        }
        static async requestPermission() {
          state.prompts += 1;
          state.permission = 'granted';
          save();
          return state.permission;
        }
      };
      if (initial.iPhoneTab) {
        Object.defineProperty(Navigator.prototype, 'userAgent', {
          configurable: true,
          get: () =>
            'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
        });
      }
      Object.defineProperty(Navigator.prototype, 'standalone', {
        configurable: true,
        get: () => !initial.iPhoneTab,
      });
    },
    {
      key: fakePushKey,
      initial: { permission, subscribed, iPhoneTab: iPhoneTab === true },
    },
  );
}

/** Reads the fake's state: current permission, subscription and prompt count. */
function readFakePush(page) {
  return page.evaluate(
    (key) => JSON.parse(sessionStorage.getItem(key)),
    fakePushKey,
  );
}

/**
 * Synthetic account API with push configured. Records every subscription
 * save/delete, account switch write and player toggle write.
 */
async function routeAccountApi(context, { accountEnabled = true } = {}) {
  const calls = { saves: 0, deletes: 0, switchWrites: [], playerWrites: [] };
  const account = {
    enabled: accountEnabled,
    weekly: true,
    players: players.map((player) => ({
      ...player,
      position: 'C',
      headshot: null,
      since: '2026-10-01T00:00:00.000Z',
      tier: 'fan',
      label: null,
      pushMuted: false,
    })),
  };
  const fixed = {
    '/api/auth/me': { email },
    '/api/push/config': { enabled: true, publicKey: 'AQID' },
    '/api/favorites': {
      favorites: [
        {
          triCode: 'TOR',
          since: '2026-10-01T00:00:00.000Z',
          pushMuted: false,
          tier: 'fan',
          label: null,
        },
      ],
    },
    '/api/after-action-reports': { reports: [], unreadCount: 0 },
    '/api/weekly-player-reports': { reports: [], unreadCount: 0 },
  };
  await context.route('http://api.spotter.test/api/**', (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();
    if (path === '/api/push/subscriptions') {
      if (method === 'POST') calls.saves += 1;
      if (method === 'DELETE') calls.deletes += 1;
      return route.fulfill({ status: 204 });
    }
    if (path === '/api/push/notifications') {
      if (method === 'PUT') {
        account.enabled = request.postDataJSON().enabled;
        calls.switchWrites.push(account.enabled);
      }
      return route.fulfill({ json: { enabled: account.enabled } });
    }
    if (path === '/api/push/weekly-report') {
      if (method === 'PUT') account.weekly = request.postDataJSON().enabled;
      return route.fulfill({ json: { enabled: account.weekly } });
    }
    const playerMute = path.match(/^\/api\/favorite-players\/(\d+)\/push-mute$/);
    if (playerMute) {
      const { muted } = request.postDataJSON();
      calls.playerWrites.push([Number(playerMute[1]), muted]);
      const player = account.players.find(
        (favorite) => favorite.playerId === Number(playerMute[1]),
      );
      player.pushMuted = muted;
      return route.fulfill({ json: { favorites: account.players } });
    }
    if (path === '/api/favorite-players') {
      return route.fulfill({ json: { favorites: account.players } });
    }
    const response = fixed[path];
    return response ? route.fulfill({ json: response }) : route.fallback();
  });
  return calls;
}

/** Opens the header's reports bell and returns its panel. */
async function openBell(page) {
  await page.getByRole('button', { name: /^Reports/ }).first().click();
  const panel = page.getByRole('menu');
  await expect(panel).toBeVisible();
  return panel;
}

for (const width of [375, 1280]) {
  for (const colorScheme of ['light', 'dark']) {
    test.describe(`${width} ${colorScheme}`, () => {
      test.use({ viewport: { width, height: 900 }, colorScheme });

      signedInTest(
        'PUSH-03 Verify: a device that already allows notifications subscribes without a prompt, and again after signing in again',
        async ({ page, context }) => {
          await installFakePush(context, {
            permission: 'granted',
            subscribed: false,
          });
          const calls = await routeAccountApi(context);
          await page.goto('./');
          await expect.poll(() => calls.saves).toBe(1);
          expect((await readFakePush(page)).subscribed).toBe(true);
          const panel = await openBell(page);
          await expect(
            panel.getByRole('button', { name: 'Turn off phone notifications' }),
          ).toBeVisible();

          // Every load re-syncs the device.
          await page.reload();
          await expect.poll(() => calls.saves).toBe(2);

          // Sign-out removes the device; signing in again brings it back.
          await page.keyboard.press('Escape');
          await page
            .getByRole('button', { name: `Signed in as ${email}` })
            .hover();
          await page.getByRole('menuitem', { name: 'Sign out' }).click();
          await expect.poll(() => calls.deletes).toBe(1);
          await expect
            .poll(async () => (await readFakePush(page)).subscribed)
            .toBe(false);
          await page.evaluate(
            ([key, value]) => localStorage.setItem(key, value),
            [tokenKey, token],
          );
          await page.reload();
          await expect.poll(() => calls.saves).toBe(3);
          expect((await readFakePush(page)).subscribed).toBe(true);
          expect((await readFakePush(page)).prompts).toBe(0);
        },
      );

      signedInTest(
        "PUSH-03 Verify: without permission nothing is asked until the bell's Turn on",
        async ({ page, context }) => {
          await installFakePush(context, {
            permission: 'default',
            subscribed: false,
          });
          const calls = await routeAccountApi(context, {
            accountEnabled: false,
          });
          await page.goto('./');
          const panel = await openBell(page);
          const turnOn = panel.getByRole('button', {
            name: 'Turn on phone notifications',
          });
          await expect(turnOn).toBeVisible();
          expect((await readFakePush(page)).prompts).toBe(0);
          expect(calls.saves).toBe(0);

          await turnOn.click();
          await expect(
            panel.getByRole('button', { name: 'Turn off phone notifications' }),
          ).toBeVisible();
          expect((await readFakePush(page)).prompts).toBe(1);
          expect(calls.saves).toBe(1);
          expect(calls.switchWrites).toEqual([true]);
        },
      );

      signedInTest(
        'PUSH-03 Verify: Turn off sets the account switch and keeps the device subscribed',
        async ({ page, context }) => {
          await installFakePush(context, {
            permission: 'granted',
            subscribed: true,
          });
          const calls = await routeAccountApi(context);
          await page.goto('./');
          const panel = await openBell(page);
          await panel
            .getByRole('button', { name: 'Turn off phone notifications' })
            .click();
          await expect(
            panel.getByRole('button', { name: 'Turn on phone notifications' }),
          ).toBeVisible();
          expect(calls.switchWrites).toEqual([false]);
          expect(calls.deletes).toBe(0);
          expect((await readFakePush(page)).subscribed).toBe(true);

          // Stays off after a reload, while the device keeps re-syncing.
          await page.reload();
          const reloadedPanel = await openBell(page);
          await expect(
            reloadedPanel.getByRole('button', {
              name: 'Turn on phone notifications',
            }),
          ).toBeVisible();
          await expect.poll(() => calls.saves).toBe(2);
        },
      );

      signedInTest(
        'PUSH-03 Verify: player toggles sit under the weekly report switch',
        async ({ page, context }) => {
          await installFakePush(context, {
            permission: 'granted',
            subscribed: true,
          });
          const calls = await routeAccountApi(context);
          await page.goto('./');
          const panel = await openBell(page);
          const playerList = panel.getByRole('list', {
            name: 'Weekly player report notifications by player',
          });
          await expect(playerList.getByRole('listitem')).toHaveCount(2);
          const muteMcDavid = playerList.getByRole('button', {
            name: 'Mute Connor McDavid in the weekly report notification',
          });
          await expect(muteMcDavid).toHaveAttribute('aria-pressed', 'false');
          await muteMcDavid.click();
          await expect(muteMcDavid).toHaveAttribute('aria-pressed', 'true');
          await expect(muteMcDavid).toHaveText('Muted');
          expect(calls.playerWrites).toEqual([[players[0].playerId, true]]);

          // The player list only shows while the weekly push is on.
          await panel
            .getByRole('button', { name: 'Weekly player report notifications' })
            .click();
          await expect(playerList).not.toBeVisible();
        },
      );

      signedInTest(
        'PUSH-03 Verify: a blocked browser shows the hint and does not subscribe',
        async ({ page, context }) => {
          await installFakePush(context, {
            permission: 'denied',
            subscribed: false,
          });
          const calls = await routeAccountApi(context);
          await page.goto('./');
          const panel = await openBell(page);
          await expect(
            panel.getByText('Phone notifications are blocked for this site.'),
          ).toBeVisible();
          expect(calls.saves).toBe(0);
        },
      );

      signedInTest(
        'PUSH-03 Verify: an iPhone browser tab shows the Home Screen hint and does not subscribe',
        async ({ page, context }) => {
          await installFakePush(context, {
            permission: 'granted',
            subscribed: false,
            iPhoneTab: true,
          });
          const calls = await routeAccountApi(context);
          await page.goto('./');
          const panel = await openBell(page);
          await expect(
            panel.getByText('Add to Home Screen to get phone notifications'),
          ).toBeVisible();
          expect(calls.saves).toBe(0);
        },
      );
    });
  }
}
