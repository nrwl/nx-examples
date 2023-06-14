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
  products: [],
};

export function productsReducer(
  state: ProductsState = initialState,
  action: ProductsAction
): ProductsState {
  console.log('productsReducer', action.type);
  switch (action.type) {
    case '[Products] Load Products Success':
      return { products: action.products };
    case '[Products] Load Products':
      return { products: [] };
    default: {
      return state;
    }
  }
}
