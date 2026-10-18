// Reading the reference tables, with per-table lookups cached for each loaded set of tables.
import { baseStatus } from './codex';
import type { RefRow, RefTables } from './types';

export function refRows<T extends RefRow = RefRow>(ref: RefTables, key: string): T[] {
  return (ref[key]?.rows ?? []) as T[];
}

const caches = new WeakMap<RefTables, Map<string, unknown>>();
/** Memoise a derived lookup per tables object (the tables are replaced, never mutated). */
export function memo<T>(ref: RefTables, key: string, build: () => T): T {
  let m = caches.get(ref);
  if (!m) {
    m = new Map();
    caches.set(ref, m);
  }
  if (!m.has(key)) m.set(key, build());
  return m.get(key) as T;
}

export function infoSkill(ref: RefTables, name: string): RefRow | undefined {
  const map = memo(ref, 'skillMap', () =>
    Object.fromEntries(refRows(ref, 'skills').map((r) => [String(r.name).toLowerCase(), r])),
  );
  return map[name.toLowerCase()];
}

export function infoStatus(ref: RefTables, name: string): RefRow | undefined {
  const map = memo(ref, 'statusMap', () =>
    Object.fromEntries(refRows(ref, 'statuses').map((r) => [baseStatus(String(r.name)).toLowerCase(), r])),
  );
  return map[baseStatus(name).toLowerCase()];
}

/** The Info-sheet row for an ability or attribute. */
export function refAb(ref: RefTables, a: string): RefRow | undefined {
  return refRows(ref, 'abilities').find((r) => r.name === a) ?? refRows(ref, 'attributes').find((r) => r.name === a);
}

/** Ingredient name (lower-case) -> category. */
export const ingredientCategories = (ref: RefTables) =>
  memo(ref, 'ingCat', () =>
    Object.fromEntries(refRows(ref, 'ingredients').map((r) => [String(r.name).toLowerCase(), r.category as string])),
  );
