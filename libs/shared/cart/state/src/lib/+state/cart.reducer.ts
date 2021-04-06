import { CartAction, CartActionTypes } from './cart.actions';

export const CART_FEATURE_KEY = 'cart';

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
}

export interface CartPartialState {
  readonly [CART_FEATURE_KEY]: CartState;
}

export const initialState: CartState = {
  items: [],
};

export const cartReducer = (state: CartState, action: CartAction) => {
  switch (action.type) {
    case CartActionTypes.SetQuantity: {
      return {
        ...state,
        items: state.items.map((item) => {
          if (item.productId !== action.productId) {
            return item;
          }

          return {
            ...item,
            quantity: action.quantity,
          };
        }),
      };
    }

    default: {
      return state;
    }
  }
};
