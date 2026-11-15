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
    plugins: [react()],
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
            mapbox: ['mapbox-gl'],
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
