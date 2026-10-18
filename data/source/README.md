# Source spreadsheets

All game data comes from two spreadsheets made by other people, so none of it is committed. Download your own copies
(links in [docs/THIRD_PARTY.md](../../docs/THIRD_PARTY.md)) and save them here under these names:

| File | Source | Gives |
|---|---|---|
| `DOS2_DE_Eng.xlsx` | Nexus Mods "DOS2 Character Planner" (download, unpack) | skills, statuses, summons, weapon/racial skills and their icons |
| `DOS2_Info_Shared.xlsx` | the community "Divinity: Original Sin 2 - Info (Shared)" Google Sheet: File → Download → Microsoft Excel, then rename | recipes, gear calculator tables and the Reference tab |

`tools/build.py` extracts them into `data/nexus.json`, `data/nexus-icons.json` and `data/ref/` (all ignored by git)
whenever a spreadsheet is newer than what was extracted.

Builds made from the spreadsheets contain their content, including Larian's icons: keep them for personal use and
don't publish them.
