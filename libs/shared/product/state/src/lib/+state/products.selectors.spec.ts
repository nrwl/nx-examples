import { mockProducts } from '@nx-example/shared/product/data/testing';

import { ProductsState } from './products.reducer';
import { getProduct, getProducts } from './products.selectors';

describe('Products Selectors', () => {
  let productsState: ProductsState;

  beforeEach(() => {
    productsState = {
      products: mockProducts,
    };
  });

  describe('getProducts', () => {
    it('should return products', () => {
      expect(getProducts(productsState)).toEqual(mockProducts);
    });
  });

  describe('getProduct', () => {
    it('should return a product by ID', () => {
      expect(getProduct(productsState, '1')).toEqual(mockProducts[1]);
    });
  });
});
