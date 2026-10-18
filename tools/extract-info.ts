// Community "Divinity: Original Sin 2 - Info (Shared)" workbook -> data/generated/ref/<table>.json (one document per
// table). Extracted from the user's copy of the workbook and never committed; `make` runs this whenever the workbook
// is newer, and the build only uses the result when <out-dir>/.stamp exists (written last).
//
//   npm run data:info [-- <xlsx> <out-dir>]
//
// Defaults: data/source/DOS2_Info_Shared.xlsx -> data/generated/ref/. Each document is
// { source, extracted, rows: [...] } (or { ..., data: {...} } for non-list tables like runes), exactly what the
// claude.ai database collection "ref" holds; each must stay under the 256 KiB document limit.
// Cell hover-notes are kept under row._notes[field].
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pyStr } from './lib/py.ts';
import { colIndex, colLetters, openWorkbook, type Scalar, type Sheet } from './lib/sheet.ts';

const [src = 'data/source/DOS2_Info_Shared.xlsx', outDir = 'data/generated/ref'] = process.argv.slice(2);
const SOURCE = 'Divinity: Original Sin 2 - Info (Shared) (Google Sheet 1CyOtdPIicJMgAK8RtAaFMNpBqoZDDzFp-IKY0JAWr38)';
const sheet = await openWorkbook(src, true);

type Value = string | number | boolean;
type Row = Record<string, unknown>;

/** Python's round(x, 4): correctly rounded, ties to even. */
function round4(x: number): number {
  const [ip = '0', fp = ''] = Math.abs(x).toFixed(60).split('.');
  if (!/^50*$/.test(fp.slice(4))) return Number(x.toFixed(4));
  let kept = BigInt(ip + fp.slice(0, 4));
  if (kept % 2n === 1n) kept += 1n;
  const v = Number(kept) / 1e4;
  return x < 0 ? -v : v;
}

/** Numbers stay numbers (4 decimals max), numeric strings become numbers, blank becomes null. */
function clean(v: Scalar): Value | null {
  if (v == null) return null;
  if (typeof v === 'number') return Number.isInteger(v) ? v : round4(v);
  if (typeof v === 'string') {
    const t = v.trim();
    if (t === '') return null;
    if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
    return t;
  }
  return v;
}

/** A cell's hover-note, without Google's threaded-comment framing and trailing "-Author" lines. */
function noteText(raw: string | null): string | null {
  if (raw == null) return null;
  let t = raw.trim();
  if (t.startsWith('[Threaded comment]')) {
    t = t.replace(/^\[Threaded comment\][\s\S]*?\nComment:\n/, '');
    t = t.replace(/\n(Reply|Comment):\n/g, '\n— ');
    t = t.replace(/\n— \t/g, '\n— ');
  }
  t = t.replace(/\n\s*-[A-Z][\p{L}\p{N}_ .]*$/u, '').trim();
  return t || null;
}

const at = (ws: Sheet, ref: string, r: number) => ws.value(r, colIndex(ref));
const noteAt = (ws: Sheet, ref: string, r: number) => noteText(ws.note(r, colIndex(ref)));
const range = (a: number, b: number) => Array.from({ length: Math.max(0, b - a + 1) }, (_, i) => a + i);
const isInt = (v: unknown) => typeof v === 'boolean' || (typeof v === 'number' && Number.isInteger(v));

/** Rows of a sheet as objects. cols: {field: column letter}. Rows whose key column is empty are skipped. */
function table(name: string, cols: Record<string, string>, opts: { first?: number; key?: string } = {}): Row[] {
  const ws = sheet(name);
  const { first = 2, key = 'A' } = opts;
  const out: Row[] = [];
  for (const r of range(first, ws.maxRow)) {
    const kv = at(ws, key, r);
    if (kv == null || kv === '') continue;
    const row: Row = {};
    const notes: Record<string, string> = {};
    for (const [f, col] of Object.entries(cols)) {
      const v = clean(at(ws, col, r));
      if (v != null) row[f] = v;
      const n = noteAt(ws, col, r);
      if (n) notes[f] = n;
    }
    if (Object.keys(notes).length) row._notes = notes;
    out.push(row);
  }
  return out;
}
const dropNull = (o: Row) => Object.fromEntries(Object.entries(o).filter(([, v]) => v != null));

const T: Record<string, unknown> = {};

