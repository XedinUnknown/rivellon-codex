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
| `make e2e` | build, then Playwright end-to-end tests against both targets |
| `make format` | apply formatting and safe lint fixes |
| `make help` | everything else |

CI runs `check` and `e2e` on pushes to `master` and `*.*.x` branches and on pull requests.

## Data

Put the two source spreadsheets in `data/source/` (see [data/source/README.md](data/source/README.md)). The skill and
status icons are Larian's game art, so they aren't committed: `make build` and `make dev` extract them from the Nexus
workbook whenever it's newer than `data/nexus-icons.json`. Without the workbook, builds still work and show badges
with each name's initials instead.

The text data and reference tables are generated JSON in `data/`, committed. To regenerate them:

```bash
make data           # both workbooks -> data/nexus.json and data/ref/*.json
make icons          # data/game-icons.json from @iconify-json/game-icons
```

On claude.ai the reference tables in the artifact's database take precedence over the bundled ones, so after
regenerating `data/ref/`, also write the new documents to the database collection `ref`.

## Publishing to claude.ai

Build the single-file page and republish `dist/single/index.html` to the same artifact URL with capabilities
`{ db: {}, user: {} }`. Republishing replaces only the page; the database is untouched.

## Branches

`master` is the latest stable state; `x.y.x` branches (e.g. `0.1.x`) are version lines, the newest being where
development happens.
