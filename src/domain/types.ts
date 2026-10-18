// Data shapes: the embedded Nexus data, the reference tables, and the editable party and items.

// ---------- Nexus (data/nexus.json) ----------
export interface SkillEffect {
  e: string;
  dur: string;
  chain: boolean;
  res: string;
  /** targets: S self, A allies, E enemies */
  t: string;
}
export interface Skill {
  school: string;
  name: string;
  dmg: string;
  block: string;
  scale: string;
  range: string;
  cd: string;
  ap: string;
  sp: string;
  mem: string;
  book: string;
  icon: string | null;
  effects: SkillEffect[];
  req: [string, string][];
  weapon?: string;
  craft: boolean;
}
/** Summons and weapon/racial skills: a flatter shape. */
export interface SimpleSkill {
  group: string;
  name: string;
  dmg: string;
  block: string;
  scale: string;
  effect: string;
  dur: string;
  range: string;
  cd: string;
  ap: string;
  sp: string;
  extra: string;
  icon: string | null;
}
export interface Status {
  name: string;
  icon: string | null;
  effects: string[];
  causes: Record<string, string[]>;
  resist: string[];
  immune: string[];
  treat: string[];
  resistHead: string;
  immuneHead: string;
  treatHead: string;
}
export interface NexusData {
  skills: Skill[];
  statuses: Status[];
  special: SimpleSkill[];
  summons: SimpleSkill[];
  /** icon key -> data URI */
  icons: Record<string, string>;
}
export interface GameIcons {
  size: [number, number];
  icons: Record<string, string>;
}

// ---------- reference tables (data/ref/*.json, or the claude.ai "ref" collection) ----------
export type Notes = Record<string, string>;
export interface RefRow {
  _notes?: Notes;
  [field: string]: unknown;
}
export interface RefDoc {
  source?: string;
  extracted?: string;
  rows?: RefRow[];
  data?: unknown;
  sheetNotes?: Record<string, string>;
}
export type RefTables = Record<string, RefDoc>;

export interface Recipe extends RefRow {
  result: string;
  amount?: number;
  effect?: string;
  result2?: string;
  amount2?: number;
  category?: string;
  subcat?: string;
  station?: string;
  ingredients?: { name: string; value: unknown; mode: unknown }[];
}
export interface WeaponRow extends RefRow {
  name: string;
  hands: number;
  attribute?: string;
  range?: string | number;
  notes?: string;
  d1?: number;
  d5?: number;
  d10?: number;
  d15?: number;
  d20?: number;
  d22?: number;
}
export interface ArmorRow extends RefRow {
  material: string;
  slot: string;
  attribute?: string;
  p1?: number;
  m1?: number;
  p10?: number;
  m10?: number;
  p20?: number;
  m20?: number;
}
export interface GearRoll extends RefRow {
  slot: string;
  text: string;
  kind: 'skill' | 'inflict' | 'rune' | 'set' | 'stat' | 'other';
  stat: string;
  min?: number;
  max?: number;
  pct?: boolean;
}
export interface RuneRow extends RefRow {
  rune: string;
  weapon?: unknown;
  armor?: unknown;
  amulet?: unknown;
}
export interface RunesData {
  boosts?: RuneRow[];
  mythic?: RuneRow[];
  power?: RuneRow[];
  sizes?: { size: unknown; weapon?: unknown; armor?: unknown; amulet?: unknown }[];
  sourceOrb?: { weapon?: unknown; armor?: unknown; amulet?: unknown } | null;
}

// ---------- party and items (editable, persisted) ----------
export interface Bonus {
  stat?: string;
  value?: number;
  pct?: boolean;
  skill?: string;
  status?: string;
  immune?: string;
  reflect?: { pct: number; from: string; type: string | null };
  text?: string;
}
export interface Damage {
  min?: number | null;
  max?: number | null;
  type?: string;
}
export interface ItemStats {
  dmg?: Damage;
  extra?: Damage[];
  crit?: number | null;
  critDmg?: number | null;
  phys?: number | null;
  magic?: number | null;
  block?: number | null;
  reqAttr?: string | null;
  reqVal?: number | null;
  /** null = no slot, "empty" = empty slot, otherwise the socketed rune's item id */
  rune?: string | null;
  weight?: number | null;
  value?: number | null;
}
export type Socket = 'weapon' | 'armor' | 'amulet';
export interface Item {
  name: string;
  kind: string;
  /** "w:<Name>:<1|2>" for weapons, "a:<Material>:<Slot>" for armour */
  type?: string | null;
  level?: number | null;
  rarity: string;
  bonuses: Bonus[];
  st?: ItemStats;
  base?: { damage?: number | null; phys?: number | null; magic?: number | null };
  runeFx?: Partial<Record<Socket, Bonus[]>>;
  created?: string;
  notes?: string;
  hands?: number;
}
export type Items = Record<string, Item>;
export interface GearRef {
  itemId?: string;
  /** legacy inline gear */
  name?: string;
  bonuses?: Bonus[];
}
export interface Member {
  schema: 2;
  name: string;
  level: number;
  race?: string | null;
  gender?: string | null;
  undead?: boolean;
  /** ability points spent */
  points: Record<string, number | null>;
  /** base attribute values (10 + spent) */
  attributes: Record<string, number | null>;
  talents: string[];
  known: string[];
  gear: Record<string, GearRef | null>;
  notes: string;
}
export type MemberId = 'sol' | 'fane' | 'sebille' | 'beast';
export type Party = Record<MemberId, Member>;
