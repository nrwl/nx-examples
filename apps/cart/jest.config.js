module.exports = {
  preset: '../../jest.preset.js',
  transform: {
    '^.+\\.[tj]sx?$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'html'],
  coverageDirectory: '../../coverage/apps/cart',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  globals: { 'ts-jest': { tsconfig: '<rootDir>/tsconfig.spec.json' } },
  displayName: 'cart',
};
