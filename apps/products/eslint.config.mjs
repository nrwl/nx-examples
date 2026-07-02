import baseConfig from '../../eslint.config.mjs';
import nx from '@nx/eslint-plugin';

export default [
  ...baseConfig,
  ...nx.configs['flat/angular'],
  {
    files: ['**/*.ts'],
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'nxExample',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'nx-example',
          style: 'kebab-case',
        },
      ],
      '@angular-eslint/prefer-standalone': 'off',
      // Newly enabled by the angular-eslint v22 recommended set; this app's
      // components intentionally keep eager change detection (see the Angular
      // v22 `change-detection-eager` migration).
      '@angular-eslint/prefer-on-push-component-change-detection': 'off',
    },
    languageOptions: {
      parserOptions: {
        project: ['apps/products/tsconfig.*?.json'],
      },
    },
  },
  ...nx.configs['flat/angular-template'],
  {
    ignores: ['out-tsc', 'src/test-setup.ts'],
  },
];
