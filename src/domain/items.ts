// Item rules: hands, icons, runes and who wears what.
import { hasGameIcon } from './codex';
import { MEMBERS } from './constants';
import type { Bonus, GearRef, Item, Items, MemberId, Party, RefTables, RuneRow, RunesData, Socket } from './types';

/** 1 or 2 for weapons with a type, else null: the weapon type decides. */
export function handsOf(it: Item | null | undefined): 1 | 2 | null {
  if (it?.kind !== 'weapon' || !it.type || !/:(1|2)$/.test(it.type)) return null;
  return it.type.endsWith('2') ? 2 : 1;
}

export function itemIconKey(it: Item | null | undefined): string {
  if (!it) return 'empty';
  if (it.kind === 'weapon') {
    const m = String(it.type || '').match(/^w:([^:]+):(\d)/);
    if (!m) return 'sword';
    const n = (m[1] as string).toLowerCase();
    if (['sword', 'axe', 'mace'].includes(n)) return m[2] === '2' ? `${n}2` : n;
    return hasGameIcon(n) ? n : 'sword';
  }
  return hasGameIcon(it.kind) ? it.kind : 'empty';
}

// Icon for any named thing (recipes, ingredients): keyword rules first, then the sheet category.
const NAME_ICON_RULES: [RegExp, string][] = [
  [/skill ?book|grimoire|tome/, 'x-book'],
  [/scroll/, 'x-scroll'],
  [/rune frame|rune/, 'rune'],
  [/pixie dust|dust/, 'x-sparkle'],
  [/arrowhead/, 'x-arrowhead'],
  [/arrow/, 'x-arrow'],
  [/grenade|bomb|flask of|nail flask|smoke/, 'x-bomb'],
  [/poison|venom|toxic/, 'x-poison'],
  [/heal|restor|regenerat/, 'x-heal'],
  [/herbmix|herb|leaf|flower|root|thorn|drudanae|whisperwood|bloodwood|blossom|petal|fern/, 'x-herbs'],
  [/potion|elixir|draught|tonic|concoction|brew/, 'x-potion'],
  [/stew|soup|dinner|pie|meal|porridge|salad|sandwich/, 'x-meal'],
  [/bread|loaf|flour|dough|bun/, 'x-bread'],
  [/apple|pear|fruit|berr/, 'x-apple'],
  [/grape/, 'x-grapes'],
  [/mushroom|shroom/, 'x-mushroom'],
  [/fish|eel|crab|clam|squid/, 'x-fish'],
  [/meat|ham|steak|sausage|chicken|leg of|ribs|bacon/, 'x-meat'],
  [/cheese/, 'x-cheese'],
  [/egg/, 'x-egg'],
  [/tomato/, 'x-tomato'],
  [/potato/, 'x-potato'],
  [/carrot/, 'x-carrot'],
  [/pumpkin/, 'x-pumpkin'],
  [/honey/, 'x-honey'],
  [/salt|pepper|spice|sugar/, 'x-salt'],
  [/wine|beer|ale|mead|rum|liquor|tea|coffee|milk|juice|drink/, 'x-drink'],
  [/water|puddle/, 'x-water'],
  [/oil|tar|grease/, 'x-oil'],
  [/blood/, 'x-blood'],
  [/essence|crystal|gem|pearl|amethyst|diamond|emerald|ruby|sapphire|tourmaline/, 'x-essence'],
  [/source orb|orb|globe/, 'x-orb'],
  [/soul|ghost|spirit/, 'x-ghost'],
  [/face|mask/, 'x-mask'],
  [/skull|head/, 'x-skull'],
  [/bone/, 'x-bone'],
  [/feather/, 'x-feather'],
  [/claw/, 'x-claw'],
  [/tooth|fang/, 'x-tooth'],
  [/horn|shell/, 'x-horn'],
  [/heart/, 'x-heart'],
  [/eye/, 'x-eye'],
  [/tentacle/, 'x-tentacle'],
  [/slime|goo|ooze/, 'x-slime'],
  [/web|silk|spider/, 'x-web'],
  [/two-?hand|2h|greatsword|zweihander/, 'sword2'],
  [/sword|blade|sabre|saber/, 'sword'],
  [/axe/, 'axe'],
  [/mace|club|hammer of/, 'mace'],
  [/dagger|shiv|knife/, 'dagger'],
  [/wand/, 'wand'],
  [/spear|harpoon|pike|stick$/, 'spear'],
  [/staff/, 'staff'],
  [/crossbow/, 'crossbow'],
  [/bow/, 'bow'],
  [/shield|targe/, 'shield'],
  [/helm|hat|cap|hood|crown/, 'helmet'],
  [/armou?r|shirt|robe|breastplate|chest/, 'chest'],
  [/glove|gauntlet/, 'gloves'],
  [/boot|shoe|sandal/, 'boots'],
  [/belt|girdle/, 'belt'],
  [/trouser|pants|leggings/, 'leggings'],
  [/ring/, 'ring'],
  [/amulet|necklace|pendant/, 'amulet'],
  [/ingot|\bbar\b|metal|iron|steel|plate|scale|nail|chain|wire/, 'x-metal'],
  [/ore|nugget|clay/, 'x-ore'],
  [/leather|hide|pelt|fur|skin/, 'x-hide'],
  [/needle|thread|string/, 'x-needle'],
  [/cloth|fabric|linen|wool|rag/, 'x-cloth'],
  [/wood|branch|stick|plank|log|twig|staff of|pole/, 'x-wood'],
  [/stone|rock|pebble|boulder|sand/, 'x-stone'],
  [/ink|quill|pen/, 'x-quill'],
  [/paper|parchment|book page|letter|note/, 'x-paper'],
  [/map/, 'x-map'],
  [/key/, 'x-key'],
  [/lockpick/, 'x-lockpick'],
  [/hammer|tongs|tool|kit|pan|pot|mortar|pestle|saw|chisel|shovel|knife/, 'x-tool'],
  [/jar|bottle|vial|beaker|glass/, 'x-jar'],
  [/coin|gold/, 'x-coin'],
  [/fire|flame|ember|cinder/, 'x-fire'],
  [/ice|frost|snow/, 'x-ice'],
  [/lightning|thunder|spark/, 'x-lightning'],
];
const CAT_ICON: Record<string, string> = {
  grimoire: 'x-book',
  book: 'x-book',
  skillbook: 'x-book',
  scroll: 'x-scroll',
  potions: 'x-potion',
  arrows: 'x-arrow',
  food: 'x-meal',
  drink: 'x-drink',
  weapons: 'sword',
  weapon: 'sword',
  grenades: 'x-bomb',
  objects: 'x-bag',
  quest: 'x-paper',
  runes: 'rune',
  armour: 'chest',
  boost: 'x-boost',
  mats: 'x-ore',
  essence: 'x-essence',
  junk: 'x-bag',
  tool: 'x-tool',
  equipment: 'chest',
};
export function nameIcon(name: unknown, ...cats: unknown[]): string {
  const n = String(name || '').toLowerCase();
  for (const [rx, k] of NAME_ICON_RULES) if (rx.test(n) && hasGameIcon(k)) return k;
  for (const c of cats) {
    const k = CAT_ICON[String(c || '').toLowerCase()];
    if (k && hasGameIcon(k)) return k;
  }
  return 'x-bag';
}

