// The single-file build works when opened straight from disk (double-click), saving to browser storage.

import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { expect, test } from './fixtures';

test('opens from file://', async ({ page }, info) => {
  test.skip(info.project.name !== 'single', 'only the single-file build runs from disk');
  await page.goto(pathToFileURL(join(import.meta.dirname, '..', '..', 'dist', 'single', 'index.html')).href);
  await expect(page.locator('#savestate')).toHaveText('All changes saved');
  await expect(page.getByRole('tab', { name: 'Skills' }).locator('.count')).toHaveText('202');
  await expect(page.locator('#view .entry').first()).toBeVisible();
});
