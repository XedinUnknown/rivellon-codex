// Chips: every skill, status and ability name becomes a button that shows a hover card and navigates on click.
import type { CSSProperties, ReactNode } from 'react';
import { upgradeBonus } from '../domain/bonus';
import { codex } from '../domain/codex';
import { AB_LC, DMG_COL, DMG_EMO, EMO, rarityColor, SCH, schoolColor } from '../domain/constants';
import { sgn } from '../domain/format';
import type { Bonus, Status } from '../domain/types';
import { navTo } from '../state/nav';
import { SheetIcon } from './icons';

const css = (o: Record<string, string>) => o as CSSProperties;

export function SkillChip({ name, inline, from }: { name: string; inline?: boolean; from?: string }) {
  const sk = codex().skillObj[String(name).toLowerCase()];
  const label = inline ? name : (sk?.name ?? name);
  return (
    <button
      type="button"
      className={`skchip${inline ? ' lk' : ''}`}
      style={css({ '--c': sk && 'school' in sk ? schoolColor(sk.school) : 'var(--line)' })}
      data-skill={sk?.name ?? name}
      data-from={from}
      onClick={() => navTo('skill', sk?.name ?? name)}
    >
      {sk?.icon && <SheetIcon icon={sk.icon} small />}
      <span>{label}</span>
    </button>
  );
}

export function StatusChip({ st, inline }: { st: Status; inline?: boolean }) {
  return (
    <button
      type="button"
      className={`skchip st${inline ? ' lk' : ''}`}
      data-status={st.name}
      onClick={() => navTo('status', st.name)}
    >
      {st.icon && <SheetIcon icon={st.icon} small />}
      <span>{baseName(st.name)}</span>
    </button>
  );
}
const baseName = (n: string) => n.replace(/\s*\((aura|caster|no Status Effect)\)\s*/gi, '').trim();

export function AbChip({ a, suffix, inline }: { a: string; suffix?: string | number; inline?: boolean }) {
  return (
    <button
      type="button"
      className={`skchip ab${inline ? ' lk' : ''}`}
      style={css({ '--c': SCH[a] ? schoolColor(a) : 'var(--muted)' })}
      data-ab={a}
      onClick={() => navTo('ab', a)}
    >
      <span>
        {a}
        {suffix !== undefined && suffix !== '' ? ` ${suffix}` : ''}
      </span>
    </button>
  );
}

export type Prefer = 'status' | 'skill' | 'ab';
/** A chip for a name if it's a known status/skill/ability (in the preferred order), else null. */
export function chipFor(name: string, prefer: Prefer = 'status', inline = false): ReactNode | null {
  const lc = String(name).toLowerCase().trim();
  const { statusObj, skillObj } = codex();
  const order: Prefer[] =
    prefer === 'skill'
      ? ['skill', 'status', 'ab']
      : prefer === 'ab'
        ? ['ab', 'status', 'skill']
        : ['status', 'skill', 'ab'];
  for (const t of order) {
    const st = statusObj[lc];
    const sk = skillObj[lc];
    const ab = AB_LC[lc];
    if (t === 'status' && st) return <StatusChip st={st} inline={inline} />;
    if (t === 'skill' && sk) return <SkillChip name={sk.name} inline={inline} />;
    if (t === 'ab' && ab) return <AbChip a={ab} inline={inline} />;
  }
  return null;
}

/** Text with every Capitalised skill/status name (and abilities, where asked) turned into a chip. */
export function Linkify({ text, prefer = 'status' }: { text: unknown; prefer?: Prefer }) {
  if (text == null) return null;
  const s = String(text);
  const { linkRx, statusObj, skillObj } = codex();
  const out: ReactNode[] = [];
  let last = 0;
  linkRx.lastIndex = 0;
  for (let m = linkRx.exec(s); m; m = linkRx.exec(s)) {
    const word = m[2] as string;
    const start = m.index + (m[1] as string).length;
    if (word[0] !== word[0]?.toUpperCase()) continue; // only Capitalised mentions are names
    const lc = word.toLowerCase();
    if (AB_LC[lc] && prefer !== 'ab' && !statusObj[lc] && !skillObj[lc]) continue; // abilities only where asked
    const chip = chipFor(word, prefer, true);
    if (!chip) continue;
    out.push(s.slice(last, start), <span key={start}>{chip}</span>);
    last = start + word.length;
  }
  out.push(s.slice(last));
  return <>{out}</>;
}

/** A stored item bonus as a chip. */
export function BonusChip({ bonus }: { bonus: Bonus }) {
  const b = upgradeBonus(bonus);
  const { statusObj } = codex();
  if (b.reflect) {
    const r = b.reflect;
    return (
      <span className="bchip refl" title="Reflects part of the damage you take back at the attacker">
        🪞 Reflect {r.pct}%{r.from && r.from !== 'all' ? ` ${r.from}` : ''}
        {r.type && (
          <>
            {' as '}
            <span className="dmgt" style={css({ '--c': DMG_COL[r.type] ?? 'var(--ink)' })}>
              {DMG_EMO[r.type] ?? ''} {r.type}
            </span>
          </>
        )}
      </span>
    );
  }
  if (b.status || b.immune) {
    const name = (b.status ?? b.immune) as string;
    const st = statusObj[name.toLowerCase()];
    return (
      <span className={`bchip${b.status ? ' gst' : ''}`} title={b.status ? 'Applied to the wearer' : 'Immunity'}>
        {b.status ? '💫' : '🚫'} {st ? <StatusChip st={st} inline /> : name}
      </span>
    );
  }
  if (b.skill) return <SkillChip name={b.skill} />;
  if (b.stat) {
    const amount = `${sgn(b.value ?? 0)}${b.pct ? '%' : ''}`;
    const ab = AB_LC[b.stat.toLowerCase()];
    if (ab) return <AbChip a={ab} suffix={amount} />;
    const m = b.stat.match(/^(Set|Inflict)\s+(.+)$/i);
    const st = m && statusObj[(m[2] as string).toLowerCase()];
    if (m && st)
      return (
        <span className="bchip">
          {m[1]} <StatusChip st={st} inline /> {amount}
        </span>
      );
    return (
      <span className="bchip">
        {b.stat} {amount}
      </span>
    );
  }
  return (
    <span className="bchip">
      <Linkify text={b.text} />
    </span>
  );
}

export function RarityTag({ r }: { r: string | null | undefined }) {
  if (!r) return null;
  return (
    <span className="rar" style={css({ '--rc': rarityColor(r) })}>
      <span className="rdot" />
      {r}
    </span>
  );
}

/** A skill stat with its emoji, e.g. ⚡ 2. */
export function Em({ k, v }: { k: keyof typeof EMO; v: string | number }) {
  const [icon, label] = EMO[k];
  return (
    <span title={label}>
      <span aria-hidden="true">{icon}</span>
      <span className="sr">{label}</span> <b>{v}</b>
    </span>
  );
}

export { css };
