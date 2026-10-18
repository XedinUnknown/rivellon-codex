// Item bonus grammar: what a person types ("Hydrosophist +1", "Fire Resistance +5%", "Skill: First Aid", …)
// and how a stored bonus reads back.
import { baseStatus, codex } from './codex';
import { AB_LC, ALIASES, DMG_TYPES, STAT_NAMES } from './constants';
import { sgn } from './format';
import type { Bonus } from './types';

export function canonStat(s: string): string {
  const t = s.trim().replace(/\s+/g, ' ');
  const lc = t.toLowerCase();
  const res = lc.match(/^(fire|water|air|earth|poison|physical|piercing)\s*res(ist(ance)?)?$/);
  if (res?.[1]) return `${res[1][0]?.toUpperCase()}${res[1].slice(1)} Resistance`;
  return AB_LC[lc] || ALIASES[lc] || STAT_NAMES.find((x) => x.toLowerCase() === lc) || t;
}

/** The canonical name of a status, or the text as typed. */
export function stName(s: string): string {
  const st = codex().statusObj[baseStatus(s.trim()).toLowerCase()];
  return st ? baseStatus(st.name) : s.trim();
}

export function parseBonus(raw: string): Bonus | null {
  const t = raw.trim();
  if (!t) return null;
  const { skillByLc } = codex();
  const skill = t.match(/^skill\s*:\s*(.+)$/i)?.[1]?.trim();
  if (skill) return { skill: skillByLc[skill.toLowerCase()] || skill };
  const status = t.match(/^(?:status|applies|wearer)\s*:\s*(.+)$/i)?.[1];
  if (status) return { status: stName(status) };
  const immune = t.match(/^immun(?:e|ity)\s*(?:to)?\s*:?\s*(.+)$/i)?.[1];
  if (immune) return { immune: stName(immune) };
  const rf = t.match(
    /^reflect\s+(\d+(?:\.\d+)?)\s*%?\s*(?:of\s+)?(melee|ranged|all)?\s*(?:damage)?\s*(?:as\s+([a-z]+))?/i,
  );
  if (rf) {
    const type = rf[3];
    return {
      reflect: {
        pct: Number(rf[1]),
        from: (rf[2] || 'all').toLowerCase(),
        type: type ? DMG_TYPES.find((x) => x.toLowerCase() === type.toLowerCase()) || type : null,
      },
    };
  }
  const after = t.match(/^(.+?)\s*:?\s*([+-]?\d+(?:\.\d+)?)\s*(%)?$/);
  if (after) return { stat: canonStat(after[1] as string), value: Number(after[2]), pct: !!after[3] };
  const before = t.match(/^([+-]?\d+(?:\.\d+)?)\s*(%)?\s+(.+)$/);
  if (before) return { stat: canonStat(before[3] as string), value: Number(before[1]), pct: !!before[2] };
  const sk = skillByLc[t.toLowerCase()];
  if (sk) return { skill: sk };
  return { text: t };
}

/** Free-text bonuses that read as a status, immunity or reflect are treated as such. */
export function upgradeBonus(b: Bonus): Bonus {
  if (b.text) {
    const p = parseBonus(b.text);
    if (p && (p.status || p.immune || p.reflect)) return p;
  }
  return b;
}

export const reflectLabel = (r: NonNullable<Bonus['reflect']>) =>
  `Reflect ${r.pct}%${r.from && r.from !== 'all' ? ` ${r.from}` : ''} damage${r.type ? ` as ${r.type}` : ''}`;

export function bonusLabel(b: Bonus): string {
  if (b.reflect) return reflectLabel(b.reflect);
  if (b.status) return `Status: ${b.status}`;
  if (b.immune) return `Immune to ${b.immune}`;
  if (b.skill) return `Skill: ${b.skill}`;
  if (b.stat) return `${b.stat} ${sgn(b.value ?? 0)}${b.pct ? '%' : ''}`;
  return b.text ?? '';
}
