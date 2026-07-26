import { cloudflare } from '@cloudflare/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { sites } from './build/sites-vite-plugin';

const websiteDirectory = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss(), sites(), cloudflare()],
  resolve: {
    alias: {
      '@': path.resolve(websiteDirectory, '../src'),
      react: path.resolve(websiteDirectory, 'node_modules/react'),
      'react-dom': path.resolve(websiteDirectory, 'node_modules/react-dom'),
      zod: path.resolve(websiteDirectory, 'node_modules/zod'),
      zustand: path.resolve(websiteDirectory, 'node_modules/zustand'),
    },
  },
  build: {
    cssCodeSplit: true,
    sourcemap: false,
    target: 'es2022',
  },
});
