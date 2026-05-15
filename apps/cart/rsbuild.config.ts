import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSass } from '@rsbuild/plugin-sass';

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
      // Keep the workspace-root-relative `dist/apps/cart` output path
      // so the `deploy` target keeps working.
      root: '../../dist/apps/cart',
    },
    // Assets copied verbatim, mirroring the `assets` array of the
    // previous webpack build.
    copy: [
      { from: './src/_redirects', to: '' },
      { from: '../../libs/shared/assets/src/assets', to: 'assets' },
      { from: '../../libs/shared/assets/src/favicon.ico', to: '' },
    ],
  },
});
