import type { ComponentType, ReactNode } from 'react';
import { codex } from '../../domain/codex';
import { ATTRS, CIVIL_AB, DEF_AB, MEMBERS, SCHOOLS, type SlotDef, slotDef, WEAPON_AB } from '../../domain/constants';
import { fmt, sgn } from '../../domain/format';
import { handsOf, slotItem } from '../../domain/items';
import { BUDGET_RULES, type BudgetRow, budget, derived, portraitKey, type Totals } from '../../domain/party';
import { refRows } from '../../domain/ref';
import type { Member, MemberId } from '../../domain/types';
import { useCanEdit, useTotals } from '../../state/hooks';
import { navigate } from '../../state/nav';
import { editMember, setUi, useApp } from '../../state/store';
import { AbChip, BonusChip, css, RarityTag, SkillChip, StatusChip } from '../../ui/chips';
import { NumInput } from '../../ui/fields';
import { GameIcon } from '../../ui/icons';
import { Dumbbell, Handshake, NotebookPen, Pencil, Shield, Sparkles, Star, Swords } from '../../ui/lucide';
import { StatusLine } from '../../ui/StatusLine';
import { DmgText } from '../items/itemText';
import { CharCard, Tile } from './CharCard';

export function PartyView() {
  const view = useApp((s) => s.ui.partyView);
  return (
    <>
      <StatusLine>{''}</StatusLine>
      {view === 'detail' ? <PartyDetail /> : <PartyOverview />}
    </>
  );
}

function PartyOverview() {
  return (
    <div className="pover">
      {MEMBERS.map((m) => (
        <MiniCard key={m.id} id={m.id} />
      ))}
    </div>
  );
}

function MiniCard({ id }: { id: MemberId }) {
  const p = useApp((s) => s.party[id]);
  const ref = useApp((s) => s.ref);
  const d = derived(p, useTotals()[id], ref);
  const t = (k: string) => <Tile id={id} def={slotDef(k) as SlotDef} mini />;
  const open = () => {
    navigate((u) => {
      u.who = id;
      u.partyView = 'detail';
    });
    window.scrollTo({ top: 0 });
  };
  return (
    // biome-ignore lint/a11y/useSemanticElements: a <button> can't hold the card's block content
    <div
      className="card mini-cc"
      tabIndex={0}
      role="button"
      aria-label={`Open ${p.name}`}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      }}
    >
      <div className="mc">
        <div className="cc-helm">{t('helmet')}</div>
        <div className="cc-left">
          {['chest', 'gloves', 'belt', 'boots'].map((k) => (
            <Tile key={k} id={id} def={slotDef(k) as SlotDef} mini />
          ))}
        </div>
        <div className="mc-mid">
          <div className="portrait sm">
            <GameIcon k={portraitKey(p)} />
          </div>
          <div className="ccname">{p.name}</div>
          <div className="note">
            {[p.undead ? 'Undead' : '', p.race || '', p.gender || ''].filter(Boolean).join(' ') || ' '} · Lvl{' '}
            {p.level || '?'}
          </div>
          <div className="mstats">
            <span title="Vitality (estimate)">
              <span className="si">
                <GameIcon k="heart" />
              </span>
              {d.vit.toLocaleString()}
            </span>
            <span title="AP start / max">
              <span className="si">
                <GameIcon k="ap" />
              </span>
              {d.start}/{d.maxAP}
            </span>
          </div>
        </div>
        <div className="cc-right">
          {['amulet', 'ring1', 'ring2', 'leggings'].map((k) => (
            <Tile key={k} id={id} def={slotDef(k) as SlotDef} mini />
          ))}
        </div>
        <div className="cc-weap">
          {t('main')}
          {t('off')}
        </div>
      </div>
    </div>
  );
}

const SECT_DEFAULT: Record<string, boolean> = {
  attrs: true,
  combat: true,
  civil: false,
  talents: true,
  gear: false,
  known: true,
  notes: true,
};
function Sect({
  k,
  Icon,
  title,
  row,
  children,
}: {
  k: string;
  Icon: ComponentType;
  title: ReactNode;
  row?: BudgetRow;
  children: ReactNode;
}) {
  const open = useApp((s) => s.ui.sects[k]) ?? SECT_DEFAULT[k];
  return (
    <details
      className="sect"
      open={open}
      onToggle={(e) => {
        const o = (e.currentTarget as HTMLDetailsElement).open;
        if (o !== open)
          setUi((u) => {
            u.sects = { ...u.sects, [k]: o };
          });
      }}
    >
      <summary>
        <span className="sic">
          <Icon />
        </span>
        <span className="stitle">{title}</span>
        {row && <BudgetBadge row={row} />}
      </summary>
      <div className="sbody">{children}</div>
    </details>
  );
}
function BudgetBadge({ row }: { row: BudgetRow }) {
  const { label, spent, avail, warn } = row;
  const [cls, txt] =
    spent == null
      ? ['note', `— / ${avail}`]
      : spent === avail
        ? ['ok', `${spent} / ${avail} ✓`]
        : spent < avail
          ? ['under', `${spent} / ${avail} · ${avail - spent} to spend`]
          : ['over', `${spent} / ${avail} · ${spent - avail} over`];
  return (
    <span className={`bstat ${cls}`} title={`${label}: ${BUDGET_RULES}`}>
      {txt}
      {warn && (
        <>
          {' '}
          <span className="bwarn" title={warn}>
            ⚠
          </span>
        </>
      )}
    </span>
  );
}

