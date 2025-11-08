import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const ReactCompilerConfig = {
  /* ... */
};

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [
    react({
      jsxRuntime: 'automatic',
      babel: {
        plugins: [
          ['babel-plugin-react-compiler', ReactCompilerConfig],
        ],
      },
    }),
  ],
  // Only use base path for production build (GitHub Pages), not dev server
  base: command === 'build' ? '/react-adjustable-panels/' : '/',
  build: {
    outDir: 'dist-demo',
  },
  server: {
    port: 3000,
    open: true,
  },
}));
