# Rivellon Codex — architecture & handover

Status as of 2026-10-17. Everything here describes the app, not any particular playthrough.

## 1. What it is

A single-page companion for DOS2 Definitive Edition with two halves:

- **Reference** (read-only): skills, status effects, summons, weapon & racial skills, crafting recipes, a gear
  calculator, and reference tables (talents, abilities, attributes, other stats, race traits, classes, surfaces & clouds,
  runes, combo matrix, Info-sheet statuses, ingredients, crafted item values, talent points, known bugs).
- **Party & items** (editable, persisted): four characters with points, attributes, talents, known skills, notes,
  race/gender, equipped gear; an item database (gear and runes) with stats and bonuses; derived totals, point
  budgets, estimated Vitality and AP.

Plain HTML/CSS/JS, no framework, no bundler. `tools/build.py` inlines `src/app.js`, `data/nexus.json`,
`data/icons.json` and `data/ref/*.json` into `src/template.html` to produce one ~1.7 MB file.

## 2. Runtime today: claude.ai artifact

The page is published as a claude.ai artifact with capabilities `{ db: {}, user: {} }`. On claude.ai it runs in a
sandboxed iframe; the host injects `window.claude`, which is the only way the page reaches storage:

| Call | Used for |
|---|---|
| `await window.claude.use('db')` | database handle, or `null` when unavailable (then the page is read-only and shows "Not syncing") |
| `await window.claude.use('user')` → `can('data.write')` | whether this viewer may write (`false` → read-only UI; `null` → assume writable until a write is rejected) |
| `db.collection(c).onSnapshot(cb, err)` | live subscription; used for `party`, `items`, `ref` |
| `db.doc('c/id').set(body)` | full replace (used to create documents) |
| `db.doc('c/id').update(patch)` | merge; nested objects merge recursively, arrays replace wholesale; rejects if the doc doesn't exist |
| `db.doc('c/id').delete()` | delete |

