import { join } from 'node:path';

import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSass } from '@rsbuild/plugin-sass';

// Resolve to clean absolute paths so the `../` segments are collapsed before
// they reach the filesystem. Otherwise Nx's task sandbox records reads like
// `apps/cart/../../libs/...` which never match the normalized declared inputs.
const fromRoot = (...segments: string[]) =>
  join(__dirname, '..', '..', ...segments);

export default defineConfig({
  plugins: [pluginReact(), pluginSass()],
  source: {
    // Global stylesheets are prepended to the entry, mirroring the
    // `styles` array of the previous `@nx/webpack:webpack` build.
    entry: {
      index: [
        '../../libs/shared/styles/src/index.scss',
        '../../libs/shared/header/index.scss',
        'normalize.css/normalize.css',
        './src/main.tsx',
      ],
    },
    tsconfigPath: './tsconfig.app.json',
  },
  html: {
    template: './src/index.html',
  },
  server: {
    port: 4201,
  },
  tools: {
    cssLoader: {
      // `url('/assets/...')` paths are served at runtime from the copied
      // assets, so don't try to resolve them at build time.
      url: {
        filter: (url: string) => !url.startsWith('/'),
      },
    },
  },
  output: {
    target: 'web',
    distPath: {
      // Keep the `dist/apps/cart` output path so the `deploy` target works.
      root: fromRoot('dist', 'apps', 'cart'),
    },
    // Assets copied verbatim, mirroring the `assets` array of the
    // previous webpack build.
    copy: [
      { from: join(__dirname, 'src', '_redirects'), to: '' },
      {
        from: fromRoot('libs', 'shared', 'assets', 'src', 'assets'),
        to: 'assets',
      },
      {
        from: fromRoot('libs', 'shared', 'assets', 'src', 'favicon.ico'),
        to: '',
      },
    ],
  },
});
