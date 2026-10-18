// Party rules: document normalisation, totals from gear, point budgets, Vitality and AP estimates.
import { upgradeBonus } from './bonus';
import type { MemberDef } from './constants';
import { AB_ALL, ALL_AB, ATTRS, BASE_VIT, CIVIL_AB, DEF_AB, MEMBERS, SCHOOLS, SLOTS, WEAPON_AB } from './constants';
import { clone } from './format';
import { handsOf, runeBonuses, slotItem } from './items';
import { refRows } from './ref';
import type { Bonus, Items, Member, MemberId, Party, RefTables, SimpleSkill, Skill } from './types';

export const blank = (m: MemberDef): Member => ({
  name: m.name,
  level: 0,
  points: {},
  attributes: {},
  gear: {},
  talents: [],
  known: [],
  notes: '',
  schema: 2,
});
export const blankParty = (): Party => Object.fromEntries(MEMBERS.map((m) => [m.id, blank(m)])) as Party;

/** Any stored party document (schema 1 or 2, partial) as a complete schema-2 member. */
export function normalize(body: unknown, m: MemberDef): Member {
  const b = clone((body ?? {}) as Record<string, unknown>);
  const p = { ...blank(m), ...b } as Member & { abilities?: Record<string, number> };
  if (!b.schema && b.abilities && !b.points) p.points = b.abilities as Record<string, number>; // v1 stored totals
  delete p.abilities;
  p.points ??= {};
  p.attributes ??= {};
  p.gear ??= {};
  p.talents ??= [];
  p.known ??= [];
  p.schema = 2;
  return p;
}

export interface Totals {
  /** ability totals (points + gear) */
  ab: Record<string, number>;
  /** attribute totals (base + gear), null when the base is unknown */
  at: Record<string, number | null>;
  /** gear bonuses to abilities/attributes */
  gear: Record<string, number>;
  /** other stats from gear, keyed "Stat" or "Stat %" */
  other: Record<string, number>;
  skills: { skill: string; item: string }[];
  statuses: { status: string; item: string }[];
  immune: { status: string; item: string }[];
  reflect: (NonNullable<Bonus['reflect']> & { item: string })[];
}

export function totals(party: Party, items: Items, id: MemberId): Totals {
  const gear: Record<string, number> = {};
  const other: Record<string, number> = {};
  const t: Totals = { ab: {}, at: {}, gear, other, skills: [], statuses: [], immune: [], reflect: [] };
  const twoH = handsOf(slotItem(party, items, id, 'main')) === 2;
  for (const { id: slot } of SLOTS) {
    if (slot === 'off' && twoH) continue;
    const it = slotItem(party, items, id, slot);
    if (!it) continue;
    const src = it.name || slot;
    for (const raw of [...(it.bonuses ?? []), ...runeBonuses(items, it)]) {
      const b = upgradeBonus(raw);
      if (b.reflect) t.reflect.push({ ...b.reflect, item: src });
      else if (b.status) t.statuses.push({ status: b.status, item: src });
      else if (b.immune) t.immune.push({ status: b.immune, item: src });
      else if (b.skill) t.skills.push({ skill: b.skill, item: src });
      else if (b.stat) {
        const k = b.stat + (b.pct ? ' %' : '');
        const bag = AB_ALL.includes(b.stat) ? gear : other;
        bag[k] = (bag[k] ?? 0) + (b.value ?? 0);
      }
    }
  }
  const p = party[id];
  for (const a of ALL_AB) t.ab[a] = (Number(p.points?.[a]) || 0) + (gear[a] ?? 0);
  for (const a of ATTRS) {
    const base = p.attributes?.[a];
    t.at[a] = base != null && (base as unknown) !== '' ? Number(base) + (gear[a] ?? 0) : null;
  }
  return t;
}
export const allTotals = (party: Party, items: Items) =>
  Object.fromEntries(MEMBERS.map((m) => [m.id, totals(party, items, m.id)])) as Record<MemberId, Totals>;

/** Every requirement of a skill met by the member's totals (weapon requirements aren't checked). */
export const meets = (tot: Totals, sk: Skill) => sk.req.every(([s, l]) => (tot.ab[s] ?? 0) >= (Number(l) || 0));
export const isKnown = (m: Member, sk: Skill | SimpleSkill) => (m.known ?? []).includes(sk.name);
export const gearSkill = (tot: Totals, sk: Skill | SimpleSkill) =>
  tot.skills.find((x) => x.skill.toLowerCase() === sk.name.toLowerCase());

