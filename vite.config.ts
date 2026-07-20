import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const rootDirectory = path.dirname(fileURLToPath(import.meta.url));
const resolveFromRoot = (target: string) => path.resolve(rootDirectory, target);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolveFromRoot('src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        dashboard: resolveFromRoot('index.html'),
        popup: resolveFromRoot('popup.html'),
        sidepanel: resolveFromRoot('sidepanel.html'),
        serviceWorker: resolveFromRoot('src/background/service-worker.ts'),
        problemContext: resolveFromRoot('src/content/problem-context.ts'),
      },
      output: {
        entryFileNames: (chunk) => {
          if (chunk.name === 'serviceWorker') return 'background/service-worker.js';
          if (chunk.name === 'problemContext') return 'content/problem-context.js';
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});
