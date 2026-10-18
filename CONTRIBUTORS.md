# Contributing

React 19 + TypeScript, built with Vite; Node 22 (see `.nvmrc`). How it fits together is in
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Setup

```bash
make setup          # npm ci + the Chromium build Playwright uses
make dev            # dev server with hot reload: http://localhost:5173
```

Or in Docker: `docker compose up` (same dev server; set `DEV_PORT` in `.env` to change the port). Copy
`.env.example` to `.env` to override any defaults.

## Everyday commands

| Command | Does |
|---|---|
| `make build` | both targets; `TARGET=single` for the one-file page (claude.ai artifact, double-click), `TARGET=web` for a static site |
| `make check` | Biome lint/format check, TypeScript, unit tests |
| `make e2e` | build both targets with the sample data, then run the Playwright end-to-end tests |
| `make format` | apply formatting and safe lint fixes |
| `make help` | everything else |

CI runs `check` and `e2e` on pushes to `master` and `*.*.x` branches and on pull requests.

## Data

The game data is other people's work, so the repository holds none of it. Put the two source spreadsheets in
`data/source/` (see [data/source/README.md](data/source/README.md)); `make build` and `make dev` extract them into
`data/generated/` (ignored) whenever a spreadsheet changes. Without them, builds use the hand-written sample in
`data/sample/`, which is also what CI and the end-to-end tests use (`CODEX_DATA=sample`).

Never commit anything extracted from the spreadsheets, and don't publish builds made from them. `data/game-icons.json`
(open-licensed, see THIRD_PARTY) is the only generated file that's committed; `make icons` regenerates it.

On claude.ai the reference tables in the artifact's database take precedence over the bundled ones, so after a sheet
changes, also write the new documents to the database collection `ref`.

## Publishing to claude.ai

Build the single-file page from the spreadsheets and republish `dist/single/index.html` to the same artifact URL with capabilities
`{ db: {}, user: {} }`. Republishing replaces only the page; the database is untouched.

## Branches

`master` is the latest stable state; `x.y.x` branches (e.g. `0.1.x`) are version lines, the newest being where
development happens.
