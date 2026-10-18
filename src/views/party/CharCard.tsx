// The character card: gear tiles in the game's layout around a portrait, the item picker and the item pop-up.
import { type KeyboardEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { bonusLabel } from '../../domain/bonus';
import { textOf } from '../../domain/codex';
import { BASE_VIT, GENDERS, KINDS, RACES, RARITIES, rarityColor, type SlotDef, slotDef } from '../../domain/constants';
import { handsOf, isWeapon, itemIconKey, runeOf, slotItem, type WornItem, whoWears } from '../../domain/items';
import { derived, portraitKey } from '../../domain/party';
import { refRows } from '../../domain/ref';
import type { MemberId } from '../../domain/types';
import { useCanEdit, useTotals } from '../../state/hooks';
import { clearSlot, createItem, editMember, equip, setUi, useApp } from '../../state/store';
import { BonusChip, css } from '../../ui/chips';
import { GameIcon } from '../../ui/icons';
import { Pencil, X } from '../../ui/lucide';
import { ItemEditor } from '../items/ItemEditor';
import { DmgText, joinDots, useStatLine } from '../items/itemText';

const emptyIcon = (slot: string) =>
  slot.startsWith('ring') ? 'ring' : slot === 'main' ? 'sword' : slot === 'off' ? 'shield' : slot;

/** A gear tile. Full size on the character card (click to pick, ✎ to edit), or a small icon on overview cards. */
export function Tile({ id, def, mini }: { id: MemberId; def: SlotDef; mini?: boolean }) {
  const party = useApp((s) => s.party);
  const items = useApp((s) => s.items);
  const editing = useApp((s) => s.ui.editing);
  const pickSlot = useApp((s) => s.ui.pickSlot);
  const canEdit = useCanEdit();
  const main = slotItem(party, items, id, 'main');
  let it: WornItem | null = slotItem(party, items, id, def.id);
  let locked = false;
  if (def.id === 'off' && handsOf(main) === 2) {
    it = main;
    locked = true;
  }
  const rc = it ? rarityColor(it.rarity) || 'var(--ink)' : 'var(--line)';
  if (mini)
    return (
      <div
        className={`mtile${it ? '' : ' empty'}${locked ? ' locked2' : ''}`}
        style={css({ '--rc': rc })}
        data-itemtip={it?.id}
        role="img"
        aria-label={`${def.label}: ${it ? it.name || '' : 'empty'}`}
      >
        <GameIcon k={it ? itemIconKey(it) : emptyIcon(def.id)} />
      </div>
    );
  const canSwap = canEdit && !locked;
  // a tile is a button when its item can be swapped, otherwise a labelled group
  const pick = canSwap
    ? {
        'data-pick': def.id,
        onClick: (e: React.MouseEvent) => {
          if ((e.target as HTMLElement).closest('[data-pop]')) return;
          setUi((u) => {
            u.pickSlot = u.pickSlot === def.id ? null : def.id;
            u.popSlot = null;
          });
        },
        onKeyDown: (e: KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            (e.currentTarget as HTMLElement).click();
          }
        },
        'aria-expanded': pickSlot === def.id,
      }
    : {};
  if (!it)
    return (
      // biome-ignore lint/a11y/useAriaPropsSupportedByRole: the role is button or group, both take aria-label
      <div
        className="tile empty"
        role={canSwap ? 'button' : 'group'}
        tabIndex={canSwap ? 0 : undefined}
        aria-label={`${def.label}: empty${canSwap ? ' (click to pick an item)' : ''}`}
        {...pick}
      >
        <div className="ico">
          <GameIcon k={emptyIcon(def.id)} />
        </div>
        <div className="tx">
          <span className="sl2">{def.label}</span>
          <span className="nm">—</span>
        </div>
      </div>
    );
  return <FullTile it={it} def={def} locked={locked} rc={rc} pick={pick} canSwap={canSwap} pen={canSwap && editing} />;
}

