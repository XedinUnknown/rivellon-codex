import { Fragment, useMemo } from 'react';
import { matches, textOf } from '../domain/codex';
import { nameIcon } from '../domain/items';
import { ingredientCategories, refRows } from '../domain/ref';
import type { Recipe } from '../domain/types';
import { useUi } from '../state/hooks';
import { navigate } from '../state/nav';
import { useApp } from '../state/store';
import { chipFor, Linkify } from '../ui/chips';
import { GameIcon } from '../ui/icons';
import { SheetNotes } from '../ui/Notes';
import { StatusLine } from '../ui/StatusLine';

const NOTE_LABELS = {
  result: 'Result',
  effect: 'Effect',
  result2: 'Second result',
  ing1: 'Ingredient 1',
  ing2: 'Ingredient 2',
  ing3: 'Ingredient 3',
  ing4: 'Ingredient 4',
  ing5: 'Ingredient 5',
};
const SHOWN = 250;

export function CraftingView() {
  const ref = useApp((s) => s.ref);
  const { q, cats, ing } = useUi((u) => ({ q: u.q.trim().toLowerCase(), cats: u.cats, ing: u.ing }));
  const all = refRows<Recipe>(ref, 'recipes');
  const ingCat = ingredientCategories(ref);
  const list = useMemo(() => {
    const ingLc = ing.toLowerCase();
    return all.filter((r) => {
      if (cats.length && !cats.includes(r.category as string)) return false;
      if (ingLc && !(r.ingredients ?? []).some((i) => String(i.name).toLowerCase() === ingLc)) return false;
      return matches(textOf(r), q);
    });
  }, [all, cats, ing, q]);
  const shown = list.slice(0, SHOWN);
  return (
    <>
      <StatusLine>
        {`${list.length} of ${all.length} recipes${list.length > shown.length ? ` · showing the first ${shown.length}, search to narrow` : ''} · click an ingredient to see everything it's used in`}
      </StatusLine>
      {!list.length ? (
        <div className="empty">No recipes match.</div>
      ) : (
        <div className="rows">
          {shown.map((r, idx) => {
            const tags = [
              r.category,
              r.subcat && r.subcat !== r.category ? r.subcat : null,
              r.station ? `at ${r.station}` : null,
            ].filter(Boolean) as string[];
            const resChip =
              r.category === 'Grimoire'
                ? chipFor(String(r.result).replace(/\s+(Skillbook|Scroll)$/i, ''), 'skill')
                : null;
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: recipe rows have no id and may repeat a result
              <article key={idx} className="rrow" style={{ ['--c' as string]: 'var(--accent)' }}>
                <div className="hd">
                  <span className="ricon">
                    <GameIcon k={nameIcon(r.result, r.subcat, r.category)} />
                  </span>
                  <h3>
                    {r.result}
                    {r.amount && r.amount > 1 ? ` ×${r.amount}` : ''}
                  </h3>
                  {resChip}
                  {r.result2 && (
                    <span className="tag">
                      + {r.result2}
                      {(r.amount2 ?? 0) > 1 ? ` ×${r.amount2}` : ''}
                    </span>
                  )}
                  {tags.map((t) => (
                    <span key={t} className="tag">
                      {t}
                    </span>
                  ))}
                </div>
                {r.effect && (
                  <div className="dmg">
                    <Linkify text={r.effect} />
                  </div>
                )}
                <div className="ing">
                  {(r.ingredients ?? []).map((i, n) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: an ingredient can appear twice
                    <Fragment key={n}>
                      {n > 0 && <span>+</span>}
                      <button
                        type="button"
                        className="ingb"
                        title={i.mode === 'Transform' ? 'Transformed into the result (not just used up)' : 'Used up'}
                        onClick={() => {
                          navigate((u) => {
                            u.ing = String(i.name);
                            u.q = '';
                          });
                          window.scrollTo({ top: 0 });
                        }}
                      >
                        <span className="iicon">
                          <GameIcon k={nameIcon(i.name, ingCat[String(i.name).toLowerCase()])} />
                        </span>
                        {String(i.name)}
                        {i.mode === 'Transform' && (
                          <>
                            {' '}
                            <small>transforms</small>
                          </>
                        )}
                      </button>
                    </Fragment>
                  ))}
                </div>
                <SheetNotes notes={r._notes} labels={NOTE_LABELS} />
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
