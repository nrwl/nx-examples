import React from 'react';

import '@nx-example/shared/product/ui';

import { products } from '@nx-example/shared/product/data';
import { Product } from '@nx-example/shared/product/types';

export const CartCartPage = () => {
  return (
    <ul>
      {products.map((product: Product) => (
        <li key={product.id}>
          <nx-example-product name={product.name} price={product.price} />
        </li>
      ))}
    </ul>
  );
};

export default CartCartPage;
