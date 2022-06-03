import { mockProducts } from '@nx-example/shared/product/data/testing';
import { ProductsState } from '@nx-example/shared/product/state';

import { CartState } from './cart.reducer';
import { getItemCost, getTotalCost } from './cart.selectors';

describe('Cart Selectors', () => {
  let cartState: CartState;
  let productsState: ProductsState;

  beforeEach(() => {
    cartState = {
      items: [
        {
          productId: '0',
          quantity: 0,
        },
        {
          productId: '1',
          quantity: 1,
        },
      ],
    };

    productsState = {
      products: mockProducts,
    };
  });

  describe('getItemCost', () => {
    it('should return the price multiplied by the quantity of the item', () => {
      expect(
        getItemCost(
          {
            productId: '1',
            quantity: 2,
          },
          productsState
        )
      ).toEqual(40);
    });
  });

  describe('getTotalCost', () => {
    it('should return a total of all items in the cart', () => {
      expect(getTotalCost(cartState, productsState)).toEqual(20);
    });
  });
});
