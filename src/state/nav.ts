// Navigation: browser history entries, jumping to a named skill/status/ability, and per-viewer UI memory.
//
// Each navigation (tab, character, reference section, ingredient filter, chip jump) is a history entry, so
// Back/Forward, mouse side buttons and Alt+←/→ work. Typing a search or toggling filters updates the current entry
// instead. Entries carry only state (no URL change), which also works inside claude.ai's sandboxed iframe.
import { baseStatus, codex } from '../domain/codex';
import { ATTRS } from '../domain/constants';
import { slug } from '../domain/format';
import { lsGet, lsSet } from '../storage/slots';
import { get, initialUi, set, type Tab, type Ui, useApp } from './store';

type NavState = Pick<Ui, 'tab' | 'partyView' | 'who' | 'refSec' | 'ing' | 'q' | 'schools' | 'craft' | 'use' | 'known'>;
const snap = (u: Ui): NavState => ({
  tab: u.tab,
  partyView: u.partyView,
  who: u.who,
  refSec: u.refSec,
  ing: u.ing,
  q: u.q,
  schools: [...u.schools],
  craft: u.craft,
  use: u.use,
  known: u.known,
});
interface Entry {
  codex: { nav: NavState; y: number };
}
const entry = (y = window.scrollY): Entry => ({ codex: { nav: snap(get().ui), y } });
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

function pushNav() {
  const cur = (history.state as Entry | null)?.codex;
  if (cur && same(cur.nav, snap(get().ui))) return;
  try {
    history.pushState(entry(0), '');
  } catch {}
}
export function replaceNav() {
  try {
    history.replaceState(entry(), '');
  } catch {}
}

/** Change what's shown. "push" makes a history entry, "replace" updates the current one. */
export function navigate(recipe: (u: Ui) => void, mode: 'push' | 'replace' = 'push') {
  set((s) => {
    recipe(s.ui);
    s.ui.pickSlot = null;
    s.ui.popSlot = null;
  });
  if (mode === 'push') pushNav();
  else replaceNav();
}

export function goTab(tab: Tab) {
  navigate((u) => {
    if (tab === 'party' && u.tab === 'party') u.partyView = 'overview';
    u.tab = tab;
    u.sideOpen = false;
  });
  window.scrollTo({ top: 0 });
}

/** Jump to a skill, status or ability entry by name. */
export function navTo(kind: 'skill' | 'status' | 'ab', name: string) {
  const { data, skillObj, statusObj } = codex();
  let target: string | null = null;
  if (kind === 'skill') {
    const sk = skillObj[name.toLowerCase()];
    if (!sk) return;
    const tab: Tab = data.skills.includes(sk as never)
      ? 'skills'
      : data.summons.includes(sk as never)
        ? 'summons'
        : 'special';
    navigate((u) => {
      u.tab = tab;
      u.schools = [];
      u.craft = u.use = u.known = false;
      u.q = sk.name;
    });
    target = slug('sk', sk.name);
  } else if (kind === 'status') {
    const st = statusObj[baseStatus(name).toLowerCase()];
    if (!st) return;
    navigate((u) => {
      u.tab = 'status';
      u.q = baseStatus(st.name);
    });
    target = slug('st', st.name);
  } else {
    navigate((u) => {
      u.tab = 'reference';
      u.refSec = ATTRS.includes(name) ? 'attributes' : 'abilities';
      u.q = name;
    });
  }
  setTimeout(() => {
    const el = target && document.getElementById(target);
    if (el) el.scrollIntoView({ block: 'center' });
    else window.scrollTo({ top: 0 });
  }, 0);
}

// ---------- per-viewer UI memory (localStorage) ----------
function remembered(): Partial<Ui> {
  try {
    const s = JSON.parse(lsGet('codex.ui') || '{}') as Partial<Ui> & { calc?: Partial<Ui['calc']> };
    const d = initialUi();
    return {
      tab: s.tab || d.tab,
      who: s.who || d.who,
      refSec: s.refSec || d.refSec,
      partyView: s.partyView || d.partyView,
      sects: s.sects || {},
      calc: { ...d.calc, ...(s.calc ?? {}), bonuses: [], name: '', equip: '' },
      sideCollapsed: lsGet('codex.side') === '1',
    };
  } catch {
    return {};
  }
}
const memo = (u: Ui) =>
  JSON.stringify({
    tab: u.tab,
    who: u.who,
    refSec: u.refSec,
    calc: { type: u.calc.type, level: u.calc.level, rarity: u.calc.rarity },
    partyView: u.partyView,
    sects: u.sects,
  });

/** Restore the remembered UI, keep it remembered, and wire up Back/Forward. */
export function startNav() {
  set((s) => {
    Object.assign(s.ui, remembered());
  });
  let last = memo(get().ui);
  let side = get().ui.sideCollapsed;
  useApp.subscribe(({ ui }, prev) => {
    if (ui === prev.ui) return;
    const m = memo(ui);
    if (m !== last) {
      last = m;
      lsSet('codex.ui', m);
    }
    if (ui.sideCollapsed !== side) {
      side = ui.sideCollapsed;
      lsSet('codex.side', side ? '1' : '0');
    }
  });

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.addEventListener('popstate', (e) => {
    const c = (e.state as Entry | null)?.codex;
    if (!c) return;
    set((s) => {
      Object.assign(s.ui, c.nav, { pickSlot: null, popSlot: null });
    });
    setTimeout(() => window.scrollTo(0, c.y || 0), 0);
  });
  // keep the current entry's scroll position up to date
  let t: ReturnType<typeof setTimeout> | undefined;
  window.addEventListener(
    'scroll',
    () => {
      clearTimeout(t);
      t = setTimeout(replaceNav, 250);
    },
    { passive: true },
  );
  replaceNav();
}
