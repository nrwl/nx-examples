import { Action } from '@ngrx/store';

export enum CartActionTypes {
  SetQuantity = '[Cart] Set Quantity'
}

export class SetQuantity implements Action {
  type: CartActionTypes.SetQuantity = CartActionTypes.SetQuantity;

  constructor(public productId: string, public quantity: number) {}
}

export type CartAction = SetQuantity;
