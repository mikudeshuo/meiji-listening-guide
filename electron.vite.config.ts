import { resolve } from 'node:path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
// Reduced from ElecKoi's Electron Vite configuration (AGPL-3.0).
export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        entry: {
          main: resolve('src/main/main.ts'),
          'asr-worker': resolve('src/main/asr-worker.ts'),
          'knowledge-worker': resolve('src/main/knowledge-worker.ts'),
          'media-download-worker': resolve('src/main/media-download-worker.ts'),
          'media-process-guardian': resolve('src/main/media-process-guardian.ts'),
        },
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: { entry: resolve('src/preload/preload.ts') },
      rollupOptions: { output: { format: 'cjs', entryFileNames: '[name].cjs' } },
    },
  },
  renderer: { plugins: [react()] },
});