export const isWeapon = (it: Item) => it.kind === 'weapon';
export const hasArmour = (it: Item) =>
  !['weapon', 'rune'].includes(it.kind) || !!(it.st && (it.st.phys || it.st.magic));

// ---------- runes ----------
export const runeSocket = (it: Item): Socket =>
  it.kind === 'weapon' ? 'weapon' : it.kind === 'amulet' ? 'amulet' : 'armor';
export function runeOf(items: Items, host: Item | null | undefined): (Item & { id: string }) | null {
  const r = host?.st?.rune;
  const rune = r && r !== 'empty' ? items[r] : undefined;
  return r && rune ? { ...rune, id: r } : null;
}
export function runeBonuses(items: Items, host: Item | null | undefined): Bonus[] {
  const r = runeOf(items, host);
  return r && host ? (r.runeFx?.[runeSocket(host)] ?? []) : [];
}
export function socketedIn(items: Items, runeId: string): (Item & { id: string }) | null {
  for (const [iid, x] of Object.entries(items)) if (x.st?.rune === runeId) return { ...x, id: iid };
  return null;
}
export function runeLabel(items: Items, v: string | null | undefined): string {
  if (!v) return 'No slot';
  if (v === 'empty') return 'Empty slot';
  const r = items[v];
  return r ? r.name || '(unnamed rune)' : '(missing rune)';
}
/** The Info sheet's row for a rune, matched by name. */
export function sheetRune(ref: RefTables, name: string | undefined): RuneRow | null {
  if (!name) return null;
  const R = (ref.runes?.data ?? {}) as RunesData;
  const w = String(name)
    .replace(/\s*rune$/i, '')
    .split(' ');
  return (R.boosts ?? []).find((r) => w.includes(r.rune)) ?? null;
}

// ---------- wearing ----------
export type WornItem = Item & { id?: string };
/** The item in a member's slot (linked or legacy inline), or null. */
export function slotItem(party: Party, items: Items, member: MemberId, slot: string): WornItem | null {
  const g: GearRef | null | undefined = party[member]?.gear?.[slot];
  if (!g) return null;
  if (g.itemId) {
    const it = items[g.itemId];
    return it ? { ...it, id: g.itemId } : null;
  }
  return g.bonuses || g.name ? ({ ...g, kind: '', rarity: '', bonuses: g.bonuses ?? [] } as WornItem) : null;
}
export function whoWears(party: Party, itemId: string): { member: MemberId; slot: string } | null {
  for (const m of MEMBERS)
    for (const [slot, g] of Object.entries(party[m.id]?.gear ?? {}))
      if (g?.itemId === itemId) return { member: m.id, slot };
  return null;
}

/** Bag weight/value summaries for the Items tab. */
export function itemTotals(party: Party, items: Items) {
  let bagGold = 0;
  let wornGold = 0;
  let bagKg = 0;
  for (const [id, it] of Object.entries(items)) {
    const worn = !!whoWears(party, id);
    const gold = Number(it.st?.value) || 0;
    if (worn) wornGold += gold;
    else {
      bagGold += gold;
      bagKg += Number(it.st?.weight) || 0;
    }
  }
  return { bagGold, wornGold, bagKg };
}