function FullTile({
  it,
  def,
  locked,
  rc,
  pick,
  canSwap,
  pen,
}: {
  it: WornItem;
  def: SlotDef;
  locked: boolean;
  rc: string;
  pick: object;
  canSwap: boolean;
  pen: boolean;
}) {
  const items = useApp((s) => s.items);
  const s = it.st ?? {};
  const rune = runeOf(items, it);
  const sub =
    isWeapon(it) && s.dmg ? (
      <DmgText d={s.dmg} />
    ) : s.phys || s.magic ? (
      `🛡 ${s.phys || 0} · ✨ ${s.magic || 0}`
    ) : (
      (it.bonuses ?? []).slice(0, 2).map(bonusLabel).join(', ')
    );
  return (
    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: the role is button or group, both take aria-label
    <div
      className={`tile${locked ? ' locked2' : ''}`}
      style={css({ '--rc': rc })}
      data-itemtip={it.id}
      role={canSwap ? 'button' : 'group'}
      tabIndex={canSwap ? 0 : undefined}
      aria-label={`${def.label}: ${it.name || ''}`}
      {...pick}
    >
      <div className="ico">
        <GameIcon k={itemIconKey(it)} />
      </div>
      <div className="tx">
        <span className="sl2">
          {def.label}
          {locked ? ' · 2H' : ''}
        </span>
        <span className="nm">{it.name || '(unnamed)'}</span>
        <span className="mini2">{sub || ' '}</span>
      </div>
      {rune && (
        <span className="rn" title={`Rune: ${rune.name}`}>
          <GameIcon k="rune" />
        </span>
      )}
      {pen && (
        <button
          type="button"
          className="pen"
          data-pop={def.id}
          title="Edit this item"
          aria-label={`Edit ${def.label} item`}
          onClick={() =>
            setUi((u) => {
              u.pickSlot = null;
              u.popSlot = def.id;
            })
          }
        >
          <Pencil />
        </button>
      )}
    </div>
  );
}

