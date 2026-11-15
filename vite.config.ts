/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const rawTarget = env.VITE_BACKEND_URL || env.VITE_API_BASE_URL || 'http://localhost:8000';
  const cleanTarget = rawTarget.startsWith('http')
    ? rawTarget.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '')
    : 'http://localhost:8000';

  return {
    plugins: [
      react(),
      {
        name: 'emit-maplibre-worker-mjs',
        async generateBundle() {
          const fsSpec: string = 'node:fs';
          const { readFileSync } = (await import(fsSpec)) as {
            readFileSync: (path: URL) => Uint8Array;
          };
          this.emitFile({
            type: 'asset',
            fileName: 'assets/maplibre-gl-worker.mjs',
            source: readFileSync(
              new URL('./node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs', import.meta.url)
            ),
          });
        },
      },
    ],
    optimizeDeps: {
      exclude: ['maplibre-gl'],
    },
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': {
          target: cleanTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            maplibre: ['maplibre-gl'],
          },
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./tests/setup.ts'],
      css: true,
    },
  };
});
