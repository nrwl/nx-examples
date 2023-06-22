import Fastify from 'fastify';
import { app } from './app/app';
import { basename } from 'path';

// Be able to dynamically register the base path for the api
function init(prefix = '') {
  // Instantiate Fastify with some config
  const server = Fastify({
    logger: true,
  });

  // Register your application as a normal plugin.
  server.register(app, { prefix });

  return server;
}
// if serving locally, start the server and listen
// TODO(caleb): how to correctly set this. require.main === module is always false bc overrides?
if (
  require.main?.filename &&
  basename(require.main.filename) === 'node-with-require-overrides.js'
) {
  console.log('main');
  const host = process.env.HOST ?? 'localhost';
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;

  const server = init();

  // Start listening.
  server.listen({ port, host }, (err) => {
    if (err) {
      server.log.error(err);
      process.exit(1);
    } else {
      console.log(`[ ready ] http://${host}:${port}`);
    }
  });
} else {
  // if using in netlify function, export the function and import into function
  // see functions/api/api.ts
  module.exports = init;
}