Facts about the store (from the runtime's developer reference): one store per artifact, hosted by Anthropic; JSON
documents at slash paths; **≤ 256 KiB per document**; every document has a `version` that increments on each write;
writes are **last-writer-wins**, no transactions; snapshots are frozen objects (clone before mutating); at most 64
subscriptions per view; data survives reloads and republishes and is erased only when the artifact is deleted.
Physical location/backend technology is not exposed.

Outside claude.ai (`window.claude` undefined) the page renders the embedded Nexus data only.

## 3. Data: where each piece lives

| Data | Where | How it changes |
|---|---|---|
| Skills (202), statuses (131), summons (42), weapon/racial skills (23) + 359 icons | embedded JSON in the HTML (`<script id="data">`) from `data/nexus.json` | re-extract + rebuild + republish |
| SVG icons | embedded JSON (`<script id="icons">`) from `data/icons.json` | `tools/build_icons.py` + rebuild |
| 24 reference tables | embedded JSON (`<script id="ref">`) from `data/ref/*.json`; on claude.ai the DB collection **`ref`** (one doc per table: `ref/recipes`, `ref/talents`, …) replaces them once it loads, if it has any docs | `make_refdocs.py` + rebuild; on claude.ai also write the docs to the DB |
| Party | DB collection **`party`**: `party/sol`, `party/fane`, `party/sebille`, `party/beast` | the page (or Claude) |
| Items and runes | DB collection **`items`**: `items/<id>` | the page (or Claude) |

Export format (also the planned local file format): `{ party: {id: doc}, items: {id: doc} }` plus optionally
`ref`. Same JSON as the DB documents.

## 4. Data model

### 4.1 `party/<id>` (schema 2)

```jsonc
{
  "schema": 2,
  "name": "Sol", "level": 8,
  "race": "Human" | "Elf" | "Dwarf" | "Lizard" | null,
  "gender": "Male" | "Female" | null,
  "undead": false,
  "points":     { "Aerotheurge": 2, "Warfare": 2, "Leadership": 1, … },  // points SPENT, any ability; null = removed
  "attributes": { "Intelligence": 20, "Constitution": 13, … },          // BASE value (10 + spent), no gear; absent = unknown
  "talents": ["Executioner", "Ingenious", …],                           // includes racial traits; racial ones excluded from budget
  "known":   ["Haste", "Battering Ram", …],                             // skill names exactly as in nexus.json
  "gear":    { "helmet": { "itemId": "it-…" }, "main": { "itemId": "it-…" }, "ring1": null, … },
  "notes": "free text"
}
```

- Slots: `helmet amulet chest gloves belt leggings boots ring1 ring2 main off`.
- Members are hard-coded in `MEMBERS` (ids `sol fane sebille beast`) — the four DOS2 origin-style slots.
- Legacy: schema-1 docs had totals in `abilities`; `normalize()` maps them to `points`. Legacy inline gear
  (`gear.slot = {name, bonuses}`) is still read.

### 4.2 `items/<id>`

```jsonc
{
  "name": "Conqueror",
  "kind": "helmet|amulet|chest|gloves|belt|leggings|boots|ring|weapon|shield|rune",
  "type": "w:Staff:2" | "a:Cloth:Helmet" | null,  // weapon type decides hands: w:<Name>:<1|2>; armour a:<Material>:<Slot>
  "level": 6, "rarity": "Common|Uncommon|Rare|Epic|Legendary|Divine|Unique" | "",
  "bonuses": [ <bonus>, … ],
  "st": {                                // all optional
    "dmg":   { "min": 16, "max": 21, "type": "Air" },     // Physical Piercing Fire Water Air Earth Poison
    "extra": [ { "min": 3, "max": 4, "type": "Fire" } ],
    "crit": 5, "critDmg": 150,           // %
    "phys": 4, "magic": 12, "block": 10,
    "reqAttr": "Intelligence", "reqVal": 11,
    "rune": null | "empty" | "<rune item id>",
    "weight": 2.5, "value": 326
  },
  "base": { "damage": 21.3 } | { "phys": 6, "magic": 31 },   // calculator estimate, shown only when st has no real numbers
  "runeFx": { "weapon": [<bonus>], "armor": [<bonus>], "amulet": [<bonus>] },  // runes only
  "created": "ISO date"
}
```

Bonus grammar (`parseBonus`, case-insensitive, aliases like `hydro`, `int`, `crit dmg`, `fire res`):

| Typed | Stored | Effect |
|---|---|---|
| `Hydrosophist +1`, `+1 Int` | `{stat, value, pct:false}` | ability/attribute → added to totals |
| `Fire Resistance +5%`, `HP +20`, `Crit Damage +10%` | `{stat, value, pct}` | "other" stats; `HP` / `HP %` / `Vitality %` feed Vitality |
| `Set Acid 10%` | `{stat:"Set Acid", value:10, pct:true}` | on-hit status (chip links the status) |
| `Skill: First Aid` | `{skill}` | grants the skill (dashed marker on Skills tab) |
| `Status: Cursed` | `{status}` | status applied to the wearer |
| `Immune to Stunned` | `{immune}` | immunity |
| `Reflect 10% melee damage as Air` | `{reflect:{pct, from:"melee|ranged|all", type}}` | listed under From gear |
| anything else | `{text}` | shown as-is (linkified) |

Invariants enforced by the UI: an item is worn by at most one character/slot (equipping moves it); a two-handed main
hand locks the off hand (shown as the same weapon, faded) and the off-hand item is ignored in totals; 2H items can't
go in the off hand; a rune is socketed in at most one item; deleting a socketed rune leaves `"empty"`.

### 4.3 `ref/<table>`

`{ source, extracted, rows: [...] }` (or `data: {...}` for `runes`; `rarity` also has `sheetNotes`). Spreadsheet cell
comments are preserved per row as `_notes: { field: text }`. Tables: abilities, armor, armorSets, attributes, bugs,
classes, combos, gearRolls, ingredients, raceTraits, rarity, recipes, runes, skills, stats, statuses, summons, surfaces,
tabs, talentPoints, talents, values, weaponCompare, weapons.

## 5. Derived values and game rules

- **Totals** (`totals()`): ability total = points + gear bonuses; attribute total = base + gear (null if base unknown).
  Rune bonuses count only for the socket type of their host (weapon / armour / amulet).
- **Skill requirements** (`meets()`): every `req` pair met by totals. Weapon requirements are shown, not checked.
- **Point budget** (`budget()`): creation 3 attribute / 2 combat / 1 civil / 1 talent; per level +2 attribute,
  +1 combat; civil at levels 2, 6, 10…; talents at 3, 8, 13…; Polymorph +1 attribute per point; All Skilled Up
  +1 combat +1 civil; Bigger & Better +2 attribute; racial traits excluded. Sources disagree on attribute points per
  level (GameFAQs: 2; Fextralife wording reads like 1) — 2 is used.
- **Vitality** (`derived()`, an estimate): `BASE_VIT[level] × (1 + 0.07 × (Con − 10) + pct/100) + flat`, where pct
  = gear `Vitality %`/`HP %` + race traits matching "+N% Vitality" (e.g. Dwarf Sturdy +10%), flat = gear `HP`.
  Con 10 assumed when unknown. Not modelled: Lone Wolf, What a Rush, Picture of Health, statuses.
- **AP**: start 4, max 6, recovery 4, plus gear `Max AP` / `AP Recovery` / `Starting AP`; Glass Cannon → start = max.
- **Gear calculator**: base weapon damage / armour by level from the Info sheet (sample levels 1,5,10,15,20,22 for
  weapons; 1,10,20 for armour), log-linear interpolation between samples, × rarity multiplier from the level-20
  table. Possible rolls per slot from `ref/gearRolls`.

## 6. UI structure

- **Shell**: collapsible left sidebar (brand, save indicator, tab buttons with Lucide icons, licence credit). Collapsed
  = icons only; on ≤700 px it's an icon rail that opens as an overlay. A sticky filter bar sits above content (hidden
  on Party).
