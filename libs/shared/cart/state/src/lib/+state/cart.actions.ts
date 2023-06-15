import type { Action } from '@ngrx/store';

export enum CartActionTypes {
  SetQuantity = '[Cart] Set Quantity',
  SetItems = '[Cart] Set Items',
  Checkout = '[Cart] Checkout Success',
}

export class SetItems implements Action {
  readonly type = CartActionTypes.SetItems;

  constructor(public items: { productId: string; quantity: number }[]) {}
}

export class SetQuantity implements Action {
  readonly type = CartActionTypes.SetQuantity;

  constructor(public productId: string, public quantity: number) {}
}

export class CheckoutSuccess implements Action {
  readonly type = CartActionTypes.Checkout;

  constructor(public orderId: string) {}
}

export type CartAction = SetQuantity | SetItems | CheckoutSuccess;
