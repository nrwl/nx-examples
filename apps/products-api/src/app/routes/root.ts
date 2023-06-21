import { FastifyInstance } from 'fastify';
import { products } from '@nx-example/shared/product/data';

export default async function (fastify: FastifyInstance) {
  fastify.get('/api/products', async () => {
    return products;
  });
}
