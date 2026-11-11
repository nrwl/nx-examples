import baseConfig from '../../../eslint.config.mjs';
import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/angular'],
  ...nx.configs['flat/angular-template'],
  ...baseConfig,
  {
    files: ['**/*.ts'],
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'products', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'products', style: 'kebab-case' },
      ],
      '@angular-eslint/prefer-standalone': 'off',
    },
  },
  {
    files: ['**/*.html'],
    rules: {
      // The product images have no text alternative.
      '@angular-eslint/template/alt-text': 'off',
    },
  },
  {
    ignores: ['src/test-setup.ts'],
  },
];
