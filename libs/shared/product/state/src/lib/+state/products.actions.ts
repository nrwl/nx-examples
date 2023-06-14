import { Action } from '@ngrx/store';
import { Product } from '@nx-example/shared/product/types';

export enum ProductsActionTypes {
  LoadProducts = '[Products] Load Products',
  LoadProductsSuccess = '[Products] Load Products Success',
}

export class LoadProducts implements Action {
  readonly type = ProductsActionTypes.LoadProducts;
}
export class LoadProductsSuccess implements Action {
  readonly type = ProductsActionTypes.LoadProductsSuccess;
  constructor(public products: Product[]) {}
}

export type ProductsAction = LoadProducts | LoadProductsSuccess;
