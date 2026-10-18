// Game constants and lookup tables.
import type { MemberId } from './types';

/** Schools in in-game order, with their CSS colour token. */
export const SCH: Record<string, string> = {
  Aerotheurge: 'aero',
  Geomancer: 'geo',
  Huntsman: 'hunt',
  Hydrosophist: 'hydro',
  Necromancer: 'necro',
  Polymorph: 'poly',
  Pyrokinetic: 'pyro',
  Scoundrel: 'scou',
  Summoning: 'summ',
  Warfare: 'war',
};
export const SCHOOLS = Object.keys(SCH);
export const WEAPON_AB = ['Dual Wielding', 'Ranged', 'Single-Handed', 'Two-Handed'];
export const DEF_AB = ['Leadership', 'Perseverance', 'Retribution'];
export const CIVIL_AB = ['Bartering', 'Loremaster', 'Lucky Charm', 'Persuasion', 'Sneaking', 'Telekinesis', 'Thievery'];
export const ALL_AB = [...SCHOOLS, ...WEAPON_AB, ...DEF_AB, ...CIVIL_AB];
export const ATTRS = ['Strength', 'Finesse', 'Intelligence', 'Constitution', 'Memory', 'Wits'];
export const AB_ALL = [...ALL_AB, ...ATTRS];
export const AB_LC: Record<string, string> = Object.fromEntries(AB_ALL.map((a) => [a.toLowerCase(), a]));
export const ALIASES: Record<string, string> = {
  aero: 'Aerotheurge',
  geo: 'Geomancer',
  hydro: 'Hydrosophist',
  pyro: 'Pyrokinetic',
  necro: 'Necromancer',
  poly: 'Polymorph',
  hunt: 'Huntsman',
  scoundrel: 'Scoundrel',
  summon: 'Summoning',
  war: 'Warfare',
  str: 'Strength',
  fin: 'Finesse',
  int: 'Intelligence',
  con: 'Constitution',
  mem: 'Memory',
  wit: 'Wits',
  wits: 'Wits',
  dw: 'Dual Wielding',
  '1h': 'Single-Handed',
  '2h': 'Two-Handed',
  'critical chance': 'Crit Chance',
  crit: 'Crit Chance',
  'critical damage': 'Crit Damage',
  'crit dmg': 'Crit Damage',
  'critical multiplier': 'Crit Damage',
  'crit multiplier': 'Crit Damage',
  vitality: 'HP',
  lifesteal: 'Life Steal',
};
export const RESISTS = [
  'Fire Resistance',
  'Water Resistance',
  'Air Resistance',
  'Earth Resistance',
  'Poison Resistance',
  'Physical Resistance',
  'Piercing Resistance',
];
export const STAT_NAMES = [
  ...RESISTS,
  'Vitality',
  'Movement',
  'Initiative',
  'Crit Chance',
  'Crit Damage',
  'Accuracy',
  'Dodging',
  'Life Steal',
  'Damage',
  'Blocking',
  'Reflect Melee',
  'Cleave',
  'Physical Armour',
  'Magic Armour',
  'Max AP',
  'Starting AP',
  'AP Recovery',
  'Source Points',
];
export const RARITIES = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Divine', 'Unique'];
export const KINDS: Record<string, string> = {
  helmet: 'Helmet',
  amulet: 'Amulet',
  chest: 'Chest',
  gloves: 'Gloves',
  belt: 'Belt',
  leggings: 'Leggings',
  boots: 'Boots',
  ring: 'Ring',
  weapon: 'Weapon',
  shield: 'Shield',
  rune: 'Rune',
};
export const SOCKETS = [
  ['weapon', '⚔️', 'In a weapon'],
  ['armor', '🛡', 'In armour'],
  ['amulet', '📿', 'In an amulet'],
] as const;

