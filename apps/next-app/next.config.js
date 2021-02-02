// eslint-disable-next-line @typescript-eslint/no-var-requires
const withNx = require('@nrwl/next/plugins/with-nx');

const withLess = require('@zeit/next-less');
module.exports = withLess(
  withNx({
    // Set this to true if you use CSS modules.
    // See: https://github.com/css-modules/css-modules
    cssModules: false,
  })
);
