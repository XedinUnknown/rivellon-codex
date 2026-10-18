import type { ReactNode } from 'react';
import { bonusLabel, parseBonus } from '../domain/bonus';
import { calcBase, calcTypes, rollColumn, weaponName } from '../domain/calc';
import { codex } from '../domain/codex';
import { AB_ALL, AB_LC, KIND_COLS, MEMBERS, RARITIES, rarityColor, SLOTS } from '../domain/constants';
import { fmt } from '../domain/format';
import { slotItem } from '../domain/items';
import { refRows } from '../domain/ref';
import type { ArmorRow, GearRoll, MemberId, WeaponRow } from '../domain/types';
import { useCanEdit } from '../state/hooks';
import { createItem, equip, setUi, useApp } from '../state/store';
import { AbChip, BonusChip, css, Linkify, SkillChip, StatusChip } from '../ui/chips';
import { NumInput } from '../ui/fields';
import { SheetNotes } from '../ui/Notes';
import { StatusLine } from '../ui/StatusLine';
import { Suggestions } from './items/ItemEditor';

function RollChip({ r }: { r: GearRoll }) {
  if (r.kind === 'skill') return <SkillChip name={r.stat} />;
  const range = r.min != null ? ` ${r.min}${r.max !== r.min ? `–${r.max}` : ''}${r.pct ? '%' : ''}` : '';
  if (r.kind === 'set' || r.kind === 'inflict') {
    const st = codex().statusObj[r.stat.replace(/^(Set|Inflict)\s+/, '').toLowerCase()];
    return st ? (
      <span className="rl">
        {r.kind === 'set' ? 'Set' : 'Inflict'} <StatusChip st={st} inline />
        {range}
      </span>
    ) : (
      <span className="rl">{r.text}</span>
    );
  }
  const ab = r.kind === 'stat' ? AB_LC[r.stat.toLowerCase()] : undefined;
  if (ab) return <AbChip a={ab} suffix={`${r.min}${r.max !== r.min ? `–${r.max}` : ''}`} />;
  return <span className="rl">{r.text}</span>;
}

const WEAPON_LEVELS = ['d1', 'd5', 'd10', 'd15', 'd20', 'd22'] as const;

