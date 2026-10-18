// @iconify-json/game-icons -> data/game-icons.json: only the icons the app uses, by app key.
//
//   npm run data:icons
//
// Output: { size: [w, h], icons: { key: "<svg body>" } }. Bodies go inside <svg viewBox="0 0 w h"> and use
// currentColor. For each key the first candidate present in the installed icon set wins.
// UI icons (Lucide) come from lucide-react instead and are tree-shaken at build time.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const GAME: Record<string, string[]> = {
  // equipment slots / weapon types (itemIconKey)
  helmet: ['visored-helm'],
  amulet: ['gem-pendant'],
  chest: ['breastplate'],
  gloves: ['gauntlet'],
  belt: ['belt'],
  leggings: ['trousers'],
  boots: ['boots'],
  ring: ['ring'],
  sword: ['broadsword'],
  sword2: ['relic-blade'],
  axe: ['battle-axe'],
  axe2: ['sharp-axe'],
  mace: ['flanged-mace'],
  mace2: ['warhammer'],
  dagger: ['plain-dagger'],
  wand: ['fairy-wand'],
  spear: ['barbed-spear'],
  staff: ['wizard-staff'],
  bow: ['pocket-bow'],
  crossbow: ['crossbow'],
  shield: ['round-shield'],
  rune: ['rune-stone'],
  empty: ['cancel'],
  // portraits (portraitKey) and character stats
  'p-human-m': ['viking-head'],
  'p-human-f': ['witch-face'],
  'p-elf-m': ['elf-helmet'],
  'p-elf-f': ['woman-elf-face'],
  'p-dwarf-m': ['dwarf-face'],
  'p-dwarf-f': ['dwarf-king'],
  'p-lizard': ['lizardman'],
  'p-undead': ['skeleton'],
  'p-unknown': ['portrait'],
  heart: ['heart-plus'],
  ap: ['lightning-trio'],
  // generic things (NAME_ICON_RULES use the x- keys)
  'x-book': ['spell-book', 'book-cover'],
  'x-scroll': ['scroll-unfurled'],
  'x-potion': ['standing-potion', 'potion-ball'],
  'x-poison': ['poison-bottle'],
  'x-heal': ['health-potion'],
  'x-herbs': ['herbs-bundle', 'flowers'],
  'x-arrow': ['arrow-flights'],
  'x-arrowhead': ['arrowhead'],
  'x-bomb': ['unlit-bomb', 'grenade'],
  'x-meal': ['meal', 'hot-meal'],
  'x-apple': ['shiny-apple'],
  'x-mushroom': ['mushroom-gills'],
  'x-fish': ['fish-cooked', 'fried-fish'],
  'x-meat': ['ham-shank', 'meat'],
  'x-cheese': ['cheese-wedge'],
  'x-egg': ['egg-clutch'],
  'x-tomato': ['tomato'],
  'x-potato': ['potato'],
  'x-drink': ['beer-stein', 'wine-bottle'],
  'x-water': ['water-flask', 'drop'],
  'x-honey': ['honey-jar', 'honeypot'],
  'x-powder': ['powder'],
  'x-flour': ['flour', 'wheat'],
  'x-metal': ['metal-bar'],
  'x-hide': ['animal-hide'],
  'x-cloth': ['rolled-cloth'],
  'x-needle': ['sewing-needle'],
  'x-wood': ['wood-stick', 'log'],
  'x-stone': ['stone-pile'],
  'x-feather': ['feather'],
  'x-bone': ['crossed-bones'],
  'x-skull': ['skull-crossed-bones'],
  'x-blood': ['drop'],
  'x-essence': ['crystal-shine', 'crystal-growth'],
  'x-orb': ['crystal-ball'],
  'x-ghost': ['ghost'],
  'x-quill': ['quill-ink'],
  'x-jar': ['glass-jar', 'jar', 'covered-jar'],
  'x-tool': ['hammer-nails'],
  'x-lockpick': ['lockpicks'],
  'x-bag': ['swap-bag', 'knapsack'],
  'x-boost': ['upgrade'],
  'x-sparkle': ['sparkles'],
  'x-mask': ['mask', 'carnival-mask'],
  'x-ore': ['ore'],
  'x-key': ['key'],
  'x-eye': ['eye-target', 'eyeball'],
  'x-tentacle': ['tentacle-strike'],
  'x-slime': ['slime'],
  'x-oil': ['oil-drum'],
  'x-salt': ['salt-shaker', 'powder'],
  'x-bread': ['bread'],
  'x-carrot': ['carrot'],
  'x-pumpkin': ['pumpkin'],
  'x-grapes': ['grapes'],
  'x-paper': ['paper', 'papers'],
  'x-map': ['treasure-map'],
  'x-coin': ['coins'],
  'x-horn': ['horn-internal', 'spiral-shell'],
  'x-heart': ['heart-organ'],
  'x-claw': ['claw'],
  'x-tooth': ['tooth'],
  'x-web': ['spider-web'],
  'x-fire': ['flame'],
  'x-ice': ['ice-cube'],
  'x-lightning': ['lightning-arc'],
};

const [out = 'data/game-icons.json'] = process.argv.slice(2);
const require = createRequire(import.meta.url);
const set = JSON.parse(readFileSync(require.resolve('@iconify-json/game-icons/icons.json'), 'utf8')) as {
  icons: Record<string, { body: string }>;
  width?: number;
  height?: number;
};

const icons: Record<string, string> = {};
const missing: string[] = [];
for (const [key, candidates] of Object.entries(GAME)) {
  const hit = candidates.find((c) => c in set.icons);
  if (hit) icons[key] = (set.icons[hit] as { body: string }).body;
  else missing.push(`${key} (${candidates.join(', ')})`);
}
writeFileSync(out, `${JSON.stringify({ size: [set.width ?? 512, set.height ?? 512], icons }, null, 2)}\n`);
console.log(`${Object.keys(icons).length} game icons -> ${out}`);
if (missing.length) {
  console.error(`missing: ${missing.join('; ')}`);
  process.exitCode = 1;
}
