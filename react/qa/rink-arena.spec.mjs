const { test, expect } = await import(process.env.SPOTTER_TEST_MODULE);

// Rink Quest's dimensional arena (ON2-09A). The match is seeded from the
// clock, so the shot journeys play adaptively through the real UI until Blue
// shoots. Every recorded number is browser emulation, not phone hardware.
test.use({ spotterSession: 'anonymous', reducedMotion: 'no-preference' });

const SIZES = [
  {
    name: 'portrait phone',
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  },
  {
    name: 'landscape phone',
    viewport: { width: 844, height: 390 },
    hasTouch: true,
  },
  { name: 'desktop', viewport: { width: 1280, height: 900 }, hasTouch: false },
];

/** Browser-side recorder: arena attribute changes, the shot dialog, taps and frame times. */
function installArenaProbe() {
  const probe = {
    events: [],
    frameSamples: [],
    lastPointerDown: null,
    tapLatencies: [],
  };
  window.__arenaProbe = probe;
  const record = (type, detail) =>
    probe.events.push({ type, detail, at: performance.now() });

  document.addEventListener(
    'pointerdown',
    () => {
      probe.lastPointerDown = performance.now();
    },
    true,
  );

  let previousFrame = null;
  function sampleFrame(now) {
    const arena = document.querySelector('[data-arena-view]');
    if (arena?.dataset.arenaSettled === 'false' && previousFrame !== null) {
      probe.frameSamples.push(now - previousFrame);
    }
    previousFrame = now;
    requestAnimationFrame(sampleFrame);
  }
  requestAnimationFrame(sampleFrame);

  let hadTiles = false;
  let hadShotDialog = false;
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.target.dataset) {
        const name = mutation.attributeName;
        if (name?.startsWith('data-arena-') || name === 'data-board-renderer') {
          record(name, mutation.target.getAttribute(name));
        }
      }
    }
    const hasTiles = Boolean(document.querySelector('[data-rink-tile]'));
    if (hasTiles && !hadTiles && probe.lastPointerDown !== null) {
      const pressedAt = probe.lastPointerDown;
      requestAnimationFrame(() =>
        probe.tapLatencies.push(performance.now() - pressedAt),
      );
    }
    hadTiles = hasTiles;
    const shotDialog = [
      ...document.querySelectorAll('[role="dialog"] h2'),
    ].some((heading) => heading.textContent === 'Take the shot');
    if (shotDialog && !hadShotDialog) {
      const arena = document.querySelector('[data-arena-view]');
      record('shot-dialog', {
        view: arena?.dataset.arenaView ?? null,
        settled: arena?.dataset.arenaSettled ?? null,
      });
    }
    hadShotDialog = shotDialog;
  });
  const start = () =>
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: [
        'data-arena-ready',
        'data-arena-view',
        'data-arena-settled',
        'data-board-renderer',
      ],
    });
  if (document.documentElement) start();
  else document.addEventListener('DOMContentLoaded', start);
}

/** Makes every WebGL context request fail, as on a browser without WebGL. */
function disableWebGL() {
  const original = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function getContext(kind, ...rest) {
    if (String(kind).startsWith('webgl') || kind === 'experimental-webgl') {
      return null;
    }
    return original.call(this, kind, ...rest);
  };
}

const arena = (page) => page.locator('[data-arena-view]');
const blueSkaters = (page) => page.locator('button[aria-label^="Blue "]');
const tileButtons = (page) => page.locator('button[data-rink-tile]');

function annotate(name, value) {
  test.info().annotations.push({
    type: `metric (emulation): ${name}`,
    description: typeof value === 'string' ? value : JSON.stringify(value),
  });
}

function summarize(samples) {
  if (samples.length === 0) return { count: 0 };
  const sorted = [...samples].sort((a, b) => a - b);
  const pick = (share) =>
    Math.round(
      sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * share))] *
        10,
    ) / 10;
  return {
    count: sorted.length,
    median: pick(0.5),
    p95: pick(0.95),
    max: pick(1),
  };
}

/** Opens Rink Quest and starts a short match; returns the click time in page clock. */
async function startMatch(page) {
  await page.goto('./#/board-game');
  const shortGame = page.getByRole('button', { name: /Short game/ });
  await expect(shortGame).toBeVisible();
  const startedAt = await page.evaluate(() => performance.now());
  await shortGame.click();
  return startedAt;
}

