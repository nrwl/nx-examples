import { createFeatureSelector } from '@ngrx/store';

import { PRODUCTS_FEATURE_KEY, ProductsState } from './products.reducer';

export const getProductsState = createFeatureSelector(PRODUCTS_FEATURE_KEY);

export const getProducts = ({ products }: ProductsState) => products;

export const getProduct = ({ products }: ProductsState, productId: string) => {
  return products.find(product => product.id === productId);
};
