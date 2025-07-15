import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      // React + TypeScript support with enhanced options
      plugins: [
        react({
          // Enhanced React plugin settings
          jsxRuntime: 'automatic',
          include: ['**/*.tsx', '**/*.jsx'],
          babel: {
            // Force all TypeScript through Babel for guaranteed transpilation
            presets: [
              ['@babel/preset-env', { targets: 'defaults' }],
              ['@babel/preset-react', { runtime: 'automatic' }],
              ['@babel/preset-typescript', {
                isTSX: true,
                allExtensions: true,
                allowNamespaces: true,
                allowDeclareFields: true,
                onlyRemoveTypeImports: true
              }]
            ],
            plugins: [
              ['@babel/plugin-transform-typescript', {
                isTSX: true,
                allowNamespaces: true
              }]
            ]
          }
        }),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      optimizeDeps: {
        // Force include to ensure proper TypeScript handling
        include: ['react', 'react-dom']
      },
      build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: true,
        // Ensure CommonJS modules mixed with ES modules are handled
        commonjsOptions: {
          transformMixedEsModules: true
        }
      },
      // Vite already discovers `index.html` and `src/main.tsx`.
      // Additional TypeScript/JS target for better DX.
      esbuild: {
        // guarantee TSX/JSX are handled even if Babel misses them
        loader: 'tsx',
        include: /\.(tsx?|jsx?)$/,
        exclude: [],
        target: 'es2020',
        jsx: 'automatic',
        jsxInject: `import React from 'react'`,
        logOverride: {
          'this-is-undefined-in-esm': 'silent'
        }
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.')
        },
        extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
      },
      // keep Vite on the expected port during dev so we don’t keep “trying another one…”
      server: {
        port: 5182,
        open: true
      },
    };
});
