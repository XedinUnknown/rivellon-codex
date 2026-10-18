import { beforeAll, describe, expect, it } from 'vitest';
import { bonusLabel, canonStat, parseBonus } from './bonus';
import { calcBase, interp } from './calc';
import { initCodex, matches } from './codex';
import { MEMBERS } from './constants';
import { handsOf, itemIconKey, whoWears } from './items';
import { blankParty, budget, derived, meets, normalize, totals } from './party';
import type { Items, NexusData, RefTables, Skill } from './types';

const skill = (name: string, req: [string, string][]): Skill => ({
  school: 'Aerotheurge',
  name,
  dmg: '',
  block: '',
  scale: '',
  range: '',
  cd: '',
  ap: '',
  sp: '',
  mem: '',
  book: '',
  icon: null,
  effects: [],
  req,
  craft: false,
});

beforeAll(() => {
  const data: NexusData = {
    skills: [skill('First Aid', [['Hydrosophist', '1']])],
    statuses: [
      {
        name: 'Burning',
        icon: null,
        effects: [],
        causes: {},
        resist: [],
        immune: [],
        treat: [],
        resistHead: '',
        immuneHead: '',
        treatHead: '',
      },
    ],
    special: [],
    summons: [],
    icons: {},
  };
  initCodex(data, {
    size: [512, 512],
    icons: { sword: '<path/>', sword2: '<path/>', staff: '<path/>', helmet: '<path/>' },
  });
});

describe('parseBonus', () => {
  it.each([
    ['Hydrosophist +1', { stat: 'Hydrosophist', value: 1, pct: false }],
    ['+2 int', { stat: 'Intelligence', value: 2, pct: false }],
    ['fire res 5%', { stat: 'Fire Resistance', value: 5, pct: true }],
    ['Crit dmg +10%', { stat: 'Crit Damage', value: 10, pct: true }],
    ['Skill: first aid', { skill: 'First Aid' }],
    ['Status: burning', { status: 'Burning' }],
    ['Immune to Burning', { immune: 'Burning' }],
    ['Reflect 10% melee damage as air', { reflect: { pct: 10, from: 'melee', type: 'Air' } }],
    ['first aid', { skill: 'First Aid' }],
    ['Some odd text', { text: 'Some odd text' }],
  ])('%s', (raw, want) => {
    expect(parseBonus(raw)).toEqual(want);
  });
  it('ignores blank input', () => expect(parseBonus('  ')).toBeNull());
  it('reads back', () => {
    expect(bonusLabel({ stat: 'Fire Resistance', value: 5, pct: true })).toBe('Fire Resistance +5%');
    expect(bonusLabel({ reflect: { pct: 10, from: 'all', type: null } })).toBe('Reflect 10% damage');
  });
  it('canonicalises stats', () => {
    expect(canonStat('physical resist')).toBe('Physical Resistance');
    expect(canonStat('lifesteal')).toBe('Life Steal');
  });
});

describe('search', () => {
  it('matches word starts for short queries and substrings for long ones', () => {
    expect(matches('battle stomp', 'st')).toBe(true);
    expect(matches('battle stomp', 'tt')).toBe(false);
    expect(matches('battle stomp', 'ttl')).toBe(true);
  });
});

describe('party rules', () => {
  const items: Items = {
    staff: {
      name: 'Staff',
      kind: 'weapon',
      type: 'w:Staff:2',
      rarity: 'Rare',
      bonuses: [{ stat: 'Hydrosophist', value: 1, pct: false }],
    },
    shield: { name: 'Shield', kind: 'shield', rarity: '', bonuses: [{ stat: 'Constitution', value: 2, pct: false }] },
    helm: {
      name: 'Helm',
      kind: 'helmet',
      rarity: '',
      bonuses: [{ stat: 'HP', value: 20, pct: false }, { skill: 'First Aid' }],
    },
  };
  const party = blankParty();
  party.sol = {
    ...party.sol,
    level: 4,
    points: { Hydrosophist: 0, Polymorph: 1 },
    attributes: { Constitution: 12 },
    gear: { main: { itemId: 'staff' }, off: { itemId: 'shield' }, helmet: { itemId: 'helm' } },
  };

  it('adds gear to totals, ignoring the off hand under a two-handed weapon', () => {
    const t = totals(party, items, 'sol');
    expect(handsOf(items.staff)).toBe(2);
    expect(t.ab.Hydrosophist).toBe(1);
    expect(t.at.Constitution).toBe(12); // the shield's +2 doesn't count
    expect(t.other.HP).toBe(20);
    expect(t.skills).toEqual([{ skill: 'First Aid', item: 'Helm' }]);
    expect(meets(t, skill('First Aid', [['Hydrosophist', '1']]))).toBe(true);
  });

  it('computes point budgets', () => {
    const b = budget(party.sol, {});
    // level 4: 3 + 2×3 + 1 (Polymorph) attribute; 2 + 3 combat; civil at 1 + level 2; talents at 1 + level 3
    expect(b.map((r) => [r.spent, r.avail])).toEqual([
      [2, 10],
      [1, 5],
      [0, 2],
      [0, 2],
    ]);
  });

  it('estimates Vitality and AP', () => {
    const t = totals(party, items, 'sol');
    const d = derived(party.sol, t, {});
    expect(d.vit).toBe(Math.round(85 * (1 + 0.07 * 2)) + 20);
    expect([d.start, d.maxAP, d.rec]).toEqual([4, 6, 4]);
  });

  it('normalises schema-1 documents', () => {
    const m = normalize({ name: 'Sol', abilities: { Warfare: 2 } }, MEMBERS[0] as (typeof MEMBERS)[0]);
    expect(m.points).toEqual({ Warfare: 2 });
    expect(m.schema).toBe(2);
    expect('abilities' in m).toBe(false);
  });

  it('knows who wears what and picks icons', () => {
    expect(whoWears(party, 'shield')).toEqual({ member: 'sol', slot: 'off' });
    expect(itemIconKey(items.staff)).toBe('staff');
    expect(itemIconKey({ name: '', kind: 'weapon', type: 'w:Sword:2', rarity: '', bonuses: [] })).toBe('sword2');
  });
});

describe('gear calculator', () => {
  it('interpolates log-linearly between sample levels', () => {
    expect(
      interp(
        [
          [1, 10],
          [10, 100],
        ],
        1,
      ),
    ).toBe(10);
    expect(
      interp(
        [
          [1, 10],
          [10, 100],
        ],
        10,
      ),
    ).toBe(100);
    expect(
      interp(
        [
          [1, 10],
          [10, 100],
        ],
        5.5,
      ),
    ).toBeCloseTo(10 * 10 ** 0.5);
    expect(interp([[1, null]], 3)).toBeNull();
  });
  it('applies rarity multipliers', () => {
    const ref: RefTables = { rarity: { rows: [{ type: 'Staff', xRare: 1.5 }] } };
    const t = {
      key: 'w:Staff:2',
      label: 'Staff (2H)',
      kind: 'weapon' as const,
      itemKind: 'weapon',
      group: 'Weapons' as const,
      row: { name: 'Staff', hands: 2, d1: 10, d5: 20 },
    };
    expect(calcBase(ref, t, 1, 'Rare')).toEqual({ mult: 1.5, damage: 15 });
    expect(calcBase(ref, t, 1, 'Epic').mult).toBeNull();
  });
});