async function press(page, locator, hasTouch) {
  if (hasTouch) await locator.tap();
  else await locator.click();
}

async function isVisible(locator) {
  return locator
    .first()
    .isVisible()
    .catch(() => false);
}

/** Picks the first enabled button in a dialog, if any. */
async function pressFirstEnabled(dialog) {
  const enabled = dialog.locator('button:not([disabled])');
  if ((await enabled.count()) === 0) return false;
  await enabled.first().click();
  return true;
}

/**
 * Selects a Blue skater that has legal moves, trying the puck carrier first.
 * Returns true once destination tiles are shown.
 */
async function selectMovableSkater(page, hasTouch) {
  const carrier = page.locator(
    'button[aria-label^="Blue "][aria-label$="has puck"]',
  );
  const candidates = (await carrier.count()) > 0 ? [carrier.first()] : [];
  const count = await blueSkaters(page).count();
  for (let index = 0; index < count; index++) {
    candidates.push(blueSkaters(page).nth(index));
  }
  for (const skater of candidates) {
    if (!(await skater.isVisible().catch(() => false))) continue;
    await press(page, skater, hasTouch);
    if ((await tileButtons(page).count()) > 0) return true;
  }
  return false;
}

/** The highlighted tile furthest toward Red's net. */
async function furthestTile(page) {
  const keys = await tileButtons(page).evaluateAll((buttons) =>
    buttons.map((button) => button.dataset.rinkTile),
  );
  keys.sort((a, b) => Number(b.split(',')[0]) - Number(a.split(',')[0]));
  return page.locator(`button[data-rink-tile="${keys[0]}"]`);
}

/** Waits until the arena (or fallback) shows the move phase on Blue's turn. */
async function waitForBlueMove(page, deadline) {
  return playUntil(page, deadline, async () =>
    isVisible(page.getByText('Select one of your blue players to activate.')),
  );
}

/**
 * One adaptive step of play through the real UI. Returns quietly when there
 * is nothing to do yet (CPU thinking, a camera move, an animation).
 */
async function playStep(page, hasTouch) {
  const dialog = page.getByRole('dialog');
  if (await isVisible(page.getByRole('button', { name: 'Play again' }))) {
    await page.getByRole('button', { name: 'Play again' }).click();
    return;
  }
  if (await isVisible(page.getByRole('button', { name: 'Drop the puck' }))) {
    await page.getByRole('button', { name: 'Drop the puck' }).click();
    return;
  }
  if (await isVisible(page.getByRole('heading', { name: 'Faceoff draw' }))) {
    const drop = dialog.getByRole('button', { name: /DROP!/ });
    if (await isVisible(drop)) await drop.click();
    else if (await isVisible(dialog.getByText('Pick your draw'))) {
      await pressFirstEnabled(dialog);
    }
    return;
  }
  if (await isVisible(page.getByRole('button', { name: 'Reveal (E)' }))) {
    const cards = dialog.locator('button:not([disabled])').filter({
      hasNotText: 'Reveal (E)',
    });
    if ((await cards.count()) > 0)
      await cards
        .first()
        .click()
        .catch(() => {});
    await page.getByRole('button', { name: 'Reveal (E)' }).click();
    return;
  }
  if (await isVisible(page.getByRole('button', { name: 'Continue' }))) {
    await page.getByRole('button', { name: 'Continue' }).click();
    return;
  }
  const shoot = page.getByRole('button', { name: 'Shoot', exact: true });
  if (await shoot.isEnabled().catch(() => false)) {
    await shoot.click();
    return;
  }
  if (
    await isVisible(
      page.getByText('Select one of your blue players to activate.'),
    )
  ) {
    if (await selectMovableSkater(page, hasTouch)) {
      await press(page, await furthestTile(page), hasTouch);
    }
    return;
  }
  if ((await tileButtons(page).count()) > 0) {
    await press(page, await furthestTile(page), hasTouch);
    return;
  }
  const endActivation = page.getByRole('button', { name: 'End activation' });
  if (await endActivation.isEnabled().catch(() => false)) {
    await endActivation.click();
    return;
  }
  await page.waitForTimeout(150);
}

