// Small helpers that reproduce how the original Python extractors read cells, so outputs stay identical.
import type { Scalar } from './sheet.ts';

/** Python's str() of a cell value (True/False for booleans). */
export function pyStr(v: Scalar): string {
  if (v == null) return '';
  if (typeof v === 'boolean') return v ? 'True' : 'False';
  return String(v);
}

/** Python truthiness of a cell value. */
export const truthy = (v: Scalar): boolean => v != null && v !== '' && v !== 0 && v !== false;

/** isinstance(v, (int, float)) — bool counts, as it's an int subclass in Python. */
export const isNum = (v: Scalar): v is number | boolean => typeof v === 'number' || typeof v === 'boolean';
