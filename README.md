# Rivellon Codex

A companion app for **Divinity: Original Sin 2 – Definitive Edition**: every skill, status, summon and recipe in one
searchable place, plus a party tracker (characters, ability points, attributes, talents, known skills) and an item
database with game-style character cards, gear slots, runes and derived stats.

It runs as a **claude.ai artifact**, keeping its editable data in that artifact's hosted database, or as a page opened
from disk or a static host, saving to **browser storage** or, in Chrome/Edge, to a **JSON file** you choose. Click the
save indicator in the sidebar to pick. Named **slots** keep separate saves (e.g. one per playthrough), and
Export/Import moves data between any of them. Installing it as a desktop app is next — see
[docs/ARCHITECTURE.md § Roadmap](docs/ARCHITECTURE.md#11-roadmap).

- Live artifact (private): https://claude.ai/artifact/VBQvi9vagdHsmqvhuGPe83
- Architecture, data model, rules and decisions: **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**
- Third-party data and icon licences: [THIRD_PARTY.md](docs/THIRD_PARTY.md)

## Use it

- **On claude.ai**: open the artifact link above.
- **From disk**: build the single-file page (`make build TARGET=single`) and open `dist/single/index.html` in a
  browser. For the skill and status icons, put the source spreadsheet in `data/source/` first
  ([how](data/source/README.md)); builds without it, such as CI's, show badges instead.
- **From a web server**: `make build TARGET=web` and serve `dist/web/`.

## Licence

The code is MIT-licensed ([LICENSE](LICENSE)); game data and icons keep their own terms ([THIRD_PARTY.md](docs/THIRD_PARTY.md)).

---

[Contributing and development setup](CONTRIBUTORS.md) · [Instructions for AI agents](AGENTS.md)
