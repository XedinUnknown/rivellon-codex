// Outside claude.ai: browser storage, slots, a JSON file, export and import. The real file pickers need a person,
// so they're replaced by handles into the origin-private file system, which implement the same interface.
import { writeFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import { expect, items, party, test } from './fixtures';

const PICKERS = () => {
  const file = async (create: boolean) =>
    (await navigator.storage.getDirectory()).getFileHandle('codex.json', { create });
  const w = window as unknown as Record<string, unknown>;
  w.showSaveFilePicker = () => file(true);
  w.showOpenFilePicker = async () => [await file(false)];
};
const READ_FILE = async () =>
  (await (await (await navigator.storage.getDirectory()).getFileHandle('codex.json')).getFile()).text();
const state = <T>(page: Page, fn: string) => page.evaluate(fn) as Promise<T>;
/** Party tab, then Sol's detail (a second click on the Party tab always shows the overview). */
async function openSol(page: Page) {
  await page.getByRole('tab', { name: 'Party' }).click();
  if (!(await page.locator('.pover').isVisible())) await page.getByRole('tab', { name: 'Party' }).click();
  await page.getByRole('button', { name: 'Open Sol' }).click();
}

test('browser storage, slots, file, export and import', async ({ page, errors }, info) => {
  test.slow();
  await page.addInitScript(PICKERS);
  await page.goto('/');
  await expect(page.locator('#savestate')).toHaveText('All changes saved');

  // browser storage survives a reload
  await openSol(page);
  await page.getByRole('button', { name: 'Edit' }).click();
  await page.locator('#lvl').fill('7');
  await expect(page.locator('#savestate')).toHaveText('All changes saved');
  await page.reload();
  await expect(page.locator('.ptop .who button[aria-pressed="true"]')).toContainText('Lvl 7');

  // import
  const file = info.outputPath('import.json');
  writeFileSync(file, JSON.stringify({ party, items }));
  await page.locator('#savestate').click();
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Import…' }).click();
  await (await chooser).setFiles(file);
  await page.getByRole('button', { name: 'Replace' }).click();
  await expect(page.locator('#savestate')).toHaveText('All changes saved');
  await expect(page.getByRole('tab', { name: 'Items' }).locator('.count')).toHaveText(
    String(Object.keys(items).length),
  );

  // export
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export' }).click();
  const exported = JSON.parse(
    await (await (await download).createReadStream()).toArray().then((b) => Buffer.concat(b).toString()),
  );
  expect(Object.keys(exported).sort()).toEqual(['items', 'party']);
  expect(Object.keys(exported.items).sort()).toEqual(Object.keys(items).sort());

  // a new slot starts empty and is kept across reloads
  await page.getByLabel('New slot name').fill('Second');
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.locator('#savestate')).toContainText('Second');
  await expect(page.getByRole('tab', { name: 'Items' }).locator('.count')).toHaveText('0');
  await page.keyboard.press('Escape');
  await page.reload();
  await expect(page.locator('#savestate')).toContainText('Second');

  // switching back shows Default's data; deleting a slot returns to Default
  await page.locator('#savestate').click();
  await page.getByLabel('Slot', { exact: true }).selectOption('Default');
  await expect(page.getByRole('tab', { name: 'Items' }).locator('.count')).toHaveText(
    String(Object.keys(items).length),
  );
  await page.getByLabel('Slot', { exact: true }).selectOption('Second');
  await page.getByRole('button', { name: 'Delete slot' }).click();
  await page.getByRole('button', { name: /Really delete/ }).click();
  await expect(page.getByLabel('Slot', { exact: true })).toHaveValue('Default');
  await expect(page.getByText('Deleted slot “Second”.')).toBeVisible();
  expect(await state<string[]>(page, 'indexedDB.databases().then(d => d.map(x => x.name))')).toEqual([
    'rivellon-codex',
  ]);

  // a new JSON file starts with the current data, is reopened after a reload, and is saved to
  await page.getByRole('button', { name: 'New file…' }).click();
  await expect(page.getByText('Saving to')).toContainText('codex.json');
  expect(Object.keys(JSON.parse(await page.evaluate(READ_FILE)).items).sort()).toEqual(Object.keys(items).sort());
  await page.keyboard.press('Escape');
  await page.reload();
  await expect(page.locator('#savestate')).toHaveText('All changes saved');
  await page.locator('#savestate').click();
  await expect(page.getByText('Saving to')).toContainText('codex.json');
  await page.keyboard.press('Escape');
  await openSol(page);
  await page.getByRole('button', { name: 'Edit' }).click();
  await page.getByPlaceholder('Plans, reminders…').fill('from page');
  await expect.poll(async () => JSON.parse(await page.evaluate(READ_FILE)).party.sol.notes).toBe('from page');

  // changes made to the file elsewhere show up
  await page.waitForTimeout(1100); // so the outside write gets a new lastModified
  await page.evaluate(async () => {
    const h = await (await navigator.storage.getDirectory()).getFileHandle('codex.json');
    const d = JSON.parse(await (await h.getFile()).text());
    d.party.sol.notes = 'from outside';
    const w = await h.createWritable();
    await w.write(JSON.stringify(d));
    await w.close();
  });
  await page.getByRole('button', { name: 'View' }).click();
  await expect(page.locator('.notesview')).toHaveText('from outside', { timeout: 6000 });

  // and back to browser storage
  await page.locator('#savestate').click();
  await page.getByRole('button', { name: 'Use' }).click();
  await expect(page.getByText('Now saving in browser storage.')).toBeVisible();
  expect(errors).toEqual([]);
});
