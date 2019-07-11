module.exports = {
  name: 'shared-product-state',
  preset: '../../../../jest.config.js',
  coverageDirectory: '../../../../coverage/libs/shared/product/state',
  snapshotSerializers: [
    'jest-preset-angular/AngularSnapshotSerializer.js',
    'jest-preset-angular/HTMLCommentSerializer.js'
  ]
};
