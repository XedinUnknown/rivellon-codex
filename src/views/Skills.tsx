import { memo, useMemo } from 'react';
import { codex, matches } from '../domain/codex';
import { MEMBERS, SCHOOLS, schoolColor } from '../domain/constants';
import { slug } from '../domain/format';
import { gearSkill, isKnown, meets, type Totals } from '../domain/party';
import { infoSkill } from '../domain/ref';
import type { MemberId, Party, RefTables, Skill } from '../domain/types';
import { useCanEdit, useTotals, useUi } from '../state/hooks';
import { editMember, useApp } from '../state/store';
import { css, Em, Linkify } from '../ui/chips';
import { SheetIcon } from '../ui/icons';
import { StatusLine } from '../ui/StatusLine';

const TGT: Record<string, string> = { S: 'self', A: 'allies', E: 'enemies' };
const skillText = (sk: Skill) =>
  [sk.name, sk.school, sk.dmg, sk.scale, ...sk.effects.map((f) => f.e), ...sk.req.map((r) => r[0])]
    .join(' ')
    .toLowerCase();

export function SkillsView() {
  const { q, schools, craft, use, known } = useUi((u) => ({
    q: u.q.trim().toLowerCase(),
    schools: u.schools,
    craft: u.craft,
    use: u.use,
    known: u.known,
  }));
  const party = useApp((s) => s.party);
  const ref = useApp((s) => s.ref);
  const partyLoaded = useApp((s) => s.partyLoaded);
  const canEdit = useCanEdit();
  const tot = useTotals();
  const all = codex().data.skills;
  const list = useMemo(() => {
    const out = all.filter((sk) => {
      if (schools.length && !sk.req.some((r) => schools.includes(r[0]))) return false;
      if (craft && !sk.craft) return false;
      if (use && !MEMBERS.some((m) => meets(tot[m.id], sk) || gearSkill(tot[m.id], sk))) return false;
      if (known && !MEMBERS.some((m) => isKnown(party[m.id], sk) || gearSkill(tot[m.id], sk))) return false;
      return !q || matches(skillText(sk), q);
    });
    return out.sort(
      (a, b) =>
        SCHOOLS.indexOf(a.school) - SCHOOLS.indexOf(b.school) ||
        (Number(a.book) || 0) - (Number(b.book) || 0) ||
        a.name.localeCompare(b.name),
    );
  }, [all, schools, craft, use, known, q, party, tot]);
  return (
    <>
      <StatusLine>{`${list.length} of ${all.length} skills${partyLoaded ? '' : ' · party not loaded yet'}`}</StatusLine>
      {list.length ? (
        <div className="list">
          {list.map((sk) => (
            <SkillEntry key={sk.name} sk={sk} party={party} tot={tot} canEdit={canEdit} refTables={ref} />
          ))}
        </div>
      ) : (
        <div className="empty">No skills match these filters.</div>
      )}
    </>
  );
}

