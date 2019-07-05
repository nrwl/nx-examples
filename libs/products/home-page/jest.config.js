module.exports = {
  name: 'products-home-page',
  preset: '../../../jest.config.js',
  coverageDirectory: '../../../coverage/libs/products/home-page',
  snapshotSerializers: [
    'jest-preset-angular/AngularSnapshotSerializer.js',
    'jest-preset-angular/HTMLCommentSerializer.js'
  ]
};