/** Item picker anchored to a slot: searchable, Enter = first match, ↑/↓, Esc. */
export function Picker({ id }: { id: MemberId }) {
  const pickSlot = useApp((s) => s.ui.pickSlot);
  const party = useApp((s) => s.party);
  const items = useApp((s) => s.items);
  const box = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState('');
  const def = pickSlot ? slotDef(pickSlot) : undefined;
  const cur = def ? party[id].gear?.[def.id]?.itemId : undefined;
  const list = useMemo(
    () =>
      def
        ? Object.entries(items)
            .filter(([, x]) => def.kinds.includes(x.kind) && !(def.id === 'off' && handsOf(x) === 2))
            .sort(
              (a, b) =>
                RARITIES.indexOf(b[1].rarity) - RARITIES.indexOf(a[1].rarity) ||
                String(a[1].name).localeCompare(String(b[1].name)),
            )
        : [],
    [def, items],
  );
  const shown = list.filter(([, x]) => !q || textOf(x).includes(q.trim().toLowerCase()));
  // position next to the slot's tile; keep it there while scrolling
  useLayoutEffect(() => {
    if (!def) return;
    const place = () => {
      const pk = box.current;
      const t = document.querySelector(`[data-pick="${def.id}"]`);
      if (!pk || !t) return;
      const r = t.getBoundingClientRect();
      const w = Math.min(380, window.innerWidth - 16);
      pk.style.width = `${w}px`;
      const x = Math.min(window.innerWidth - w - 8, Math.max(8, r.left));
      let y = r.bottom + 4;
      const h = pk.offsetHeight;
      if (y + h > window.innerHeight - 8) y = Math.max(8, r.top - h - 4);
      pk.style.left = `${x}px`;
      pk.style.top = `${y}px`;
    };
    place();
    window.addEventListener('scroll', place, { passive: true });
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place);
      window.removeEventListener('resize', place);
    };
  });
  useEffect(() => {
    if (!def) return;
    setQ('');
    box.current?.querySelector<HTMLInputElement>('[data-picksearch]')?.focus({ preventScroll: true });
    const down = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest('.picker') && !t.closest('[data-pick]'))
        setUi((u) => {
          u.pickSlot = null;
        });
    };
    document.addEventListener('mousedown', down);
    return () => document.removeEventListener('mousedown', down);
  }, [def]);
  if (!def) return null;
  const close = () => {
    setUi((u) => {
      u.pickSlot = null;
    });
    document.querySelector<HTMLElement>(`[data-pick="${def.id}"]`)?.focus();
  };
  const choose = (v: string) => {
    setUi((u) => {
      u.pickSlot = null;
    });
    if (v === '__new') {
      const iid = createItem({ kind: def.kinds[0] });
      equip(iid, id, def.id);
      setUi((u) => {
        u.popSlot = def.id;
      });
    } else if (!v) clearSlot(id, def.id);
    else equip(v, id, def.id);
  };
  const rows = () => [...(box.current?.querySelectorAll<HTMLButtonElement>('.plist .prow') ?? [])];
  const onKey = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement;
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (t.dataset.picksearch && e.key === 'Enter') {
      e.preventDefault();
      rows()[0]?.click();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const all = rows();
      const i = all.indexOf(t as HTMLButtonElement);
      if (t.dataset.picksearch && e.key === 'ArrowDown') {
        e.preventDefault();
        all[0]?.focus();
      } else if (i >= 0) {
        e.preventDefault();
        const n = all[i + (e.key === 'ArrowDown' ? 1 : -1)];
        if (n) n.focus();
        else if (e.key === 'ArrowUp') box.current?.querySelector<HTMLInputElement>('[data-picksearch]')?.focus();
      }
    }
  };
  return (
    <div className="picker" role="dialog" aria-label={`Choose ${def.label}`} ref={box} onKeyDown={onKey}>
      <div className="phd">
        {def.label}
        <button type="button" className="x" aria-label="Close" onClick={close}>
          <X />
        </button>
      </div>
      <div className="psearch">
        <input
          type="search"
          data-picksearch="1"
          placeholder={`Search ${list.length} item${list.length === 1 ? '' : 's'}: name, stat, bonus…`}
          aria-label="Search items"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className="plist" role="listbox">
        {list.length === 0 && (
          <p className="note" style={{ padding: '6px 10px' }}>
            No items of this kind yet.
          </p>
        )}
        {shown.map(([iid]) => (
          <PickRow key={iid} iid={iid} id={id} slot={def.id} cur={cur} onPick={choose} />
        ))}
      </div>
      {list.length > 0 && shown.length === 0 && (
        <p className="note pempty" style={{ padding: '8px 14px' }}>
          Nothing matches.
        </p>
      )}
      <div className="pfoot">
        {cur && (
          <button type="button" className="btn" onClick={() => choose('')}>
            Unequip
          </button>
        )}
        <button type="button" className="btn" onClick={() => choose('__new')}>
          ＋ New item
        </button>
      </div>
    </div>
  );
}

function PickRow({
  iid,
  id,
  slot,
  cur,
  onPick,
}: {
  iid: string;
  id: MemberId;
  slot: string;
  cur: string | undefined;
  onPick(v: string): void;
}) {
  const x = useApp((s) => s.items[iid]);
  const party = useApp((s) => s.party);
  const statLine = useStatLine(x ?? ({ kind: '', name: '', rarity: '', bonuses: [] } as never));
  if (!x) return null;
  const w = whoWears(party, iid);
  const other = w && !(w.member === id && w.slot === slot);
  return (
    <button
      type="button"
      className={`prow${iid === cur ? ' cur' : ''}`}
      role="option"
      aria-selected={iid === cur}
      data-itemtip={iid}
      style={css({ '--rc': rarityColor(x.rarity) || 'var(--ink)' })}
      onClick={() => onPick(iid)}
    >
      <span className="pi">
        <GameIcon k={itemIconKey(x)} />
      </span>
      <span className="pt">
        <span className="nm">{x.name || '(unnamed)'}</span>
        <span className="note">{statLine.length ? joinDots(statLine) : (KINDS[x.kind] ?? '')}</span>
      </span>
      {other ? (
        <span className="tag">on {party[w.member].name}</span>
      ) : iid === cur ? (
        <span className="tag">equipped</span>
      ) : null}
    </button>
  );
}

