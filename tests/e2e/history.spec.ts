// Back/Forward move between views; typing a search doesn't add entries; scroll positions come back.
import { expect, mockClaude, test } from './fixtures';

test('back and forward', async ({ page }) => {
  await mockClaude(page);
  await page.goto('/');
  const tab = () => page.locator('[role="tab"][aria-selected="true"]');
  await page.getByRole('tab', { name: 'Skills' }).click();
  await page.mouse.wheel(0, 3000);
  await page.waitForTimeout(400);
  const y = await page.evaluate(() => window.scrollY);
  expect(y).toBeGreaterThan(1000);
  await page.getByRole('tab', { name: 'Status effects' }).click();
  await page.getByLabel('Search').fill('bur');
  await page.getByLabel('Search').fill('burning');
  await page.getByRole('tab', { name: 'Party' }).click();
  await page.getByRole('button', { name: 'Open Sol' }).click();
  await expect(page.locator('.ptop')).toBeVisible();

  await page.goBack();
  await expect(page.locator('.pover')).toBeVisible();
  await page.goBack();
  await expect(tab()).toHaveAttribute('title', 'Status effects');
  await expect(page.getByLabel('Search')).toHaveValue('burning');
  await page.goBack();
  await expect(tab()).toHaveAttribute('title', 'Skills');
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(y - 5);
  await page.goForward();
  await expect(tab()).toHaveAttribute('title', 'Status effects');

  // a chip jump is an entry too
  await page.getByLabel('Search').fill('');
  await page.locator('#view [data-skill]').first().click();
  await expect(tab()).not.toHaveAttribute('title', 'Status effects');
  await page.goBack();
  await expect(tab()).toHaveAttribute('title', 'Status effects');
});
