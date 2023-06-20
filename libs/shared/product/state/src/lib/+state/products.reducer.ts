import { Product } from '@nx-example/shared/product/types';

import { ProductsAction, ProductsActionTypes } from './products.actions';

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
  switch (action.type) {
    case ProductsActionTypes.LoadProductsSuccess:
      return { products: action.products };
    case ProductsActionTypes.LoadProducts:
      return { products: [] };
    default: {
      return state;
    }
  }
}
