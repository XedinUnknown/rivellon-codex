"""Rebuild data/icons.json from the npm icon packages.

  npm i @iconify-json/game-icons lucide-static      (in any scratch folder)
  python3 tools/build_icons.py <path-to-node_modules>

Output shape:
  { "game": { key: "<svg body>" }, "gameSize": [512, 512], "lucide": { name: "<full svg>" } }
Game-icons bodies are used inside <svg viewBox="0 0 512 512"> with fill=currentColor (see gIcon() in app.js).
For each key the first candidate that exists in the installed game-icons version wins.
"""
import json, os, sys, pathlib

nm = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else 'node_modules')
G = json.load(open(nm / '@iconify-json/game-icons/icons.json'))
names = set(G['icons'])

GAME = {
    # equipment slots / weapon types (itemIconKey)
    'helmet': ['visored-helm'], 'amulet': ['gem-pendant'], 'chest': ['breastplate'], 'gloves': ['gauntlet'],
    'belt': ['belt'], 'leggings': ['trousers'], 'boots': ['boots'], 'ring': ['ring'],
    'sword': ['broadsword'], 'sword2': ['relic-blade'], 'axe': ['battle-axe'], 'axe2': ['sharp-axe'],
    'mace': ['flanged-mace'], 'mace2': ['warhammer'], 'dagger': ['plain-dagger'], 'wand': ['fairy-wand'],
    'spear': ['barbed-spear'], 'staff': ['wizard-staff'], 'bow': ['pocket-bow'], 'crossbow': ['crossbow'],
    'shield': ['round-shield'], 'rune': ['rune-stone'], 'empty': ['cancel'],
    # portraits (portraitKey) and character stats
    'p-human-m': ['viking-head'], 'p-human-f': ['witch-face'], 'p-elf-m': ['elf-helmet'], 'p-elf-f': ['woman-elf-face'],
    'p-dwarf-m': ['dwarf-face'], 'p-dwarf-f': ['dwarf-king'], 'p-lizard': ['lizardman'], 'p-undead': ['skeleton'],
    'p-unknown': ['portrait'], 'heart': ['heart-plus'], 'ap': ['lightning-trio'],
    # generic things (nameIcon rules in app.js use the 'x-' keys)
    'x-book': ['spell-book', 'book-cover'], 'x-scroll': ['scroll-unfurled'], 'x-potion': ['standing-potion', 'potion-ball'],
    'x-poison': ['poison-bottle'], 'x-heal': ['health-potion'], 'x-herbs': ['herbs-bundle', 'flowers'],
    'x-arrow': ['arrow-flights'], 'x-arrowhead': ['arrowhead'], 'x-bomb': ['unlit-bomb', 'grenade'],
    'x-meal': ['meal', 'hot-meal'], 'x-apple': ['shiny-apple'], 'x-mushroom': ['mushroom-gills'], 'x-fish': ['fish-cooked', 'fried-fish'],
    'x-meat': ['ham-shank', 'meat'], 'x-cheese': ['cheese-wedge'], 'x-egg': ['egg-clutch'], 'x-tomato': ['tomato'], 'x-potato': ['potato'],
    'x-drink': ['beer-stein', 'wine-bottle'], 'x-water': ['water-flask', 'drop'], 'x-honey': ['honey-jar', 'honeypot'],
    'x-powder': ['powder'], 'x-flour': ['flour', 'wheat'], 'x-metal': ['metal-bar'], 'x-hide': ['animal-hide'],
    'x-cloth': ['rolled-cloth'], 'x-needle': ['sewing-needle'], 'x-wood': ['wood-stick', 'log'], 'x-stone': ['stone-pile'],
    'x-feather': ['feather'], 'x-bone': ['crossed-bones'], 'x-skull': ['skull-crossed-bones'], 'x-blood': ['drop'],
    'x-essence': ['crystal-shine', 'crystal-growth'], 'x-orb': ['crystal-ball'], 'x-ghost': ['ghost'], 'x-quill': ['quill-ink'],
    'x-jar': ['glass-jar', 'jar'], 'x-tool': ['hammer-nails'], 'x-lockpick': ['lockpicks'], 'x-bag': ['swap-bag', 'knapsack'],
    'x-boost': ['upgrade'], 'x-sparkle': ['sparkles'], 'x-mask': ['mask'], 'x-ore': ['ore'], 'x-key': ['key'],
    'x-eye': ['eye-target', 'eyeball'], 'x-tentacle': ['tentacle-strike'], 'x-slime': ['slime'], 'x-oil': ['oil-drum'],
    'x-salt': ['salt-shaker', 'powder'], 'x-bread': ['bread'], 'x-carrot': ['carrot'], 'x-pumpkin': ['pumpkin'], 'x-grapes': ['grapes'],
    'x-paper': ['paper', 'papers'], 'x-map': ['treasure-map'], 'x-coin': ['coins'], 'x-horn': ['horn-internal', 'spiral-shell'],
    'x-heart': ['heart-organ'], 'x-claw': ['claw'], 'x-tooth': ['tooth'], 'x-web': ['spider-web'], 'x-fire': ['flame'],
    'x-ice': ['ice-cube'], 'x-lightning': ['lightning-arc'],
}
LUCIDE = ['sparkles', 'activity', 'ghost', 'swords', 'hammer', 'backpack', 'calculator', 'book-open', 'users',
          'panel-left-close', 'panel-left-open', 'x', 'pencil', 'dumbbell', 'handshake', 'star', 'shield',
          'notebook-pen', 'chevron-right', 'brain']

out = {'game': {}, 'gameSize': [G.get('width', 512), G.get('height', 512)], 'lucide': {}}
for key, cands in GAME.items():
    hit = next((c for c in cands if c in names), None)
    if not hit:
        print('missing game icon for', key, cands); continue
    out['game'][key] = G['icons'][hit]['body']
for n in LUCIDE:
    p = nm / 'lucide-static/icons' / f'{n}.svg'
    if p.exists(): out['lucide'][n] = p.read_text()
    else: print('missing lucide icon', n)

dest = pathlib.Path(__file__).resolve().parent.parent / 'data/icons.json'
json.dump(out, open(dest, 'w'))
print(f"{len(out['game'])} game icons, {len(out['lucide'])} lucide icons -> {dest}")
