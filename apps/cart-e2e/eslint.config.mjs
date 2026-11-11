import cypress from 'eslint-plugin-cypress/flat';
import baseConfig from '../../eslint.config.mjs';

export default [
  cypress.configs.recommended,
  ...baseConfig,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    // Override or add rules here
    rules: {},
  },
];
