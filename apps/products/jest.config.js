module.exports = {
  preset: '../../jest.preset.js',
  coverageDirectory: '../../coverage/apps/products',

  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  globals: {
    'ts-jest': {
      stringifyContentPathRegex: '\\.(html|svg)$',

      tsconfig: '<rootDir>/tsconfig.spec.json',
    },
  },
  transform: {
    '^.+.(ts|mjs|js|html)$': 'jest-preset-angular',
  },
  displayName: 'products',
  snapshotSerializers: [
    'jest-preset-angular/build/serializers/no-ng-attributes',
    'jest-preset-angular/build/serializers/ng-snapshot',
    'jest-preset-angular/build/serializers/html-comment',
  ],
  transformIgnorePatterns: ['node_modules/(?!.*.mjs$)'],
};
