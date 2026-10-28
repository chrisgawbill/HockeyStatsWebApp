/// <reference types="vitest" />
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/HockeyStatsWebApp/',
  server: {
    port: 5173,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      exclude: ['src/test/**'],
      reporter: ['text-summary', 'json', 'json-summary'],
      thresholds: {
        statements: 87.84,
        branches: 80.6,
        functions: 90.54,
        lines: 88.86,
      },
    },
  },
});
