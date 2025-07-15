import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      // React + TypeScript support
      plugins: [
        react()
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      // Vite already discovers `index.html` and `src/main.tsx`.
      // Additional TypeScript/JS target for better DX.
      esbuild: {
        target: 'es2020'
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
    };
});
