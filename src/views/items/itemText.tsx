// Read-only item summaries: the one-line stat summary, damage text and the hover card.
import { Fragment, type ReactNode } from 'react';
import { typeLabel } from '../../domain/calc';
import { DMG_COL, DMG_EMO, KINDS, rarityColor, SOCKETS, slotDef } from '../../domain/constants';
import { fmt } from '../../domain/format';
import {
  handsOf,
  isWeapon,
  itemIconKey,
  runeBonuses,
  runeLabel,
  runeOf,
  runeSocket,
  socketedIn,
  whoWears,
} from '../../domain/items';
import type { Damage, Item } from '../../domain/types';
import { useApp } from '../../state/store';
import { AbChip, BonusChip, css, RarityTag } from '../../ui/chips';
import { GameIcon } from '../../ui/icons';

export function DmgText({ d }: { d: Damage | undefined }) {
  if (!d || (d.min == null && d.max == null)) return null;
  return (
    <span className="dmgt" style={css({ '--c': DMG_COL[d.type ?? ''] ?? 'var(--ink)' })}>
      {DMG_EMO[d.type ?? ''] ?? '⚔️'} {d.min ?? '?'}
      {d.max != null && d.max !== d.min ? `–${d.max}` : ''} {d.type ?? ''}
    </span>
  );
}

export const joinDots = (parts: ReactNode[]) =>
  parts.map((p, i) => (
    // biome-ignore lint/suspicious/noArrayIndexKey: positional
    <Fragment key={i}>
      {i > 0 && ' · '}
      {p}
    </Fragment>
  ));

/** The stats an item has, in one line; null when none were entered. */
export function useStatLine(it: Item): ReactNode[] {
  const items = useApp((s) => s.items);
  const s = it.st ?? {};
  const out: ReactNode[] = [];
  if (isWeapon(it)) {
    const h = handsOf(it);
    if (h) out.push(`✋ ${h}H`);
    if (s.dmg && (s.dmg.min != null || s.dmg.max != null)) out.push(<DmgText d={s.dmg} />);
    for (const x of s.extra ?? [])
      out.push(
        <>
          + <DmgText d={x} />
        </>,
      );
  }
  if (s.phys) out.push(`🛡 ${s.phys}`);
  if (s.magic) out.push(`✨ ${s.magic}`);
  if (s.crit) out.push(`🎲 ${s.crit}% crit`);
  if (s.critDmg) out.push(`💥 ${s.critDmg}% crit dmg`);
  if (s.block) out.push(`🧱 ${s.block}% block`);
  if (s.reqAttr)
    out.push(
      <>
        🔒 <AbChip a={s.reqAttr} suffix={s.reqVal ?? ''} inline />
      </>,
    );
  if (s.rune) out.push(`💎 ${runeLabel(items, s.rune)}`);
  if (s.weight) out.push(`⚖️ ${s.weight} kg`);
  if (s.value) out.push(`🪙 ${Number(s.value).toLocaleString()}`);
  return out;
}
export function StatLine({ it }: { it: Item }) {
  return <>{joinDots(useStatLine(it))}</>;
}

/** "≈ ⚔️ 21.3 avg (estimate)" for items saved from the calculator without real numbers. */
export function estimateText(it: Item): string {
  if (!it.base) return '';
  return it.base.damage != null
    ? `≈ ⚔️ ${fmt(it.base.damage)} avg (estimate)`
    : `≈ 🛡 ${fmt(it.base.phys || 0)} · ✨ ${fmt(it.base.magic || 0)} (estimate)`;
}

