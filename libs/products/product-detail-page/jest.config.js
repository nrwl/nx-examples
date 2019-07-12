module.exports = {
  name: 'products-product-detail-page',
  preset: '../../../jest.config.js',
  coverageDirectory: '../../../coverage/libs/products/product-detail-page',
  snapshotSerializers: [
    'jest-preset-angular/AngularSnapshotSerializer.js',
    'jest-preset-angular/HTMLCommentSerializer.js'
  ]
};
