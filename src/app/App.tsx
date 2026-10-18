import { useState } from 'react';
import { useApp } from '../state/store';
import { StatusLineTarget } from '../ui/StatusLine';
import { Tooltip } from '../ui/Tooltip';
import { CraftingView } from '../views/Crafting';
import { GearCalcView } from '../views/GearCalc';
import { ItemsView } from '../views/Items';
import { PartyView } from '../views/party/Party';
import { ReferenceView } from '../views/Reference';
import { SimpleListView } from '../views/SimpleList';
import { SkillsView } from '../views/Skills';
import { StatusesView } from '../views/Statuses';
import { FilterBar } from './FilterBar';
import { Sidebar } from './Sidebar';
import { StorageDialog } from './StorageDialog';

function View() {
  const tab = useApp((s) => s.ui.tab);
  switch (tab) {
    case 'skills':
      return <SkillsView />;
    case 'status':
      return <StatusesView />;
    case 'summons':
      return <SimpleListView which="summons" />;
    case 'special':
      return <SimpleListView which="special" />;
    case 'crafting':
      return <CraftingView />;
    case 'items':
      return <ItemsView />;
    case 'gear':
      return <GearCalcView />;
    case 'reference':
      return <ReferenceView />;
    default:
      return <PartyView />;
  }
}

export function App() {
  const [line, setLine] = useState<HTMLDivElement | null>(null);
  return (
    <div className="shell">
      <Sidebar />
      <div className="wrap">
        <FilterBar lineRef={setLine} />
        <StatusLineTarget.Provider value={line}>
          <main id="view">
            <View />
          </main>
        </StatusLineTarget.Provider>
      </div>
      <Tooltip />
      <StorageDialog />
    </div>
  );
}
