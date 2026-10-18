/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { codexData } from './tools/codex-data-plugin.ts';

// Build targets (pick with --mode):
//   single  one self-contained HTML file: the claude.ai artifact, or double-clicked from disk
//   web     hashed, split files for a static host (data loads as separate chunks)
// With CODEX_DATA=sample (the end-to-end tests) the build uses the sample data and goes to dist/sample-<mode>.
export default defineConfig(({ mode }) => {
  const single = mode === 'single';
  const out = `dist/${process.env.CODEX_DATA === 'sample' ? 'sample-' : ''}${single ? 'single' : 'web'}`;
  return {
    base: './',
    plugins: [
      codexData(import.meta.dirname),
      react(),
      ...(single ? [viteSingleFile({ removeViteModuleLoader: true })] : []),
    ],
    json: { stringify: true },
    build: {
      outDir: out,
      emptyOutDir: true,
      target: 'es2022',
      chunkSizeWarningLimit: 2048,
    },
    test: {
      include: ['src/**/*.test.ts'],
    },
  };
});
