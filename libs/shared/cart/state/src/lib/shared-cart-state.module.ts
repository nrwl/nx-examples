import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { StoreModule } from '@ngrx/store';

import {
  CART_FEATURE_KEY,
  cartReducer,
  initialState as cartInitialState
} from './+state/cart.reducer';

@NgModule({
  imports: [
    CommonModule,
    StoreModule.forFeature(CART_FEATURE_KEY, cartReducer, {
      initialState: cartInitialState
    })
  ]
})
export class SharedCartStateModule {}
