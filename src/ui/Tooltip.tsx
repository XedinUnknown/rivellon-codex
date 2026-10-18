// Hover cards for skills, statuses, abilities and items. Anything with data-skill / data-status / data-ab /
// data-itemtip shows one. Hold Ctrl (⌘ on Mac) to keep it open and interact inside it.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { baseStatus, codex } from '../domain/codex';
import { ATTRS, MEMBERS, SCH, schoolColor } from '../domain/constants';
import { infoSkill, infoStatus, refAb } from '../domain/ref';
import type { Skill } from '../domain/types';
import { useTotals } from '../state/hooks';
import { useApp } from '../state/store';
import { ItemTip } from '../views/items/itemText';
import { css, Em, Linkify } from './chips';
import { SheetIcon } from './icons';

const SEL = '[data-skill],[data-status],[data-ab],[data-itemtip]';
type Target = { kind: 'skill' | 'status' | 'ab' | 'item'; key: string; from?: string; rect: DOMRect };

function SkillTip({ name, from }: { name: string; from?: string }) {
  const ref = useApp((s) => s.ref);
  const sk = codex().skillObj[name.toLowerCase()];
  if (!sk) return null;
  const inf = infoSkill(ref, sk.name);
  const school = 'school' in sk ? sk.school : '';
  const full = 'effects' in sk && Array.isArray(sk.effects) ? (sk as Skill) : null;
  return (
    <>
      <div className="hd">
        <SheetIcon icon={sk.icon} name={sk.name} />
        <div>
          <h3>{sk.name}</h3>
          <span className="school" style={css({ '--c': schoolColor(school) })}>
            {school || ('group' in sk ? sk.group : '')}
          </span>
        </div>
      </div>
      <div className="stats">
        <Em k="ap" v={sk.ap} />
        {sk.sp && sk.sp !== '-' && <Em k="sp" v={sk.sp} />}
        <Em k="cd" v={sk.cd} />
        {full && <Em k="mem" v={full.mem} />}
        <Em k="range" v={sk.range} />
      </div>
      {sk.dmg && sk.dmg !== '-' && (
        <div className="dmg">
          ⚔️ {sk.dmg}
          {sk.scale && sk.scale !== '-' ? ` · scales with ${sk.scale}` : ''}
        </div>
      )}
      {inf?.description ? <p>{String(inf.description)}</p> : null}
      {full && full.effects.length > 0 && (
        <ul className="fx">
          {full.effects.map((f, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: positional
            <li key={i}>
              <Linkify text={f.e} />
              {f.dur && f.dur !== '-' && <span className="d"> ⏱ {f.dur}</span>}
            </li>
          ))}
        </ul>
      )}
      {full && full.req.length > 0 && (
        <div className="req">
          {full.req.map(([s, l]) => (
            <span key={s + l} className="r" style={{ color: schoolColor(s), borderColor: schoolColor(s) }}>
              {s} {l}
            </span>
          ))}
          {full.weapon && <span className="tag">Needs {full.weapon}</span>}
        </div>
      )}
      {from && <div className="note">From {from}</div>}
      <div className="note" style={{ marginTop: 6 }}>
        Click to open
      </div>
    </>
  );
}

function StatusTip({ name }: { name: string }) {
  const ref = useApp((s) => s.ref);
  const st = codex().statusObj[baseStatus(name).toLowerCase()];
  if (!st) return null;
  const inf = infoStatus(ref, st.name);
  const list = (h: string, arr: string[]) => {
    const shown = arr.filter((x) => !x.startsWith('§'));
    return arr.length ? (
      <p>
        <b>{h}:</b> {shown.slice(0, 10).join(', ')}
        {arr.length > 10 ? '…' : ''}
      </p>
    ) : null;
  };
  return (
    <>
      <div className="hd">
        <SheetIcon icon={st.icon} name={st.name} />
        <div>
          <h3>{baseStatus(st.name)}</h3>
          <span className="school" style={css({ '--c': 'var(--accent)' })}>
            Status effect
          </span>
        </div>
      </div>
      {st.effects.length > 0 && (
        <ul className="fx">
          {st.effects.map((e) => (
            <li key={e}>
              <span>{e}</span>
            </li>
          ))}
        </ul>
      )}
      {inf?.effect && !st.effects.length ? <p>{String(inf.effect)}</p> : null}
      {list('Removed by', st.treat)}
      {list('Resisted by', st.resist)}
      <div className="note" style={{ marginTop: 6 }}>
        Click to open
      </div>
    </>
  );
}

function AbTip({ a }: { a: string }) {
  const ref = useApp((s) => s.ref);
  const party = useApp((s) => s.party);
  const tot = useTotals();
  const r = refAb(ref, a);
  const isAttr = ATTRS.includes(a);
  return (
    <>
      <div className="hd">
        <div>
          <h3 style={{ color: SCH[a] ? schoolColor(a) : 'inherit' }}>{a}</h3>
          <span className="school" style={css({ '--c': 'var(--muted)' })}>
            {isAttr ? 'Attribute' : r?.type ? `${String(r.type)} ability` : 'Ability'}
          </span>
        </div>
      </div>
      {r?.effect ? <p>{String(r.effect)}</p> : null}
      {r?.notes ? <p className="note">{String(r.notes)}</p> : null}
      <p className="note">
        Party totals:{' '}
        {MEMBERS.map((m, i) => (
          <span key={m.id}>
            {i > 0 && ' · '}
            {party[m.id].name} <b>{isAttr ? (tot[m.id].at[a] ?? '—') : (tot[m.id].ab[a] ?? 0)}</b>
          </span>
        ))}
      </p>
    </>
  );
}

