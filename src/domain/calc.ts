// Gear calculator: base weapon damage / armour by level and rarity from the Info sheet.
import { memo, refRows } from './ref';
import type { ArmorRow, RefTables, WeaponRow } from './types';

export interface CalcType {
  key: string;
  label: string;
  kind: 'weapon' | 'armor';
  itemKind: string;
  row: WeaponRow | ArmorRow;
  group: 'Weapons' | 'Armour' | 'Shield' | 'Accessories';
}

const ARMOR_KIND: Record<string, string> = {
  Helmet: 'helmet',
  Chest: 'chest',
  Gloves: 'gloves',
  Leggings: 'leggings',
  Boots: 'boots',
  Belt: 'belt',
  Ring: 'ring',
  Amulet: 'amulet',
  'Off-Hand': 'shield',
};

export function calcTypes(ref: RefTables): CalcType[] {
  return memo(ref, 'calcTypes', () => {
    const t: CalcType[] = [];
    for (const w of refRows<WeaponRow>(ref, 'weapons'))
      t.push({
        key: `w:${w.name}:${w.hands}`,
        label: `${w.name} (${w.hands}H)`,
        kind: 'weapon',
        itemKind: 'weapon',
        row: w,
        group: 'Weapons',
      });
    for (const a of refRows<ArmorRow>(ref, 'armor'))
      t.push({
        key: `a:${a.material}:${a.slot}`,
        label: a.material === a.slot ? a.slot : `${a.material} ${a.slot}`,
        kind: 'armor',
        itemKind: ARMOR_KIND[a.slot] ?? '',
        row: a,
        group: ['Belt', 'Ring', 'Amulet'].includes(a.slot)
          ? 'Accessories'
          : a.slot === 'Off-Hand'
            ? 'Shield'
            : 'Armour',
      });
    return t;
  });
}

export const typeLabel = (ref: RefTables, key: string | null | undefined) =>
  key ? calcTypes(ref).find((t) => t.key === key)?.label : undefined;

/** Log-linear interpolation between sample levels (linear when a value isn't positive). */
export function interp(points: [number, unknown][], L: number): number | null {
  const pts = points.filter((p): p is [number, number] => typeof p[1] === 'number');
  const first = pts[0];
  const last = pts[pts.length - 1];
  if (!first || !last) return null;
  if (L <= first[0]) return first[1];
  for (let i = 0; i < pts.length - 1; i++) {
    const [l1, v1] = pts[i] as [number, number];
    const [l2, v2] = pts[i + 1] as [number, number];
    if (L === l1) return v1;
    if (L === l2) return v2;
    if (L > l1 && L < l2) {
      const f = (L - l1) / (l2 - l1);
      return v1 > 0 && v2 > 0 ? v1 * (v2 / v1) ** f : v1 + (v2 - v1) * f;
    }
  }
  return last[1];
}

/** The Gear Stats column listing what an item type can roll. */
export function rollColumn(t: CalcType): string {
  if (t.kind === 'armor') {
    const slot = (t.row as ArmorRow).slot;
    return slot === 'Chest' ? 'Chest Armour' : slot === 'Off-Hand' ? 'Shield' : slot;
  }
  const w = t.row as WeaponRow;
  if (w.name === 'Staff') return '2H Staff';
  if (['Bow', 'Crossbow'].includes(w.name)) return 'Ranged Weapon';
  if (['Dagger', 'Wand'].includes(w.name)) return 'Dagger/Wand';
  return w.hands === 2 ? '2H Melee Str/Fin' : '1H Weapon (Str)';
}

export const weaponName = (w: WeaponRow) =>
  w.hands === 2 && ['Sword', 'Axe', 'Mace'].includes(w.name) ? `2H ${w.name}` : w.name;

function rarityRow(ref: RefTables, t: CalcType) {
  const name =
    t.kind === 'weapon' ? weaponName(t.row as WeaponRow) : (t.row as ArmorRow).slot.replace('Off-Hand', 'Shield');
  return refRows(ref, 'rarity').find((r) => r.type === name);
}

export interface CalcBase {
  mult: number | null;
  damage?: number | null;
  phys?: number | null;
  magic?: number | null;
}
export function calcBase(ref: RefTables, t: CalcType, L: number, rarity: string): CalcBase {
  const rr = rarityRow(ref, t);
  const mult = rarity === 'Common' ? 1 : ((rr?.[`x${rarity}`] as number | undefined) ?? null);
  const m = mult || 1;
  if (t.kind === 'weapon') {
    const w = t.row as WeaponRow;
    const v = interp(
      [
        [1, w.d1],
        [5, w.d5],
        [10, w.d10],
        [15, w.d15],
        [20, w.d20],
        [22, w.d22],
      ],
      L,
    );
    return { mult, damage: v != null ? Math.round(v * m * 10) / 10 : null };
  }
  const a = t.row as ArmorRow;
  const ph = interp(
    [
      [1, a.p1],
      [10, a.p10],
      [20, a.p20],
    ],
    L,
  );
  const mg = interp(
    [
      [1, a.m1],
      [10, a.m10],
      [20, a.m20],
    ],
    L,
  );
  return { mult, phys: ph != null ? Math.round(ph * m) : null, magic: mg != null ? Math.round(mg * m) : null };
}
