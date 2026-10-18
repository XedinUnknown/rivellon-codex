import type { Notes } from '../domain/types';
import { Linkify } from './chips';

/** The spreadsheet's cell comments for a row, collapsed. */
export function SheetNotes({ notes, labels = {} }: { notes: Notes | undefined; labels?: Record<string, string> }) {
  const parts = Object.entries(notes ?? {}).filter(([, v]) => v);
  if (!parts.length) return null;
  return (
    <details className="nt">
      <summary>Sheet notes</summary>
      {parts.map(([k, v]) => (
        <p key={k}>
          {labels[k] && <b>{labels[k]}: </b>}
          <Linkify text={v} />
        </p>
      ))}
    </details>
  );
}
