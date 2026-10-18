# Agent instructions

[README.md](README.md) and [CONTRIBUTORS.md](CONTRIBUTORS.md) apply to agents too; architecture, data model and
decisions are in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

- Before finishing a change, run `make check`, and `make e2e` when behaviour or UI changed.
- Game logic belongs in `src/domain/` (pure, unit-tested); storage in `src/storage/`; React components only render
  and call the actions in `src/state/`.
- Game data is extracted at build time from the spreadsheets in `data/source/` into `data/generated/`. Never commit
  either, or anything copied from them (text, numbers, icons); `data/sample/` is hand-written, keep it that way.
- To change extracted data, change the extractors in `tools/`.
