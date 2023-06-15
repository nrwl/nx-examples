import { mockProducts } from '@nx-example/shared/product/data/testing';

import { productsReducer, ProductsState } from './products.reducer';
import { ProductsAction } from './products.actions';

describe('Products Reducer', () => {
  let productsState: ProductsState;

  beforeEach(() => {
    productsState = {
      products: mockProducts,
    };
  });

  describe('unknown action', () => {
    it('should return the initial state', () => {
      const action = {} as ProductsAction;
      const result = productsReducer(productsState, action);

      expect(result).toBe(productsState);
    });
  });
});
