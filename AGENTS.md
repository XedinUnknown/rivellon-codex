# Agent instructions

[README.md](README.md) and [CONTRIBUTORS.md](CONTRIBUTORS.md) apply to agents too; architecture, data model and
decisions are in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

- Before finishing a change, run `make check`, and `make e2e` when behaviour or UI changed.
- Game logic belongs in `src/domain/` (pure, unit-tested); storage in `src/storage/`; React components only render
  and call the actions in `src/state/`.
- `data/*.json` and `data/ref/*.json` are generated: change the extractors in `tools/`, not the JSON by hand.
- The source spreadsheets live in `data/source/` and are never committed.
