// Choosing and switching storage: claude.ai's database inside claude.ai; otherwise the current slot's browser
// storage or its JSON file.
import { MEMBERS } from '../domain/constants';
import { clone } from '../domain/format';
import { blankParty, normalize } from '../domain/party';
import type { Item, Items, MemberId, RefTables } from '../domain/types';
import { browserBackend, idbDrop, idbGet, idbPut } from '../storage/browser';
import { fileBackend, filePermission, JSON_TYPES } from '../storage/file';
import { currentSlot, DEFAULT_SLOT, lsGet, lsSet, saveSlotList, slotDb, slotList, slotPref } from '../storage/slots';
import type { Backend, DataFile } from '../storage/types';
import { get, set, sync } from './store';

let backend: Backend | null = null;
let gen = 0;
let embeddedRef: RefTables = {};
let waitingHandle: FileSystemFileHandle | null = null;
let setLine: (msg: string) => void = () => {};

export const inClaude = () => !!window.claude;
export const fileStorageAvailable = () => !inClaude() && typeof window.showOpenFilePicker === 'function';
export const browserStorageAvailable = () => !inClaude() && 'indexedDB' in window;

/** Switch to a backend (or none): drop everything held for the previous one and subscribe to the new one. */
function attach(b: Backend | null, writable = true) {
  backend?.close?.();
  backend = b;
  const g = ++gen;
  sync.attach(b?.db ?? null);
  set((s) => {
    s.backend = b ? { kind: b.kind, ...(b.name ? { name: b.name } : {}) } : null;
    s.canWrite = !!b && writable;
    s.party = blankParty();
    s.items = {};
    s.ref = embeddedRef;
    s.partyLoaded = false;
  });
  if (!b) return;
  const on = (c: string, cb: (docs: { id: string; data(): unknown }[]) => void, what: string) =>
    b.db.collection(c).onSnapshot(
      (snap) => {
        if (g === gen) cb(snap.docs);
      },
      (e) => {
        if (g === gen) setLine(`${what} sync stopped: ${e.code ?? e.message}`);
      },
    );
  on(
    'party',
    (docs) => {
      set((s) => {
        for (const d of docs) {
          const m = MEMBERS.find((x) => x.id === d.id);
          if (!m) continue;
          const key = `party/${d.id}`;
          const body = normalize(d.data(), m);
          sync.synced[key] = body;
          if (!sync.dirty[key]) s.party[m.id as MemberId] = clone(body);
        }
        s.partyLoaded = true;
      });
    },
    'Party',
  );
  on(
    'items',
    (docs) => {
      set((s) => {
        const seen = new Set<string>();
        for (const d of docs) {
          seen.add(d.id);
          const key = `items/${d.id}`;
          const body = clone(d.data()) as Item;
          sync.synced[key] = body;
          if (!sync.dirty[key]) s.items[d.id] = clone(body);
        }
        for (const k of Object.keys(s.items)) if (!seen.has(k) && !sync.dirty[`items/${k}`]) delete s.items[k];
      });
    },
    'Item',
  );
  on(
    'ref',
    (docs) => {
      if (!docs.length) return; // nothing stored: keep the built-in tables
      set({ ref: Object.fromEntries(docs.map((d) => [d.id, d.data()])) as RefTables });
    },
    'Reference data',
  );
}

// ---------- slots and files ----------
async function adoptFile(h: FileSystemFileHandle, initial?: DataFile) {
  attach(await fileBackend(h, initial, setLine));
  waitingHandle = null;
  set({ fileWaiting: null });
  lsSet(slotPref(get().slot), 'file');
  await idbPut(slotDb(get().slot), 'meta', 'fileHandle', h).catch(() => {});
}

