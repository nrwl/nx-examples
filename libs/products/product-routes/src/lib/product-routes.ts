import { FastifyInstance } from 'fastify';
import { products } from '@nx-example/shared/product/data';

export async function productsRoutes(fastify: FastifyInstance) {
  fastify.get('/products', async () => {
    return products;
  });
}
