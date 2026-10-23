const { test, expect } = await import(process.env.SPOTTER_TEST_MODULE);

// Interaction journeys run against Spotter's recorded API fixtures.
// Team switches stay within recorded matchups (TOR, MTL, UTA).

test('Journey: matchup teams survive reload and back/forward @critical', async ({ page }) => {
  await page.goto('./#/matchup?teamA=TOR&teamB=MTL');
  const teamA = page.getByRole('combobox', { name: 'Team A' });
  await expect(teamA).toHaveValue('TOR');

  await teamA.selectOption('UTA');
  await expect(page).toHaveURL(/teamA=UTA/);
  await page.reload();
  await expect(teamA).toHaveValue('UTA');

  await page.goBack();
  await expect(teamA).toHaveValue('TOR');
  await page.goForward();
  await expect(teamA).toHaveValue('UTA');
});

test('Journey: stat leader dialog works by keyboard and restores focus', async ({ page }) => {
  await page.goto('./');
  const opener = page
    .getByRole('region', { name: /leaders$/ })
    .locator('button[aria-haspopup="dialog"]')
    .first();
  await opener.focus();
  await page.keyboard.press('Enter');

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(':focus')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});
