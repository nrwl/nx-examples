import { Action } from '@ngrx/store';
import { mockProducts } from '@nx-example/shared/product/data/testing';

import { productsReducer, ProductsState } from './products.reducer';

describe('Products Reducer', () => {
  let productsState: ProductsState;

  beforeEach(() => {
    productsState = {
      products: mockProducts,
    };
  });

  describe('unknown action', () => {
    it('should return the initial state', () => {
      const action = {} as Action;
      const result = productsReducer(productsState, action);

      expect(result).toBe(productsState);
    });
  });
});
