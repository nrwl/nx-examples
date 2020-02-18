module.exports = {
  name: 'products-product-detail-page',
  preset: '../../../jest.config.js',
  coverageDirectory: '../../../coverage/libs/products/product-detail-page',
  snapshotSerializers: [
    'jest-preset-angular/build/AngularNoNgAttributesSnapshotSerializer.js',
    'jest-preset-angular/build/AngularSnapshotSerializer.js',
    'jest-preset-angular/build/HTMLCommentSerializer.js'
  ]
};