/** Open the current slot: its remembered file if that was the choice, otherwise its browser storage. */
async function openSlot() {
  waitingHandle = null;
  set({ fileWaiting: null });
  const slot = get().slot;
  if (lsGet(slotPref(slot)) === 'file' && fileStorageAvailable()) {
    try {
      const h = await idbGet<FileSystemFileHandle>(slotDb(slot), 'meta', 'fileHandle');
      if (h) {
        if (await filePermission(h, false)) return await adoptFile(h);
        waitingHandle = h; // permission is asked for on a click
        set({ fileWaiting: h.name });
        return attach(null);
      }
    } catch (e) {
      setLine(`Could not open the saved file: ${(e as Error).message}`);
    }
  }
  if (browserStorageAvailable()) {
    try {
      return attach(await browserBackend(slotDb(slot)));
    } catch (e) {
      setLine(`Browser storage is unavailable: ${(e as Error).message}`);
    }
  }
  attach(null);
}

async function switchSlot(slot: string) {
  set({ slot });
  lsSet('codex.slot', slot === DEFAULT_SLOT ? null : slot);
  await openSlot();
}

/** Start storage: claude.ai's database inside claude.ai; otherwise the current slot. */
export async function startStorage(ref: RefTables, report: (msg: string) => void) {
  embeddedRef = ref;
  setLine = report;
  set({ ref, slot: currentSlot() });
  const claude = window.claude;
  if (claude) {
    try {
      const db = await claude.use('db');
      if (!db) return attach(null);
      const user = await claude.use('user');
      const cw = user ? await user.can('data.write') : null;
      return attach({ kind: 'claude', db }, cw !== false);
    } catch {
      return attach(null);
    }
  }
  await openSlot();
}

// ---------- what the Storage dialog does (each returns a message to show) ----------
export const exportData = (): DataFile => {
  const s = get();
  return { party: clone(s.party), items: clone(s.items) };
};

export async function switchToBrowserStorage(): Promise<string> {
  attach(await browserBackend(slotDb(get().slot)));
  lsSet(slotPref(get().slot), 'browser');
  return 'Now saving in browser storage.';
}
export async function reconnectFile(): Promise<string> {
  if (!waitingHandle) return '';
  if (!(await filePermission(waitingHandle, true))) return 'Permission was not granted.';
  await adoptFile(waitingHandle);
  return 'Reconnected.';
}
export async function openFile(): Promise<string> {
  const [h] = (await window.showOpenFilePicker?.({ types: JSON_TYPES })) ?? [];
  if (!h) return '';
  if (!(await filePermission(h, true))) return 'Permission to save to the file was not granted.';
  await adoptFile(h);
  return `Now saving to ${h.name}.`;
}
export async function newFile(): Promise<string> {
  const h = await window.showSaveFilePicker?.({ suggestedName: 'rivellon-codex.json', types: JSON_TYPES });
  if (!h) return '';
  await adoptFile(h, exportData());
  return `Created ${h.name} with the current party and items; saving there from now on.`;
}
export async function createSlot(raw: string): Promise<string> {
  const name = raw.trim().replace(/\s+/g, ' ');
  if (!name) return 'Type a name for the new slot first.';
  if (slotList().some((s) => s.toLowerCase() === name.toLowerCase()))
    return `There is already a slot called “${name}”.`;
  saveSlotList([...slotList(), name]);
  await switchSlot(name);
  return `Created slot “${name}”. It starts empty; Import fills it from an export.`;
}
export async function pickSlot(name: string): Promise<string> {
  await switchSlot(name);
  return `Switched to slot “${name}”.`;
}
/** Delete the current slot (not Default): its browser storage and remembered file; the file itself stays. */
export async function deleteSlot(): Promise<string> {
  const gone = get().slot;
  if (gone === DEFAULT_SLOT) return '';
  await switchSlot(DEFAULT_SLOT);
  saveSlotList(slotList().filter((s) => s !== gone));
  lsSet(slotPref(gone), null);
  await idbDrop(slotDb(gone)).catch(() => {});
  return `Deleted slot “${gone}”.`;
}
/** Click on the save indicator while a file waits for permission. */
export async function tryReconnect(): Promise<boolean> {
  if (!waitingHandle || backend) return false;
  try {
    if (await filePermission(waitingHandle, true)) {
      await adoptFile(waitingHandle);
      return true;
    }
  } catch {}
  return false;
}

/** Imported party documents as complete members. */
export const normalizeParty = (p: Record<string, unknown>) =>
  Object.fromEntries(MEMBERS.map((m) => [m.id, normalize(p[m.id] ?? {}, m)]));
export type { Items };
