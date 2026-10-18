// Reading the Nexus "DOS2 Character Planner" workbook: skills, statuses, summons, weapon/racial skills, and their icons.
// Icons are the sheet's embedded images (Larian's game art), shrunk to fit 40 px and stored once each as WebP data
// URIs keyed by the first 10 hex digits of the MD5 of the original image bytes. They are never committed: `make build` and
// `make dev` extract them from the user's copy of the workbook (see the Makefile).
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { isNum, pyStr, truthy } from './py.ts';
import { formatG, openWorkbook, type Scalar, type Sheet } from './sheet.ts';

export interface NexusExtract {
  /** the text data: data/nexus.json */
  data: { skills: unknown[]; statuses: unknown[]; special: unknown[]; summons: unknown[] };
  /** icon key -> data URI */
  icons: Record<string, string>;
}

export async function extractNexus(src: string): Promise<NexusExtract> {
  const sheet = await openWorkbook(src, false);
  const icons: Record<string, string> = {};
  const pending: Promise<void>[] = [];
  function iconOf(data: Buffer): string {
    const h = createHash('md5').update(data).digest('hex').slice(0, 10);
    if (!(h in icons)) {
      icons[h] = '';
      pending.push(
        sharp(data)
          .ensureAlpha()
          .resize({ width: 40, height: 40, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer()
          .then((b) => {
            icons[h] = `data:image/webp;base64,${b.toString('base64')}`;
          }),
      );
    }
    return h;
  }

  /** The Python s(): text of a cell, newlines flattened, trimmed. */
  const s = (v: Scalar) => pyStr(v).replaceAll('\n', ' ').trim();
  /** Images anchored in a given 0-based column, by 1-based row. */
  function imagesIn(ws: Sheet, col: number): Map<number, string> {
    const m = new Map<number, string>();
    for (const im of ws.images()) if (im.col === col) m.set(im.row + 1, iconOf(im.data));
    return m;
  }
  const range = (a: number, b: number) => Array.from({ length: Math.max(0, b - a) }, (_, i) => a + i);

  const SCHOOLS = [
    'Aerotheurge',
    'Geomancer',
    'Huntsman',
    'Hydrosophist',
    'Necromancer',
    'Polymorph',
    'Pyrokinetic',
    'Scoundrel',
    'Summoning',
    'Warfare',
  ];

  const skills: Record<string, unknown>[] = [];
  for (const sch of SCHOOLS) {
    const ws = sheet(sch);
    const header = (row: number) => {
      const h: Record<string, number> = {};
      for (let c = 1; c <= ws.maxCol; c++) if (truthy(ws.value(row, c))) h[s(ws.value(row, c))] = c;
      return h;
    };
    const h6 = header(6);
    const h7 = header(7);
    const need = (h: Record<string, number>, k: string) => {
      const v = h[k];
      if (v == null) throw new Error(`${sch}: header "${k}" not found`);
      return v;
    };
    const target = need(h7, 'Target');
    const col = {
      name: 3,
      type: 4,
      block: 5,
      bonus: 6,
      eff1: 9,
      eff2: 10,
      dur: need(h7, 'Duration'),
      res: need(h7, 'Resistance'),
      self: target,
      ally: target + 1,
      enemy: target + 2,
      range: need(h6, 'Range'),
      cd: need(h6, 'Cool-down'),
      ap: need(h7, 'Action'),
      sp: need(h7, 'Source'),
      mem: need(h6, 'Mem. Slots'),
      book: need(h6, 'Skill-book level'),
      req: need(h6, 'Requirements'),
    };
    const imgs = imagesIn(ws, 1);
    const rows = range(9, ws.maxRow + 1).filter((r) => isNum(ws.value(r, 1)));
    rows.push(ws.maxRow + 1);
    for (let i = 0; i < rows.length - 1; i++) {
      const r0 = rows[i] as number;
      const r1 = rows[i + 1] as number;
      const g = (c: number, r = r0) => ws.value(r, c);
      const span = range(r0, r1);
      const iconRow = span.find((r) => imgs.has(r));
      const sk: Record<string, unknown> = {
        school: sch,
        name: s(g(col.name)),
        dmg: s(g(col.type)),
        block: s(g(col.block)),
        scale: s(g(col.bonus)),
        range: s(g(col.range)),
        cd: s(g(col.cd)),
        ap: s(g(col.ap)),
        sp: s(g(col.sp)),
        mem: s(g(col.mem)),
        book: s(g(col.book)),
        icon: iconRow != null ? (imgs.get(iconRow) ?? null) : null,
        effects: [] as unknown[],
        req: [] as string[][],
      };
      const effects = sk.effects as unknown[];
      const req = sk.req as string[][];
      for (const r of span) {
        const e = s(ws.value(r, col.eff2)) || s(ws.value(r, col.eff1));
        if (e && e !== '-') {
          const dur = s(ws.value(r, col.dur));
          effects.push({
            e,
            dur: dur.replaceAll('→', '').trim(),
            chain: dur.includes('→'),
            res: s(ws.value(r, col.res)),
            t: (
              [
                ['S', col.self],
                ['A', col.ally],
                ['E', col.enemy],
              ] as const
            )
              .filter(([, c]) => s(ws.value(r, c)) === '+')
              .map(([k]) => k)
              .join(''),
          });
        }
      }
      if (sch === 'Warfare') {
        const mw = s(g(col.req));
        const sh = s(g(col.req + 1));
        const lv = s(g(col.req + 2));
        req.push(['Warfare', lv]);
        if (mw === '+') sk.weapon = 'Melee weapon';
        if (sh === '+') sk.weapon = 'Shield';
      } else if (sch === 'Scoundrel' || sch === 'Huntsman') {
        const dg = s(g(col.req));
        // combo rows may list other abilities
        for (const r of span) {
          const a = s(ws.value(r, col.req));
          const b = s(ws.value(r, col.req + 1));
          if (r === r0) req.push([sch, b]);
          else if (a && b) req.push([a, b]);
        }
        if (dg === '+') sk.weapon = sch === 'Scoundrel' ? 'Dagger' : 'Bow or crossbow';
      } else {
        for (const r of span) {
          const a = s(ws.value(r, col.req));
          const b = s(ws.value(r, col.req + 1));
          if (a && b) req.push([a, b]);
        }
      }
      const book = sk.book as string;
      sk.craft = book.toLowerCase().includes('craft');
      sk.book = book.replaceAll('craft', '').trim();
      skills.push(sk);
    }
  }

  // statuses
  const statuses: Record<string, unknown>[] = [];
  {
    const ws = sheet('Status Effects');
    const simg = imagesIn(ws, 0);
    const starts = range(6, ws.maxRow + 1).filter((r) => truthy(ws.value(r, 2)));
    starts.push(ws.maxRow + 1);
    for (let i = 0; i < starts.length - 1; i++) {
      const r0 = starts[i] as number;
      const r1 = starts[i + 1] as number;
      const span = range(r0, r1);
      const iconRow = span.find((r) => simg.has(r));
      const effects: string[] = [];
      const causes: Record<string, string[]> = {};
      const resist: string[] = [];
      const immune: string[] = [];
      const treat: string[] = [];
      let cat: string | null = null;
      for (const r of span) {
        const c = s(ws.value(r, 3));
        const d = ws.value(r, 4);
        if (c) {
          let dv: string;
          if (typeof d === 'number') {
            const pct = ws.numFmt(r, 4).includes('%');
            dv = d ? (pct ? `${formatG(d * 100, true)}%` : formatG(d, true)) : '';
          } else dv = s(d);
          effects.push((c + (dv ? ` ${dv}` : '')).trim());
        }
        const e = s(ws.value(r, 5));
        if (e) {
          cat = e;
          causes[cat] ??= [];
        }
        const f = s(ws.value(r, 6));
        if (f && cat) causes[cat]?.push(f);
        const k = s(ws.value(r, 11));
        const m = s(ws.value(r, 13));
        if (k) resist.push(k + (m ? ` → ${m}` : ''));
        const p = s(ws.value(r, 16));
        if (p) immune.push(p);
        const q = s(ws.value(r, 17));
        if (q && r !== r0) treat.push(`§${q}`);
        const rr = s(ws.value(r, 18));
        const u = s(ws.value(r, 21));
        if (rr) treat.push(rr + (u ? ` → ${u}` : ''));
      }
      statuses.push({
        name: s(ws.value(r0, 2)),
        icon: iconRow != null ? (simg.get(iconRow) ?? null) : null,
        effects,
        causes,
        resist,
        immune,
        treat,
        resistHead: s(ws.value(r0, 10)),
        immuneHead: s(ws.value(r0, 15)),
        treatHead: s(ws.value(r0, 17)),
      });
    }
  }

  // special abilities & summons
  function simple(name: string) {
    const ws = sheet(name);
    const imgs = imagesIn(ws, 1);
    const rows: Record<string, unknown>[] = [];
    let grp = '';
    for (let r = 9; r <= ws.maxRow; r++) {
      const a = ws.value(r, 1);
      if (typeof a === 'string' && a.trim() && !truthy(ws.value(r, 3))) {
        grp = s(a);
        continue;
      }
      const b = s(ws.value(r, 2));
      const gname = s(ws.value(r, 7));
      if (b && !isNum(a)) {
        grp = b + (gname ? ` — ${gname}` : '');
        continue;
      }
      if (isNum(a)) {
        const v = (c: number) => s(ws.value(r, c));
        rows.push({
          group: grp,
          name: v(3),
          dmg: v(4),
          block: v(5),
          scale: v(6),
          effect: v(8) || v(7),
          dur: v(10),
          range: v(15),
          cd: v(16),
          ap: v(17),
          sp: v(18),
          extra: name === 'Special Abilities' ? v(20) : '',
          icon: imgs.get(r) ?? null,
        });
      }
    }
    return rows;
  }
  const special = simple('Special Abilities');
  const summons = simple('Summons');

  await Promise.all(pending);
  return { data: { skills, statuses, special, summons }, icons };
}
