// Entry: load the game data (see tools/codex-data-plugin.ts), then render. The data modules are separate chunks in
// the web build and inlined in the single-file build.

import { loadIcons, loadNexus, refLoaders, usesSample } from 'virtual:codex-data';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { initCodex } from './domain/codex';
import type { GameIcons, NexusData, RefTables } from './domain/types';
import { startNav } from './state/nav';
import { startStorage } from './state/storage';
import { useApp } from './state/store';
import './styles/app.css';

async function main() {
  const root = document.getElementById('root') as HTMLElement;
  const [nexus, icons, game, ref] = await Promise.all([
    loadNexus() as Promise<Omit<NexusData, 'icons'>>,
    loadIcons() as Promise<NexusData['icons']>,
    import('../data/game-icons.json').then((m) => m.default as unknown as GameIcons),
    Promise.all(Object.entries(refLoaders).map(async ([k, f]) => [k, await f()] as const)).then(
      (entries) => Object.fromEntries(entries) as RefTables,
    ),
  ]);
  initCodex({ ...nexus, icons }, game);
  startNav();
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  if (usesSample)
    useApp.setState({
      notice: 'Showing sample game data. For the real data, put the spreadsheets in data/source/ and rebuild.',
    });
  await startStorage(ref, (notice) => useApp.setState({ notice }));
}

main().catch((e: unknown) => {
  const root = document.getElementById('root');
  if (root) root.textContent = `Could not start: ${(e as Error)?.message ?? e}`;
  throw e;
});
