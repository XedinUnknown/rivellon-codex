// Nexus "DOS2 Character Planner" workbook -> data/nexus.json (text, committed) and data/nexus-icons.json (game art,
// never committed; `make build` regenerates it when the workbook is newer).
//
//   npm run data:nexus [-- <xlsx> <out.json | -> <icons.json | ->]      ("-" skips that output)
//
// Defaults: data/source/DOS2_DE_Eng.xlsx -> data/nexus.json, data/nexus-icons.json.
import { writeFileSync } from 'node:fs';
import { extractNexus } from './lib/nexus.ts';

const [src = 'data/source/DOS2_DE_Eng.xlsx', out = 'data/nexus.json', iconsOut = 'data/nexus-icons.json'] =
  process.argv.slice(2);
const { data, icons } = await extractNexus(src);
if (out !== '-') {
  writeFileSync(out, `${JSON.stringify(data, null, 2)}\n`);
  console.log(
    `${data.skills.length} skills, ${data.statuses.length} statuses, ${data.special.length} special, ${data.summons.length} summons -> ${out}`,
  );
}
if (iconsOut !== '-') {
  writeFileSync(iconsOut, `${JSON.stringify(icons)}\n`);
  console.log(`${Object.keys(icons).length} icons -> ${iconsOut}`);
}
