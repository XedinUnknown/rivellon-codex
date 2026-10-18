// Slots: separate saves outside claude.ai. Each gets what an origin would scope: its own IndexedDB database and
// BroadcastChannel, storage choice and remembered file. "Default" uses the original, unsuffixed names.
export const DEFAULT_SLOT = 'Default';

export const lsGet = (k: string): string | null => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
export const lsSet = (k: string, v: string | null) => {
  try {
    if (v == null) localStorage.removeItem(k);
    else localStorage.setItem(k, v);
  } catch {
    // storage unavailable (private window, blocked site data): nothing to remember
  }
};

export function slotList(): string[] {
  let a: unknown = [];
  try {
    a = JSON.parse(lsGet('codex.slots') || '[]');
  } catch {}
  return [
    DEFAULT_SLOT,
    ...(Array.isArray(a) ? a.filter((x): x is string => typeof x === 'string' && x !== DEFAULT_SLOT) : []),
  ];
}
export const saveSlotList = (names: string[]) =>
  lsSet('codex.slots', JSON.stringify(names.filter((x) => x !== DEFAULT_SLOT)));

const suffix = (s: string) => (s === DEFAULT_SLOT ? '' : `:${s}`);
/** IndexedDB database and BroadcastChannel name. */
export const slotDb = (s: string) => `rivellon-codex${suffix(s)}`;
/** localStorage key holding the slot's storage choice: "browser" | "file". */
export const slotPref = (s: string) => `codex.storage${suffix(s)}`;

export function currentSlot(): string {
  const s = lsGet('codex.slot');
  return s && slotList().includes(s) ? s : DEFAULT_SLOT;
}
