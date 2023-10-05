import { composePlugins, withNx } from '@nx/webpack';
import { withReact } from '@nx/react';
import { products } from '@nx-example/shared/product/data';

// Nx plugins for webpack.
export default composePlugins(
  withNx(),
  withReact() as any,
  (config, { options, context }) => {
    // Update the webpack config as needed here.
    // e.g. config.plugins.push(new MyPlugin())
    // For more information on webpack config and Nx see:
    // https://nx.dev/packages/webpack/documents/webpack-config-setup
    console.log('products', products);
    return config;
  }
);
