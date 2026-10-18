import { type CSSProperties, type InputHTMLAttributes, useState } from 'react';

type Base = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'>;

/** A number field: keeps what's typed while focused (so "1." or an empty field survive), reports a number or null. */
export function NumInput({
  value,
  onValue,
  int,
  style,
  ...rest
}: Base & { value: number | null | undefined; onValue(v: number | null): void; int?: boolean; style?: CSSProperties }) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <input
      {...rest}
      type="number"
      style={style}
      value={draft ?? value ?? ''}
      onChange={(e) => {
        const t = e.target.value;
        setDraft(t);
        if (t === '') onValue(null);
        else {
          const n = int ? Number.parseInt(t, 10) : Number(t);
          if (!Number.isNaN(n)) onValue(n);
        }
      }}
      onBlur={(e) => {
        setDraft(null);
        rest.onBlur?.(e);
      }}
    />
  );
}
