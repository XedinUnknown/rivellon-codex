# Rivellon Codex

A companion app for **Divinity: Original Sin 2 – Definitive Edition**: every skill, status, summon and recipe in one
searchable place, plus a party tracker (characters, ability points, attributes, talents, known skills) and an item
database with game-style character cards, gear slots, runes and derived stats.

It is a single self-contained HTML page. As a **claude.ai artifact** it keeps its editable data in that artifact's
hosted database. Opened from disk (or a static host) it saves to **browser storage** or, in Chrome/Edge, to a
**JSON file** you choose; click the save indicator in the sidebar to pick. Named **slots** keep separate saves (e.g. one
per playthrough), and Export/Import moves data between any of them.
Installing it as a desktop app is next — see [docs/ARCHITECTURE.md § Roadmap](docs/ARCHITECTURE.md#11-roadmap).

- Live artifact (private): https://claude.ai/artifact/VBQvi9vagdHsmqvhuGPe83
- Architecture, data model, rules and decisions: **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**
- Third-party data and icon licences: [THIRD_PARTY.md](docs/THIRD_PARTY.md)

## Repository layout

```
src/template.html        page shell: CSS (design tokens, light/dark), static markup, placeholders
src/app.js               all application code (vanilla JS, no framework, no build step beyond inlining)
data/nexus.json          skills, statuses, summons, weapon/racial skills + 40px WebP icons (embedded at build)
data/icons.json          SVG icons: game-icons.net bodies + Lucide (embedded at build)
data/ref/*.json          24 reference tables from the "Info (Shared)" sheet (embedded at build)
tools/build.py           inlines app.js + nexus.json + icons.json + ref/*.json into dist/rivellon-codex.html
tools/extract_nexus.py   Nexus "DOS2_DE_Eng.xlsx" -> data/nexus.json
tools/extract_info.py    "Divinity: Original Sin 2 - Info (Shared)" xlsx export -> info.json
tools/make_refdocs.py    info.json -> data/ref/<table>.json (one DB document per table)
tools/build_icons.py     npm icon packages -> data/icons.json
tests/harness.py         Playwright smoke test with a mocked window.claude runtime
tests/storage.py         Playwright test of browser storage, slots, JSON file, Export and Import
tests/fixtures/          sample party + items (not real playthrough data)
dist/rivellon-codex.html last built page (~1.7 MB)
```

## Build

```bash
python3 tools/build.py                 # -> dist/rivellon-codex.html
```

Re-extract data (only when a source spreadsheet changes):

```bash
pip install openpyxl pillow
python3 -I tools/extract_nexus.py DOS2_DE_Eng.xlsx data/nexus.json
python3 -I tools/extract_info.py "Divinity_ Original Sin 2 - Info (Shared).xlsx" /tmp/info.json
python3 tools/make_refdocs.py /tmp/info.json
# icons: npm i @iconify-json/game-icons lucide-static && python3 tools/build_icons.py node_modules
```

After regenerating `data/ref/`, rebuild. On claude.ai the database collection `ref` takes precedence over the
embedded tables, so also write the new docs there (Claude does it via the artifact data tool; see ARCHITECTURE §3).

## Test

```bash
pip install playwright && playwright install chromium
python3 tools/build.py && python3 tests/harness.py     # screenshots go to tests/out-*.png
python3 tests/storage.py                               # local storage options
```

## Publish (claude.ai)

The artifact is updated by republishing `dist/rivellon-codex.html` to the same artifact URL with capabilities
`{ db: {}, user: {} }`. Republishing replaces only the page; the database is untouched.
