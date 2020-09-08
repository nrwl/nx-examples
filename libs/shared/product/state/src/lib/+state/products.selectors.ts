import { createFeatureSelector, createSelector } from '@ngrx/store';

import { ProductsState, PRODUCTS_FEATURE_KEY, ProductsPartialState, selectAll, selectEntities } from './products.reducer';

export const getProductsState = createFeatureSelector<ProductsPartialState, ProductsState>(PRODUCTS_FEATURE_KEY);

export const getProducts = createSelector(getProductsState, selectAll);

export const getProductsEntities = createSelector(getProductsState, selectEntities);

export const getProduct = createSelector(
  getProductsEntities,
  (entities, productId: string) => entities[productId]);