const SkillEntry = memo(function SkillEntry({
  sk,
  party,
  tot,
  canEdit,
  refTables,
}: {
  sk: Skill;
  party: Party;
  tot: Record<MemberId, Totals>;
  canEdit: boolean;
  refTables: RefTables;
}) {
  const inf = infoSkill(refTables, sk.name);
  return (
    <article className="entry" id={slug('sk', sk.name)} style={css({ '--c': schoolColor(sk.school) })}>
      <SheetIcon icon={sk.icon} name={sk.name} />
      <div style={{ minWidth: 0 }}>
        <div className="hd">
          <h3>{sk.name}</h3>
          <span className="school">{sk.school}</span>
          {sk.craft && <span className="tag craft">Combo</span>}
          {sk.sp && sk.sp !== '-' && <span className="tag">Source</span>}
        </div>
        <div className="stats">
          <Em k="ap" v={sk.ap} />
          {sk.sp && sk.sp !== '-' && <Em k="sp" v={sk.sp} />}
          <Em k="cd" v={sk.cd} />
          <Em k="mem" v={sk.mem} />
          <Em k="range" v={sk.range} />
          <Em k="book" v={sk.book} />
        </div>
        {sk.dmg && sk.dmg !== '-' && (
          <div className="dmg">
            ⚔️ {sk.dmg}
            {sk.block && sk.block !== '-' && ` · 🛡 ${sk.block}`}
            {sk.scale && sk.scale !== '-' && (
              <>
                {' · scales with '}
                <Linkify text={sk.scale} prefer="ab" />
              </>
            )}
          </div>
        )}
        {sk.effects.length > 0 && (
          <ul className="fx">
            {sk.effects.map((f, i) => {
              const dur =
                f.dur && f.dur !== '-'
                  ? `${f.chain ? 'then ' : ''}⏱ ${f.dur} turn${f.dur === '1' ? '' : 's'}`
                  : f.chain
                    ? 'then'
                    : '';
              const res =
                f.res && f.res !== '-'
                  ? `🛡 ${f.res.replace('Physic. Arm.', 'phys. armour').replace('Magic Arm.', 'magic armour')}`
                  : '';
              const tg = f.t
                ? `🎯 ${f.t
                    .split('')
                    .map((x) => TGT[x])
                    .join(', ')}`
                : '';
              return (
                // biome-ignore lint/suspicious/noArrayIndexKey: effects are a fixed list per skill
                <li key={i}>
                  <span>
                    <Linkify text={f.e} />
                  </span>
                  <span className="d">{[dur, res, tg].filter(Boolean).join(' · ')}</span>
                </li>
              );
            })}
          </ul>
        )}
        <div className="req">
          {sk.req.map(([s, l]) => (
            <span key={s + l} className="r" style={{ color: schoolColor(s), borderColor: schoolColor(s) }}>
              {s} {l}
            </span>
          ))}
          {sk.weapon && <span className="tag">Needs {sk.weapon}</span>}
          <span className="party">
            {MEMBERS.map((m) => {
              const k = isKnown(party[m.id], sk);
              const g = gearSkill(tot[m.id], sk);
              const ok = meets(tot[m.id], sk);
              const st = k
                ? 'knows it'
                : g
                  ? `granted by ${g.item}`
                  : ok
                    ? 'meets requirements'
                    : 'requirements not met';
              const title = `${m.name}: ${st}${canEdit ? ` (click to mark ${k ? 'unknown' : 'known'})` : ''}`;
              return (
                <button
                  type="button"
                  key={m.id}
                  className={`pc ${k ? 'known' : g ? 'gear' : ok ? 'ok' : ''}`}
                  title={title}
                  aria-label={title}
                  disabled={!canEdit}
                  onClick={() =>
                    editMember(m.id, (p) => {
                      p.known = p.known.includes(sk.name)
                        ? p.known.filter((x) => x !== sk.name)
                        : [...p.known, sk.name];
                    })
                  }
                >
                  {m.ab}
                </button>
              );
            })}
          </span>
        </div>
        {inf && (
          <details className="nt">
            <summary>Info sheet</summary>
            {inf.description ? (
              <p>
                <Linkify text={inf.description} />
              </p>
            ) : null}
            {inf.numbers != null && inf.numbers !== '-' && (
              <p>
                <b>{String(inf.numType || 'Numbers')}:</b> {String(inf.numbers)}
                {inf.scaling && inf.scaling !== '-' ? ` (scales with ${String(inf.scaling)})` : ''}
              </p>
            )}
            {inf.weaponReq ? (
              <p>
                <b>Weapon:</b> {String(inf.weaponReq)}
              </p>
            ) : null}
            {inf.statusRef ? (
              <p>
                <Linkify text={inf.statusRef} />
              </p>
            ) : null}
            {inf._notes &&
              Object.entries(inf._notes).map(([k, v]) => (
                <p key={k}>
                  <Linkify text={v} />
                </p>
              ))}
          </details>
        )}
      </div>
    </article>
  );
});
