import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const websiteDirectory = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(websiteDirectory, '../src'),
      react: path.resolve(websiteDirectory, 'node_modules/react'),
      'react-dom': path.resolve(websiteDirectory, 'node_modules/react-dom'),
      zod: path.resolve(websiteDirectory, 'node_modules/zod'),
      zustand: path.resolve(websiteDirectory, 'node_modules/zustand'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
});
