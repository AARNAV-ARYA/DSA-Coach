import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

const rootDirectory = path.dirname(fileURLToPath(import.meta.url));
const resolveFromRoot = (target: string) => path.resolve(rootDirectory, target);

function assertClassicContentScriptIsSelfContained(): Plugin {
  return {
    name: 'assert-classic-content-script-is-self-contained',
    generateBundle(_options, bundle) {
      const contentScript = bundle['content/problem-context.js'];
      if (contentScript?.type === 'chunk' && contentScript.imports.length > 0) {
        this.error(
          `Chrome manifest content scripts cannot contain ES-module imports. Found: ${contentScript.imports.join(', ')}`,
        );
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), assertClassicContentScriptIsSelfContained()],
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