function NumCell({
  ed,
  value,
  ph,
  label,
  max,
  onValue,
}: {
  ed: boolean;
  value: number | null | undefined;
  ph: string;
  label: string;
  max: number;
  onValue(v: number | null): void;
}) {
  if (!ed) return <span>{value ?? <span className="note">{ph}</span>}</span>;
  return <NumInput int min={0} max={max} value={value} placeholder={ph} aria-label={label} onValue={onValue} />;
}

function AbRow({ id, a, tot, ed }: { id: MemberId; a: string; tot: Totals; ed: boolean }) {
  const p = useApp((s) => s.party[id]);
  const g = tot.gear[a] ?? 0;
  return (
    <tr>
      <td>
        <AbChip a={a} />
      </td>
      <td className="n">
        <NumCell
          ed={ed}
          value={p.points[a]}
          ph="0"
          label={`${a} points`}
          max={15}
          onValue={(v) =>
            editMember(id, (m) => {
              if (v == null) delete m.points[a];
              else m.points[a] = Math.max(0, v);
            })
          }
        />
      </td>
      <td className="g">{g ? sgn(g) : ''}</td>
      <td className="t">{tot.ab[a] ?? 0}</td>
    </tr>
  );
}

function Equipped({ id }: { id: MemberId }) {
  const party = useApp((s) => s.party);
  const items = useApp((s) => s.items);
  let phys = 0;
  let magic = 0;
  let wt = 0;
  const weapons: ReactNode[] = [];
  const twoH = handsOf(slotItem(party, items, id, 'main')) === 2;
  for (const def of [
    'helmet',
    'amulet',
    'chest',
    'gloves',
    'belt',
    'leggings',
    'boots',
    'ring1',
    'ring2',
    'main',
    'off',
  ] as const) {
    if (def === 'off' && twoH) continue;
    const it = slotItem(party, items, id, def);
    if (!it) continue;
    const s = it.st ?? {};
    phys += Number(s.phys) || 0;
    magic += Number(s.magic) || 0;
    wt += Number(s.weight) || 0;
    if (it.kind === 'weapon') {
      const dmg = [s.dmg, ...(s.extra ?? [])].filter((x) => x && (x.min != null || x.max != null));
      weapons.push(
        <span key={def}>
          <br />
          <span className="rar" style={css({ '--rc': `var(--r-${(it.rarity || 'common').toLowerCase()})` })}>
            {it.name || 'Weapon'}
          </span>
          :{' '}
          {dmg.length ? (
            dmg.map((x, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: positional
              <span key={i}>
                {i > 0 && ' + '}
                <DmgText d={x} />
              </span>
            ))
          ) : (
            <span className="note">damage not entered</span>
          )}
        </span>,
      );
    }
  }
  return (
    <div className="note" style={{ color: 'var(--ink)' }}>
      🛡 <b>{phys}</b> physical armour · ✨ <b>{magic}</b> magic armour · ⚖️ <b>{fmt(wt)}</b> kg worn
      {weapons}
    </div>
  );
}

