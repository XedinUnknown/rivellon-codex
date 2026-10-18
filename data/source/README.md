# Source spreadsheets

The app's data comes from two spreadsheets kept here. They are not committed (`*.xlsx` is ignored); download them
from the links in [docs/THIRD_PARTY.md](../../docs/THIRD_PARTY.md).

- **Icons**: `make build` and `make dev` extract the skill/status icons (Larian's game art) from the Nexus workbook
  into `data/nexus-icons.json`, also ignored, whenever the workbook is newer. Without it, entries show badges with
  their initials instead.
- **Data**: `make data` re-extracts the committed text data and reference tables; only needed when a sheet changes.

| File | Source | Produces |
|---|---|---|
| `DOS2_DE_Eng.xlsx` | Nexus Mods "DOS2 Character Planner" (download, unpack) | `data/nexus-icons.json` (every build), `data/nexus.json` (`make data-nexus`) |
| `Divinity_ Original Sin 2 - Info (Shared).xlsx` | Community Google Sheet, File → Download → Microsoft Excel | `data/ref/*.json` (`make data-info`) |

Other file names or locations work too: `make data NEXUS_XLSX=… INFO_XLSX=…`.
