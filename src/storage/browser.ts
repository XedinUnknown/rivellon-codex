// Browser storage: one IndexedDB database per slot. Store "docs" holds a record per document path
// (e.g. "party/sol"); "meta" holds the slot's remembered file handle.
import { type Collections, localDb, splitPath } from './localDb';
import type { Backend } from './types';

const conns: Record<string, Promise<IDBDatabase>> = {};
export function idbOpen(name: string): Promise<IDBDatabase> {
  conns[name] ??= new Promise((res, rej) => {
    const r = indexedDB.open(name, 1);
    r.onupgradeneeded = () => {
      r.result.createObjectStore('docs');
      r.result.createObjectStore('meta');
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => {
      delete conns[name];
      rej(r.error);
    };
  });
  return conns[name];
}
const req = <T>(r: IDBRequest<T>) =>
  new Promise<T>((res, rej) => {
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });

export async function idbGet<T>(name: string, store: string, key: string): Promise<T | undefined> {
  return req((await idbOpen(name)).transaction(store).objectStore(store).get(key)) as Promise<T | undefined>;
}
export async function idbPut(name: string, store: string, key: string, val: unknown): Promise<void> {
  const tx = (await idbOpen(name)).transaction(store, 'readwrite');
  const st = tx.objectStore(store);
  if (val == null) st.delete(key);
  else st.put(val, key);
  await new Promise<void>((res, rej) => {
    tx.oncomplete = () => res();
    tx.onerror = tx.onabort = () => rej(tx.error ?? new Error('browser storage write failed'));
  });
}
/** Close and delete a slot's database. */
export async function idbDrop(name: string): Promise<void> {
  const c = conns[name];
  delete conns[name];
  if (c) (await c.catch(() => null))?.close();
  await req(indexedDB.deleteDatabase(name));
}

export async function browserBackend(name: string): Promise<Backend> {
  const st = (await idbOpen(name)).transaction('docs').objectStore('docs');
  const [keys, vals] = await Promise.all([req(st.getAllKeys()), req(st.getAll())]);
  const data: Collections = { party: {}, items: {} };
  keys.forEach((k, i) => {
    const [c, id] = splitPath(String(k));
    data[c] ??= {};
    data[c][id] = vals[i];
  });
  // other tabs on the same slot
  const bc = 'BroadcastChannel' in window ? new BroadcastChannel(name) : null;
  const db = localDb(data, async (c, id, body) => {
    await idbPut(name, 'docs', `${c}/${id}`, body);
    bc?.postMessage({ c, id, body });
  });
  if (bc)
    bc.onmessage = (e: MessageEvent<{ c?: string; id: string; body: unknown }>) => {
      if (e.data?.c) db.external(e.data.c, e.data.id, e.data.body);
    };
  return { kind: 'browser', db, close: () => bc?.close() };
}