function PartyDetail() {
  const id = useApp((s) => s.ui.who);
  const party = useApp((s) => s.party);
  const ref = useApp((s) => s.ref);
  const editing = useApp((s) => s.ui.editing);
  const canEdit = useCanEdit();
  const tot = useTotals()[id];
  const p: Member = party[id];
  const ed = canEdit && editing;
  const B = Object.fromEntries(budget(p, ref).map((r) => [r.label, r])) as Record<BudgetRow['label'], BudgetRow>;
  const { skillObj, statusObj } = codex();
  const other = Object.entries(tot.other);
  const sortedKnown = [...p.known].sort((a, b) => {
    const A = skillObj[a.toLowerCase()];
    const Bk = skillObj[b.toLowerCase()];
    const sa = A && 'school' in A ? A.school : '';
    const sb = Bk && 'school' in Bk ? Bk.school : '';
    return SCHOOLS.indexOf(sa) - SCHOOLS.indexOf(sb) || a.localeCompare(b);
  });
  const talentRows = refRows(ref, 'talents');
  const raceRows = refRows(ref, 'raceTraits');
  const abHead = (
    <thead>
      <tr>
        <th>Ability</th>
        <th>Points</th>
        <th>Gear</th>
        <th>Total</th>
      </tr>
    </thead>
  );
  const none = (
    <tr>
      <td className="note" colSpan={4}>
        None
      </td>
    </tr>
  );
  const weaponDef = [...WEAPON_AB, ...DEF_AB].filter((a) => ed || tot.ab[a]);
  const civil = CIVIL_AB.filter((a) => ed || tot.ab[a]);
  return (
    <>
      <div className="ptop">
        <button
          type="button"
          className="btn"
          onClick={() =>
            navigate((u) => {
              u.partyView = 'overview';
            })
          }
        >
          ← Party
        </button>
        <div className="who">
          {MEMBERS.map((m) => (
            <button
              type="button"
              key={m.id}
              aria-pressed={m.id === id}
              onClick={() =>
                navigate((u) => {
                  u.who = m.id;
                })
              }
            >
              <span className="wp">
                <GameIcon k={portraitKey(party[m.id])} />
              </span>
              <span className="wn">
                {party[m.id].name || m.name}
                <small>Lvl {party[m.id].level || '?'}</small>
              </span>
            </button>
          ))}
        </div>
        {canEdit && (
          // biome-ignore lint/a11y/useSemanticElements: a two-button toggle
          <span className="viewtoggle" role="group" aria-label="Mode">
            <button
              type="button"
              aria-pressed={!ed}
              onClick={() =>
                setUi((u) => {
                  u.editing = false;
                  u.pickSlot = u.popSlot = null;
                })
              }
            >
              View
            </button>
            <button
              type="button"
              aria-pressed={ed}
              onClick={() =>
                setUi((u) => {
                  u.editing = true;
                  u.pickSlot = u.popSlot = null;
                })
              }
            >
              <Pencil /> Edit
            </button>
          </span>
        )}
      </div>
      <div className={`pdetail member${ed ? ' editing' : ''}`} data-m={id}>
        <CharCard id={id} />
        <div className="card">
          <div className="lvl" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <h3 style={{ flex: 1 }}>Stats</h3>
            <label htmlFor="lvl">📈 Level</label>
            {ed ? (
              <NumInput
                id="lvl"
                int
                min={1}
                max={35}
                value={p.level || null}
                style={{ width: '4.2em' }}
                onValue={(v) =>
                  editMember(id, (m) => {
                    m.level = v || 0;
                  })
                }
              />
            ) : (
              <b>{p.level || '—'}</b>
            )}
          </div>
          <Sect k="attrs" Icon={Dumbbell} title="Attributes" row={B['Attribute points']}>
            <table className="tt">
              <thead>
                <tr>
                  <th>Attribute</th>
                  <th>Base</th>
                  <th>Gear</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {ATTRS.map((a) => (
                  <tr key={a}>
                    <td>
                      <AbChip a={a} />
                    </td>
                    <td className="n">
                      <NumCell
                        ed={ed}
                        value={p.attributes[a]}
                        ph="10"
                        label={`${a} base`}
                        max={60}
                        onValue={(v) =>
                          editMember(id, (m) => {
                            if (v == null) delete m.attributes[a];
                            else m.attributes[a] = Math.max(0, v);
                          })
                        }
                      />
                    </td>
                    <td className="g">{tot.gear[a] ? sgn(tot.gear[a] as number) : ''}</td>
                    <td className="t">{tot.at[a] ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Sect>
          <Sect k="combat" Icon={Swords} title="Combat abilities" row={B['Combat ability points']}>
            <table className="tt">
              {abHead}
              <tbody>
                {SCHOOLS.map((a) => (
                  <AbRow key={a} id={id} a={a} tot={tot} ed={ed} />
                ))}
                <tr className="sub">
                  <td colSpan={4}>Weapon &amp; defence</td>
                </tr>
                {weaponDef.length ? weaponDef.map((a) => <AbRow key={a} id={id} a={a} tot={tot} ed={ed} />) : none}
              </tbody>
            </table>
          </Sect>
          <Sect k="civil" Icon={Handshake} title="Civil abilities" row={B['Civil ability points']}>
            <table className="tt">
              {abHead}
              <tbody>{civil.length ? civil.map((a) => <AbRow key={a} id={id} a={a} tot={tot} ed={ed} />) : none}</tbody>
            </table>
          </Sect>
          <Sect k="talents" Icon={Star} title="Talents" row={B['Talents (not racial)']}>
            <div className="bon">
              {p.talents.length ? (
                p.talents.map((t, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: talents are positional
                  <span key={i} className="bwrap">
                    <span
                      className="bchip"
                      title={String(
                        talentRows.find((x) => x.name === t)?.description ??
                          raceRows.find((x) => x.trait === t)?.description ??
                          '',
                      )}
                    >
                      {t}
                    </span>
                    {ed && (
                      <button
                        type="button"
                        className="x"
                        aria-label={`Remove ${t}`}
                        onClick={() => editMember(id, (m) => void m.talents.splice(i, 1), 200)}
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))
              ) : (
                <span className="note">None</span>
              )}
            </div>
            {ed && (
              <>
                <div className="addrow">
                  <input
                    type="text"
                    list="dl-talents"
                    placeholder="Add a talent"
                    aria-label="Add a talent"
                    onKeyDown={(e) => {
                      if (e.key !== 'Enter') return;
                      const t = e.currentTarget.value.trim();
                      if (!t) return;
                      e.preventDefault();
                      const hit = talentRows.find((x) => String(x.name).toLowerCase() === t.toLowerCase());
                      e.currentTarget.value = '';
                      editMember(id, (m) => void m.talents.push(hit ? String(hit.name) : t), 200);
                    }}
                  />
                </div>
                <datalist id="dl-talents">
                  {talentRows.map((t) => (
                    <option key={String(t.name)} value={String(t.name)} />
                  ))}
                </datalist>
              </>
            )}
          </Sect>
          <Sect k="gear" Icon={Shield} title="From gear">
            <Equipped id={id} />
            {other.length > 0 && (
              <>
                <h4>Other stats</h4>
                <div className="bon">
                  {other.map(([k, v]) => (
                    <BonusChip key={k} bonus={{ stat: k.replace(' %', ''), value: v, pct: k.endsWith(' %') }} />
                  ))}
                </div>
              </>
            )}
            {(tot.statuses.length > 0 || tot.immune.length > 0) && (
              <>
                <h4>Statuses</h4>
                <div className="bon">
                  {tot.statuses.map((s, i) => {
                    const st = statusObj[s.status.toLowerCase()];
                    return (
                      // biome-ignore lint/suspicious/noArrayIndexKey: positional
                      <span key={`s${i}`} className="bchip gst" title={`From ${s.item}`}>
                        💫 {st ? <StatusChip st={st} inline /> : s.status}
                      </span>
                    );
                  })}
                  {tot.immune.map((s, i) => {
                    const st = statusObj[s.status.toLowerCase()];
                    return (
                      // biome-ignore lint/suspicious/noArrayIndexKey: positional
                      <span key={`i${i}`} className="bchip" title={`From ${s.item}`}>
                        🚫 {st ? <StatusChip st={st} inline /> : s.status}
                      </span>
                    );
                  })}
                </div>
              </>
            )}
            {tot.reflect.length > 0 && (
              <>
                <h4>Reflect</h4>
                <div className="bon">
                  {tot.reflect.map((r, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: positional
                    <span key={i} title={`From ${r.item}`}>
                      <BonusChip bonus={{ reflect: r }} />
                    </span>
                  ))}
                </div>
              </>
            )}
            {tot.skills.length > 0 && (
              <>
                <h4>Skills</h4>
                <div className="bon">
                  {tot.skills.map((s) => (
                    <SkillChip key={s.skill + s.item} name={s.skill} from={s.item} />
                  ))}
                </div>
              </>
            )}
          </Sect>
          <Sect
            k="known"
            Icon={Sparkles}
            title={
              <>
                Known skills <small className="note">({p.known.length})</small>
              </>
            }
          >
            <div className="bon">
              {sortedKnown.length ? (
                sortedKnown.map((n) => <SkillChip key={n} name={n} />)
              ) : (
                <span className="note">None marked yet. Click the markers on the Skills tab.</span>
              )}
            </div>
          </Sect>
          <Sect k="notes" Icon={NotebookPen} title="Notes">
            {ed ? (
              <textarea
                placeholder="Plans, reminders…"
                value={p.notes || ''}
                onChange={(e) =>
                  editMember(id, (m) => {
                    m.notes = e.target.value;
                  })
                }
              />
            ) : (
              <div className="notesview">{p.notes ? p.notes : <span className="note">No notes</span>}</div>
            )}
          </Sect>
        </div>
      </div>
    </>
  );
}

export { RarityTag };
