// The full item editor (name, rarity, level, stats, rune slot, bonuses), used on the Items tab and in party slots.
import { type KeyboardEvent, memo, useMemo } from 'react';
import { bonusLabel, parseBonus } from '../../domain/bonus';
import { calcTypes } from '../../domain/calc';
import { codex } from '../../domain/codex';
import {
  AB_ALL,
  ATTRS,
  DMG_COL,
  DMG_EMO,
  DMG_TYPES,
  RARITIES,
  RESISTS,
  rarityColor,
  SOCKETS,
} from '../../domain/constants';
import { handsOf, hasArmour, isWeapon, runeBonuses, runeSocket, sheetRune, socketedIn } from '../../domain/items';
import { refRows } from '../../domain/ref';
import type { Bonus, GearRoll, Item, ItemStats, RefTables, Socket } from '../../domain/types';
import { useCanEdit } from '../../state/hooks';
import { createItem, editItem, useApp } from '../../state/store';
import { BonusChip, css } from '../../ui/chips';
import { NumInput } from '../../ui/fields';

/** Bonus suggestions for the add-bonus field: the sheet's rolls for these Gear Stats columns plus common ones. */
export function suggestions(ref: RefTables, cols: string[]): string[] {
  const opts = new Set<string>();
  for (const r of refRows<GearRoll>(ref, 'gearRolls').filter((r) => cols.includes(r.slot))) {
    if (r.kind === 'skill') opts.add(`Skill: ${r.stat}`);
    else if (r.kind === 'stat') opts.add(`${r.stat} +${r.min}${r.pct ? '%' : ''}`);
    else if (r.kind !== 'rune') opts.add(r.text);
  }
  for (const a of AB_ALL) opts.add(`${a} +1`);
  for (const r of RESISTS) opts.add(`${r} +5%`);
  for (const s of [
    'HP +20',
    'Reflect 10% melee damage as Air',
    'Reflect 10% ranged damage as Physical',
    'Vitality +10%',
    'Movement +0.5',
    'Initiative +2',
    'Crit Chance +3%',
    'Crit Damage +10%',
    'Accuracy +5%',
    'Dodging +5%',
    'Life Steal +5%',
    'Damage +5%',
  ])
    opts.add(s);
  for (const s of ['Cursed', 'Warm', 'Burning', 'Blessed', 'Regenerating', 'Magic Shell']) opts.add(`Status: ${s}`);
  const { data } = codex();
  for (const s of [...data.skills, ...data.special].map((x) => x.name).sort()) opts.add(`Skill: ${s}`);
  for (const s of [
    'Stunned',
    'Knocked Down',
    'Burning',
    'Poisoned',
    'Chilled',
    'Frozen',
    'Shocked',
    'Bleeding',
    'Diseased',
  ])
    opts.add(`Immune to ${s}`);
  return [...opts];
}

export const Suggestions = memo(function Suggestions({ id, cols }: { id: string; cols: string[] }) {
  const ref = useApp((s) => s.ref);
  const key = cols.join('|');
  // biome-ignore lint/correctness/useExhaustiveDependencies: cols are compared by content
  const opts = useMemo(() => suggestions(ref, cols), [ref, key]);
  return (
    <datalist id={id}>
      {opts.map((o) => (
        <option key={o} value={o} />
      ))}
    </datalist>
  );
});

/** The bonus list being edited: the item's own, or a rune's effect for one socket type. */
function bonusArr(it: Item, sock: Socket | ''): Bonus[] {
  if (!sock) {
    it.bonuses ??= [];
    return it.bonuses;
  }
  it.runeFx ??= {};
  it.runeFx[sock] ??= [];
  return it.runeFx[sock];
}

/** A bonus list with remove buttons and an add field (Enter adds what's typed). */
export function BonusList({
  iid,
  arr,
  sock,
  dl,
  placeholder,
}: {
  iid: string;
  arr: Bonus[];
  sock: Socket | '';
  dl: string;
  placeholder: string;
}) {
  const canEdit = useCanEdit();
  const add = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    const b = parseBonus(e.currentTarget.value);
    if (!b) return;
    e.preventDefault();
    e.currentTarget.value = '';
    editItem(iid, (it) => void bonusArr(it, sock).push(b), 200);
  };
  return (
    <>
      <div className="bon">
        {arr.map((b, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: bonuses are positional
          <span key={i} className="bwrap">
            <BonusChip bonus={b} />
            {canEdit && (
              <button
                type="button"
                className="x"
                aria-label={`Remove ${bonusLabel(b)}`}
                onClick={() => editItem(iid, (it) => void bonusArr(it, sock).splice(i, 1), 200)}
              >
                ×
              </button>
            )}
          </span>
        ))}
      </div>
      {canEdit && (
        <div className="addrow">
          <input type="text" list={dl} placeholder={placeholder} aria-label="Add a bonus" onKeyDown={add} />
        </div>
      )}
    </>
  );
}

function Mini({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: the control is passed in as children
    <label className="mini" title={title}>
      <span aria-hidden="true">{icon}</span>
      <span className="sr">{title}</span>
      {children}
    </label>
  );
}

