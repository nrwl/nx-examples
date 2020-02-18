module.exports = {
  name: 'shared-product-state',
  preset: '../../../../jest.config.js',
  coverageDirectory: '../../../../coverage/libs/shared/product/state',
  snapshotSerializers: [
    'jest-preset-angular/build/AngularNoNgAttributesSnapshotSerializer.js',
    'jest-preset-angular/build/AngularSnapshotSerializer.js',
    'jest-preset-angular/build/HTMLCommentSerializer.js'
  ]
};
