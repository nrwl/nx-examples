import Fastify from 'fastify';
import { app } from '../app/app';
import { Handler } from '@netlify/functions';
import awsLambdaFastify from '@fastify/aws-lambda';

function init() {
  // Instantiate Fastify with some config
  const server = Fastify({
    logger: true,
  });
  // Register your application as a normal plugin.
  server.register(app);
  // set the prefix for the netlify functions url
  return server;
}

// Setup serverless functionality for api.
// Note: Netlify deploys this function at the endpoint /.netlify/functions/api
export const handler: Handler = awsLambdaFastify(init());
