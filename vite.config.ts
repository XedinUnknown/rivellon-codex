/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Build targets (pick with --mode):
//   single  one self-contained HTML file: the claude.ai artifact, or double-clicked from disk
//   web     hashed, split files for a static host (data loads as separate chunks)
export default defineConfig(({ mode }) => {
  const single = mode === 'single';
  return {
    base: './',
    plugins: [react(), ...(single ? [viteSingleFile({ removeViteModuleLoader: true })] : [])],
    json: { stringify: true },
    build: {
      outDir: single ? 'dist/single' : 'dist/web',
      emptyOutDir: true,
      target: 'es2022',
      chunkSizeWarningLimit: 2048,
    },
    test: {
      include: ['src/**/*.test.ts'],
    },
  };
});
