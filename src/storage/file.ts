// A JSON file via the File System Access API (Chrome/Edge). Every save rewrites the whole file; the file is
// re-read when something else changes it.
import { type Collections, localDb, parseData } from './localDb';
import type { Backend, DataFile } from './types';

export const JSON_TYPES = [{ description: 'JSON data', accept: { 'application/json': ['.json'] } }];

export async function filePermission(h: FileSystemFileHandle, ask: boolean): Promise<boolean> {
  const o = { mode: 'readwrite' as const };
  if ((await h.queryPermission?.(o)) === 'granted') return true;
  return ask ? (await h.requestPermission?.(o)) === 'granted' : false;
}

/** Open a file as storage; with `initial`, write that data into it first. */
export async function fileBackend(
  h: FileSystemFileHandle,
  initial?: DataFile,
  onError?: (msg: string) => void,
): Promise<Backend> {
  let mod = 0;
  let data: Collections;
  if (initial) data = { ...initial } as Collections;
  else {
    const f = await h.getFile();
    data = parseData(await f.text()) as unknown as Collections;
    mod = f.lastModified;
  }
  const writeFile = async () => {
    const w = await h.createWritable();
    await w.write(`${JSON.stringify(db.data, null, 2)}\n`);
    await w.close();
    mod = (await h.getFile()).lastModified;
  };
  // writes are serialised, and a write that's still waiting absorbs later ones
  let chain: Promise<void> = Promise.resolve();
  let queued: Promise<void> | null = null;
  const save = () => {
    queued ??= chain = chain
      .catch(() => {})
      .then(() => {
        queued = null;
        return writeFile();
      });
    return queued;
  };
  const db = localDb(data, save);
  if (initial) await save();
  let busy = false;
  const poll = setInterval(async () => {
    if (busy || queued || document.hidden) return;
    busy = true;
    try {
      const f = await h.getFile();
      if (f.lastModified !== mod) {
        mod = f.lastModified;
        db.replace(parseData(await f.text()) as unknown as Collections);
      }
    } catch (e) {
      onError?.(`Could not re-read ${h.name}: ${(e as Error).message}`);
    }
    busy = false;
  }, 2000);
  return { kind: 'file', name: h.name, db, close: () => clearInterval(poll) };
}