/** The hover card for an item. */
export function ItemTip({ it, id }: { it: Item; id?: string }) {
  const party = useApp((s) => s.party);
  const items = useApp((s) => s.items);
  const ref = useApp((s) => s.ref);
  const statLine = useStatLine(it);
  const s = it.st ?? {};
  const rb = runeBonuses(items, it);
  const r = runeOf(items, it);
  const w = id ? whoWears(party, id) : null;
  const rows: [string, string, ReactNode][] = [];
  const add = (icon: string, label: string, val: ReactNode) => {
    if (val != null && val !== '') rows.push([icon, label, val]);
  };
  if (isWeapon(it)) {
    const h = handsOf(it);
    add('✋', 'Hands', h ? `${h}H` : null);
    add(DMG_EMO[s.dmg?.type ?? ''] ?? '⚔️', 'Damage', s.dmg ? <DmgText d={s.dmg} /> : null);
    for (const x of s.extra ?? []) add('➕', 'Extra damage', <DmgText d={x} />);
    add('🎲', 'Crit chance', s.crit != null ? `${s.crit}%` : null);
    add('💥', 'Crit damage', s.critDmg != null ? `${s.critDmg}%` : null);
  }
  add('🛡', 'Physical armour', s.phys != null ? String(s.phys) : null);
  add('✨', 'Magic armour', s.magic != null ? String(s.magic) : null);
  add('🧱', 'Block', s.block != null ? `${s.block}%` : null);
  add('🔒', 'Requires', s.reqAttr ? <AbChip a={s.reqAttr} suffix={s.reqVal ?? ''} inline /> : null);
  add('💎', 'Rune slot', s.rune ? (s.rune === 'empty' ? 'Empty' : r ? r.name || 'Rune' : '?') : null);
  add('⚖️', 'Weight', s.weight != null ? `${s.weight} kg` : null);
  add('🪙', 'Value', s.value != null ? Number(s.value).toLocaleString() : null);
  if (!statLine.length && it.base)
    add(
      '≈',
      'Estimate',
      it.base.damage != null
        ? `${fmt(it.base.damage)} avg damage`
        : `🛡 ${fmt(it.base.phys || 0)} · ✨ ${fmt(it.base.magic || 0)}`,
    );
  const sub = [
    it.rarity ? <RarityTag key="rarity" r={it.rarity} /> : null,
    typeLabel(ref, it.type) || KINDS[it.kind] || it.kind || '',
    it.level ? `Level ${it.level}` : '',
  ].filter(Boolean);
  const host = id && it.kind === 'rune' ? socketedIn(items, id) : null;
  return (
    <div className="itip" style={css({ '--rc': rarityColor(it.rarity) || 'var(--ink)' })}>
      <div className="hd">
        <div className="iti">
          <GameIcon k={itemIconKey(it)} />
        </div>
        <div>
          <div className="nm">{it.name || '(unnamed)'}</div>
          <div className="note">{joinDots(sub)}</div>
        </div>
      </div>
      {rows.length > 0 && (
        <dl className="istats">
          {rows.map(([icon, label, val]) => (
            <Fragment key={label + icon}>
              <dt title={label}>
                {icon} {label}
              </dt>
              <dd>{val}</dd>
            </Fragment>
          ))}
        </dl>
      )}
      {(it.bonuses ?? []).length > 0 && (
        <div className="bon" style={{ marginTop: 6 }}>
          {it.bonuses.map((b, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: positional
            <BonusChip key={i} bonus={b} />
          ))}
        </div>
      )}
      {r && (
        <div className="irune">
          <p className="note">
            💎 {r.name || 'Rune'} · {runeSocket(it)} effect
          </p>
          {rb.length ? (
            <div className="bon">
              {rb.map((b, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: positional
                <BonusChip key={i} bonus={b} />
              ))}
            </div>
          ) : (
            <p className="note">No effect entered yet</p>
          )}
        </div>
      )}
      {it.kind === 'rune' &&
        SOCKETS.map(([k, ic, label]) => {
          const arr = it.runeFx?.[k] ?? [];
          return arr.length ? (
            <Fragment key={k}>
              <p className="note" style={{ margin: '6px 0 2px' }}>
                {ic} {label}
              </p>
              <div className="bon">
                {arr.map((b, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: positional
                  <BonusChip key={i} bonus={b} />
                ))}
              </div>
            </Fragment>
          ) : null;
        })}
      {it.notes && (
        <p className="note" style={{ whiteSpace: 'pre-line' }}>
          {it.notes}
        </p>
      )}
      <p className="note ifoot">
        {w
          ? `Worn by ${party[w.member].name} · ${slotDef(w.slot)?.label ?? w.slot}`
          : it.kind === 'rune'
            ? host
              ? `Socketed in ${host.name || 'an item'}`
              : 'Loose'
            : 'In the bag'}
        <span className="pinhint"> · hold Ctrl to keep this open</span>
      </p>
    </div>
  );
}
