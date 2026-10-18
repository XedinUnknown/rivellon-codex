// Lookups built once from the embedded data: skill/status by name, the name-linking regex, icon availability.
import { AB_LC } from './constants';
import type { GameIcons, NexusData, SimpleSkill, Skill, Status } from './types';

export interface Codex {
  data: NexusData;
  game: GameIcons;
  /** lower-case name -> skill (regular, summon or weapon/racial) */
  skillObj: Record<string, Skill | SimpleSkill>;
  /** lower-case name -> canonical skill name */
  skillByLc: Record<string, string>;
  /** lower-case base name -> status */
  statusObj: Record<string, Status>;
  /** matches any known skill, status or ability name (3+ chars) in free text */
  linkRx: RegExp;
}

let current: Codex | null = null;

export function codex(): Codex {
  if (!current) throw new Error('codex data not loaded yet');
  return current;
}

/** Status names without the "(aura)", "(caster)" or "(no Status Effect)" suffixes. */
export const baseStatus = (n: string) => n.replace(/\s*\((aura|caster|no Status Effect)\)\s*/gi, '').trim();

export function initCodex(data: NexusData, game: GameIcons): Codex {
  const skillObj: Record<string, Skill | SimpleSkill> = Object.fromEntries(
    [...data.summons, ...data.special, ...data.skills].map((s) => [s.name.toLowerCase(), s]),
  );
  const skillByLc = Object.fromEntries(Object.values(skillObj).map((s) => [s.name.toLowerCase(), s.name]));
  const statusObj: Record<string, Status> = {};
  for (const s of data.statuses) {
    const k = baseStatus(s.name).toLowerCase();
    if (!statusObj[k] && !/no status effect/i.test(s.name)) statusObj[k] = s;
  }
  const names = [...new Set([...Object.keys(statusObj), ...Object.keys(skillObj), ...Object.keys(AB_LC)])]
    .filter((n) => n.length >= 3)
    .sort((a, b) => b.length - a.length);
  const linkRx = new RegExp(
    `(^|[^A-Za-z])(${names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?![A-Za-z])`,
    'gi',
  );
  current = { data, game, skillObj, skillByLc, statusObj, linkRx };
  return current;
}

export const hasGameIcon = (k: string) => !!current?.game.icons[k];

// ---------- search ----------
const textCache = new WeakMap<object, string>();
/** All text inside a value (icon keys excluded), lower-case; cached per object. */
export function textOf(x: unknown): string {
  if (x && typeof x === 'object') {
    const hit = textCache.get(x);
    if (hit != null) return hit;
  }
  const out: string[] = [];
  (function walk(v: unknown, k: string) {
    if (k === 'icon' || v == null) return;
    if (typeof v === 'object') for (const [kk, vv] of Object.entries(v)) walk(vv, kk);
    else out.push(String(v));
  })(x, '');
  const s = out.join(' ').toLowerCase();
  if (x && typeof x === 'object') textCache.set(x, s);
  return s;
}

/** 1–2 characters match word starts; 3+ match substrings. */
export function matches(text: string, q: string): boolean {
  if (!q) return true;
  if (q.length >= 3) return text.includes(q);
  return new RegExp(`(^|[^a-z0-9])${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(text);
}
