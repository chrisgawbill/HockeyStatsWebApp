const { test, expect } = await import(process.env.SPOTTER_TEST_MODULE);

test.use({ spotterSession: 'anonymous' });

async function startMatch(page) {
  await page.goto('./#/board-game');
  await page.getByRole('button', { name: /Short game/ }).click();
  await page.getByRole('button', { name: 'Drop the puck' }).click();
}

async function advanceUntilBoardActions(page) {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    const setScreen = page.getByRole('button', { name: 'Set Screen' });
    if (await setScreen.isVisible().catch(() => false)) return;

    const drop = page.getByRole('button', { name: /DROP!/ });
    if (await drop.isVisible().catch(() => false)) {
      await drop.click();
      continue;
    }
    const reveal = page.getByRole('button', { name: 'Reveal (E)' });
    if (await reveal.isVisible().catch(() => false)) {
      await reveal.click();
      continue;
    }
    const continueButton = page.getByRole('button', { name: 'Continue' });
    if (await continueButton.isVisible().catch(() => false)) {
      await continueButton.click();
      continue;
    }
    const dialog = page.getByRole('dialog');
    if (await dialog.isVisible().catch(() => false)) {
      const card = dialog.locator('button:not([disabled])').first();
      if (await card.isVisible().catch(() => false)) {
        await card.click();
        continue;
      }
    }
    await page.waitForTimeout(200);
  }
  throw new Error('Timed out waiting for the match board actions');
}

for (const viewport of [
  { name: 'phone', width: 375, height: 844 },
  { name: 'desktop', width: 1280, height: 900 },
]) {
  test.describe(`net-front screen controls on ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test(`ON2-05 Verify: screen controls render and stay disabled when ineligible on ${viewport.name}`, async ({
      page,
    }) => {
      test.setTimeout(120_000);
      await startMatch(page);
      await advanceUntilBoardActions(page);
      await expect(page.getByRole('button', { name: 'Set Screen' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Clear Crease' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Clear Crease' })).toBeDisabled();
    });
  });
}
