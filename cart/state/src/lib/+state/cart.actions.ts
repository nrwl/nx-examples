import type { Action } from '@ngrx/store';

export enum CartActionTypes {
  /* eslint-disable @typescript-eslint/no-shadow */
  SetQuantity = '[Cart] Set Quantity',
}

export class SetQuantity implements Action {
  readonly type = CartActionTypes.SetQuantity;

  constructor(public productId: string, public quantity: number) {}
}

export type CartAction = SetQuantity;
