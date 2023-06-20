import { Handler } from '@netlify/functions';
import fastify, { FastifyInstance, FastifyRequest } from 'fastify';
import awsLambdaFastify from '@fastify/aws-lambda';
import sensible from '@fastify/sensible';
import { products } from '@nx-example/shared/product/data';
import cors from '@fastify/cors';
import { randomUUID } from 'crypto';

async function routes(fastify: FastifyInstance) {
  fastify.get('/products', async () => {
    return products;
  });
  fastify.post(
    '/checkout',
    async (
      request: FastifyRequest<{
        Body: { productId: string; quanntity: number }[];
      }>
    ) => {
      const items = request.body;
      console.log(request.body);
      const price = items.reduce((acc, item) => {
        const product = products.find((p) => p.id === item.productId);
        return acc + product.price * item.quanntity;
      }, 0);

      // gotta think real hard
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000));

      return { success: true, orderId: randomUUID(), total: price };
    }
  );
}

function init() {
  const app = fastify();
  app.register(sensible);
  app.register(cors);
  // set the prefix for the netlify functions url
  app.register(routes, {
    prefix: `${process.env.BASE_API_PATH || ''}/api`,
  });
  return app;
}

// Note: Netlify deploys this function at the endpoint /.netlify/functions/api
export const handler: Handler = awsLambdaFastify(init());
