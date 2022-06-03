import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { StoreModule } from '@ngrx/store';

import {
  initialState as productsInitialState,
  productsReducer,
  PRODUCTS_FEATURE_KEY,
} from './+state/products.reducer';

@NgModule({
  imports: [
    CommonModule,
    StoreModule.forFeature(PRODUCTS_FEATURE_KEY, productsReducer, {
      initialState: productsInitialState,
    }),
  ],
})
export class SharedProductStateModule {}
