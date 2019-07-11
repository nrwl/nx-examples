import React, { useReducer } from 'react';

import styled from '@emotion/styled';

import '@nx-example/shared/product/ui';

import {
  CartItem,
  cartReducer,
  getItemCost,
  getTotalCost,
  SetQuantity
} from '@nx-example/shared/cart/state';
import {
  getProduct,
  initialState,
  productsReducer
} from '@nx-example/shared/product/state';

const StyledUl = styled.ul`
  display: flex;
  flex-direction: column;
  margin: auto;
  max-width: 900px;
  padding: 10px;
`;

const StyledLi = styled.li`
  display: inline-flex;
  align-items: center;
  flex-direction: row;
  padding: 10px;

  figure {
    flex-shrink: 0;
    height: 150px;
    width: 150px;
    justify-content: center;
    display: flex;
    margin: 0;
  }

  img {
    max-width: 100%;
    max-height: 100%;
  }

  h2 {
    flex-grow: 1;
    margin-left: 100px;
  }

  select {
    width: 50px;
    margin: 0 20px;
  }
`;

const StyledTotalLi = styled.li`
  display: inline-flex;
  align-items: center;
  flex-direction: row;
  padding: 10px;

  h2 {
    flex-grow: 1;
    margin-left: 250px;
  }
`;

const optionsArray = new Array(5).fill(null);

export const CartCartPage = () => {
  const [productsState] = useReducer(productsReducer, initialState);
  const { products } = productsState;
  const [cartState, dispatch] = useReducer(cartReducer, {
    items: products.map(product => ({
      productId: product.id,
      quantity: 1
    }))
  });

  return (
    <StyledUl>
      {cartState.items.map((item: CartItem) => (
        <StyledLi key={item.productId}>
          <figure>
            <img src={getProduct(productsState, item.productId).image} />
          </figure>
          <h2>{getProduct(productsState, item.productId).name}</h2>
          <p>
            <nx-example-product-price
              value={getProduct(productsState, item.productId).price}
            />
          </p>
          <select
            value={item.quantity}
            onChange={event => {
              dispatch(new SetQuantity(item.productId, +event.target.value));
            }}
          >
            {optionsArray.map((_, i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
          <p>
            <nx-example-product-price
              value={getItemCost(item, productsState)}
            />
          </p>
        </StyledLi>
      ))}
      <StyledTotalLi>
        <h2>Total</h2>
        <p>
          <nx-example-product-price
            value={getTotalCost(cartState, productsState)}
          />
        </p>
      </StyledTotalLi>
    </StyledUl>
  );
};

export default CartCartPage;
