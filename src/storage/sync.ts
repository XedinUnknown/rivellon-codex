// Saving: edits change the in-memory state, then queue(key) debounces a write of that document. One write per
// document at a time; a write requested during another runs after it. Only fields that changed since the last
// copy known to be stored are sent, so two open views editing different fields don't overwrite each other.
import { clone } from '../domain/format';
import type { DbHandle, StoreError } from './types';

/** Fields whose sub-keys are patched individually. */
const NESTED = new Set(['points', 'attributes', 'gear', 'st', 'runeFx']);
const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
type Obj = Record<string, unknown>;

export function diffPatch(cur: Obj, base: Obj): Obj {
  const patch: Obj = {};
  for (const k of new Set([...Object.keys(cur ?? {}), ...Object.keys(base ?? {})])) {
    const c = cur?.[k];
    const b = base?.[k];
    if (same(c, b)) continue;
    if (NESTED.has(k) && c && b && typeof c === 'object' && typeof b === 'object' && !Array.isArray(c)) {
      const sub: Obj = {};
      for (const s of new Set([...Object.keys(c), ...Object.keys(b)]))
        if (!same((c as Obj)[s], (b as Obj)[s])) sub[s] = (c as Obj)[s] ?? null;
      patch[k] = sub;
    } else patch[k] = c ?? null;
  }
  return patch;
}

export interface SyncHooks {
  /** the current body of a document ("party/sol", "items/<id>"); null means delete it */
  body(key: string): unknown;
  /** saving state changed */
  status(busy: boolean, error: string | null): void;
  /** the store refused a write as not allowed */
  readOnly(): void;
}

export class Sync {
  private db: DbHandle | null = null;
  private readonly writing: Record<string, boolean> = {};
  private readonly pending: Record<string, boolean> = {};
  private readonly timers: Record<string, ReturnType<typeof setTimeout> | null> = {};
  /** key -> last body known to be stored (from snapshots or our own writes) */
  readonly synced: Record<string, unknown> = {};
  /** key -> local edits not yet stored; snapshots don't overwrite these */
  readonly dirty: Record<string, boolean> = {};
  private lastErr: string | null = null;

  constructor(private readonly hooks: SyncHooks) {}

  /** Switch database: everything held for the previous one is dropped. */
  attach(db: DbHandle | null) {
    this.db = db;
    for (const o of [this.synced, this.dirty, this.pending, this.writing]) for (const k of Object.keys(o)) delete o[k];
    for (const [k, t] of Object.entries(this.timers)) {
      if (t) clearTimeout(t);
      delete this.timers[k];
    }
    this.lastErr = null;
    this.report();
  }

  busy(): boolean {
    return Object.values(this.writing).some(Boolean) || Object.values(this.timers).some(Boolean);
  }

  /** Save a document after `delay` ms of quiet. */
  queue(key: string, delay = 600) {
    this.dirty[key] = true;
    const t = this.timers[key];
    if (t) clearTimeout(t);
    this.timers[key] = setTimeout(() => {
      this.timers[key] = null;
      void this.write(key);
    }, delay);
    this.report();
  }

  /** Write the whole document next time instead of a patch (e.g. after an import). */
  forget(key: string) {
    delete this.synced[key];
  }

  private report() {
    this.hooks.status(this.busy(), this.lastErr);
  }

  private async write(key: string): Promise<void> {
    const db = this.db;
    if (!db) return;
    if (this.writing[key]) {
      this.pending[key] = true;
      return;
    }
    this.writing[key] = true;
    this.lastErr = null;
    this.report();
    try {
      const body = this.hooks.body(key);
      if (body == null) {
        await db.doc(key).delete();
        delete this.synced[key];
      } else {
        const cur = clone(body) as Obj;
        const base = this.synced[key] as Obj | undefined;
        if (!base) await db.doc(key).set(cur);
        else {
          const patch = diffPatch(cur, base);
          if (Object.keys(patch).length) {
            try {
              await db.doc(key).update(patch);
            } catch (e) {
              // the document vanished meanwhile: write it whole
              if ((e as StoreError)?.code === 'invalid_argument') await db.doc(key).set(cur);
              else throw e;
            }
          }
        }
        this.synced[key] = cur;
      }
    } catch (e) {
      this.lastErr = (e as Error)?.message || 'unknown error';
      if ((e as StoreError)?.code === 'invalid_argument') this.hooks.readOnly();
    }
    if (db !== this.db) return; // switched storage meanwhile
    this.writing[key] = false;
    if (this.pending[key]) {
      this.pending[key] = false;
      void this.write(key);
    } else if (!this.timers[key]) this.dirty[key] = false;
    this.report();
  }
}
