import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// No nxReadySignal() here, so @nx/vite infers its `command` readyWhen fallback
// instead of `signal`. That fallback is the shell-quoted probe to test on Windows.
export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../../node_modules/.vite/apps/readiness/vite',
  server: {
    port: 4310,
    host: 'localhost',
    proxy: {
      '/api/node': 'http://localhost:3333',
      '/api/tsx': 'http://localhost:3334',
    },
  },
  preview: {
    port: 4311,
    host: 'localhost',
  },
  plugins: [react()],
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
}));
