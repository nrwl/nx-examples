import { createReducer } from '@ngrx/store';
import { createEntityAdapter, EntityState } from '@ngrx/entity';

import { products } from '@nx-example/shared/product/data';
import { Product } from '@nx-example/shared/product/types';

export const PRODUCTS_FEATURE_KEY = 'products';

export interface ProductsState extends EntityState<Product> {}

export interface ProductsPartialState {
  readonly [PRODUCTS_FEATURE_KEY]: ProductsState;
}

export const productsAdapter = createEntityAdapter<Product>();

export const initialState: ProductsState = {
  ...productsAdapter.setAll(products, productsAdapter.getInitialState())
};

export const productsReducer = createReducer(initialState);

export const { selectAll, selectEntities } = productsAdapter.getSelectors();