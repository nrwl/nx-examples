import { Handler } from '@netlify/functions';
import fastify, { FastifyInstance, FastifyRequest } from 'fastify';
import awsLambdaFastify from '@fastify/aws-lambda';
import sensible from '@fastify/sensible';
import { products } from '@nx-example/shared/product/data';
import cors from '@fastify/cors';

async function routes(fastify: FastifyInstance) {
  fastify.get('/products', async () => {
    return products;
  });
}

function init() {
  const app = fastify();
  app.register(sensible);
  app.register(cors);
  // set the prefix for the netlify functions url
  app.register(routes, { prefix: '/.netlify/functions/api' });
  return app;
}

// Note: Netlify deploys this function at the endpoint /.netlify/functions/api
export const handler: Handler = awsLambdaFastify(init());
