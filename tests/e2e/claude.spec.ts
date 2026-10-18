// Inside claude.ai: the artifact database (mocked) is the storage; every tab renders, edits are written.
import { expect, items, mockClaude, sample, test } from './fixtures';

test.beforeEach(async ({ page }) => {
  await mockClaude(page);
  await page.goto('/');
  await expect(page.locator('#savestate')).toHaveText('All changes saved');
});

test('every tab renders', async ({ page, errors }) => {
  for (const [tab, name] of [
    ['Party', 'party'],
    ['Items', 'items'],
    ['Skills', 'skills'],
    ['Status effects', 'status'],
    ['Summons', 'summons'],
    ['Weapon & racial', 'special'],
    ['Crafting', 'crafting'],
    ['Gear calculator', 'gear'],
    ['Reference', 'reference'],
  ]) {
    await page.getByRole('tab', { name: tab }).click();
    await expect(page.locator('#view')).not.toBeEmpty();
    await page.screenshot({ path: `test-results/tab-${name}.png` });
  }
  expect(errors).toEqual([]);
});

test('counts come from the data', async ({ page }) => {
  await expect(page.getByRole('tab', { name: 'Skills' }).locator('.count')).toHaveText(String(sample.skills));
  await expect(page.getByRole('tab', { name: 'Items' }).locator('.count')).toHaveText(
    String(Object.keys(items).length),
  );
  await expect(page.getByRole('tab', { name: 'Crafting' }).locator('.count')).toHaveText(String(sample.recipes));
});

test('a character opens and the item picker works', async ({ page }) => {
  await page.getByRole('tab', { name: 'Party' }).click();
  await page.getByRole('button', { name: 'Open Sol' }).click();
  await page.locator('.tile[data-pick="main"]').click();
  await expect(page.locator('.picker')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.picker')).toHaveCount(0);
});

test('marking a skill known writes only that field', async ({ page }) => {
  const marker = page.locator('#sk-apportation .pc').first();
  const before = await marker.getAttribute('class');
  await marker.click();
  await expect(marker).not.toHaveAttribute('class', before ?? '');
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __writes: unknown[][] }).__writes))
    .toContainEqual(['update', 'party/sol', expect.stringContaining('"known"')]);
  const write = await page.evaluate(() => (window as unknown as { __writes: unknown[][] }).__writes.at(-1));
  expect(Object.keys(JSON.parse(String(write?.[2])))).toEqual(['known']);
});

test('searching filters and chips navigate', async ({ page }) => {
  await page.getByLabel('Search').fill('apportation');
  await expect(page.locator('#view .entry')).toHaveCount(1);
  await page.getByRole('tab', { name: 'Status effects' }).click();
  await page.getByLabel('Search').fill('burning');
  const chip = page.locator('#view [data-skill]').first();
  const name = await chip.getAttribute('data-skill');
  await chip.click();
  await expect(page.getByLabel('Search')).toHaveValue(name ?? '');
});