// Point budgets (DOS2): creation 3 attribute / 2 combat / 1 civil / 1 talent;
// each level +2 attribute, +1 combat; civil at levels 2, 6, 10…; talents at 3, 8, 13…
export const BUDGET_RULES =
  "At creation: 3 attribute, 2 combat, 1 civil point, 1 talent. Each level: +2 attribute, +1 combat. Civil points at levels 2, 6, 10…; talents at 3, 8, 13…. Polymorph +1 attribute per point; All Skilled Up +1 combat +1 civil; Bigger & Better +2 attribute. Racial talents don't count.";

export interface BudgetRow {
  label: 'Attribute points' | 'Combat ability points' | 'Civil ability points' | 'Talents (not racial)';
  /** null when nothing has been entered */
  spent: number | null;
  avail: number;
  warn: string;
}
export function budget(m: Member, ref: RefTables): BudgetRow[] {
  const L = Math.max(1, Number(m.level) || 1);
  const has = (t: string) => m.talents.includes(t);
  const raceNames = new Set(refRows(ref, 'raceTraits').map((r) => r.trait));
  const poly = Number(m.points?.Polymorph) || 0;
  const levels = Array.from({ length: L + 1 }, (_, i) => i);
  const attrAvail = 3 + 2 * (L - 1) + poly + (has('Bigger & Better') ? 2 : 0);
  const combatAvail = 2 + (L - 1) + (has('All Skilled Up') ? 1 : 0);
  const civilAvail = 1 + levels.filter((l) => l >= 2 && (l - 2) % 4 === 0).length + (has('All Skilled Up') ? 1 : 0);
  const talentAvail = 1 + levels.filter((l) => l >= 3 && (l - 3) % 5 === 0).length;
  const entered = (a: string) => m.attributes[a] != null && (m.attributes[a] as unknown) !== '';
  const attrEntered = ATTRS.some(entered);
  const attrSpent = ATTRS.reduce((s, a) => s + ((Number(m.attributes[a]) || 10) - 10), 0);
  const low = ATTRS.filter((a) => entered(a) && Number(m.attributes[a]) < 10);
  const sum = (abs: string[]) => abs.reduce((s, a) => s + (Number(m.points?.[a]) || 0), 0);
  return [
    {
      label: 'Attribute points',
      spent: attrEntered ? attrSpent : null,
      avail: attrAvail,
      warn: low.length ? `${low.join(', ')} below the base of 10` : '',
    },
    { label: 'Combat ability points', spent: sum([...SCHOOLS, ...WEAPON_AB, ...DEF_AB]), avail: combatAvail, warn: '' },
    { label: 'Civil ability points', spent: sum(CIVIL_AB), avail: civilAvail, warn: '' },
    {
      label: 'Talents (not racial)',
      spent: m.talents.filter((t) => !raceNames.has(t)).length,
      avail: talentAvail,
      warn: '',
    },
  ];
}

export function portraitKey(m: Member): string {
  if (m.undead) return 'p-undead';
  const r = (m.race || '').toLowerCase();
  if (r === 'lizard') return 'p-lizard';
  if (['human', 'elf', 'dwarf'].includes(r)) return `p-${r}-${m.gender === 'Female' ? 'f' : 'm'}`;
  return 'p-unknown';
}

export interface Derived {
  vit: number;
  conKnown: boolean;
  racePct: number;
  pct: number;
  flat: number;
  maxAP: number;
  rec: number;
  start: number;
  L: number;
}
/** Vitality (estimate) and AP from level, Constitution, race and gear. */
export function derived(m: Member, tot: Totals, ref: RefTables): Derived {
  const L = Math.min(25, Math.max(1, Number(m.level) || 1));
  const o = tot.other;
  const con = tot.at.Constitution;
  let racePct = 0;
  if (m.race)
    for (const r of refRows(ref, 'raceTraits').filter((r) => r.race === m.race)) {
      const mm = String(r.description || '').match(/\+(\d+)% Vitality/i);
      if (mm) racePct += Number(mm[1]);
    }
  const pct = (o['Vitality %'] ?? 0) + (o['HP %'] ?? 0) + racePct;
  const flat = (o.HP ?? 0) + (o.Vitality ?? 0);
  const vit = Math.round((BASE_VIT[L] ?? 0) * (1 + 0.07 * ((con ?? 10) - 10) + pct / 100) + flat);
  const maxAP = 6 + (o['Max AP'] ?? 0);
  const rec = 4 + (o['AP Recovery'] ?? 0);
  const start = m.talents.includes('Glass Cannon') ? maxAP : 4 + (o['Starting AP'] ?? 0);
  return { vit, conKnown: con != null, racePct, pct, flat, maxAP, rec, start, L };
}
