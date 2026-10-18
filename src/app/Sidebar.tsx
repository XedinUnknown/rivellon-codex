import { useEffect, useState } from 'react';
import { codex } from '../domain/codex';
import { refRows } from '../domain/ref';
import { goTab } from '../state/nav';
import { setUi, type Tab, useApp } from '../state/store';
import {
  Activity,
  Backpack,
  BookOpen,
  Calculator,
  Ghost,
  Hammer,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Swords,
  Users,
} from '../ui/lucide';
import { SaveIndicator } from './SaveIndicator';

const ICON = {
  party: Users,
  items: Backpack,
  skills: Sparkles,
  status: Activity,
  summons: Ghost,
  special: Swords,
  crafting: Hammer,
  gear: Calculator,
  reference: BookOpen,
} as const;

const narrowQuery = '(max-width:700px)';

export function Sidebar() {
  const tab = useApp((s) => s.ui.tab);
  const items = useApp((s) => s.items);
  const ref = useApp((s) => s.ref);
  const collapsed = useApp((s) => s.ui.sideCollapsed);
  const open = useApp((s) => s.ui.sideOpen);
  const [narrow, setNarrow] = useState(() => window.matchMedia(narrowQuery).matches);
  useEffect(() => {
    const mq = window.matchMedia(narrowQuery);
    const on = () => setNarrow(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  const { data } = codex();
  const recipes = refRows(ref, 'recipes').length;
  const tabs: [Tab, string, number | string][] = [
    ['party', 'Party', 4],
    ['items', 'Items', Object.keys(items).length],
    ['skills', 'Skills', data.skills.length],
    ['status', 'Status effects', data.statuses.length],
    ['summons', 'Summons', data.summons.length],
    ['special', 'Weapon & racial', data.special.length],
    ['crafting', 'Crafting', recipes || '…'],
    ['gear', 'Gear calculator', ''],
    ['reference', 'Reference', ''],
  ];
  const shut = narrow ? !open : collapsed;
  return (
    <nav
      className={`side${!narrow && collapsed ? ' collapsed' : ''}${open ? ' open' : ''}`}
      id="side"
      aria-label="Sections"
    >
      <div className="brand">
        <button
          type="button"
          className="sidetoggle"
          title={shut ? 'Expand menu' : 'Collapse menu'}
          aria-label={shut ? 'Expand menu' : 'Collapse menu'}
          onClick={() =>
            setUi((u) => {
              if (narrow) u.sideOpen = !u.sideOpen;
              else u.sideCollapsed = !u.sideCollapsed;
            })
          }
        >
          {shut ? <PanelLeftOpen /> : <PanelLeftClose />}
        </button>
        <div
          className="bt"
          title="Skills, combos, summons and statuses from the Nexus DOS2 DE sheet; recipes, gear rolls, runes and talents from the community Info (Shared) sheet; your party and items from the storage chosen under the save indicator."
        >
          Rivellon Codex<small>DOS2 DE party companion</small>
        </div>
      </div>
      <SaveIndicator />
      <div className="tabs" role="tablist" aria-orientation="vertical">
        {tabs.map(([k, label, n]) => {
          const Icon = ICON[k];
          return (
            <button
              type="button"
              key={k}
              role="tab"
              aria-selected={tab === k}
              title={label}
              aria-label={label}
              onClick={() => goTab(k)}
            >
              <Icon />
              <span className="lbl">{label}</span>
              {n !== '' && <span className="count">{n}</span>}
            </button>
          );
        })}
      </div>
      <div className="credit">
        Icons:{' '}
        <a href="https://game-icons.net" target="_blank" rel="noopener">
          game-icons.net
        </a>{' '}
        (CC BY 3.0, Lorc, Delapouite &amp; contributors) ·{' '}
        <a href="https://lucide.dev" target="_blank" rel="noopener">
          Lucide
        </a>{' '}
        (ISC)
      </div>
    </nav>
  );
}
