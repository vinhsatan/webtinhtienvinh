import path from 'node:path';
import fs from 'node:fs';
import { reactRouter } from '@react-router/dev/vite';
import { reactRouterHonoServer } from 'react-router-hono-server/dev';
import { defineConfig, loadEnv } from 'vite';
import babel from 'vite-plugin-babel';
import tsconfigPaths from 'vite-tsconfig-paths';
import { addRenderIds } from './plugins/addRenderIds';
import { aliases } from './plugins/aliases';
import consoleToParent from './plugins/console-to-parent';
import { layoutWrapperPlugin } from './plugins/layouts';
import { loadFontsFromTailwindSource } from './plugins/loadFontsFromTailwindSource';
import { nextPublicProcessEnv } from './plugins/nextPublicProcessEnv';
import { restart } from './plugins/restart';
import { restartEnvFileChange } from './plugins/restartEnvFileChange';

// Load .env file explicitly
const env = loadEnv('development', process.cwd());

export default defineConfig({
  // NEXT_PUBLIC_* cho Create, VITE_* cho NO_SERVER_SYNC, NO_PERSIST (tránh 401 khi npm run dev)
  envPrefix: ['NEXT_PUBLIC_', 'VITE_'],
  // Explicitly define VITE_* env variables for import.meta.env access
  define: {
    'import.meta.env.VITE_N8N_WEBHOOK_URL': JSON.stringify(env.VITE_N8N_WEBHOOK_URL || ''),
    'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || ''),
    'import.meta.env.VITE_AUTH_MODE': JSON.stringify(env.VITE_AUTH_MODE || ''),
    'import.meta.env.VITE_AUTH_EMAIL': JSON.stringify(env.VITE_AUTH_EMAIL || ''),
    'import.meta.env.VITE_AUTH_PASSWORD': JSON.stringify(env.VITE_AUTH_PASSWORD || ''),
    'import.meta.env.VITE_APP_DOMAIN': JSON.stringify(env.APP_DOMAIN || env.VITE_APP_DOMAIN || ''),
    'import.meta.env.VITE_APP_ENV': JSON.stringify(env.APP_ENV || env.VITE_APP_ENV || ''),
    'import.meta.env.VITE_JWT_SECRET': JSON.stringify(env.VITE_JWT_SECRET || ''),
    'import.meta.env.VITE_NO_PERSIST': JSON.stringify(env.VITE_NO_PERSIST || 'false'),
    'import.meta.env.VITE_NO_SERVER_SYNC': JSON.stringify(env.VITE_NO_SERVER_SYNC || 'false'),
    'import.meta.env.VITE_TELEGRAM_BOT_TOKEN': JSON.stringify(env.VITE_TELEGRAM_BOT_TOKEN || ''),
    'import.meta.env.VITE_TELEGRAM_CHAT_ID': JSON.stringify(env.VITE_TELEGRAM_CHAT_ID || ''),
  },
  optimizeDeps: {
    // Explicitly include fast-glob, since it gets dynamically imported and we
    // don't want that to cause a re-bundle.
    include: ['fast-glob', 'lucide-react', 'xlsx'],
    exclude: [
      '@hono/auth-js/react',
      '@hono/auth-js',
      '@auth/core',
      '@hono/auth-js',
      'hono/context-storage',
      '@auth/core/errors',
      'fsevents',
      'lightningcss',
      '@mapbox/node-pre-gyp',
      'nock',
      'aws-sdk',
      'mock-aws-s3',
    ],
  },
  logLevel: 'info',
  plugins: [
    nextPublicProcessEnv(),
    restartEnvFileChange(),
    reactRouterHonoServer({
      serverEntryPoint: './__create/index.ts',
      runtime: 'node',
    }),
    babel({
      include: ['src/**/*.{js,jsx,ts,tsx}'], // or RegExp: /src\/.*\.[tj]sx?$/
      exclude: /node_modules/, // skip everything else
      babelConfig: {
        babelrc: false, // don’t merge other Babel files
        configFile: false,
        plugins: ['styled-jsx/babel'],
      },
    }),
    restart({
      restart: [
        'src/**/page.jsx',
        'src/**/page.tsx',
        'src/**/layout.jsx',
        'src/**/layout.tsx',
        'src/**/route.js',
        'src/**/route.ts',
      ],
      // Khi sửa → reload trang ngay (tự động cập nhật localhost)
      reload: [
        'src/components/**/*.{js,jsx}',
        'src/utils/**/*.js',
        'src/contexts/**/*.jsx',
        // HMR options left as-is
        proxy: {
          '/api': {
            target: 'http://127.0.0.1:3000',
            changeOrigin: true,
            secure: false,
            ws: true
          }
        },
        'src/app/**/*.{js,jsx,ts,tsx,css}',
      ],
      delay: 150, // Phản hồi nhanh
    }),
    consoleToParent(),
    loadFontsFromTailwindSource(),
    addRenderIds(),
    reactRouter(),
    tsconfigPaths(),
    aliases(),
    layoutWrapperPlugin(),
  ],
  resolve: {
    alias: {
      lodash: 'lodash-es',
      'npm:stripe': 'stripe',
      stripe: path.resolve(__dirname, './src/__create/stripe'),
      '@auth/create/react': '@hono/auth-js/react',
      '@auth/create': path.resolve(__dirname, './src/__create/@auth/create'),
      '@': path.resolve(__dirname, 'src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  clearScreen: false,
  server: {
    allowedHosts: true,
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling: true, // Luôn dùng polling - đảm bảo detect thay đổi (Windows/WSL)
      interval: 200, // Kiểm tra mỗi 200ms
    },
    hmr: {
      protocol: 'ws',
      host: undefined, // Auto-detect from browser location
      port: 5173,
      overlay: false, // Disabled overlay so API responses are visible
    },
    warmup: {
      clientFiles: ['./src/app/**/*', './src/app/root.tsx', './src/app/routes.ts'],
    },
  },
});
