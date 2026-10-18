// Icons: game-icons.net bodies (equipment, portraits, crafting) and the Nexus sheet's skill/status images.
import { codex } from '../domain/codex';

/** A game-icons.net icon by app key (see tools/build-icons.ts), coloured with currentColor. */
export function GameIcon({ k }: { k: string }) {
  const { game } = codex();
  const body = game.icons[k];
  if (!body) return null;
  return (
    <svg
      className="gi"
      viewBox={`0 0 ${game.size[0]} ${game.size[1]}`}
      aria-hidden="true"
      // the bodies are static, trusted SVG markup generated at build time from @iconify-json/game-icons
      // biome-ignore lint/security/noDangerouslySetInnerHtml: build-time icon data
      dangerouslySetInnerHTML={{ __html: body }}
    />
  );
}

/** Initials of a name for the badge shown instead of a missing icon: "Battle Stomp" -> "BS". */
const initials = (name: string) =>
  name
    .replace(/\(.*?\)/g, '')
    .split(/[\s-]+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

/**
 * A skill/status icon from the Nexus sheet. The icons are Larian's game art, so they're only there when extracted from
 * the user's copy of the workbook; otherwise entries show a badge with the name's initials in the entry's colour.
 */
export function SheetIcon({ icon, name, small }: { icon: string | null | undefined; name?: string; small?: boolean }) {
  const src = icon ? codex().data.icons[icon] : undefined;
  if (small) return src ? <img src={src} alt="" /> : null;
  if (src) return <img className="ic" src={src} alt="" loading="lazy" />;
  return (
    <div className="noic" aria-hidden="true">
      {name ? initials(name) : ''}
    </div>
  );
}
