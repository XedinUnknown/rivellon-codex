// An in-memory document store with the DbHandle shape; persist() stores each change (IndexedDB or a file).
import { clone } from '../domain/format';
import type { DataFile, DbHandle, Snapshot, StoreError } from './types';

export const storeErr = (code: string, message: string): StoreError => Object.assign(new Error(message), { code });
export const splitPath = (path: string): [string, string] => {
  const i = path.indexOf('/');
  return [path.slice(0, i), path.slice(i + 1)];
};

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v);

/** update() semantics: nested objects merge, arrays replace, null removes the key. */
export function mergeInto(t: Obj, p: Obj): Obj {
  for (const [k, v] of Object.entries(p)) {
    if (v === null) delete t[k];
    else if (isObj(v) && isObj(t[k])) mergeInto(t[k] as Obj, v);
    else t[k] = clone(v);
  }
  return t;
}

/** Parse an export / data file; throws on anything that isn't one. */
export function parseData(text: string): DataFile {
  const o: unknown = text.trim() ? JSON.parse(text) : {};
  const ok = (v: unknown) => v == null || isObj(v);
  if (!isObj(o) || !ok(o.party) || !ok(o.items) || !ok(o.ref))
    throw new Error('not a Rivellon Codex data file (expected { party, items })');
  return {
    party: (o.party as Obj) ?? {},
    items: (o.items as Obj) ?? {},
    ...(o.ref ? { ref: o.ref as Obj } : {}),
  };
}

export type Collections = Record<string, Obj>;
export interface LocalDb extends DbHandle {
  /** a change made elsewhere (another tab): apply and notify, without persisting */
  external(c: string, id: string, body: unknown): void;
  /** replace everything (the file changed outside the page) */
  replace(next: Collections): void;
  readonly data: Collections;
}

export function localDb(data: Collections, persist: (c: string, id: string, body: unknown) => Promise<void>): LocalDb {
  const subs: Record<string, ((s: Snapshot) => void)[]> = {};
  const snap = (c: string): Snapshot => ({
    docs: Object.entries(data[c] ?? {}).map(([id, v]) => ({ id, data: () => clone(v) })),
  });
  const emit = (c: string) => {
    for (const cb of subs[c] ?? []) cb(snap(c));
  };
  async function write(path: string, fn: (cur: unknown) => unknown) {
    const [c, id] = splitPath(path);
    data[c] ??= {};
    const coll = data[c] as Obj;
    const body = fn(coll[id]);
    if (body === undefined) delete coll[id];
    else coll[id] = body;
    emit(c);
    await persist(c, id, body ?? null);
  }
  return {
    collection: (c) => ({
      onSnapshot(cb) {
        subs[c] ??= [];
        subs[c].push(cb);
        setTimeout(() => cb(snap(c)), 0);
        return () => {
          subs[c] = (subs[c] ?? []).filter((x) => x !== cb);
        };
      },
    }),
    doc: (path) => ({
      set: (body) => write(path, () => clone(body)),
      update: (patch) =>
        write(path, (cur) => {
          if (!isObj(cur)) throw storeErr('invalid_argument', 'document does not exist');
          return mergeInto(clone(cur), patch);
        }),
      delete: () => write(path, () => undefined),
    }),
    external(c, id, body) {
      data[c] ??= {};
      const coll = data[c] as Obj;
      if (body == null) delete coll[id];
      else coll[id] = body;
      emit(c);
    },
    replace(next) {
      for (const c of new Set([...Object.keys(data), ...Object.keys(next)])) {
        data[c] = next[c] ?? {};
        emit(c);
      }
    },
    data,
  };
}
