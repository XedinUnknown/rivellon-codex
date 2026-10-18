// Entry: load the embedded data, then render. The data modules are separate chunks in the web build and inlined in
// the single-file build.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { initCodex } from './domain/codex';
import type { GameIcons, NexusData, RefTables } from './domain/types';
import { startNav } from './state/nav';
import { startStorage } from './state/storage';
import { useApp } from './state/store';
import './styles/app.css';

const dataFiles = import.meta.glob<{ default: unknown }>(['../data/nexus.json', '../data/game-icons.json']);
// Larian's skill/status icons: only present when extracted from the user's copy of the workbook
const sheetIcons = import.meta.glob<{ default: unknown }>('../data/nexus-icons.json');
const refFiles = import.meta.glob<{ default: unknown }>('../data/ref/*.json');

async function load<T>(files: Record<string, () => Promise<{ default: unknown }>>, path: string): Promise<T> {
  const f = files[path];
  if (!f) throw new Error(`${path} is missing from the build`);
  return (await f()).default as T;
}

async function main() {
  const root = document.getElementById('root') as HTMLElement;
  const [nexus, icons, game, ref] = await Promise.all([
    load<Omit<NexusData, 'icons'>>(dataFiles, '../data/nexus.json'),
    sheetIcons['../data/nexus-icons.json'] ? load<NexusData['icons']>(sheetIcons, '../data/nexus-icons.json') : {},
    load<GameIcons>(dataFiles, '../data/game-icons.json'),
    Promise.all(
      Object.entries(refFiles).map(
        async ([path, f]) => [path.replace(/^.*\/(.+)\.json$/, '$1'), (await f()).default] as const,
      ),
    ).then((entries) => Object.fromEntries(entries) as RefTables),
  ]);
  initCodex({ ...nexus, icons }, game);
  startNav();
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  await startStorage(ref, (notice) => useApp.setState({ notice }));
}

main().catch((e: unknown) => {
  const root = document.getElementById('root');
  if (root) root.textContent = `Could not start: ${(e as Error)?.message ?? e}`;
  throw e;
});
