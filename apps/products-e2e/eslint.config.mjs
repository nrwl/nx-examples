import cypress from 'eslint-plugin-cypress';
import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  cypress.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    // Override or add rules here
    rules: {},
    languageOptions: {
      parserOptions: {
        project: 'apps/products-e2e/tsconfig.*?.json',
      },
    },
  },
  {
    ignores: ['out-tsc', 'src/test-setup.ts'],
  },
];
