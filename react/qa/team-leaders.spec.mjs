const { test, expect } = await import(process.env.SPOTTER_TEST_MODULE);

// Team page leaderboard extra columns. Values come from Spotter's recorded
// fixtures, which may predate the zone faceoff and games-started data, so these
// checks cover the column headers and layout rather than specific numbers.

const EXTRA_COLUMNS_BY_TAB = [
  { tab: 'G', headers: ['/GP'] },
  { tab: 'A', headers: ['/GP'] },
  { tab: 'P', headers: ['/GP'] },
  { tab: 'FO%', headers: ['OZ FO', 'DZ FO'] },
  { tab: 'SV%', headers: ['GS'] },
  { tab: 'GAA', headers: ['GS'] },
];

/** The team page's Player Stats section, which holds the leaderboard tabs. */
function playerStatsSection(page) {
  return page.locator('section', {
    has: page.getByRole('heading', { name: 'Player Stats' }),
  });
}

for (const { tab, headers } of EXTRA_COLUMNS_BY_TAB) {
  test(`Team leaders: ${tab} tab shows its ${headers.join(' and ')} column`, async ({ page }) => {
    await page.goto('./#/team/TOR');
    const section = playerStatsSection(page);
    await section.getByRole('button', { name: tab, exact: true }).click();

    for (const header of headers) {
      await expect(section.getByText(header, { exact: true })).toBeVisible();
    }
  });
}

test('Team leaders: plain tabs show no extra column header', async ({ page }) => {
  await page.goto('./#/team/TOR');
  const section = playerStatsSection(page);
  await section.getByRole('button', { name: 'PIM', exact: true }).click();

  await expect(section.getByText('/GP', { exact: true })).toHaveCount(0);
  await expect(section.getByText('GS', { exact: true })).toHaveCount(0);
});

test('Team leaders: FO% columns fit at phone width', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('./#/team/TOR');
  const section = playerStatsSection(page);
  await section.getByRole('button', { name: 'FO%', exact: true }).click();
  await expect(section.getByText('DZ FO', { exact: true })).toBeVisible();

  const hasHorizontalScroll = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(hasHorizontalScroll).toBe(false);
});
