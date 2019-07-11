import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { StoreModule } from '@ngrx/store';

import {
  initialState as productsInitialState,
  PRODUCTS_FEATURE_KEY,
  productsReducer
} from './+state/products.reducer';

@NgModule({
  imports: [
    CommonModule,
    StoreModule.forFeature(PRODUCTS_FEATURE_KEY, productsReducer, {
      initialState: productsInitialState
    })
  ]
})
export class SharedProductStateModule {}
