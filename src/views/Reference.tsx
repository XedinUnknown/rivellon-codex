import { Fragment, type ReactNode } from 'react';
import { baseStatus, matches, textOf } from '../domain/codex';
import { AB_LC, REF_SECTIONS, SCH, schoolColor } from '../domain/constants';
import { nameIcon } from '../domain/items';
import { refRows } from '../domain/ref';
import type { RefRow, RuneRow, RunesData } from '../domain/types';
import { useUi } from '../state/hooks';
import { useApp } from '../state/store';
import { AbChip, chipFor, Linkify, type Prefer } from '../ui/chips';
import { GameIcon } from '../ui/icons';
import { SheetNotes } from '../ui/Notes';
import { StatusLine } from '../ui/StatusLine';

const FIELDS: Record<string, [string, string][]> = {
  talents: [
    ['description', 'Effect'],
    ['requirements', 'Needs'],
  ],
  abilities: [
    ['type', 'Type'],
    ['effect', 'Passive'],
    ['notes', 'Notes'],
  ],
  attributes: [
    ['effect', 'Per point over 10'],
    ['notes', 'Notes'],
  ],
  stats: [
    ['effect', 'What it does'],
    ['notes', 'Notes'],
  ],
  raceTraits: [
    ['race', 'Race'],
    ['description', 'Effect'],
  ],
  classes: [
    ['ability1', 'Ability'],
    ['ability2', 'Ability'],
    ['civil', 'Civil'],
    ['talent', 'Talent'],
    ['skill1', 'Skill'],
    ['skill2', 'Skill'],
    ['skill3', 'Skill'],
    ['weapons', 'Weapons'],
    ['shield', 'Shield'],
    ['extraItems', 'Extra'],
  ],
  surfaces: [
    ['kind', 'Type'],
    ['description', 'Effect'],
    ['duration', 'Turns'],
    ['resist', 'Resisted by'],
    ['interactions', 'Interactions'],
    ['vaporizeSpike', 'Vaporize / spike'],
  ],
  infoStatuses: [
    ['resist', 'Resisted by'],
    ['effect', 'Effect'],
  ],
  ingredients: [
    ['value', 'Base value'],
    ['category', 'Category'],
    ['notes', 'Notes'],
  ],
  talentPoints: [['total', 'Talent points so far']],
  bugs: [
    ['conditions', 'Conditions'],
    ['steps', 'Steps'],
    ['notes', 'Notes'],
  ],
  tabs: [
    ['description', 'Contents'],
    ['status', 'DE status'],
  ],
};
const CHIP_FIELDS: Record<string, Prefer> = {
  ability1: 'ab',
  ability2: 'ab',
  civil: 'ab',
  skill1: 'skill',
  skill2: 'skill',
  skill3: 'skill',
};
const LINKED = [
  'effect',
  'description',
  'notes',
  'interactions',
  'requirements',
  'steps',
  'conditions',
  'vaporizeSpike',
];
const TITLE: Record<string, (r: RefRow) => unknown> = {
  raceTraits: (r) => r.trait,
  talentPoints: (r) => `Level ${r.level}`,
  bugs: (r) => r.bug,
  tabs: (r) => r.tab,
  classes: (r) => r.name,
};
const KIND: Record<string, string> = { S: 'Surface', C: 'Cloud' };
const RES: Record<string, string> = { P: 'physical armour', M: 'magic armour' };

const cellAb = (v: unknown): ReactNode => {
  const a = AB_LC[String(v ?? '').toLowerCase()];
  return a ? <AbChip a={a} /> : String(v ?? '');
};
const s = (v: unknown) => (v == null ? '' : String(v));