function TipBody({ t }: { t: Target }) {
  const it = useApp((s) => (t.kind === 'item' ? s.items[t.key] : undefined));
  if (t.kind === 'skill') return <SkillTip name={t.key} from={t.from} />;
  if (t.kind === 'status') return <StatusTip name={t.key} />;
  if (t.kind === 'ab') return <AbTip a={t.key} />;
  return it ? <ItemTip it={it} id={t.key} /> : null;
}

export function Tooltip() {
  const [target, setTarget] = useState<Target | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const pinned = useRef(false);
  const hover = useRef(false);
  const [held, setHeld] = useState<'pinned' | 'held' | null>(null);
  const pickSlot = useApp((s) => s.ui.pickSlot);

  useEffect(() => {
    const kept = () => pinned.current || held !== null;
    const show = (el: Element) => {
      if (kept()) return;
      const h = el as HTMLElement;
      if (pickSlot && h.dataset.pick) return;
      const d = h.dataset;
      const t: Target | null = d.skill
        ? { kind: 'skill', key: d.skill, from: d.from, rect: h.getBoundingClientRect() }
        : d.status
          ? { kind: 'status', key: d.status, rect: h.getBoundingClientRect() }
          : d.ab
            ? { kind: 'ab', key: d.ab, rect: h.getBoundingClientRect() }
            : d.itemtip
              ? { kind: 'item', key: d.itemtip, rect: h.getBoundingClientRect() }
              : null;
      setTarget(t);
    };
    const hide = (force = false) => {
      if (kept() && !force) return;
      pinned.current = false;
      setHeld(null);
      setTarget(null);
    };
    const inTip = (n: EventTarget | null) => !!(n && box.current?.contains(n as Node));
    const over = (e: MouseEvent) => {
      if (inTip(e.target)) return;
      const c = (e.target as Element).closest?.(SEL);
      if (c) show(c);
    };
    const out = (e: MouseEvent) => {
      const c = (e.target as Element).closest?.(SEL);
      if (c && !c.contains(e.relatedTarget as Node) && !inTip(e.relatedTarget)) hide();
    };
    const focusIn = (e: FocusEvent) => {
      const c = (e.target as Element).closest?.(SEL);
      if (c && !inTip(c)) show(c);
    };
    const focusOut = (e: FocusEvent) => {
      if ((e.target as Element).closest?.(SEL) && !inTip(e.target)) hide();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Control' && e.key !== 'Meta') return;
      if (e.type === 'keydown') {
        if (target && !pinned.current) {
          pinned.current = true;
          setHeld('pinned');
        }
        return;
      }
      pinned.current = false;
      // stay until the mouse leaves it
      if ((hover.current || box.current?.matches(':hover')) && target) setHeld('held');
      else hide(true);
    };
    const blur = () => {
      if (pinned.current) key(new KeyboardEvent('keyup', { key: 'Control' }));
    };
    const scroll = () => hide();
    document.addEventListener('mouseover', over);
    document.addEventListener('mouseout', out);
    document.addEventListener('focusin', focusIn);
    document.addEventListener('focusout', focusOut);
    window.addEventListener('keydown', key);
    window.addEventListener('keyup', key);
    window.addEventListener('blur', blur);
    window.addEventListener('scroll', scroll, { passive: true });
    return () => {
      document.removeEventListener('mouseover', over);
      document.removeEventListener('mouseout', out);
      document.removeEventListener('focusin', focusIn);
      document.removeEventListener('focusout', focusOut);
      window.removeEventListener('keydown', key);
      window.removeEventListener('keyup', key);
      window.removeEventListener('blur', blur);
      window.removeEventListener('scroll', scroll);
    };
  }, [target, held, pickSlot]);

  // a navigation (chip click) closes any card
  const tab = useApp((s) => s.ui.tab);
  const q = useApp((s) => s.ui.q);
  // biome-ignore lint/correctness/useExhaustiveDependencies: close when the view changes
  useEffect(() => {
    pinned.current = false;
    setHeld(null);
    setTarget(null);
  }, [tab, q]);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el || !target) return;
    const r = target.rect;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const x = Math.min(window.innerWidth - w - 8, Math.max(8, r.left));
    let y = r.bottom + 6;
    if (y + h > window.innerHeight - 8) y = Math.max(8, r.top - h - 6);
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
  }, [target]);

  if (!target) return null;
  return (
    <div
      id="tip"
      className={`tip${held ? ` ${held}` : ''}`}
      role="tooltip"
      ref={box}
      onMouseEnter={() => {
        hover.current = true;
      }}
      onMouseLeave={() => {
        hover.current = false;
        if (!pinned.current) {
          setHeld(null);
          setTarget(null);
        }
      }}
    >
      <TipBody t={target} />
    </div>
  );
}