// ---------- Recipes ----------
{
  const ws = sheet('Recipes');
  const rec: Row[] = [];
  for (const r of range(2, ws.maxRow)) {
    const res = clean(at(ws, 'A', r));
    if (!res) continue;
    const g = (col: string) => clean(at(ws, col, r));
    const row: Row = { result: res };
    for (const [f, col] of [
      ['amount', 'B'],
      ['effect', 'E'],
      ['result2', 'F'],
      ['amount2', 'G'],
      ['category', 'H'],
      ['subcat', 'I'],
      ['station', 'J'],
      ['autolevel', 'Z'],
    ] as const) {
      const v = g(col);
      if (v != null && v !== 'V') row[f] = v;
    }
    const ings: Row[] = [];
    for (const [vcol, icol, tcol] of [
      ['K', 'L', 'M'],
      ['N', 'O', 'P'],
      ['Q', 'R', 'S'],
      ['T', 'U', 'V'],
      ['W', 'X', 'Y'],
    ] as const) {
      const name = g(icol);
      if (name) ings.push({ name, value: g(vcol), mode: g(tcol) });
    }
    row.ingredients = ings;
    const notes: Record<string, string> = {};
    for (const [col, f] of [
      ['A', 'result'],
      ['E', 'effect'],
      ['F', 'result2'],
      ['L', 'ing1'],
      ['O', 'ing2'],
      ['R', 'ing3'],
      ['U', 'ing4'],
      ['X', 'ing5'],
    ] as const) {
      const n = noteAt(ws, col, r);
      if (n) notes[f] = n;
    }
    if (Object.keys(notes).length) row._notes = notes;
    rec.push(row);
  }
  T.recipes = rec;
}

T.ingredients = table('Ingredients', { name: 'A', value: 'B', category: 'C', notes: 'D' });

// ---------- Skills (this sheet's version; DE flag in col M) ----------
T.skills = table('Skills', {
  name: 'A',
  ability1: 'B',
  ability2: 'C',
  level: 'D',
  ap: 'E',
  source: 'F',
  cooldown: 'G',
  range: 'H',
  radius: 'I',
  resist: 'J',
  description: 'K',
  numbers: 'L',
  de: 'M',
  weaponReq: 'N',
  scaling: 'O',
  statusRef: 'P',
  status1: 'Q',
  status2: 'R',
  status3: 'S',
  numType: 'T',
});

// ---------- 2-ability (combo) skill matrix ----------
{
  const ws = sheet('2-Ability Skills');
  const elems = range(2, 5).map((c) => ws.value(1, c));
  const combos: Row[] = [];
  for (const r of range(2, 7)) {
    const other = ws.value(r, 1);
    elems.forEach((el, i) => {
      const sk = clean(ws.value(r, 2 + i));
      if (sk) {
        const row: Row = { skill: sk, element: el, other };
        const n = noteText(ws.note(r, 2 + i));
        if (n) row._notes = { skill: n };
        combos.push(row);
      }
    });
  }
  T.combos = combos;
}

T.surfaces = table('SurfacesClouds', {
  name: 'A',
  kind: 'B',
  description: 'C',
  duration: 'D',
  resist: 'E',
  interactions: 'F',
  vaporizeSpike: 'G',
});
T.statuses = table('Status', { name: 'A', resist: 'B', effect: 'C' });

// ---------- Runes ----------
{
  const ws = sheet('Runes');
  const runes = {
    boosts: [] as Row[],
    mythic: [] as Row[],
    power: [] as Row[],
    sizes: [] as Row[],
    sourceOrb: null as Row | null,
  };
  let section: 'boosts' | 'mythic' | 'power' = 'boosts';
  for (const r of range(2, ws.maxRow)) {
    const a = clean(at(ws, 'A', r));
    if (typeof a === 'string' && a.startsWith('v ')) {
      section = a.includes('Mythic') ? 'mythic' : 'power';
      continue;
    }
    if (a === 'Source Orb') {
      runes.sourceOrb = {
        weapon: clean(at(ws, 'B', r)),
        armor: clean(at(ws, 'C', r)),
        amulet: clean(at(ws, 'D', r)),
      };
      continue;
    }
    if (a) {
      const row: Row = { rune: a, weapon: clean(at(ws, 'B', r)) };
      if (section !== 'power') {
        row.armor = clean(at(ws, 'C', r));
        row.amulet = clean(at(ws, 'D', r));
      }
      const notes: Record<string, string> = {};
      for (const [k, c] of [
        ['rune', 'A'],
        ['weapon', 'B'],
        ['armor', 'C'],
        ['amulet', 'D'],
      ] as const) {
        const n = noteAt(ws, c, r);
        if (n) notes[k] = n;
      }
      if (Object.keys(notes).length) row._notes = notes;
      runes[section].push(row);
    }
    // the size table lives in F:I, independent of column A
    const size = clean(at(ws, 'F', r));
    if (size) {
      runes.sizes.push({
        size,
        weapon: clean(at(ws, 'G', r)),
        armor: clean(at(ws, 'H', r)),
        amulet: clean(at(ws, 'I', r)),
      });
    }
  }
  T.runes = runes;
}

