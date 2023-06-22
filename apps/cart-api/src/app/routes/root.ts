import { FastifyInstance, FastifyRequest } from 'fastify';
import { randomUUID } from 'crypto';
import { products } from '@nx-example/shared/product/data';

export default async function (fastify: FastifyInstance) {
  fastify.post(
    '/api/checkout',
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