/** The ✎ pop-up: choose the slot's item and edit it in full. */
export function ItemPop({ id }: { id: MemberId }) {
  const popSlot = useApp((s) => s.ui.popSlot);
  const def = popSlot ? slotDef(popSlot) : undefined;
  useEffect(() => {
    if (!def) return;
    document.querySelector<HTMLElement>('.pop select, .pop input')?.focus();
  }, [def]);
  if (!def) return null;
  const close = () => {
    setUi((u) => {
      u.popSlot = null;
    });
    document.querySelector<HTMLElement>(`[data-pop="${def.id}"]`)?.focus();
  };
  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Escape is handled on the dialog
    // biome-ignore lint/a11y/noStaticElementInteractions: clicking the backdrop closes the dialog
    <div className="popwrap" onClick={(e) => e.target === e.currentTarget && close()}>
      <div
        className="pop"
        role="dialog"
        aria-modal="true"
        aria-label={`Edit ${def.label}`}
        onKeyDown={(e) => e.key === 'Escape' && close()}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h3 style={{ flex: 1 }}>{def.label}</h3>
          <button type="button" className="x" aria-label="Close" onClick={close}>
            <X />
          </button>
        </div>
        <SlotEditor id={id} def={def} />
      </div>
    </div>
  );
}

function SlotEditor({ id, def }: { id: MemberId; def: SlotDef }) {
  const party = useApp((s) => s.party);
  const items = useApp((s) => s.items);
  const canEdit = useCanEdit();
  const g = party[id].gear?.[def.id];
  const it = slotItem(party, items, id, def.id);
  const main = def.id === 'off' ? slotItem(party, items, id, 'main') : null;
  if (main && handsOf(main) === 2)
    return (
      <div className="slot locked" data-slot="off" title="Two-handed: occupies both hands">
        <div className="sh">
          <span className="sl">{def.label}</span>
          <select
            className="rarsel"
            data-rar={main.rarity ?? ''}
            style={css({ '--rc': rarityColor(main.rarity) })}
            disabled
            aria-label={`Off hand: ${main.name || 'two-handed weapon'}`}
          >
            <option>{main.name || '(two-handed weapon)'}</option>
          </select>
          <span className="note">✋ 2H</span>
        </div>
      </div>
    );
  const choices = Object.entries(items)
    .filter(([, x]) => def.kinds.includes(x.kind) && !(def.id === 'off' && handsOf(x) === 2))
    .sort((a, b) => String(a[1].name).localeCompare(String(b[1].name)));
  return (
    <div className="slot" data-slot={def.id}>
      <div className="sh">
        <span className="sl">{def.label}</span>
        <select
          className="rarsel"
          data-rar={it?.rarity ?? ''}
          style={css({ '--rc': it ? rarityColor(it.rarity) : '' })}
          aria-label={`${def.label} item`}
          disabled={!canEdit}
          value={g?.itemId ?? ''}
          onChange={(e) => {
            const v = e.target.value;
            if (v === '__new') {
              const iid = createItem({ kind: def.kinds[0] });
              equip(iid, id, def.id);
              setTimeout(() => document.querySelector<HTMLInputElement>(`[data-item="${iid}"] .iname`)?.focus(), 0);
            } else if (!v) clearSlot(id, def.id);
            else equip(v, id, def.id);
          }}
        >
          <option value="">— empty —</option>
          {choices.map(([iid, x]) => {
            const w = whoWears(party, iid);
            return (
              <option key={iid} value={iid} style={{ color: rarityColor(x.rarity) }}>
                {x.name || '(unnamed)'}
                {w && !(w.member === id && w.slot === def.id) ? ` (on ${party[w.member].name})` : ''}
              </option>
            );
          })}
          {canEdit && <option value="__new">＋ New item…</option>}
        </select>
      </div>
      {it?.id ? (
        <ItemEditor iid={it.id} it={it} cols={def.cols} />
      ) : it ? (
        <div className="bon">
          {(it.bonuses ?? []).map((b, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: positional
            <BonusChip key={i} bonus={b} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function CharCard({ id }: { id: MemberId }) {
  const p = useApp((s) => s.party[id]);
  const ref = useApp((s) => s.ref);
  const editing = useApp((s) => s.ui.editing);
  const canEdit = useCanEdit();
  const tot = useTotals()[id];
  const d = derived(p, tot, ref);
  const ed = canEdit && editing;
  const raceTraits = p.race ? refRows(ref, 'raceTraits').filter((r) => r.race === p.race) : [];
  const T = (k: string) => <Tile id={id} def={slotDef(k) as SlotDef} />;
  const sel = (f: 'race' | 'gender', opts: string[], ph: string) => (
    <select
      className="ccsel"
      aria-label={ph}
      disabled={!canEdit}
      value={p[f] ?? ''}
      onChange={(e) =>
        editMember(id, (m) => {
          m[f] = e.target.value || null;
        })
      }
    >
      <option value="">{ph}</option>
      {opts.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  );
  return (
    <section className="card cc-card">
      <div className="cc">
        <div className="cc-helm">{T('helmet')}</div>
        <div className="cc-left">
          {['chest', 'gloves', 'belt', 'boots'].map((k) => (
            <Tile key={k} id={id} def={slotDef(k) as SlotDef} />
          ))}
        </div>
        <div className="cc-mid">
          <div className="portrait">
            <GameIcon k={portraitKey(p)} />
          </div>
          <div className="ccname">{p.name}</div>
          {ed ? (
            <div className="ccrow">
              {sel('race', RACES, 'Race')}
              {sel('gender', GENDERS, 'Gender')}
              <label className="mini" title="Undead">
                <input
                  type="checkbox"
                  checked={!!p.undead}
                  onChange={(e) =>
                    editMember(id, (m) => {
                      m.undead = e.target.checked;
                    })
                  }
                />{' '}
                Undead
              </label>
            </div>
          ) : (
            <div className="note">
              {[p.undead ? 'Undead' : '', p.race || '', p.gender || ''].filter(Boolean).join(' ') || 'Race not set'} ·
              Level {p.level || '?'}
            </div>
          )}
          <div className="ccstats">
            <div
              title={`Vitality estimate: base ${BASE_VIT[d.L]} at level ${d.L} × (1 + 7% per Constitution over 10${d.pct ? ` + ${d.pct}% from gear/race` : ''})${d.flat ? ` + ${d.flat} flat` : ''}`}
            >
              <span className="si">
                <GameIcon k="heart" />
              </span>
              <b>≈{d.vit.toLocaleString()}</b>
              <small>Vitality{d.conKnown ? '' : ' (Con 10 assumed)'}</small>
            </div>
            <div title={`Action points: start ${d.start}, max ${d.maxAP}, recovery ${d.rec} per turn`}>
              <span className="si">
                <GameIcon k="ap" />
              </span>
              <b>
                {d.start} / {d.maxAP}
              </b>
              <small>AP start / max · +{d.rec}/turn</small>
            </div>
          </div>
          {raceTraits.length > 0 && (
            <div className="bon" style={{ justifyContent: 'center' }}>
              {raceTraits.map((r) => (
                <span key={String(r.trait)} className="bchip" title={String(r.description ?? '')}>
                  {String(r.trait)}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="cc-right">
          {['amulet', 'ring1', 'ring2', 'leggings'].map((k) => (
            <Tile key={k} id={id} def={slotDef(k) as SlotDef} />
          ))}
        </div>
        <div className="cc-weap">
          {T('main')}
          {T('off')}
        </div>
      </div>
      <p className="note">
        Hover an item for details (hold Ctrl to keep it open)
        {canEdit ? `. Click a slot to swap the item${ed ? '; the ✎ pen edits the item itself' : ''}` : ''}. Vitality is
        an estimate from the level table and Constitution (+7% per point); AP uses the base 4 start / 6 max / 4 recovery
        plus gear and Glass Cannon. Lone Wolf isn't applied (party of four), nor are conditional effects like What a
        Rush.
      </p>
      {canEdit && <ItemPop id={id} />}
      {canEdit && <Picker id={id} />}
    </section>
  );
}
