import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { StoreModule } from '@ngrx/store';

import {
  initialState as productsInitialState,
  productsReducer,
  PRODUCTS_FEATURE_KEY,
} from './+state/products.reducer';
import { EffectsModule } from '@ngrx/effects';
import { ProductsEffects } from './+state/products.effects';

@NgModule({
  imports: [
    CommonModule,
    StoreModule.forFeature(PRODUCTS_FEATURE_KEY, productsReducer, {
      initialState: productsInitialState,
    }),
    EffectsModule.forFeature(ProductsEffects),
  ],
})
export class SharedProductStateModule {}
