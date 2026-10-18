import { Fragment, useMemo } from 'react';
import { codex, matches, textOf } from '../domain/codex';
import { slug } from '../domain/format';
import { useUi } from '../state/hooks';
import { Em, Linkify } from '../ui/chips';
import { SheetIcon } from '../ui/icons';
import { StatusLine } from '../ui/StatusLine';

/** Summons, or weapon & racial skills: grouped entries with fewer fields than regular skills. */
export function SimpleListView({ which }: { which: 'summons' | 'special' }) {
  const q = useUi((u) => u.q.trim().toLowerCase());
  const all = codex().data[which];
  const label = which === 'summons' ? 'summon skills' : 'weapon & racial skills';
  const list = useMemo(() => all.filter((x) => matches(textOf(x), q)), [all, q]);
  return (
    <>
      <StatusLine>{`${list.length} of ${all.length} ${label}`}</StatusLine>
      {list.length ? (
        list.map((x, i) => {
          const head = i === 0 || list[i - 1]?.group !== x.group ? x.group : null;
          return (
            <Fragment key={x.name + x.group}>
              {head != null && <h2 style={{ font: '700 1.1rem var(--display)', margin: '18px 0 0' }}>{head}</h2>}
              <article
                className="entry"
                id={slug('sk', x.name)}
                style={{ ['--c' as string]: 'var(--accent)', marginTop: 8 }}
              >
                <SheetIcon icon={x.icon} name={x.name} />
                <div style={{ minWidth: 0 }}>
                  <div className="hd">
                    <h3>{x.name}</h3>
                  </div>
                  <div className="stats">
                    <Em k="ap" v={x.ap} />
                    {x.sp && x.sp !== '-' && <Em k="sp" v={x.sp} />}
                    <Em k="cd" v={x.cd} />
                    <Em k="range" v={x.range} />
                  </div>
                  {x.dmg && x.dmg !== '-' && (
                    <div className="dmg">
                      ⚔️ {x.dmg}
                      {x.block && x.block !== '-' && ` · 🛡 ${x.block}`}
                      {x.scale && x.scale !== '-' && (
                        <>
                          {' · scales with '}
                          <Linkify text={x.scale} prefer="ab" />
                        </>
                      )}
                    </div>
                  )}
                  {x.effect && x.effect !== '-' && (
                    <ul className="fx">
                      <li>
                        <span>
                          <Linkify text={x.effect} />
                        </span>
                        {x.dur && x.dur !== '-' && <span className="d">⏱ {x.dur} turns</span>}
                      </li>
                    </ul>
                  )}
                  {x.extra && (
                    <div className="req">
                      <span className="tag">Needs {x.extra}</span>
                    </div>
                  )}
                </div>
              </article>
            </Fragment>
          );
        })
      ) : (
        <div className="empty">Nothing matches “{q}”.</div>
      )}
    </>
  );
}
