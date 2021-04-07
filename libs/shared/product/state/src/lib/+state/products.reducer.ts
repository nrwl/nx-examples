import { products } from '@nx-example/shared/product/data';
import { Product } from '@nx-example/shared/product/types';

import { ProductsAction } from './products.actions';

export const PRODUCTS_FEATURE_KEY = 'products';

export interface ProductsState {
  products: Product[];
}

export interface ProductsPartialState {
  readonly [PRODUCTS_FEATURE_KEY]: ProductsState;
}

export const initialState: ProductsState = {
  products: products,
};

export function productsReducer(
  state: ProductsState = initialState,
  action: ProductsAction
): ProductsState {
  switch (action.type) {
    default: {
      return state;
    }
  }
}
