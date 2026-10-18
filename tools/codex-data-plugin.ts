// Vite plugin: the game data the app bundles, as the virtual module "virtual:codex-data".
//
// The real data is extracted from the user's own spreadsheets into data/generated/ (see the Makefile) and never
// committed; without it, the committed hand-written sample in data/sample/ is used. CODEX_DATA=sample forces the
// sample (the end-to-end tests do). The skill/status icons only exist in data/generated/.
import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';

const ID = 'virtual:codex-data';

export function codexData(root: string): Plugin {
  const forceSample = process.env.CODEX_DATA === 'sample';
  const gen = (p: string) => resolve(root, 'data/generated', p);
  const sample = (p: string) => resolve(root, 'data/sample', p);
  const real = (p: string) => !forceSample && existsSync(gen(p));
  const src = {
    nexus: real('nexus.json') ? gen('nexus.json') : sample('nexus.json'),
    icons: real('nexus-icons.json') ? gen('nexus-icons.json') : null,
    ref: real('ref/.stamp') ? gen('ref') : sample('ref'),
  };
  const usesSample = src.nexus.startsWith(sample('')) || src.ref.startsWith(sample(''));
  const imp = (file: string) => `() => import(${JSON.stringify(file)}).then((m) => m.default)`;
  return {
    name: 'rivellon:codex-data',
    configResolved(config) {
      if (usesSample)
        config.logger.warn(
          `Using the sample game data${forceSample ? ' (CODEX_DATA=sample)' : ': put the spreadsheets in data/source/ and run make (see data/source/README.md)'}`,
        );
    },
    resolveId: (id) => (id === ID ? `\0${ID}` : undefined),
    load(id) {
      if (id !== `\0${ID}`) return;
      const tables = readdirSync(src.ref).filter((f) => f.endsWith('.json'));
      return [
        `export const usesSample = ${usesSample};`,
        `export const loadNexus = ${imp(src.nexus)};`,
        `export const loadIcons = ${src.icons ? imp(src.icons) : '() => Promise.resolve({})'};`,
        `export const refLoaders = {${tables.map((f) => `${JSON.stringify(f.slice(0, -5))}: ${imp(resolve(src.ref, f))}`).join(', ')}};`,
      ].join('\n');
    },
  };
}
