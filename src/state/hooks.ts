import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { allTotals } from '../domain/party';
import { type State, type Ui, useApp } from './store';

export const useUi = <T>(pick: (u: Ui) => T): T => useApp(useShallow((s: State) => pick(s.ui)));
/** Totals for every member, recomputed only when the party or items change. */
export function useTotals() {
  const party = useApp((s) => s.party);
  const items = useApp((s) => s.items);
  return useMemo(() => allTotals(party, items), [party, items]);
}
/** Whether edits are possible (writable storage in use). */
export const useCanEdit = () => useApp((s) => s.canWrite && !!s.backend);