// ---------- Summons (base + infused columns) ----------
T.summons = table('Summons', {
  name: 'A',
  level: 'B',
  summoningLvl: 'C',
  vitality: 'D',
  physArmor: 'E',
  magArmor: 'F',
  initiative: 'G',
  damage: 'H',
  dmgType: 'I',
  airRes: 'J',
  earthRes: 'K',
  fireRes: 'L',
  poisonRes: 'M',
  waterRes: 'N',
  abilities: 'O',
  skills: 'P',
  immunities: 'Q',
  preDE: 'R',
  infusion: 'S',
  infType: 'T',
  infAirRes: 'U',
  infEarthRes: 'V',
  infFireRes: 'W',
  infPoisonRes: 'X',
  infWaterRes: 'Y',
  infAbilities: 'Z',
  infSkills: 'AA',
  infImmunities: 'AB',
  infSpecial: 'AC',
});

// ---------- V: crafted item gold values by level ----------
{
  const ws = sheet('V');
  const vals: Row[] = [];
  for (const r of range(2, ws.maxRow)) {
    const a = clean(at(ws, 'A', r));
    if (!a) continue;
    if (typeof a === 'string' && a.startsWith('v ')) break; // a testing block follows
    const by: Record<string, Value> = {};
    for (const c of range(2, 21)) {
      const v = clean(ws.value(r, c));
      if (v != null) by[String(c - 1)] = v;
    }
    vals.push({ item: a, byLevel: by });
  }
  T.values = vals;
}

// ---------- Attributes (+ "Other Stats" section) ----------
{
  const ws = sheet('Attributes');
  const attrs: Row[] = [];
  const other: Row[] = [];
  let sect = attrs;
  for (const r of range(2, ws.maxRow)) {
    const a = clean(at(ws, 'A', r));
    if (!a) continue;
    if (a === 'Other Stats') {
      sect = other;
      continue;
    }
    const row = dropNull({ name: a, effect: clean(at(ws, 'B', r)), notes: clean(at(ws, 'C', r)) });
    const nn: Record<string, string> = {};
    for (const [k, c] of [
      ['name', 'A'],
      ['effect', 'B'],
      ['notes', 'C'],
    ] as const) {
      const n = noteAt(ws, c, r);
      if (n) nn[k] = n;
    }
    if (Object.keys(nn).length) row._notes = nn;
    sect.push(row);
  }
  T.attributes = attrs;
  T.stats = other;
}

T.abilities = table('Abilities', { name: 'A', type: 'B', effect: 'C', notes: 'D' });
T.talents = table('Talents', { name: 'A', description: 'B', requirements: 'C' });
T.talentPoints = table('Talents', { level: 'E', total: 'F' }, { key: 'E' });
T.raceTraits = table('Race Traits', { race: 'A', trait: 'B', description: 'C' });
T.classes = table('Classes', {
  name: 'A',
  ability1: 'B',
  ability2: 'C',
  civil: 'D',
  talent: 'E',
  str: 'F',
  fin: 'G',
  int: 'H',
  con: 'I',
  wit: 'J',
  skill1: 'K',
  skill2: 'L',
  skill3: 'M',
  weapons: 'N',
  shield: 'O',
  extraItems: 'P',
  extraValue: 'Q',
});

// ---------- Weapons: base types + comparison rows ----------
{
  const w = table('Weapons', {
    name: 'A',
    hands: 'B',
    type: 'C',
    attribute: 'D',
    range: 'E',
    d1: 'F',
    d5: 'G',
    d10: 'H',
    d15: 'I',
    d20: 'J',
    d22: 'K',
    notes: 'M',
  });
  T.weapons = w.filter((x) => isInt(x.hands));
  T.weaponCompare = w.filter((x) => !('hands' in x));
}

// ---------- Armor ----------
{
  const arm = table('Armor', {
    material: 'A',
    slot: 'B',
    attribute: 'C',
    p1: 'E',
    m1: 'F',
    p10: 'H',
    m10: 'I',
    p20: 'K',
    m20: 'L',
    notes: 'M',
  });
  const SET_ROWS = ['No shield', 'w/ Shield'];
  T.armor = arm.filter((x) => !SET_ROWS.includes(x.slot as string) && 'p1' in x);
  const ws = sheet('Armor');
  const sets: Row[] = [];
  for (const r of range(2, ws.maxRow)) {
    const b = clean(at(ws, 'B', r));
    if (b === 'No shield' || b === 'w/ Shield') {
      const v = ['E', 'F', 'H', 'I', 'K', 'L'].map((c) => clean(at(ws, c, r)));
      sets.push({
        set: clean(at(ws, 'A', r)),
        shield: b === 'w/ Shield',
        p1: v[0],
        m1: v[1],
        p10: v[2],
        m10: v[3],
        p20: v[4],
        m20: v[5],
      });
    }
  }
  T.armorSets = sets;
}

