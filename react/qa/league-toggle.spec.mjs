const { test, expect } = await import(process.env.SPOTTER_TEST_MODULE);
import { SEASON, routeAhlApi } from '../src/test/fixtures/ahlLeague.mjs';

// The NHL/AHL toggle. NHL calls fall through to Spotter's recorded fixtures;
// every `league=ahl` call is answered from the synthetic AHL league.
test.use({ spotterSession: 'anonymous' });

/** Marks the document so a full reload is detectable. */
async function markDocument(page) {
  await page.evaluate(() => {
    window.__ahl01Marker = true;
  });
}

const leagueToggle = (page) =>
  page.getByRole('group', { name: 'League' }).first();

test('AHL-01 Verify: standings switch to the AHL and back without a reload', async ({
  page,
}) => {
  await routeAhlApi(page);
  await page.goto('./#/standings');
  await expect(page.getByText('Maple Leafs').first()).toBeVisible();
  await markDocument(page);

  await leagueToggle(page).getByRole('button', { name: 'AHL' }).click();
  await expect(page).toHaveURL(/league=ahl/);
  await expect(page.getByText('Marlies').first()).toBeVisible();
  await expect(page.getByText('Maple Leafs')).toHaveCount(0);
  await expect(page.getByText(/playoff race/i)).toHaveCount(0);
  expect(await page.evaluate(() => window.__ahl01Marker)).toBe(true);

  await page.getByRole('button', { name: 'Division', exact: true }).click();
  await expect(page.getByText('North', { exact: true }).first()).toBeVisible();

  await leagueToggle(page).getByRole('button', { name: 'NHL' }).click();
  await expect(page).not.toHaveURL(/league=/);
  await expect(page.getByText('Maple Leafs').first()).toBeVisible();
  expect(await page.evaluate(() => window.__ahl01Marker)).toBe(true);
});

test('AHL-01 Verify: an AHL link opens the AHL and the device remembers it', async ({
  page,
}) => {
  await routeAhlApi(page);
  await page.goto(
    `./#/schedule?league=ahl&season=${SEASON}&view=month&date=2026-10-09`,
  );
  await expect(
    leagueToggle(page).getByRole('button', { name: 'AHL' }),
  ).toHaveAttribute('aria-pressed', 'true');

  await page.goto('./#/standings');
  await expect(page).toHaveURL(/league=ahl/);
  await expect(page.getByText('Marlies').first()).toBeVisible();
});

test('AHL-01 Verify: the AHL TOR team page shows the Marlies, not the Maple Leafs', async ({
  page,
}) => {
  const ahlRequests = await routeAhlApi(page);
  await page.goto(`./#/team/TOR?league=ahl&season=${SEASON}`);

  await expect(
    page.getByRole('heading', { name: 'Toronto Marlies', level: 1 }),
  ).toBeVisible();
  await expect(page.getByText('Maple Leafs')).toHaveCount(0);
  await expect(page.getByText(/playoff line/)).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'CF%', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'FO%', exact: true }),
  ).toHaveCount(0);
  expect(ahlRequests).not.toContain('/team/lines/TOR');
  expect(ahlRequests).not.toContain('/player/skater/corsi');
});

test('AHL-01 Verify: NHL-only features are hidden in the AHL view', async ({
  page,
}) => {
  await routeAhlApi(page);
  await page.goto('./#/?league=ahl');

  await expect(page.getByRole('link', { name: 'Rink Quest' })).toHaveCount(0);
  await expect(page.getByText('Draft lottery')).toHaveCount(0);
  await expect(page.getByText('Brisson').first()).toBeVisible();

  await leagueToggle(page).getByRole('button', { name: 'NHL' }).click();
  await expect(
    page.getByRole('link', { name: 'Rink Quest' }).first(),
  ).toBeAttached();
});
