# Third-party material

## Icons

| Set | Licence | Used for | Attribution |
|---|---|---|---|
| [game-icons.net](https://game-icons.net) via `@iconify-json/game-icons` 1.2.4 | **CC BY 3.0** | equipment, weapon types, portraits, recipe/ingredient icons, Vitality/AP (`data/game-icons.json`) | Lorc, Delapouite & contributors — credit is shown at the bottom of the side menu and must stay visible |
| [Lucide](https://lucide.dev) via `lucide-react` 1.59.0 | ISC | navigation and UI icons | credited in the side menu; licence in the package |

## Game data

| Source                                                                                                                                                                                                                               | Used for |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---|
| [DOS2 Character Planner](https://www.nexusmods.com/divinityoriginalsin2/mods/232)                                                                                                                                                    | skills, statuses, summons, weapon/racial skills and their icons (`data/nexus.json`) |
| [Community Google Sheet](https://docs.google.com/spreadsheets/d/1CyOtdPIicJMgAK8RtAaFMNpBqoZDDzFp-IKY0JAWr38/edit?gid=1910338991) | recipes, ingredients, gear rolls, weapon/armour bases, rarity multipliers, runes, talents, abilities, attributes, stats, race traits, classes, surfaces, statuses, summons, combo matrix, crafted values, bugs (`data/ref/`) — cell comments are kept as `_notes` |

None of this game data is in the repository. Neither spreadsheet states a licence, the Info sheet's descriptions and
notes are its authors' writing, and Divinity: Original Sin 2 (its names, text and the icons embedded in the Nexus sheet)
is © Larian Studios; [Larian's fan content policy](https://larian.com/fan-content-policy) asks for permission for
anything that isn't your own work. So `make build` extracts the data from your own copies of the spreadsheets into
`data/generated/` (ignored by git); builds made that way contain it and are for personal use. Without the
spreadsheets, the app uses `data/sample/`, a small set written for this project (game names with made-up figures and
wording).

## This project

The code and the sample data are under the MIT licence ([LICENSE](../LICENSE)). It doesn't cover the third-party
material above, which keeps its own terms. Rivellon Codex is unofficial fan content, not made or endorsed by Larian
Studios.

## Formulas and rules (cited in the UI)

- Base Vitality per level: [Fextralife – Vitality](https://divinityoriginalsin2.wiki.fextralife.com/Vitality)
- Constitution +7% Vitality per point: [GameFAQs DOS2 DE – Attributes](https://gamefaqs.gamespot.com/pc/243225-divinity-original-sin-ii-definitive-edition/faqs/75293/attributes)
- Point budgets per level: [GameFAQs – Levels and Experience](https://gamefaqs.gamespot.com/pc/179840-divinity-original-sin-ii/faqs/75293/levels-and-experience), [Fextralife – Attributes](https://divinityoriginalsin2.wiki.fextralife.com/Attributes)
- Action Points: [Divinity wiki – Original Sin 2 Action Points](https://divinity.fandom.com/wiki/Original_Sin_2_Action_Points)
- Rarity colours: [Larian forums – Item Rarities](https://forums.larian.com/ubbthreads.php?ubb=showflat&Number=636874) (conflicts with other sources on Legendary; see ARCHITECTURE §6)