- **Tabs**: Party, Items, Skills, Status effects, Summons, Weapon & racial, Crafting, Gear calculator, Reference.
- **Party overview**: compact cards (2 per row): portrait, race, level, Vitality, AP, gear icons in the game layout,
  hover tooltips. Click → detail.
- **Character detail**: sticky toolbar (← Party, character pills with portrait + level, View/Edit). Left: character
  card (helmet top; chest, gloves, belt, boots left; amulet, ring, ring, leggings right; main/off bottom; portrait,
  race/gender, Vitality, AP centre). Right: Stats with collapsible sections (Attributes, Combat abilities, Civil
  abilities, Talents — each with a budget badge — From gear, Known skills, Notes).
  - **View**: read-only values; clicking a slot still opens the item picker (swapping is allowed).
  - **Edit**: inputs, talent add/remove, race/gender, ✎ pen on each slot opens the full item editor in a modal.
  - **Picker**: searchable list anchored to the slot (Enter = first match, ↑/↓, Esc), rarity-coloured rows,
    "on <character>" tags, Unequip, ＋ New item.
- **Items tab**: all items with kind filter, full editor (type, level, rarity, stats, rune socket, weight, value,
  bonuses), equip/unequip, two-click delete. Runes get per-socket bonus lists.
- **Chips & tooltips**: every skill, status and ability name becomes a chip (`linkify()`; only Capitalised names,
  abilities only where asked) with a hover card; click navigates. Item tiles/rows show a full item card. **Hold Ctrl
  (⌘ on Mac) to pin** a card and interact inside it.
- **Search**: 1–2 characters match word starts; 3+ match substrings; icon keys are excluded.
- **Colours**: rarity tokens `--r-common … --r-unique` (Legendary pink is disputed — some sources say orange);
  damage types use school colours; light/dark via tokens.
- **Per-viewer UI memory** (`localStorage`): `codex.ui` (tab, character, calculator, section open state, party view),
  `codex.side` (sidebar collapsed).

## 7. Persistence logic (`src/app.js`, "persistence")

- Edits mutate in-memory state, then `queue(key)` debounces (600 ms; 100–200 ms for discrete actions) and calls
  `writeDoc()`. One write per document at a time; a write requested during another is queued (`pending`).
- **Field-level patches**: `synced[key]` holds the last body known to be in the DB (from snapshots or our own writes).
  `diffPatch(current, synced)` sends only changed top-level fields; for `points`, `attributes`, `gear`, `st`, `runeFx`
  only changed sub-keys (removed sub-keys sent as `null`). New docs use `set`. This stops two views clobbering each
  other's unrelated fields; the same field edited in two views is still last-writer-wins.
