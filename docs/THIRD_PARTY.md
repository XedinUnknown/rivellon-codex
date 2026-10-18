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

Divinity: Original Sin 2 is © Larian Studios. The skill/status icons embedded in the Nexus sheet are game assets, so
they are not in this repository: `make build` extracts them from your own copy of the sheet into
`data/nexus-icons.json` (ignored by git). A build made that way contains them; don't publish it. Without the sheet the
app shows badges with each name's initials instead.

## This project

The code is under the MIT licence ([LICENSE](../LICENSE)). It doesn't cover the third-party material above, which
keeps its own terms.

## Formulas and rules (cited in the UI)

- Base Vitality per level: [Fextralife – Vitality](https://divinityoriginalsin2.wiki.fextralife.com/Vitality)
- Constitution +7% Vitality per point: [GameFAQs DOS2 DE – Attributes](https://gamefaqs.gamespot.com/pc/243225-divinity-original-sin-ii-definitive-edition/faqs/75293/attributes)
- Point budgets per level: [GameFAQs – Levels and Experience](https://gamefaqs.gamespot.com/pc/179840-divinity-original-sin-ii/faqs/75293/levels-and-experience), [Fextralife – Attributes](https://divinityoriginalsin2.wiki.fextralife.com/Attributes)
- Action Points: [Divinity wiki – Original Sin 2 Action Points](https://divinity.fandom.com/wiki/Original_Sin_2_Action_Points)
- Rarity colours: [Larian forums – Item Rarities](https://forums.larian.com/ubbthreads.php?ubb=showflat&Number=636874) (conflicts with other sources on Legendary; see ARCHITECTURE §6)
