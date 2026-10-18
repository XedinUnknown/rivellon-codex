import { describe, expect, it } from 'vitest';
import { localDb, mergeInto, parseData } from './localDb';
import { diffPatch } from './sync';

describe('diffPatch', () => {
  it('sends only changed fields, and only changed sub-keys of nested ones', () => {
    const base = { name: 'Sol', level: 3, points: { Warfare: 1, Scoundrel: 2 }, known: ['A'] };
    const cur = { name: 'Sol', level: 4, points: { Warfare: 2 }, known: ['A', 'B'] };
    expect(diffPatch(cur, base)).toEqual({ level: 4, points: { Warfare: 2, Scoundrel: null }, known: ['A', 'B'] });
  });
  it('is empty when nothing changed', () => {
    expect(diffPatch({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 2 } })).toEqual({});
  });
});

describe('mergeInto', () => {
  it('merges objects, replaces arrays, removes nulls', () => {
    const t = { a: { x: 1, y: 2 }, list: [1, 2], gone: 1 };
    expect(mergeInto(t, { a: { y: 3 }, list: [9], gone: null })).toEqual({ a: { x: 1, y: 3 }, list: [9] });
  });
});

describe('parseData', () => {
  it('accepts exports and rejects anything else', () => {
    expect(parseData('{"party":{},"items":{"i":{}}}')).toEqual({ party: {}, items: { i: {} } });
    expect(parseData('')).toEqual({ party: {}, items: {} });
    expect(() => parseData('[1]')).toThrow(/not a Rivellon Codex data file/);
    expect(() => parseData('{"party":[]}')).toThrow();
  });
});

describe('localDb', () => {
  it('stores, notifies and rejects updates of missing documents', async () => {
    const persisted: unknown[] = [];
    const db = localDb({ party: {} }, async (c, id, body) => {
      persisted.push([c, id, body]);
    });
    const seen: number[] = [];
    db.collection('party').onSnapshot((s) => seen.push(s.docs.length));
    await db.doc('party/sol').set({ name: 'Sol', points: { A: 1 } });
    await db.doc('party/sol').update({ points: { B: 2 } });
    expect(db.data.party?.sol).toEqual({ name: 'Sol', points: { A: 1, B: 2 } });
    await expect(db.doc('party/fane').update({ x: 1 })).rejects.toMatchObject({ code: 'invalid_argument' });
    await db.doc('party/sol').delete();
    expect(persisted.at(-1)).toEqual(['party', 'sol', null]);
    await new Promise((r) => setTimeout(r, 5));
    expect(seen.at(-1)).toBe(0);
  });
});