function RuneTable({ rows, hasArm, q }: { rows: RuneRow[]; hasArm: boolean; q: string }) {
  return (
    <div className="scroll">
      <table className="wide">
        <thead>
          <tr>
            <th>Rune</th>
            <th>Weapon</th>
            {hasArm && (
              <>
                <th>Armour</th>
                <th>Amulet</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {rows
            .filter((r) => matches(textOf(r), q))
            .map((r) => (
              <tr key={r.rune}>
                <td>{r.rune}</td>
                <td>{cellAb(r.weapon)}</td>
                {hasArm && (
                  <>
                    <td>{cellAb(r.armor)}</td>
                    <td>{cellAb(r.amulet)}</td>
                  </>
                )}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

export function ReferenceView() {
  const ref = useApp((st) => st.ref);
  const { sec, q } = useUi((u) => ({ sec: u.refSec, q: u.q.trim().toLowerCase() }));

  if (sec === 'runes') {
    const R = (ref.runes?.data ?? {}) as RunesData;
    return (
      <div className="calc">
        <StatusLine>Runes (Info sheet)</StatusLine>
        <div className="card">
          <h3>What each rune boosts</h3>
          <RuneTable rows={R.boosts ?? []} hasArm q={q} />
        </div>
        <div className="card">
          <h3>Rune strength by size</h3>
          <div className="scroll">
            <table className="wide">
              <thead>
                <tr>
                  <th>Size</th>
                  <th>Weapon</th>
                  <th>Armour</th>
                  <th>Amulet</th>
                </tr>
              </thead>
              <tbody>
                {(R.sizes ?? []).map((x) => (
                  <tr key={s(x.size)}>
                    <td>{s(x.size)}</td>
                    <td>{s(x.weapon)}</td>
                    <td>{s(x.armor)}</td>
                    <td>{s(x.amulet)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <h3>Mythic runes (ability bonuses)</h3>
          <RuneTable rows={R.mythic ?? []} hasArm q={q} />
        </div>
        <div className="card">
          <h3>Power runes</h3>
          <RuneTable rows={R.power ?? []} hasArm={false} q={q} />
        </div>
        {R.sourceOrb && (
          <div className="card">
            <h3>Source Orb in a socket</h3>
            <p>
              Weapon: <Linkify text={R.sourceOrb.weapon} prefer="skill" /> · Armour:{' '}
              <Linkify text={R.sourceOrb.armor} prefer="skill" /> · Amulet:{' '}
              <Linkify text={R.sourceOrb.amulet} prefer="skill" />
            </p>
          </div>
        )}
      </div>
    );
  }

  if (sec === 'combos') {
    const rows = refRows(ref, 'combos');
    const els = ['Aerotheurge', 'Geomancer', 'Hydrosophist', 'Pyrokinetic'];
    const others = [...new Set(rows.map((r) => s(r.other)))];
    return (
      <div className="card" style={{ marginTop: 14 }}>
        <StatusLine>
          Combo skills: one elemental book + one non-elemental book (1 point in each school to craft)
        </StatusLine>
        <div className="scroll">
          <table className="wide">
            <thead>
              <tr>
                <th />
                {els.map((e) => (
                  <th key={e}>
                    <AbChip a={e} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {others.map((o) => (
                <tr key={o}>
                  <td>
                    <AbChip a={o} />
                  </td>
                  {els.map((e) => {
                    const r = rows.find((x) => x.other === o && x.element === e);
                    return (
                      <td key={e} style={{ textAlign: 'left' }}>
                        {r ? (chipFor(s(r.skill), 'skill') ?? s(r.skill)) : ''}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (sec === 'values') {
    const rows = refRows(ref, 'values').filter((r) => matches(textOf(r), q));
    const L = Array.from({ length: 20 }, (_, i) => String(i + 1));
    return (
      <div className="card" style={{ marginTop: 14 }}>
        <StatusLine>Gold value of crafted gear by level (blank = not recorded)</StatusLine>
        <div className="scroll">
          <table className="wide">
            <thead>
              <tr>
                <th>Item</th>
                {L.map((l) => (
                  <th key={l}>{l}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const by = (r.byLevel ?? {}) as Record<string, unknown>;
                return (
                  <tr key={s(r.item)}>
                    <td>{s(r.item)}</td>
                    {L.map((l) => (
                      <td key={l}>{s(by[l])}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const key = sec === 'infoStatuses' ? 'statuses' : sec;
  const fields = FIELDS[sec] ?? [];
  const all = refRows(ref, key);
  const list = all.filter((r) => matches(textOf(r), q));
  const line = `${list.length} of ${all.length} · ${REF_SECTIONS.find((x) => x[0] === sec)?.[1] ?? ''}`;
  if (!list.length)
    return (
      <>
        <StatusLine>{line}</StatusLine>
        <div className="empty">Nothing matches.</div>
      </>
    );
  const labels = Object.fromEntries(fields);
  return (
    <div className="rows">
      <StatusLine>{line}</StatusLine>
      {list.map((r, idx) => {
        const plain = s((TITLE[sec] ?? ((x: RefRow) => x.name))(r));
        let title: ReactNode = plain;
        if (sec === 'abilities' || sec === 'attributes') title = <AbChip a={s(r.name)} />;
        else if (sec === 'ingredients')
          title = (
            <>
              <span className="ricon">
                <GameIcon k={nameIcon(r.name, r.category)} />
              </span>
              {plain}
            </>
          );
        else if (sec === 'infoStatuses') title = chipFor(baseStatus(s(r.name)), 'status') ?? plain;
        return (
          <article
            // biome-ignore lint/suspicious/noArrayIndexKey: sheet rows have no id
            key={idx}
            className="rrow"
            style={{ ['--c' as string]: SCH[s(r.name)] ? schoolColor(s(r.name)) : 'var(--line)' }}
          >
            <h3>{title}</h3>
            <dl className="kv">
              {fields.map(([k, l]) => {
                let v = r[k];
                if (v == null || v === '-' || v === '') return null;
                if (sec === 'surfaces' && k === 'kind') v = KIND[s(v)] ?? v;
                if (k === 'resist') v = RES[s(v)] ?? v;
                const prefer = CHIP_FIELDS[k];
                const html =
                  prefer && sec === 'classes' ? (
                    (chipFor(s(v), prefer) ?? s(v))
                  ) : LINKED.includes(k) ? (
                    <Linkify text={v} />
                  ) : (
                    s(v)
                  );
                return (
                  <Fragment key={k + l}>
                    <dt>{l}</dt>
                    <dd>{html}</dd>
                  </Fragment>
                );
              })}
              {sec === 'classes' && (
                <>
                  <dt>Attributes</dt>
                  <dd>
                    {['str', 'fin', 'int', 'con', 'wit']
                      .filter((k) => r[k])
                      .map((k) => `${k.toUpperCase()} +${s(r[k])}`)
                      .join(', ') || '—'}
                  </dd>
                </>
              )}
            </dl>
            <SheetNotes
              notes={r._notes}
              labels={{ ...labels, name: 'Name', bug: 'Bug', tab: 'Tab', trait: 'Trait', race: 'Race' }}
            />
          </article>
        );
      })}
    </div>
  );
}
