import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      // React + TypeScript support
      plugins: [
        react({
          // ensure the new automatic JSX runtime is used for TS/TSX files
          jsxRuntime: 'automatic',
          include: ['**/*.tsx', '**/*.jsx']
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      // Vite already discovers `index.html` and `src/main.tsx`.
      // Additional TypeScript/JS target for better DX.
      esbuild: {
        target: 'es2020',
        jsx: 'automatic'
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      // keep Vite on the expected port during dev so we don’t keep “trying another one…”
      server: {
        port: 5182
      },
    };
});
