import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

// Base relativa: el mismo artefacto funciona en GitHub Pages
// (https://andrezzrg.github.io/niand-erp-basico/), en un subdirectorio
// cualquiera y abierto desde el sistema de archivos.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2022',
    chunkSizeWarningLimit: 900,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/domain/**/*.ts', 'src/lib/**/*.ts'],
      thresholds: { statements: 80, branches: 70, functions: 80, lines: 80 },
    },
  },
});
