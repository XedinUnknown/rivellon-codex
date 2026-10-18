// App state: what's on screen (ui), the party and items being edited, and the storage status.
// Edits go through the actions below, which update the state and queue a save of the changed document.
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { MEMBERS } from '../domain/constants';
import { handsOf, socketedIn, whoWears } from '../domain/items';
import { blankParty } from '../domain/party';
import type { Bonus, Item, Items, Member, MemberId, Party, RefTables } from '../domain/types';
import { DEFAULT_SLOT } from '../storage/slots';
import { Sync } from '../storage/sync';
import type { BackendKind } from '../storage/types';

export type Tab = 'party' | 'items' | 'skills' | 'status' | 'summons' | 'special' | 'crafting' | 'gear' | 'reference';

export interface Ui {
  tab: Tab;
  /** search text as typed */
  q: string;
  schools: string[];
  craft: boolean;
  use: boolean;
  known: boolean;
  who: MemberId;
  partyView: 'overview' | 'detail';
  refSec: string;
  /** crafting: only recipes using this ingredient */
  ing: string;
  cats: string[];
  kinds: string[];
  calc: { type: string; level: number; rarity: string; name: string; bonuses: Bonus[]; equip: string };
  /** party detail: open state of each collapsible section */
  sects: Record<string, boolean>;
  editing: boolean;
  /** party detail: slot whose item picker is open */
  pickSlot: string | null;
  /** party detail: slot whose item editor is open */
  popSlot: string | null;
  confirmDel: string | null;
  flash: string;
  sideCollapsed: boolean;
  sideOpen: boolean;
  storageOpen: boolean;
}

export interface State {
  ui: Ui;
  party: Party;
  items: Items;
  ref: RefTables;
  partyLoaded: boolean;
  canWrite: boolean;
  /** storage in use, or null (nothing is saved) */
  backend: { kind: BackendKind; name?: string } | null;
  /** a remembered JSON file that needs permission again */
  fileWaiting: string | null;
  slot: string;
  save: { busy: boolean; error: string | null };
  /** a storage problem to show under the filters */
  notice: string;
}

export const initialUi = (): Ui => ({
  tab: 'skills',
  q: '',
  schools: [],
  craft: false,
  use: false,
  known: false,
  who: 'sol',
  partyView: 'overview',
  refSec: 'talents',
  ing: '',
  cats: [],
  kinds: [],
  calc: { type: 'w:Staff:2', level: 8, rarity: 'Common', name: '', bonuses: [], equip: '' },
  sects: {},
  editing: false,
  pickSlot: null,
  popSlot: null,
  confirmDel: null,
  flash: '',
  sideCollapsed: false,
  sideOpen: false,
  storageOpen: false,
});

export const useApp = create<State>()(
  immer(() => ({
    ui: initialUi(),
    party: blankParty(),
    items: {},
    ref: {},
    partyLoaded: false,
    canWrite: false,
    backend: null,
    fileWaiting: null,
    slot: DEFAULT_SLOT,
    save: { busy: false, error: null },
    notice: '',
  })),
);

export const get = useApp.getState;
export const set = useApp.setState;

export const sync = new Sync({
  body(key) {
    const [c, id] = key.split('/') as [string, string];
    const s = get();
    return c === 'party' ? s.party[id as MemberId] : (s.items[id] ?? null);
  },
  status(busy, error) {
    const cur = get().save;
    if (cur.busy !== busy || cur.error !== error) set({ save: { busy, error } });
  },
  readOnly() {
    set({ canWrite: false });
  },
});

// ---------- edits ----------
export const saveMember = (id: MemberId, delay?: number) => sync.queue(`party/${id}`, delay);
export const saveItem = (iid: string, delay?: number) => sync.queue(`items/${iid}`, delay);

export function editMember(id: MemberId, recipe: (m: Member) => void, delay?: number) {
  set((s) => {
    recipe(s.party[id]);
  });
  saveMember(id, delay);
}
export function editItem(iid: string, recipe: (it: Item) => void, delay?: number) {
  set((s) => {
    const it = s.items[iid];
    if (it) recipe(it);
  });
  saveItem(iid, delay);
}

const newId = () => `it-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
export function createItem(fields: Partial<Item>): string {
  const iid = newId();
  set((s) => {
    s.items[iid] = {
      name: '',
      kind: 'weapon',
      rarity: '',
      level: null,
      bonuses: [],
      created: new Date().toISOString(),
      ...fields,
    };
  });
  saveItem(iid, 50);
  return iid;
}

/** Put an item in a slot; it leaves any slot it was in. A two-handed main hand empties the off hand. */
export function equip(iid: string, member: MemberId, slot: string) {
  const s = get();
  const it = s.items[iid];
  if (slot === 'off' && handsOf(it) === 2) return;
  const w = whoWears(s.party, iid);
  set((st) => {
    if (slot === 'main' && handsOf(it) === 2) delete st.party[member].gear.off;
    if (w) delete st.party[w.member].gear[w.slot];
    st.party[member].gear[slot] = { itemId: iid };
  });
  if (w && w.member !== member) saveMember(w.member, 100);
  saveMember(member, 100);
}
export function unequip(iid: string) {
  const w = whoWears(get().party, iid);
  if (!w) return;
  editMember(
    w.member,
    (m) => {
      delete m.gear[w.slot];
    },
    100,
  );
}
export function clearSlot(member: MemberId, slot: string) {
  editMember(
    member,
    (m) => {
      delete m.gear[slot];
    },
    100,
  );
}
/** Delete an item: unequip it, and empty the socket it sat in if it's a rune. */
export function deleteItem(iid: string) {
  unequip(iid);
  const host = socketedIn(get().items, iid);
  if (host)
    editItem(
      host.id,
      (h) => {
        if (h.st) h.st.rune = 'empty';
      },
      50,
    );
  set((s) => {
    delete s.items[iid];
  });
  saveItem(iid, 50);
}

/** Replace the party and all items with imported data (each document is written whole). */
export function importData(party: Record<string, Member>, items: Items) {
  const before = Object.keys(get().items);
  set((s) => {
    for (const m of MEMBERS) s.party[m.id] = party[m.id] as Member;
    s.items = items;
  });
  for (const m of MEMBERS) {
    sync.forget(`party/${m.id}`);
    saveMember(m.id, 50);
  }
  for (const iid of before) if (!items[iid]) saveItem(iid, 50);
  for (const iid of Object.keys(items)) {
    sync.forget(`items/${iid}`);
    saveItem(iid, 50);
  }
}

// ---------- UI ----------
export function setUi(recipe: (u: Ui) => void) {
  set((s) => {
    recipe(s.ui);
  });
}
