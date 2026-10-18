// Shared test setup: a mocked claude.ai runtime backed by the fixtures, and failing on page errors.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test as base, expect, type Page } from '@playwright/test';

const root = join(import.meta.dirname, '..', '..');
const read = (p: string) => JSON.parse(readFileSync(join(root, p), 'utf8'));
export const party = read('tests/fixtures/party.json') as Record<string, { level: number; notes?: string }>;
export const items = read('tests/fixtures/items.json') as Record<string, unknown>;
// the builds under test use the hand-written sample data (CODEX_DATA=sample)
const ref = Object.fromEntries(
  readdirSync(join(root, 'data/sample/ref')).map((f) => [f.replace(/\.json$/, ''), read(`data/sample/ref/${f}`)]),
);
const nexus = read('data/sample/nexus.json') as { skills: unknown[] };
export const sample = { skills: nexus.skills.length, recipes: (ref.recipes as { rows: unknown[] }).rows.length };

/** window.claude with the subset of the artifact runtime the page uses; writes are recorded in window.__writes. */
export async function mockClaude(page: Page) {
  await page.addInitScript(
    ({ party, items, ref }) => {
      type Doc = Record<string, unknown>;
      const store: Record<string, Record<string, Doc>> = { party, items, ref } as never;
      const subs: Record<string, ((s: unknown) => void)[]> = { party: [], ref: [], items: [] };
      const w = window as unknown as Record<string, unknown>;
      const writes: unknown[] = [];
      w.__writes = writes;
      w.__store = store;
      const snapOf = (c: string) => ({
        docs: Object.entries(store[c] ?? {}).map(([id, b]) => ({ id, data: () => structuredClone(b) })),
      });
      const fire = (c: string) =>
        setTimeout(() => {
          for (const cb of subs[c] ?? []) cb(snapOf(c));
        }, 30);
      const split = (p: string) => p.split('/') as [string, string];
      w.claude = {
        use: async (n: string) =>
          n === 'db'
            ? {
                collection: (c: string) => ({
                  onSnapshot: (cb: (s: unknown) => void) => {
                    subs[c]?.push(cb);
                    setTimeout(() => cb(snapOf(c)), 50);
                    return () => {};
                  },
                }),
                doc: (p: string) => ({
                  set: async (b: Doc) => {
                    const [c, id] = split(p);
                    (store[c] as Record<string, Doc>)[id] = b;
                    writes.push(['set', p]);
                    fire(c);
                  },
                  update: async (b: Doc) => {
                    const [c, id] = split(p);
                    const d = store[c]?.[id];
                    if (!d) throw Object.assign(new Error('missing'), { code: 'invalid_argument' });
                    for (const [k, v] of Object.entries(b)) {
                      if (v && typeof v === 'object' && !Array.isArray(v) && d[k] && typeof d[k] === 'object')
                        Object.assign(d[k] as object, v);
                      else d[k] = v;
                    }
                    writes.push(['update', p, JSON.stringify(b)]);
                    fire(c);
                  },
                  delete: async () => {
                    const [c, id] = split(p);
                    delete store[c]?.[id];
                    writes.push(['delete', p]);
                    fire(c);
                  },
                }),
              }
            : { can: async () => true },
      };
    },
    { party, items, ref },
  );
}

/** A page that fails the test on any uncaught error or console error. */
export const test = base.extend<{ errors: string[] }>({
  errors: async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    await use(errors);
    expect(errors, 'page errors').toEqual([]);
  },
});
export { expect };
