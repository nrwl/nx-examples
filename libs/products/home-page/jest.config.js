module.exports = {
  name: 'products-home-page',
  preset: '../../../jest.config.js',
  coverageDirectory: '../../../coverage/libs/products/home-page',
  snapshotSerializers: [
    'jest-preset-angular/build/AngularNoNgAttributesSnapshotSerializer.js',
    'jest-preset-angular/build/AngularSnapshotSerializer.js',
    'jest-preset-angular/build/HTMLCommentSerializer.js'
  ]
};
