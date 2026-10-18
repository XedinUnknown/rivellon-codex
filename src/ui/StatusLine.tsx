// Each view puts its one-line summary ("12 of 202 skills") into the filter bar's status line.
import { createContext, useContext } from 'react';
import { createPortal } from 'react-dom';

export const StatusLineTarget = createContext<HTMLElement | null>(null);

export function StatusLine({ children }: { children: string }) {
  const el = useContext(StatusLineTarget);
  return el ? createPortal(children, el) : null;
}
