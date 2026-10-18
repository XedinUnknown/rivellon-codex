// Items: creating and editing (text, number and bonus fields), the calculator's "Save as an item", hover cards.
import { expect, mockClaude, test } from './fixtures';

type W = { __writes: unknown[][]; __store: { items: Record<string, Record<string, unknown>> } };
const store = (page: import('@playwright/test').Page) => page.evaluate(() => (window as unknown as W).__store.items);

test.beforeEach(async ({ page }) => {
  await mockClaude(page);
  await page.goto('/');
  await expect(page.locator('#savestate')).toHaveText('All changes saved');
});

test('create, edit and delete an item', async ({ page }) => {
  await page.getByRole('tab', { name: 'Items' }).click();
  await page.getByLabel('New item of type').selectOption('helmet');
  await page.getByRole('button', { name: 'Add item' }).click();
  const name = page.locator('.iname:focus');
  await expect(name).toBeVisible();
  await name.fill('Test Helm');
  const row = page.locator('article.rrow', { has: page.locator('.iname[value="Test Helm"]') });
  await row.getByLabel('phys').fill('12.5');
  await row.getByLabel('Add a bonus').fill('Fire Resistance +5%');
  await row.getByLabel('Add a bonus').press('Enter');
  await expect(row.locator('.bchip')).toContainText('Fire Resistance +5%');
  await expect(page.locator('#savestate')).toHaveText('All changes saved');
  await expect
    .poll(async () => Object.values(await store(page)).find((x) => x.name === 'Test Helm'))
    .toMatchObject({ kind: 'helmet', st: { phys: 12.5 }, bonuses: [{ stat: 'Fire Resistance', value: 5, pct: true }] });

  await row.getByRole('button', { name: 'Delete' }).click();
  await row.getByRole('button', { name: 'Click again to delete' }).click();
  await expect.poll(async () => Object.values(await store(page)).some((x) => x.name === 'Test Helm')).toBe(false);
});

test('save a calculator item', async ({ page }) => {
  await page.getByRole('tab', { name: 'Gear calculator' }).click();
  await page.getByLabel('Item type').selectOption({ label: 'Staff (2H)' });
  await page.getByLabel('Name', { exact: true }).fill('Calc Staff');
  await page.getByLabel('Add a bonus').fill('Pyrokinetic +1');
  await page.getByLabel('Add a bonus').press('Enter');
  await page.getByRole('button', { name: 'Save item' }).click();
  await expect(page.getByText('Saved “Calc Staff” to Items.')).toBeVisible();
  await expect
    .poll(async () => Object.values(await store(page)).find((x) => x.name === 'Calc Staff'))
    .toMatchObject({ kind: 'weapon', type: 'w:Staff:2', bonuses: [{ stat: 'Pyrokinetic', value: 1 }] });
});

test('hover cards, and Ctrl keeps one open', async ({ page }) => {
  await page.getByLabel('Search').fill('blinding radiance');
  await page.locator('#view .entry [data-status]').first().hover();
  await expect(page.locator('#tip')).toBeVisible();
  await page.keyboard.down('Control');
  await page.locator('#tip').hover();
  await expect(page.locator('#tip')).toBeVisible();
  await page.keyboard.up('Control');
  await page.mouse.move(5, 700);
  await expect(page.locator('#tip')).toHaveCount(0);
});