function DmgTypeSelect({ value, onValue, disabled }: { value: string; onValue(v: string): void; disabled: boolean }) {
  return (
    <select
      className="dmgsel"
      style={css({ '--dc': DMG_COL[value] ?? 'var(--ink)' })}
      aria-label="Damage type"
      disabled={disabled}
      value={value}
      onChange={(e) => onValue(e.target.value)}
    >
      {DMG_TYPES.map((t) => (
        <option key={t} value={t} style={{ color: DMG_COL[t] }}>
          {DMG_EMO[t]} {t}
        </option>
      ))}
    </select>
  );
}

function StatsEditor({ iid, it }: { iid: string; it: Item }) {
  const ref = useApp((s) => s.ref);
  const items = useApp((s) => s.items);
  const canEdit = useCanEdit();
  const dis = !canEdit;
  const s: ItemStats = it.st ?? {};
  const setSt = (recipe: (st: ItemStats) => void) =>
    editItem(iid, (x) => {
      x.st ??= {};
      recipe(x.st);
    });
  const num = (f: keyof ItemStats, ph: string, w: string) => (
    <NumInput
      step="any"
      value={s[f] as number | null | undefined}
      placeholder={ph}
      aria-label={ph}
      style={{ width: w }}
      disabled={dis}
      onValue={(v) =>
        setSt((st) => {
          (st as Record<string, unknown>)[f] = v;
        })
      }
    />
  );
  const dmgNum = (which: 'dmg' | 'extra', f: 'min' | 'max', ph: string) => (
    <NumInput
      step="any"
      value={which === 'dmg' ? s.dmg?.[f] : s.extra?.[0]?.[f]}
      placeholder={ph}
      aria-label={ph}
      style={{ width: '4.4em' }}
      disabled={dis}
      onValue={(v) =>
        setSt((st) => {
          if (which === 'dmg') st.dmg = { type: 'Physical', ...(st.dmg ?? {}), [f]: v };
          else {
            const e = { type: 'Fire', ...(st.extra?.[0] ?? {}), [f]: v };
            st.extra = e.min == null && e.max == null ? [] : [e];
          }
        })
      }
    />
  );
  const types = calcTypes(ref).filter((t) => t.itemKind === it.kind);
  const hands = handsOf(it);
  const rb = runeBonuses(items, it);
  const freeRunes = Object.entries(items).filter(
    ([rid, x]) => x.kind === 'rune' && (!socketedIn(items, rid) || s.rune === rid),
  );
  return (
    <div className="strow">
      {(types.length > 1 || it.kind === 'weapon') && (
        <Mini icon="🏷️" title={it.kind === 'weapon' ? 'Weapon type (decides 1H/2H)' : 'Item type'}>
          <select
            disabled={dis}
            value={it.type ?? ''}
            onChange={(e) =>
              editItem(iid, (x) => {
                x.type = e.target.value || null;
                delete x.hands;
              })
            }
          >
            <option value="">—</option>
            {types.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
        </Mini>
      )}
      {isWeapon(it) && hands && (
        <span className="mini" title="Set by the weapon type">
          <span aria-hidden="true">✋</span> <b>{hands}H</b>
        </span>
      )}
      {isWeapon(it) && (
        <>
          <Mini icon={DMG_EMO[s.dmg?.type ?? ''] ?? '⚔️'} title="Damage (min–max, type)">
            {dmgNum('dmg', 'min', 'min')}–{dmgNum('dmg', 'max', 'max')}{' '}
            <DmgTypeSelect
              value={s.dmg?.type || 'Physical'}
              disabled={dis}
              onValue={(v) =>
                setSt((st) => {
                  st.dmg = { ...(st.dmg ?? {}), type: v };
                })
              }
            />
          </Mini>
          <Mini icon="➕" title="Extra damage (min–max, type)">
            {dmgNum('extra', 'min', 'min')}–{dmgNum('extra', 'max', 'max')}{' '}
            <DmgTypeSelect
              value={s.extra?.[0]?.type || 'Fire'}
              disabled={dis}
              onValue={(v) =>
                setSt((st) => {
                  const e = { ...(st.extra?.[0] ?? {}), type: v };
                  st.extra = e.min == null && e.max == null ? [] : [e];
                })
              }
            />
          </Mini>
          <Mini icon="🎲" title="Critical chance %">
            {num('crit', 'crit %', '4.6em')}
          </Mini>
          <Mini icon="💥" title="Critical damage %">
            {num('critDmg', 'crit dmg %', '5.6em')}
          </Mini>
        </>
      )}
      {hasArmour(it) && (
        <>
          <Mini icon="🛡" title="Physical armour">
            {num('phys', 'phys', '5.2em')}
          </Mini>
          <Mini icon="✨" title="Magic armour">
            {num('magic', 'magic', '5.2em')}
          </Mini>
        </>
      )}
      {it.kind === 'shield' && (
        <Mini icon="🧱" title="Block chance %">
          {num('block', 'block %', '4.8em')}
        </Mini>
      )}
      {!['ring', 'amulet', 'belt', 'rune'].includes(it.kind) && (
        <Mini icon="🔒" title="Requirement">
          <select
            disabled={dis}
            value={s.reqAttr ?? ''}
            onChange={(e) =>
              setSt((st) => {
                st.reqAttr = e.target.value || null;
              })
            }
          >
            <option value="">—</option>
            {ATTRS.slice(0, 4).map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>{' '}
          {num('reqVal', '#', '3.6em')}
        </Mini>
      )}
      {it.kind !== 'rune' && (
        <Mini icon="💎" title="Rune slot">
          <select
            disabled={dis}
            value={s.rune ?? ''}
            onChange={(e) => {
              let v: string | null = e.target.value || null;
              if (v === '__newrune') v = createItem({ kind: 'rune', name: '', runeFx: {} });
              setSt((st) => {
                st.rune = v;
              });
            }}
          >
            <option value="">No slot</option>
            <option value="empty">Empty slot</option>
            {freeRunes.map(([rid, x]) => (
              <option key={rid} value={rid}>
                {x.name || '(unnamed rune)'}
              </option>
            ))}
            {canEdit && <option value="__newrune">＋ New rune…</option>}
          </select>
          {rb.length > 0 && (
            <>
              {' '}
              <span className="bon" style={{ display: 'inline-flex' }}>
                {rb.map((b, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: positional
                  <BonusChip key={i} bonus={b} />
                ))}
              </span>
            </>
          )}
        </Mini>
      )}
      <Mini icon="⚖️" title="Weight (kg)">
        {num('weight', 'kg', '4.6em')}
      </Mini>
      <Mini icon="🪙" title="Gold value">
        {num('value', 'gold', '5.6em')}
      </Mini>
    </div>
  );
}

function RuneFxEditor({ iid, it, dl }: { iid: string; it: Item; dl: string }) {
  const ref = useApp((s) => s.ref);
  const items = useApp((s) => s.items);
  const sr = sheetRune(ref, it.name);
  const host = socketedIn(items, iid);
  return (
    <div className="runefx">
      {host ? (
        <p className="note">
          💎 Socketed in <b>{host.name || 'an item'}</b>: its {runeSocket(host)} effect applies.
        </p>
      ) : (
        <p className="note">Not socketed. Pick it in an item's 💎 Rune slot.</p>
      )}
      {SOCKETS.map(([k, ic, label]) => {
        const sheet = sr?.[k];
        return (
          <div key={k} className="sock">
            <span className="mini" title={label}>
              <span aria-hidden="true">{ic}</span> {label}
              {sheet && sheet !== '-' ? <span className="note"> · sheet: {String(sheet)}</span> : null}
            </span>
            <BonusList
              iid={iid}
              arr={it.runeFx?.[k] ?? []}
              sock={k}
              dl={dl}
              placeholder="Effect from the rune tooltip, e.g. Fire Resistance +10%"
            />
          </div>
        );
      })}
    </div>
  );
}

export function ItemEditor({ iid, it, cols }: { iid: string; it: Item; cols: string[] }) {
  const canEdit = useCanEdit();
  const dl = `dl-${iid}`;
  const rc = rarityColor(it.rarity);
  return (
    <div className="ied" data-item={iid}>
      <div className="sh">
        <input
          type="text"
          className={`iname${it.rarity ? ' rarname' : ''}`}
          style={css({ '--rc': rc })}
          value={it.name ?? ''}
          placeholder="Item name"
          aria-label="Item name"
          disabled={!canEdit}
          onChange={(e) =>
            editItem(iid, (x) => {
              x.name = e.target.value;
            })
          }
        />
        <select
          className="rarsel"
          data-rar={it.rarity ?? ''}
          style={css({ '--rc': rc })}
          aria-label="Rarity"
          disabled={!canEdit}
          value={it.rarity ?? ''}
          onChange={(e) =>
            editItem(iid, (x) => {
              x.rarity = e.target.value;
            })
          }
        >
          <option value="">Rarity</option>
          {RARITIES.map((r) => (
            <option key={r} style={{ color: rarityColor(r) }}>
              {r}
            </option>
          ))}
        </select>
        <label className="mini" title="Item level">
          <span aria-hidden="true">📈</span>
          <NumInput
            int
            min={1}
            max={35}
            value={it.level}
            placeholder="lvl"
            aria-label="Item level"
            style={{ width: '4.2em' }}
            disabled={!canEdit}
            onValue={(v) =>
              editItem(iid, (x) => {
                x.level = v || null;
              })
            }
          />
        </label>
      </div>
      <StatsEditor iid={iid} it={it} />
      {it.kind === 'rune' ? (
        <RuneFxEditor iid={iid} it={it} dl={dl} />
      ) : (
        <BonusList
          iid={iid}
          arr={it.bonuses ?? []}
          sock=""
          dl={dl}
          placeholder="Add: Hydrosophist +1 · Fire Resistance +5% · Skill: First Aid · Status: Cursed · Immune to Stunned"
        />
      )}
      {canEdit && <Suggestions id={dl} cols={cols} />}
    </div>
  );
}
