import { mockProducts } from '@nx-example/shared/product/data/testing';

import { productsReducer, ProductsState, initialState } from './products.reducer';

describe('Products Reducer', () => {
  let productsState: ProductsState;

  beforeEach(() => {
    productsState = initialState;
  });

  describe('unknown action', () => {
    it('should return the initial state', () => {
      const action = {} as any;
      const result = productsReducer(productsState, action);

      expect(result).toBe(productsState);
    });
  });
});
