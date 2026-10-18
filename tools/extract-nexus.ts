// Nexus "DOS2 Character Planner" workbook -> data/generated/nexus.json (text) and data/generated/nexus-icons.json
// (icons). Both are extracted from the user's copy of the workbook and never committed; `make` runs this whenever the
// workbook is newer.
//
//   npm run data:nexus [-- <xlsx> <out.json | -> <icons.json | ->]      ("-" skips that output)
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { extractNexus } from './lib/nexus.ts';

const [
  src = 'data/source/DOS2_DE_Eng.xlsx',
  out = 'data/generated/nexus.json',
  iconsOut = 'data/generated/nexus-icons.json',
] = process.argv.slice(2);
const { data, icons } = await extractNexus(src);
if (out !== '-') {
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `${JSON.stringify(data, null, 2)}\n`);
  console.log(
    `${data.skills.length} skills, ${data.statuses.length} statuses, ${data.special.length} special, ${data.summons.length} summons -> ${out}`,
  );
}
if (iconsOut !== '-') {
  mkdirSync(dirname(iconsOut), { recursive: true });
  writeFileSync(iconsOut, `${JSON.stringify(icons)}\n`);
  console.log(`${Object.keys(icons).length} icons -> ${iconsOut}`);
}
