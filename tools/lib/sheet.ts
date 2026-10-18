// Thin wrapper over ExcelJS with the cell semantics the extractors rely on (1-based rows and columns).
import { readFileSync } from 'node:fs';
import { posix } from 'node:path';
import ExcelJS from 'exceljs';
import { strFromU8, unzipSync } from 'fflate';

export type Scalar = string | number | boolean | null;

export interface Sheet {
  name: string;
  maxRow: number;
  maxCol: number;
  /** Cell value; formulas give their cached result when `cached`, otherwise "=FORMULA" like openpyxl. */
  value(row: number, col: number): Scalar;
  /** Cell comment text (legacy note), or null. */
  note(row: number, col: number): string | null;
  numFmt(row: number, col: number): string;
  /** Images by their top-left anchor (0-based row/col, as stored in the drawing). */
  images(): { row: number; col: number; data: Buffer }[];
}

export async function openWorkbook(file: string, cached: boolean): Promise<(name: string) => Sheet> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(file);
  const pkg = readPackage(file);
  return (name) => {
    const ws = wb.getWorksheet(name);
    if (!ws) throw new Error(`sheet "${name}" not found in ${file}`);
    return wrap(wb, ws, cached, pkg.get(name) ?? { comments: new Map(), formulaValues: new Map() });
  };
}

// Two things ExcelJS gets wrong are read from the package directly (workbook -> sheet part -> related parts):
//  - comments: ExcelJS only attaches those that come with a VML drawing, and Google Sheets exports have none;
//  - formula results of 0: ExcelJS drops a cached result that is falsy.
const unescapeXml = (s: string) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, e: string) => {
    const k = e.toLowerCase();
    if (k[0] === '#') return String.fromCodePoint(k[1] === 'x' ? Number.parseInt(k.slice(2), 16) : Number(k.slice(1)));
    return ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" } as Record<string, string>)[k] ?? _;
  });
const attr = (tag: string, name: string) => new RegExp(`\\b${name}="([^"]*)"`).exec(tag)?.[1];

interface SheetExtras {
  comments: Map<string, string>;
  formulaValues: Map<string, Scalar>;
}
function readPackage(file: string): Map<string, SheetExtras> {
  const zip = unzipSync(readFileSync(file));
  const text = (path: string) => (zip[path] ? strFromU8(zip[path]) : '');
  const rels = (path: string) => {
    const dir = posix.dirname(path);
    const relsPath = posix.join(dir, '_rels', `${posix.basename(path)}.rels`);
    return [...text(relsPath).matchAll(/<Relationship\b[^>]*>/g)].map((m) => ({
      id: attr(m[0], 'Id'),
      type: attr(m[0], 'Type') ?? '',
      target: posix.normalize(posix.join(dir, attr(m[0], 'Target') ?? '')),
    }));
  };
  const wbRels = rels('xl/workbook.xml');
  const out = new Map<string, SheetExtras>();
  for (const m of text('xl/workbook.xml').matchAll(/<sheet\b[^>]*>/g)) {
    const name = unescapeXml(attr(m[0], 'name') ?? '');
    const part = wbRels.find((r) => r.id === attr(m[0], 'r:id'))?.target;
    if (!part) continue;
    const extras: SheetExtras = { comments: new Map(), formulaValues: new Map() };
    const commentsPart = rels(part).find((r) => r.type.endsWith('/comments'))?.target;
    if (commentsPart) {
      for (const c of text(commentsPart).matchAll(/<comment\b([^>]*)>([\s\S]*?)<\/comment>/g)) {
        const ref = attr(c[1] ?? '', 'ref');
        const body = [...(c[2] ?? '').matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)]
          .map((t) => unescapeXml(t[1] ?? ''))
          .join('');
        if (ref) extras.comments.set(ref, body);
      }
    }
    for (const c of text(part).matchAll(/<c\b([^>]*)>((?:(?!<\/c>)[\s\S])*?<f\b[\s\S]*?)<\/c>/g)) {
      const ref = attr(c[1] ?? '', 'r');
      const v = /<v>([\s\S]*?)<\/v>/.exec(c[2] ?? '')?.[1];
      if (!ref || v == null) continue;
      const t = attr(c[1] ?? '', 't');
      const raw = unescapeXml(v);
      extras.formulaValues.set(ref, t === 'str' || t === 'e' ? raw : t === 'b' ? raw === '1' : Number(raw));
    }
    out.set(name, extras);
  }
  return out;
}

function plain(v: ExcelJS.CellValue, cached: boolean): Scalar {
  if (v == null) return null;
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return v;
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'object') {
    if ('richText' in v) return v.richText.map((t) => t.text).join('');
    if ('formula' in v || 'sharedFormula' in v) {
      if (cached) return plain((v as { result?: ExcelJS.CellValue }).result ?? null, cached);
      const f = (v as { formula?: string; sharedFormula?: string }).formula ?? '';
      return `=${f}`;
    }
    if ('text' in v && 'hyperlink' in v) return String(v.text);
    if ('error' in v) return String(v.error);
  }
  return String(v);
}

function wrap(wb: ExcelJS.Workbook, ws: ExcelJS.Worksheet, cached: boolean, extras: SheetExtras): Sheet {
  const cell = (r: number, c: number) => ws.getRow(r).getCell(c);
  return {
    name: ws.name,
    maxRow: ws.rowCount,
    maxCol: ws.columnCount,
    value: (r, c) => {
      const x = cell(r, c);
      // openpyxl reports a merged range's value only in its top-left cell
      if (x.isMerged && x.master !== x) return null;
      const v = x.value;
      if (cached && v && typeof v === 'object' && 'formula' in v && v.result === undefined) {
        return extras.formulaValues.get(`${colLetters(c)}${r}`) ?? null;
      }
      return plain(v, cached);
    },
    note: (r, c) => extras.comments.get(`${colLetters(c)}${r}`) ?? null,
    numFmt: (r, c) => cell(r, c).numFmt ?? '',
    images: () =>
      ws.getImages().map((im) => {
        const media = wb.getImage(Number(im.imageId));
        const tl = im.range.tl as unknown as { nativeRow: number; nativeCol: number };
        return { row: tl.nativeRow, col: tl.nativeCol, data: Buffer.from(media.buffer as ArrayBuffer) };
      }),
  };
}

/** Column letters (A, B, … AA) to a 1-based index. */
export function colIndex(letters: string): number {
  let n = 0;
  for (const ch of letters.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n;
}

/** A 1-based column index to letters (1 -> A, 27 -> AA). */
export function colLetters(n: number): string {
  let s = '';
  for (let x = n; x > 0; x = Math.floor((x - 1) / 26)) s = String.fromCharCode(65 + ((x - 1) % 26)) + s;
  return s;
}

/** Python's format(x, '+g'): 6 significant digits, trailing zeros dropped, sign always shown. */
export function formatG(x: number, sign = false): string {
  if (x === 0) return sign ? '+0' : '0';
  const exp = Math.floor(Math.log10(Math.abs(x)));
  let s: string;
  if (exp < -4 || exp >= 6) {
    const [m, e] = x.toExponential(5).split('e') as [string, string];
    const mant = m.includes('.') ? m.replace(/0+$/, '').replace(/\.$/, '') : m;
    const n = Number(e);
    s = `${mant}e${n < 0 ? '-' : '+'}${String(Math.abs(n)).padStart(2, '0')}`;
  } else {
    s = String(Number(x.toPrecision(6)));
  }
  return sign && x > 0 ? `+${s}` : s;
}