- `dirty[key]` stops incoming snapshots overwriting local edits until the write lands.
- Snapshots that arrive while a form field has focus set `deferred`; the view re-renders when focus leaves form
  fields. `renderKeep()` re-renders and restores focus/caret (used after select changes).
- Save indicator: green "All changes saved", amber pulsing "Saving…", red "Not saved" (hover shows the error), grey
  "Not syncing"/"Read-only".

## 8. Decisions and known limitations

- Reference numbers come from community spreadsheets, some flagged by their author as not updated for DE.
  Known data issues: rarity table shows Legendary ring > Divine; the sheet's "full armour set" totals don't add up from
  its per-piece values (the calculator doesn't show them).
- No weapon damage-range spread data was found, so the calculator shows averages; real items store min–max.
- Item/recipe icons are chosen by keyword rules (`NAME_ICON_RULES`) then sheet category — imperfect by design.
- Portraits: game-icons has no full race × gender set (dwarf female, lizard genders, undead variants are approximations).
- Members are fixed to four ids; no custom characters yet.
- The page is ~1.7 MB because Nexus data, icons and reference tables are embedded.

## 9. Testing

`tests/harness.py` loads `dist/rivellon-codex.html` in headless Chromium with a mocked `window.claude` (db + user)
backed by `tests/fixtures/*.json` and `data/ref/*.json`, clicks through every tab, opens a picker, and reports page
errors. Writes are recorded in `window.__writes`; the mock `update` merges one level like the real store.

## 10. Icons

`data/icons.json` = `{ game: {key: svgBody}, gameSize: [512,512], lucide: {name: svg} }`. `gIcon(key)` wraps a
game-icons body in a 512×512 viewBox using `currentColor`; `lIcon(name)` inlines a Lucide SVG. Keys: slots/weapon
types (`itemIconKey`), portraits `p-*`, `heart`, `ap`, and generic `x-*` (`nameIcon`). Rebuild with
`tools/build_icons.py`. game-icons is CC BY 3.0 — keep the visible credit.

## 11. Roadmap

### 11.1 Storage picker (agreed direction)

Abstract persistence behind an adapter with the same document model (`collection/doc`, set/update/delete, change
events), and add a **Storage** setting that offers only what's available:

| Where the page runs | Options |
|---|---|
| claude.ai | claude.ai database (current); Export/Import as files. Live file saving via the File System Access API is probably blocked in claude.ai's sandboxed iframe — verify. |
| Local file (double-clicked) or hosted static site | **JSON file on disk** via File System Access (`showOpenFilePicker`/`showSaveFilePicker`, handle kept in IndexedDB) — Chrome/Edge only; **browser storage** (IndexedDB) everywhere |

- File format = the export format above (`party`, `items`, optionally `ref`), so moving between backends is Export → Import.
- Reference tables must ship with the local build (embed or sibling files) since there's no `ref` collection offline.
- File permissions: Chrome 122+ offers "Allow on every visit"; installed apps keep the permission once granted.
- Firefox/Safari don't implement File System Access (Mozilla's position: harmful) → browser storage + Export/Import there.
- Note: a page opened from `file://` and the same page hosted at `https://…` are different origins — browser
  storage and remembered file handles are not shared; pointing both at the same data file is.

### 11.2 Desktop app

The same files serve both modes:
- **Double-click**: open `index.html` from disk (manifest/service worker are ignored on `file://`). App-like window via
  a shortcut: `msedge.exe --app="file:///D:/…/index.html"`.
- **Install**: host the files as a static site (e.g. GitHub Pages) with a web app manifest + service worker; in Edge
  "⋯ → More tools → Apps → Install this site as an app" (Chrome has the equivalent in its ⋮ menu). Data still lives in
  the local file/IndexedDB, never on the host.

### 11.3 Other ideas

- Move the Nexus data out of the HTML (into `ref`, or sibling JSON files) so the page is code only.
- An MCP server over the local data file with schema validation, so Claude can edit it safely.
- Custom characters (not just the four fixed ids); Lone Wolf / conditional talents in derived stats; memory slot
  usage; actual Vitality/AP override fields for calibration.
