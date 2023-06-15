import { Product } from '@nx-example/shared/product/types';
import { useEffect, useReducer } from 'react';
import { cartReducer, SetItems } from '@nx-example/shared/cart/state/react';
import {
  initialState,
  productsReducer,
  LoadProductsSuccess,
} from '@nx-example/shared/product/state/react';

export const useProducts = (baseUrl: string) => {
  const [cartState, dispatchCart] = useReducer(cartReducer, {
    items: [],
  });
  const [productsState, dispatchProducts] = useReducer(
    productsReducer,
    initialState
  );

  const cb = (products: Product[]): void => {
    dispatchProducts(new LoadProductsSuccess(products));
    dispatchCart(
      new SetItems(products.map((p) => ({ productId: p.id, quantity: 1 })))
    );
  };

  useEffect(() => {
    fetch(baseUrl + '/api/products')
      .then((r) => r.json())
      .then(cb);
  }, []);

  return [
    { cart: cartState, products: productsState },
    { cart: dispatchCart, products: dispatchProducts },
  ] as const;
};
