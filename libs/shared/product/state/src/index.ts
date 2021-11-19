import { createFeatureSelector } from '@ngrx/store';
import { PRODUCTS_FEATURE_KEY } from './lib/+state/products.reducer';

export * from './lib/+state/products.reducer';
export * from './lib/+state/products.selectors';
export const getProductsState = createFeatureSelector(PRODUCTS_FEATURE_KEY);
export * from './lib/shared-product-state.module';
