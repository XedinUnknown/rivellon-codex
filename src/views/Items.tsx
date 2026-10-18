import { useMemo, useState } from 'react';
import { matches, textOf } from '../domain/codex';
import { KIND_COLS, KINDS, MEMBERS, rarityColor, SLOTS, slotDef } from '../domain/constants';
import { fmt, slug } from '../domain/format';
import { handsOf, itemIconKey, itemTotals, slotItem, socketedIn, whoWears } from '../domain/items';
import type { Item, MemberId } from '../domain/types';
import { useCanEdit, useUi } from '../state/hooks';
import { createItem, deleteItem, equip, setUi, unequip, useApp } from '../state/store';
import { css } from '../ui/chips';
import { GameIcon } from '../ui/icons';
import { StatusLine } from '../ui/StatusLine';
import { ItemEditor } from './items/ItemEditor';
import { estimateText, useStatLine } from './items/itemText';

const KIND_ORDER = Object.keys(KINDS);

export function ItemsView() {
  const items = useApp((s) => s.items);
  const party = useApp((s) => s.party);
  const backend = useApp((s) => s.backend);
  const canEdit = useCanEdit();
  const { q, kinds } = useUi((u) => ({ q: u.q.trim().toLowerCase(), kinds: u.kinds }));
  const [newKind, setNewKind] = useState('weapon');
  const all = useMemo(() => Object.entries(items).map(([id, it]) => ({ id, it })), [items]);
  const list = useMemo(
    () =>
      all
        .filter(({ it }) => (!kinds.length || kinds.includes(it.kind)) && matches(textOf(it), q))
        .sort(
          (a, b) =>
            KIND_ORDER.indexOf(a.it.kind) - KIND_ORDER.indexOf(b.it.kind) ||
            String(a.it.name).localeCompare(String(b.it.name)),
        ),
    [all, kinds, q],
  );
  const t = itemTotals(party, items);
  const where =
    backend?.kind === 'file'
      ? `in ${backend.name}`
      : backend?.kind === 'browser'
        ? 'in browser storage'
        : "in the page's database";
  return (
    <>
      <StatusLine>
        {`${list.length} of ${all.length} items · 🪙 ${t.bagGold.toLocaleString()} in the bag, ${t.wornGold.toLocaleString()} worn · ⚖️ ${fmt(t.bagKg)} kg in the bag · saved ${where}`}
      </StatusLine>
      {canEdit && (
        <div className="card" style={{ marginTop: 14 }}>
          <div className="ctl">
            <label>
              New item of type
              <select value={newKind} onChange={(e) => setNewKind(e.target.value)}>
                {Object.entries(KINDS).map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="btn"
              onClick={() => {
                const iid = createItem({ kind: newKind });
                setTimeout(() => document.querySelector<HTMLInputElement>(`[data-item="${iid}"] .iname`)?.focus(), 0);
              }}
            >
              Add item
            </button>
            <span className="note">Or build one from the Gear calculator, or from an empty Party slot.</span>
          </div>
        </div>
      )}
      {!list.length ? (
        <div className="empty" style={{ marginTop: 12 }}>
          {all.length ? 'No items match.' : 'No items saved yet.'}
        </div>
      ) : (
        <div className="rows">
          {list.map(({ id, it }) => (
            <ItemRow key={id} id={id} it={it} />
          ))}
        </div>
      )}
    </>
  );
}

function ItemRow({ id, it }: { id: string; it: Item }) {
  const party = useApp((s) => s.party);
  const items = useApp((s) => s.items);
  const confirmDel = useApp((s) => s.ui.confirmDel);
  const canEdit = useCanEdit();
  const statLine = useStatLine(it);
  const w = whoWears(party, id);
  const fits = SLOTS.filter((s) => s.kinds.includes(it.kind) && !(s.id === 'off' && handsOf(it) === 2));
  const host = it.kind === 'rune' ? socketedIn(items, id) : null;
  return (
    <article className="rrow" id={slug('it', id)} style={css({ '--c': rarityColor(it.rarity) || 'var(--line)' })}>
      <div className="hd">
        <span style={{ width: 26, height: 26, color: rarityColor(it.rarity) || 'var(--muted)' }}>
          <GameIcon k={itemIconKey(it)} />
        </span>
        <span className="tag">{KINDS[it.kind] ?? it.kind}</span>
        {!statLine.length && it.base && <span className="tag">{estimateText(it)}</span>}
        {it.kind === 'rune' ? (
          host ? (
            <span className="tag" style={{ color: 'var(--known)' }}>
              💎 In {host.name || 'an item'}
            </span>
          ) : (
            <span className="tag">Loose</span>
          )
        ) : w ? (
          <span className="tag" style={{ color: 'var(--known)' }}>
            Worn by {party[w.member].name} ({slotDef(w.slot)?.label})
          </span>
        ) : (
          <span className="tag">In the bag</span>
        )}
      </div>
      <ItemEditor iid={id} it={it} cols={KIND_COLS[it.kind] ?? []} />
      {canEdit && (
        <div className="addrow" style={{ marginTop: 6 }}>
          {it.kind !== 'rune' && (
            <select
              aria-label="Equip on"
              value=""
              onChange={(e) => {
                const v = e.target.value;
                if (!v) return;
                if (v === 'unequip') unequip(id);
                else {
                  const [m, s] = v.split(':') as [MemberId, string];
                  equip(id, m, s);
                }
              }}
            >
              <option value="">Equip on…</option>
              {MEMBERS.flatMap((m) =>
                fits.map((s) => (
                  <option key={`${m.id}:${s.id}`} value={`${m.id}:${s.id}`}>
                    {party[m.id].name} · {s.label}
                    {slotItem(party, items, m.id, s.id) ? ' (replace)' : ''}
                  </option>
                )),
              )}
              {w && <option value="unequip">Unequip</option>}
            </select>
          )}
          <button
            type="button"
            className="btn"
            onClick={() => {
              if (confirmDel !== id)
                return setUi((u) => {
                  u.confirmDel = id;
                });
              setUi((u) => {
                u.confirmDel = null;
              });
              deleteItem(id);
            }}
          >
            {confirmDel === id ? 'Click again to delete' : 'Delete'}
          </button>
        </div>
      )}
    </article>
  );
}