// ---------- Gear Stats: possible rolls per slot ----------
{
  const ws = sheet('Gear Stats');
  const slots = range(1, 14).map((c) => ws.value(1, c));
  const rolls: Row[] = [];
  const rx = /^(?<stat>.+?)[:]?\s+(?<min>-?\d+(?:\.\d+)?)(?:-(?<max>\d+(?:\.\d+)?))?(?<pct>%)?$/;
  slots.forEach((slot, i) => {
    const c = i + 1;
    for (const r of range(2, ws.maxRow)) {
      const cv = clean(ws.value(r, c));
      if (cv == null) continue;
      const v = pyStr(cv);
      const row: Row = { slot, text: v };
      if (v.startsWith('Skill: ')) Object.assign(row, { kind: 'skill', stat: v.slice(7) });
      else if (v.startsWith('Inflict: ')) Object.assign(row, { kind: 'inflict', stat: v.slice(9) });
      else if (v === 'Rune Slot') Object.assign(row, { kind: 'rune', stat: 'Rune Slot' });
      else {
        const m = rx.exec(v)?.groups;
        if (m) {
          let stat = (m.stat as string).replaceAll('Critical Chance', 'Crit Chance');
          if (stat === 'Wit') stat = 'Wits';
          const min = Number(m.min);
          const max = Number(m.max ?? m.min);
          Object.assign(row, { kind: stat.startsWith('Set ') ? 'set' : 'stat', stat, min, max, pct: !!m.pct });
        } else Object.assign(row, { kind: 'other', stat: v });
      }
      const n = noteText(ws.note(r, c));
      if (n) row._notes = { text: n };
      rolls.push(row);
    }
  });
  T.gearRolls = rolls;
}

// ---------- Rarity multipliers ----------
const rarityHeaderNotes: Record<string, string> = {};
{
  const ws = sheet('Rarity Multipliers');
  const rar: Row[] = [];
  for (const r of range(2, ws.maxRow)) {
    const a = clean(at(ws, 'A', r));
    if (!a) continue;
    const g = (col: string) => clean(at(ws, col, r));
    const row = dropNull({
      type: a,
      white: g('B'),
      uncommon: g('C'),
      rare: g('E'),
      epic: g('G'),
      legendary: g('I'),
      divine: g('K'),
      xUncommon: g('D'),
      xRare: g('F'),
      xEpic: g('H'),
      xLegendary: g('J'),
      xDivine: g('L'),
    });
    const nn: Record<string, string> = {};
    for (const col of 'ABCDEFGHIJKL') {
      const n = noteAt(ws, col, r);
      if (n) nn[col] = n;
    }
    if (Object.keys(nn).length) row._notes = nn;
    rar.push(row);
  }
  T.rarity = rar;
  for (const c of range(1, ws.maxCol)) {
    const n = noteText(ws.note(1, c));
    if (n) rarityHeaderNotes[colLetters(c)] = n;
  }
}

T.bugs = table('Bugs', { bug: 'A', conditions: 'B', steps: 'C', notes: 'D' });
// index tab (tab descriptions + DE status)
T.tabs = table('|', { tab: 'A', description: 'B', status: 'C' }, { first: 8 });

// ---------- write one document per table ----------
mkdirSync(outDir, { recursive: true });
const extracted = new Date().toISOString().slice(0, 10);
const counts: Record<string, number | null> = {};
for (const [k, v] of Object.entries(T)) {
  const doc: Row = { source: SOURCE, extracted };
  if (Array.isArray(v)) doc.rows = v;
  else doc.data = v;
  if (k === 'rarity') doc.sheetNotes = rarityHeaderNotes;
  // the limit applies to the stored (compact) document, not the indented file
  const bytes = Buffer.byteLength(JSON.stringify(doc));
  if (bytes >= 250 * 1024) throw new Error(`${k} is ${bytes} bytes; documents must stay under 256 KiB`);
  writeFileSync(join(outDir, `${k}.json`), `${JSON.stringify(doc, null, 2)}\n`);
  counts[k] = Array.isArray(v) ? v.length : null;
}
writeFileSync(join(outDir, '.stamp'), `${extracted}\n`);
console.log(JSON.stringify(counts));
