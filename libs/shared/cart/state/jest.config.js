module.exports = {
  name: 'shared-cart-state',
  preset: '../../../../jest.config.js',
  coverageDirectory: '../../../../coverage/libs/shared/cart/state',
  snapshotSerializers: [
    'jest-preset-angular/AngularSnapshotSerializer.js',
    'jest-preset-angular/HTMLCommentSerializer.js'
  ]
};