export function GearCalcView() {
  const ref = useApp((s) => s.ref);
  const party = useApp((s) => s.party);
  const items = useApp((s) => s.items);
  const C = useApp((s) => s.ui.calc);
  const flash = useApp((s) => s.ui.flash);
  const canEdit = useCanEdit();
  const types = calcTypes(ref);
  const t = types.find((x) => x.key === C.type) ?? types[0];
  if (!t) return <div className="loading">No weapon or armour tables in the reference data.</div>;
  const L = Math.max(1, Math.min(22, Number(C.level) || 1));
  const rk = C.rarity;
  const base = calcBase(ref, t, L, rk);
  const mult = base.mult;
  const exact = t.kind === 'weapon' ? [1, 5, 10, 15, 20, 22].includes(L) : [1, 10, 20].includes(L);
  const column = rollColumn(t);
  const groups: Record<string, GearRoll[]> = {
    'Abilities & attributes': [],
    'Combat stats': [],
    'Skills granted': [],
    'On-hit statuses': [],
    Other: [],
  };
  for (const r of refRows<GearRoll>(ref, 'gearRolls').filter((r) => r.slot === column)) {
    const g =
      r.kind === 'skill'
        ? 'Skills granted'
        : r.kind === 'set' || r.kind === 'inflict'
          ? 'On-hit statuses'
          : r.kind === 'stat' && AB_ALL.includes(r.stat)
            ? 'Abilities & attributes'
            : r.kind === 'stat'
              ? 'Combat stats'
              : 'Other';
    groups[g]?.push(r);
  }
  const sheetNotes = [...new Set(Object.values(ref.rarity?.sheetNotes ?? {}))];
  const fitSlots = SLOTS.filter((s) => s.kinds.includes(t.itemKind));
  const setCalc = (patch: Partial<typeof C>) => setUi((u) => void Object.assign(u.calc, patch));
  const opt = (g: string) =>
    types
      .filter((x) => x.group === g)
      .map((x) => (
        <option key={x.key} value={x.key}>
          {x.label}
        </option>
      ));
  let big: ReactNode;
  if (t.kind === 'weapon') {
    const w = t.row as WeaponRow;
    big = (
      <>
        <div>
          <b>{base.damage != null ? fmt(base.damage) : '—'}</b>
          <span>⚔️ avg base damage{mult && mult !== 1 ? ` (×${mult} for ${rk})` : ''}</span>
        </div>
        <div>
          <b style={{ fontSize: '1rem' }}>
            <Linkify text={w.attribute} prefer="ab" />
          </b>
          <span>scales with</span>
        </div>
        <div>
          <b>{String(w.range ?? '')}m</b>
          <span>🎯 range</span>
        </div>
      </>
    );
  } else {
    const a = t.row as ArmorRow;
    big = (
      <>
        <div>
          <b>{base.phys != null ? fmt(base.phys) : '—'}</b>
          <span>🛡 physical armour</span>
        </div>
        <div>
          <b>{base.magic != null ? fmt(base.magic) : '—'}</b>
          <span>✨ magic armour</span>
        </div>
        {a.attribute && a.attribute !== '-' && AB_LC[String(a.attribute).toLowerCase()] && (
          <div>
            <AbChip a={a.attribute} />
            <span>requirement attribute</span>
          </div>
        )}
      </>
    );
  }
  const save = () => {
    const b = calcBase(ref, t, L, C.rarity);
    const iid = createItem({
      name: C.name || `${C.rarity} ${t.label}`,
      kind: t.itemKind,
      type: t.key,
      level: L,
      rarity: C.rarity,
      bonuses: structuredClone(C.bonuses),
      base: t.kind === 'weapon' ? { damage: b.damage } : { phys: b.phys, magic: b.magic },
    });
    let msg = `Saved “${C.name || `${C.rarity} ${t.label}`}” to Items`;
    if (C.equip) {
      const [m, s] = C.equip.split(':') as [MemberId, string];
      equip(iid, m, s);
      msg += ` and equipped it on ${party[m].name}`;
    }
    setUi((u) => {
      u.flash = `${msg}.`;
      u.calc = { ...u.calc, name: '', bonuses: [], equip: '' };
    });
    setTimeout(
      () =>
        setUi((u) => {
          u.flash = '';
        }),
      4000,
    );
  };
  return (
    <div className="calc">
      <StatusLine>
        {`Estimates from the Info sheet${exact ? '' : " · this level is between the sheet's sample levels, so the number is interpolated"}`}
      </StatusLine>
      <div className="card">
        <div className="ctl">
          <label>
            Item type
            <select value={t.key} onChange={(e) => setCalc({ type: e.target.value, equip: '' })}>
              <optgroup label="Weapons">{opt('Weapons')}</optgroup>
              <optgroup label="Armour">{opt('Armour')}</optgroup>
              <optgroup label="Shield">{opt('Shield')}</optgroup>
              <optgroup label="Accessories">{opt('Accessories')}</optgroup>
            </select>
          </label>
          <label>
            Level
            <NumInput
              int
              min={1}
              max={22}
              value={C.level}
              style={{ width: '5em' }}
              onValue={(v) => v && setCalc({ level: v })}
            />
          </label>
          <label>
            Rarity
            <select
              className="rarsel"
              data-rar={rk}
              style={css({ '--rc': rarityColor(rk) })}
              value={rk}
              onChange={(e) => setCalc({ rarity: e.target.value })}
            >
              {RARITIES.slice(0, 6).map((r) => (
                <option key={r} style={{ color: rarityColor(r) }}>
                  {r}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="big">{big}</div>
        {rk !== 'Common' && !mult && <p className="note">No {rk} multiplier in the sheet for this item type.</p>}
        <p className="note">
          Base values for a {t.label} before bonuses
          {t.kind === 'weapon' ? ' (weapon damage is the average of the roll range)' : ''}. The sheet's samples are
          levels {t.kind === 'weapon' ? '1, 5, 10, 15, 20, 22' : '1, 10, 20'}; other levels are interpolated, and rarity
          multipliers come from level-20 items.
        </p>
        <SheetNotes notes={t.row._notes} />
      </div>
      {canEdit && (
        <div className="card">
          <h3>Save as an item</h3>
          <div className="ctl">
            <label style={{ flex: '1 1 220px' }}>
              Name
              <input
                type="text"
                value={C.name}
                placeholder="e.g. Magical Dwarven Staff"
                onChange={(e) => setCalc({ name: e.target.value })}
              />
            </label>
            <label>
              Equip on
              <select value={C.equip} onChange={(e) => setCalc({ equip: e.target.value })}>
                <option value="">Don't equip</option>
                {MEMBERS.flatMap((m) =>
                  fitSlots.map((s) => (
                    <option key={`${m.id}:${s.id}`} value={`${m.id}:${s.id}`}>
                      {party[m.id].name} · {s.label}
                      {slotItem(party, items, m.id, s.id) ? ' (replace)' : ''}
                    </option>
                  )),
                )}
              </select>
            </label>
          </div>
          <div className="bon">
            {C.bonuses.map((b, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: positional
              <span key={i} className="bwrap">
                <BonusChip bonus={b} />
                <button
                  type="button"
                  className="x"
                  aria-label={`Remove ${bonusLabel(b)}`}
                  onClick={() => setUi((u) => void u.calc.bonuses.splice(i, 1))}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="addrow">
            <input
              type="text"
              list="dl-calc"
              placeholder="Add bonus from the tooltip, e.g. Pyrokinetic +1, then Enter"
              aria-label="Add a bonus"
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return;
                const b = parseBonus(e.currentTarget.value);
                if (!b) return;
                e.preventDefault();
                e.currentTarget.value = '';
                setUi((u) => void u.calc.bonuses.push(b));
              }}
            />
            <button type="button" className="btn" onClick={save}>
              Save item
            </button>
          </div>
          <Suggestions id="dl-calc" cols={KIND_COLS[t.itemKind] ?? []} />
          {flash && (
            <p className="note" style={{ color: 'var(--known)' }}>
              {flash}
            </p>
          )}
        </div>
      )}
      <div className="card">
        <h3>What a {column} can roll</h3>
        <div className="rolls">
          {Object.entries(groups)
            .filter(([, v]) => v.length)
            .map(([g, v]) => (
              <div key={g}>
                <h4>{g}</h4>
                <ul className="chipul">
                  {v.map((r, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: rolls can repeat
                    <li key={i}>
                      <RollChip r={r} />
                      {r._notes?.text && (
                        <>
                          {' '}
                          <small title={r._notes.text}>ⓘ</small>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
        <p className="note">
          Ranges from the sheet's Gear Stats tab. Higher rarities roll more of these at once; ranges grow with level.
        </p>
      </div>
      <div className="card">
        <h3>Weapon damage by level</h3>
        <div className="scroll">
          <table className="wide">
            <thead>
              <tr>
                <th>Weapon</th>
                <th>Lvl 1</th>
                <th>5</th>
                <th>10</th>
                <th>15</th>
                <th>20</th>
                <th>22</th>
              </tr>
            </thead>
            <tbody>
              {refRows<WeaponRow>(ref, 'weapons').map((w) => (
                <tr key={`${w.name}${w.hands}`}>
                  <td>{weaponName(w)}</td>
                  {WEAPON_LEVELS.map((k) => (
                    <td key={k}>{w[k] ?? ''}</td>
                  ))}
                </tr>
              ))}
              {refRows<WeaponRow>(ref, 'weaponCompare').map((w) => (
                <tr key={w.name}>
                  <td title={w.notes ?? ''}>
                    <i>{w.name}</i>
                  </td>
                  {WEAPON_LEVELS.map((k) => (
                    <td key={k}>{w[k] != null ? fmt(w[k] as number) : ''}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="note">Italic rows are the sheet author's comparisons (hover for their notes).</p>
      </div>
      {sheetNotes.length > 0 && (
        <div className="card">
          <h3>About rarity multipliers</h3>
          {sheetNotes.map((n) => (
            <p key={n} className="note" style={{ whiteSpace: 'pre-line' }}>
              {n}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
