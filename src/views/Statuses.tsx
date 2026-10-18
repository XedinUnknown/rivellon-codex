import { type ReactNode, useMemo } from 'react';
import { codex, matches, textOf } from '../domain/codex';
import { slug } from '../domain/format';
import { useUi } from '../state/hooks';
import { chipFor, Linkify, type Prefer } from '../ui/chips';
import { SheetIcon } from '../ui/icons';
import { StatusLine } from '../ui/StatusLine';

/** A list whose entries can read "A → B" (A turns into B); each side becomes a chip when it's a known name. */
function ArrowList({ items, prefer }: { items: string[]; prefer: Prefer }) {
  return (
    <ul>
      {items.map((x, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static lists from the sheet
        <li key={i}>
          {x.split('→').map((p, j) => {
            const t = p.trim();
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: parts of one entry
              <span key={j}>
                {j > 0 && ' → '}
                {chipFor(t, prefer) ?? <Linkify text={t} prefer={prefer} />}
              </span>
            );
          })}
        </li>
      ))}
    </ul>
  );
}
/** "§Heading" entries split a list into titled groups. */
function Grouped({ items }: { items: string[] }) {
  const out: ReactNode[] = [];
  let buf: string[] = [];
  const flush = () => {
    if (buf.length) out.push(<ArrowList key={out.length} items={buf} prefer="status" />);
    buf = [];
  };
  for (const t of items) {
    if (t.startsWith('§')) {
      flush();
      out.push(<h4 key={out.length}>{t.slice(1)}</h4>);
    } else buf.push(t);
  }
  flush();
  return <>{out}</>;
}

export function StatusesView() {
  const q = useUi((u) => u.q.trim().toLowerCase());
  const all = codex().data.statuses;
  const list = useMemo(() => all.filter((s) => matches(textOf(s), q)), [all, q]);
  return (
    <>
      <StatusLine>{`${list.length} of ${all.length} status effects`}</StatusLine>
      {list.length ? (
        <div className="list">
          {list.map((s) => {
            const causes = Object.entries(s.causes).filter(([, v]) => v.length);
            return (
              <article
                key={s.name}
                className="entry"
                id={slug('st', s.name)}
                style={{ ['--c' as string]: 'var(--accent)' }}
              >
                <SheetIcon icon={s.icon} name={s.name} />
                <div style={{ minWidth: 0 }}>
                  <div className="hd">
                    <h3>{s.name}</h3>
                  </div>
                  {s.effects.length > 0 && (
                    <ul className="fx">
                      {s.effects.map((e) => (
                        <li key={e}>
                          <span>
                            <Linkify text={e} />
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="cols">
                    {causes.length > 0 && (
                      <div>
                        {causes.map(([k, v]) => (
                          <div key={k}>
                            <h4>{k}</h4>
                            <ArrowList items={v} prefer={/skill/i.test(k) ? 'skill' : 'status'} />
                          </div>
                        ))}
                      </div>
                    )}
                    {s.resist.length > 0 && (
                      <div>
                        <h4>Resisted by ({s.resistHead})</h4>
                        <ArrowList items={s.resist} prefer="status" />
                      </div>
                    )}
                    {s.immune.length > 0 && (
                      <div>
                        <h4>Immunity from ({s.immuneHead})</h4>
                        <ArrowList items={s.immune} prefer="status" />
                      </div>
                    )}
                    {s.treat.length > 0 && (
                      <div>
                        <h4>Removed by ({s.treatHead})</h4>
                        <Grouped items={s.treat} />
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty">No status effects match “{q}”.</div>
      )}
    </>
  );
}
