import { KINDS, MEMBERS, REF_SECTIONS, SCHOOLS, schoolColor } from '../domain/constants';
import { refRows } from '../domain/ref';
import { useUi } from '../state/hooks';
import { navigate } from '../state/nav';
import { useApp } from '../state/store';
import { css } from '../ui/chips';

const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

/** Search, filters and the status line above every tab except Party. */
export function FilterBar({ lineRef }: { lineRef: (el: HTMLDivElement | null) => void }) {
  const u = useUi((u) => ({
    tab: u.tab,
    q: u.q,
    schools: u.schools,
    craft: u.craft,
    use: u.use,
    known: u.known,
    cats: u.cats,
    kinds: u.kinds,
    refSec: u.refSec,
    ing: u.ing,
  }));
  const ref = useApp((s) => s.ref);
  const notice = useApp((s) => s.notice);
  const sk = u.tab === 'skills';
  const placeholder =
    u.tab === 'crafting'
      ? 'Search recipes, effects, ingredients…'
      : u.tab === 'reference'
        ? 'Search this section…'
        : u.tab === 'items'
          ? 'Search items and bonuses…'
          : 'Search names, effects, statuses…';
  const cats =
    u.tab === 'crafting'
      ? [
          ...new Set(
            refRows(ref, 'recipes')
              .map((r) => r.category as string)
              .filter(Boolean),
          ),
        ].sort()
      : [];
  const flag = (k: 'craft' | 'use' | 'known', label: string) => (
    <label className="toggle">
      <input
        type="checkbox"
        checked={u[k]}
        onChange={(e) =>
          navigate((x) => {
            x[k] = e.target.checked;
          }, 'replace')
        }
      />{' '}
      {label}
    </label>
  );
  return (
    <div className="bar" id="bar" hidden={u.tab === 'party'}>
      <div className="filters">
        {u.tab !== 'gear' && (
          <input
            type="search"
            id="q"
            placeholder={placeholder}
            aria-label="Search"
            value={u.q}
            onChange={(e) =>
              navigate((x) => {
                x.q = e.target.value;
              }, 'replace')
            }
          />
        )}
        {sk && (
          <>
            {flag('craft', 'Combos only')}
            {flag('use', 'Party can use')}
            {flag('known', 'Known by party')}
          </>
        )}
      </div>
      {sk && (
        <div className="chips">
          {SCHOOLS.map((s) => (
            <button
              type="button"
              key={s}
              className="chip"
              style={css({ '--c': schoolColor(s) })}
              aria-pressed={u.schools.includes(s)}
              onClick={() =>
                navigate((x) => {
                  x.schools = toggle(x.schools, s);
                }, 'replace')
              }
            >
              {s}
            </button>
          ))}
        </div>
      )}
      {u.tab === 'crafting' && (cats.length > 0 || u.ing) && (
        <div className="chips">
          {cats.map((c) => (
            <button
              type="button"
              key={c}
              className="chip"
              aria-pressed={u.cats.includes(c)}
              onClick={() =>
                navigate((x) => {
                  x.cats = toggle(x.cats, c);
                }, 'replace')
              }
            >
              {c}
            </button>
          ))}
          {u.ing && (
            <button
              type="button"
              className="chip"
              aria-pressed="true"
              title="Clear ingredient filter"
              onClick={() =>
                navigate((x) => {
                  x.ing = '';
                })
              }
            >
              Uses: {u.ing} ×
            </button>
          )}
        </div>
      )}
      {u.tab === 'reference' && (
        <div className="chips">
          {REF_SECTIONS.map(([k, l]) => (
            <button
              type="button"
              key={k}
              className="chip"
              aria-pressed={u.refSec === k}
              onClick={() =>
                navigate((x) => {
                  x.refSec = k;
                })
              }
            >
              {l}
            </button>
          ))}
        </div>
      )}
      {u.tab === 'items' && (
        <div className="chips">
          {Object.entries(KINDS).map(([k, l]) => (
            <button
              type="button"
              key={k}
              className="chip"
              aria-pressed={u.kinds.includes(k)}
              onClick={() =>
                navigate((x) => {
                  x.kinds = toggle(x.kinds, k);
                }, 'replace')
              }
            >
              {l}
            </button>
          ))}
        </div>
      )}
      {sk && (
        <div className="note">
          Party markers on each skill ({MEMBERS.map((m) => m.ab).join(' · ')}): <b>faded</b> = requirements not met yet,{' '}
          <b>outlined</b> = meets the requirements, <b>filled</b> = knows the skill. Click a marker to mark that
          character as knowing the skill, or click again to unmark. Set ability levels in the Party tab.
        </div>
      )}
      <div className="status-line" id="sline" ref={lineRef} />
      {notice && (
        <div className="status-line" role="status">
          {notice}
        </div>
      )}
    </div>
  );
}
