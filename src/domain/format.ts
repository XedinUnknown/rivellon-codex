/** One decimal at most, locale grouping. */
export const fmt = (n: number) => (Math.round(n * 10) / 10).toLocaleString();
/** fmt with an explicit + for positive numbers. */
export const sgn = (n: number) => (n > 0 ? '+' : '') + fmt(n);
/** Element id for an entry, e.g. slug('sk', 'Battle Stomp') -> "sk-battle-stomp". */
export const slug = (p: string, s: string) =>
  `${p}-${String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')}`;
export const clone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T;
