module.exports = {
  name: 'shared-cart-state',
  preset: '../../../../jest.config.js',
  coverageDirectory: '../../../../coverage/libs/shared/cart/state',
  snapshotSerializers: [
    'jest-preset-angular/build/AngularNoNgAttributesSnapshotSerializer.js',
    'jest-preset-angular/build/AngularSnapshotSerializer.js',
    'jest-preset-angular/build/HTMLCommentSerializer.js'
  ]
};