/** Plays adaptively until `isDone` or the deadline; returns whether it got there. */
async function playUntil(page, deadline, isDone, hasTouch = false) {
  while (Date.now() < deadline) {
    if (await isDone()) return true;
    await playStep(page, hasTouch);
  }
  return isDone();
}

async function expectNoHorizontalScroll(page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

for (const size of SIZES) {
  test.describe(`rink arena (${size.name})`, () => {
    test.use({ viewport: size.viewport, hasTouch: size.hasTouch });

    test(`ON2-09A Verify: arena renders by default and skaters and tiles work by ${size.hasTouch ? 'tap' : 'click'} and keyboard (${size.name})`, async ({
      page,
    }) => {
      test.setTimeout(120_000);
      await page.addInitScript(installArenaProbe);
      const startedAt = await startMatch(page);

      await expect(
        page.locator('[data-board-renderer="arena"]'),
      ).toBeAttached();
      await expect(arena(page)).toHaveAttribute('data-arena-ready', 'true', {
        timeout: 20_000,
      });
      await expect(arena(page)).toHaveAttribute('data-arena-view', 'tactical');
      await expect(arena(page).locator('canvas')).toBeVisible();
      await expectNoHorizontalScroll(page);

      const load = await page.evaluate((clickedAt) => {
        const readyEvent = window.__arenaProbe.events.find(
          (event) =>
            event.type === 'data-arena-ready' && event.detail === 'true',
        );
        const chunk = performance
          .getEntriesByType('resource')
          .find((entry) => /ArenaBoard-[^/]*\.js/.test(entry.name));
        return {
          readyMs: readyEvent ? Math.round(readyEvent.at - clickedAt) : null,
          chunk: chunk
            ? {
                url: chunk.name.split('/').pop(),
                transferBytes: chunk.transferSize,
                encodedBytes: chunk.encodedBodySize,
                decodedBytes: chunk.decodedBodySize,
              }
            : null,
        };
      }, startedAt);
      annotate(
        'three.js arena chunk',
        load.chunk ?? 'not observed (cached or inlined)',
      );
      annotate('match start to data-arena-ready (ms)', load.readyMs);

      const deadline = Date.now() + 90_000;
      expect(await waitForBlueMove(page, deadline)).toBe(true);
      await expect(blueSkaters(page).first()).toBeVisible();

      expect(await selectMovableSkater(page, size.hasTouch)).toBe(true);
      await expect(
        page.locator('button[aria-label^="Blue "][aria-pressed="true"]'),
      ).toHaveCount(1);
      const tileCount = await tileButtons(page).count();
      expect(tileCount).toBeGreaterThan(0);

      const box = await arena(page).boundingBox();
      const targetSizes = await tileButtons(page).evaluateAll((buttons) =>
        buttons.map((button) =>
          Math.round(button.getBoundingClientRect().width),
        ),
      );
      for (const tile of await tileButtons(page).all()) {
        const tileBox = await tile.boundingBox();
        expect(tileBox.x).toBeGreaterThanOrEqual(box.x - 1);
        expect(tileBox.x + tileBox.width).toBeLessThanOrEqual(
          box.x + box.width + 1,
        );
      }
      annotate('legal tile hit target sizes (px)', targetSizes);
      const latencies = await page.evaluate(
        () => window.__arenaProbe.tapLatencies,
      );
      annotate('tap to highlighted frame (ms)', summarize(latencies));

      // Keyboard: arrows move between highlighted tiles; Enter moves the skater.
      await tileButtons(page).first().focus();
      if (tileCount > 1) {
        const before = await page.evaluate(
          () => document.activeElement?.dataset.rinkTile,
        );
        for (const key of ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp']) {
          await page.keyboard.press(key);
          const now = await page.evaluate(
            () => document.activeElement?.dataset.rinkTile,
          );
          if (now && now !== before) break;
        }
        await expect(page.locator('button[data-rink-tile]:focus')).toHaveCount(
          1,
        );
      }
      const stepsLabel = page.getByLabel(/tiles left this activation/);
      const stepsBefore = await stepsLabel
        .getAttribute('aria-label')
        .catch(() => null);
      await page.keyboard.press('Enter');
      await expect
        .poll(async () =>
          stepsLabel.getAttribute('aria-label').catch(() => null),
        )
        .not.toBe(stepsBefore);
    });

    test(`ON2-09A Verify: a shot moves to the shot view and the timing control appears only after the camera settles (${size.name})`, async ({
      page,
    }) => {
      test.setTimeout(240_000);
      await page.addInitScript(installArenaProbe);
      await startMatch(page);
      await expect(arena(page)).toHaveAttribute('data-arena-ready', 'true', {
        timeout: 20_000,
      });

      const shotDialog = page.getByRole('heading', { name: 'Take the shot' });
      const reached = await playUntil(
        page,
        Date.now() + 200_000,
        () => isVisible(shotDialog),
        size.hasTouch,
      );
      test.skip(
        !reached,
        'No Blue shot came up within the time budget (adaptive play).',
      );

      await expect(arena(page)).toHaveAttribute('data-arena-view', 'shot');
      await expect(arena(page)).toHaveAttribute('data-arena-settled', 'true');
      const probe = await page.evaluate(() => window.__arenaProbe);
      const dialogEvent = probe.events.find(
        (event) => event.type === 'shot-dialog',
      );
      expect(dialogEvent.detail).toEqual({ view: 'shot', settled: 'true' });
      const shotStart = probe.events.findLast(
        (event) =>
          event.type === 'data-arena-view' &&
          event.detail === 'shot' &&
          event.at <= dialogEvent.at,
      );
      if (shotStart) {
        annotate(
          'shot view start to timing control (ms)',
          Math.round(dialogEvent.at - shotStart.at),
        );
      }
      annotate(
        'frame time during camera transitions (ms)',
        summarize(probe.frameSamples),
      );

      // Pick a card; the timing window opens only now, with the camera still.
      await page
        .getByRole('dialog')
        .locator('button:not([disabled])')
        .first()
        .click();
      const track = page.getByRole('dialog').locator('button').first();
      await track.click().catch(() => {});

      // Back to the tactical view before the next board action.
      await expect(
        page.getByRole('heading', { name: 'Take the shot' }),
      ).toBeHidden({
        timeout: 15_000,
      });
      await expect(arena(page)).toHaveAttribute('data-arena-view', 'tactical', {
        timeout: 10_000,
      });
      await expect(arena(page)).toHaveAttribute('data-arena-settled', 'true');
    });
  });
}

test.describe('rink arena (reduced motion)', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    reducedMotion: 'reduce',
  });

  test('ON2-09A Verify: reduced motion uses static camera cuts', async ({
    page,
  }) => {
    test.setTimeout(240_000);
    await page.addInitScript(installArenaProbe);
    await startMatch(page);
    await expect(arena(page)).toHaveAttribute('data-arena-ready', 'true', {
      timeout: 20_000,
    });
    await expect(arena(page)).toHaveAttribute('data-arena-view', 'tactical');

    // Play until a Blue shot opens (or the budget runs out); either way the
    // camera must never report an in-between, unsettled state.
    const sawShot = await playUntil(
      page,
      Date.now() + 150_000,
      async () =>
        page.evaluate(() =>
          window.__arenaProbe.events.some(
            (event) =>
              event.type === 'data-arena-view' && event.detail === 'shot',
          ),
        ),
      true,
    );
    annotate('reduced-motion run reached a shot view', String(sawShot));
    const unsettled = await page.evaluate(() =>
      window.__arenaProbe.events.filter(
        (event) =>
          event.type === 'data-arena-settled' && event.detail === 'false',
      ),
    );
    expect(unsettled).toEqual([]);
  });
});

test.describe('rink arena (WebGL unavailable)', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test('ON2-09A Verify: without WebGL the match falls back to the HTML rink', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.addInitScript(disableWebGL);
    await startMatch(page);

    await expect(
      page.locator('[data-board-renderer="fallback"]'),
    ).toBeAttached();
    await expect(page.locator('[data-arena-view]')).toHaveCount(0);
    await expect(page.locator('main canvas')).toHaveCount(0);
    await expect(blueSkaters(page).first()).toBeVisible();

    expect(await waitForBlueMove(page, Date.now() + 90_000)).toBe(true);
    expect(await selectMovableSkater(page, true)).toBe(true);
    await expect(tileButtons(page).first()).toBeVisible();
  });
});