export interface SlotDef {
  id: string;
  label: string;
  /** item kinds that fit */
  kinds: string[];
  /** Gear Stats columns used for roll suggestions */
  cols: string[];
}
const WEAPON_COLS = ['1H Weapon (Str)', 'Dagger/Wand', '2H Melee Str/Fin', '2H Staff', 'Ranged Weapon'];
export const SLOTS: SlotDef[] = [
  { id: 'helmet', label: 'Helmet', kinds: ['helmet'], cols: ['Helmet'] },
  { id: 'amulet', label: 'Amulet', kinds: ['amulet'], cols: ['Amulet'] },
  { id: 'chest', label: 'Chest', kinds: ['chest'], cols: ['Chest Armour'] },
  { id: 'gloves', label: 'Gloves', kinds: ['gloves'], cols: ['Gloves'] },
  { id: 'belt', label: 'Belt', kinds: ['belt'], cols: ['Belt'] },
  { id: 'leggings', label: 'Leggings', kinds: ['leggings'], cols: ['Leggings'] },
  { id: 'boots', label: 'Boots', kinds: ['boots'], cols: ['Boots'] },
  { id: 'ring1', label: 'Ring', kinds: ['ring'], cols: ['Ring'] },
  { id: 'ring2', label: 'Ring', kinds: ['ring'], cols: ['Ring'] },
  { id: 'main', label: 'Main hand', kinds: ['weapon'], cols: WEAPON_COLS },
  { id: 'off', label: 'Off hand', kinds: ['shield', 'weapon'], cols: ['Shield', '1H Weapon (Str)', 'Dagger/Wand'] },
];
export const slotDef = (id: string): SlotDef | undefined => SLOTS.find((s) => s.id === id);
export const KIND_COLS: Record<string, string[]> = {
  helmet: ['Helmet'],
  amulet: ['Amulet'],
  chest: ['Chest Armour'],
  gloves: ['Gloves'],
  belt: ['Belt'],
  leggings: ['Leggings'],
  boots: ['Boots'],
  ring: ['Ring'],
  weapon: WEAPON_COLS,
  shield: ['Shield'],
};

export interface MemberDef {
  id: MemberId;
  name: string;
  /** short label on the skill markers */
  ab: string;
}
export const MEMBERS: MemberDef[] = [
  { id: 'sol', name: 'Sol', ab: 'Sol' },
  { id: 'fane', name: 'Fane', ab: 'Fa' },
  { id: 'sebille', name: 'Sebille', ab: 'Se' },
  { id: 'beast', name: 'Beast', ab: 'Be' },
];

export const EMO = {
  ap: ['⚡', 'Action points'],
  sp: ['💠', 'Source points'],
  cd: ['⏳', 'Cooldown (turns)'],
  mem: ['🧠', 'Memory slots'],
  range: ['🎯', 'Range (m)'],
  book: ['📖', 'Skill book level'],
  dur: ['⏱', 'Duration'],
  dmg: ['⚔️', 'Damage'],
  lvl: ['📈', 'Level'],
} as const;

export const DMG_TYPES = ['Physical', 'Piercing', 'Fire', 'Water', 'Air', 'Earth', 'Poison'];
export const DMG_COL: Record<string, string> = {
  Physical: 'var(--war)',
  Piercing: 'var(--necro)',
  Fire: 'var(--pyro)',
  Water: 'var(--hydro)',
  Air: 'var(--aero)',
  Earth: 'var(--geo)',
  Poison: 'var(--hunt)',
};
export const DMG_EMO: Record<string, string> = {
  Physical: '⚔️',
  Piercing: '🗡️',
  Fire: '🔥',
  Water: '💧',
  Air: '🌀',
  Earth: '🪨',
  Poison: '☠️',
};

export const RACES = ['Human', 'Elf', 'Dwarf', 'Lizard'];
export const GENDERS = ['Male', 'Female'];
/** Base Vitality by level (index = level). */
export const BASE_VIT = [
  0, 30, 45, 65, 85, 110, 135, 165, 200, 235, 285, 345, 415, 560, 685, 840, 1015, 1255, 1790, 2240, 2815, 3545, 4480,
  5670, 7190, 9130,
];

export const REF_SECTIONS: [string, string][] = [
  ['talents', 'Talents'],
  ['abilities', 'Abilities'],
  ['attributes', 'Attributes'],
  ['stats', 'Other stats'],
  ['raceTraits', 'Race traits'],
  ['classes', 'Classes'],
  ['surfaces', 'Surfaces & clouds'],
  ['runes', 'Runes'],
  ['combos', 'Combo matrix'],
  ['infoStatuses', 'Statuses (Info)'],
  ['ingredients', 'Ingredients'],
  ['values', 'Crafted item values'],
  ['talentPoints', 'Talent points'],
  ['bugs', 'Known bugs'],
  ['tabs', 'About the sheet'],
];

/** CSS colour of a school or ability, or the line colour. */
export const schoolColor = (s: string | undefined) => `var(--${(s && SCH[s]) || 'line'})`;
/** CSS colour of a rarity, or '' when none. */
export const rarityColor = (r: string | undefined | null) => (r ? `var(--r-${String(r).toLowerCase()})` : '');
