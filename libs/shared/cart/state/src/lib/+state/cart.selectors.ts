import {
  getProduct,
  ProductsState,
} from '@nx-example/shared/product/state/react';
import { CartItem, CartState } from './cart.reducer';

// Lookup the 'Cart' feature state managed by NgRx
export function getItemCost(item: CartItem, productsState: ProductsState) {
  return getProduct(productsState, item.productId).price * item.quantity;
}

export function getTotalCost(state: CartState, productsState: ProductsState) {
  return state.items.reduce(
    (total, item) => total + getItemCost(item, productsState),
    0
  );
}
