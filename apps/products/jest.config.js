module.exports = {
  name: 'products',
  preset: '../../jest.config.js',
  coverageDirectory: '../../coverage/apps/products',
  snapshotSerializers: [
    'jest-preset-angular/build/AngularNoNgAttributesSnapshotSerializer.js',
    'jest-preset-angular/build/AngularSnapshotSerializer.js',
    'jest-preset-angular/build/HTMLCommentSerializer.js'
  ]
};
