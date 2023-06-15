import styled from '@emotion/styled';

import '@nx-example/shared/product/ui';

import {
  CartItem,
  getItemCost,
  getTotalCost,
  SetQuantity,
  CheckoutSuccess,
} from '@nx-example/shared/cart/state/react';
import { getProduct } from '@nx-example/shared/product/state/react';
import { useProducts } from './cart-page-hooks';

const StyledUl = styled.ul`
  display: flex;
  flex-direction: column;
  margin: auto;
  max-width: 900px;
  padding: 10px;

  @media screen and (max-width: 900px) {
    max-width: 100%;
  }
`;

const StyledLi = styled.li`
  display: inline-flex;
  align-items: center;
  flex-direction: row;
  padding: 10px;

  figure {
    flex-shrink: 0;
    height: 125px;
    width: 125px;
    justify-content: center;
    display: flex;
    margin: 0;
  }

  select {
    width: 50px;
    margin: 0 20px;
  }

  .title {
    flex-grow: 1;
    margin-left: 50px;
  }

  @media screen and (max-width: 900px) {
    figure {
      width: 50px;
      height: 50px;
    }

    .title {
      margin-left: 1em;
    }
  }
`;

const StyledTotalLi = styled.li`
  display: inline-flex;
  align-items: center;
  flex-direction: row;
  padding: 10px;

  h2 {
    flex-grow: 1;
    margin-left: 175px;
  }
`;

const optionsArray = new Array(5).fill(null);

export const CartCartPage = (props) => {
  const [state, dispatch] = useProducts(props.baseUrl);

  const handleCheckout = () => {
    fetch('/api/checkout', {
      method: 'POST',
      body: JSON.stringify(state.cart.items),
      headers: {
        'content-type': 'application/json',
      },
    })
      .then((r) => r.json())
      .then((r) => {
        dispatch.cart(new CheckoutSuccess(r.orderId));
      });
  };

  return (
    <StyledUl>
      {state.products.products.length > 0 &&
        state.cart.items.length > 0 &&
        state.cart.items.map((item: CartItem) => (
          <StyledLi key={item.productId}>
            <a href={`/product/${item.productId}`}>
              <figure>
                <img src={getProduct(state.products, item.productId)?.image} />
              </figure>
            </a>
            <a href={`/product/${item.productId}`} className="title">
              <h2>{getProduct(state.products, item.productId)?.name}</h2>
            </a>
            <p>
              <nx-example-product-price
                value={getProduct(state.products, item.productId)?.price}
              />
            </p>
            <select
              value={item.quantity}
              onChange={(event) => {
                dispatch.cart(
                  new SetQuantity(item.productId, +event.target.value)
                );
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
                value={getItemCost(item, state.products)}
              />
            </p>
          </StyledLi>
        ))}
      <StyledTotalLi>
        <h2>Total</h2>
        <p>
          <nx-example-product-price
            value={getTotalCost(state.cart, state.products)}
          />
        </p>
      </StyledTotalLi>
      <p>
        {state.cart.orderId ? (
          <span>Checkout Success! Order ID: {state.cart.orderId}</span>
        ) : (
          <button onClick={handleCheckout}>Checkout</button>
        )}
      </p>
    </StyledUl>
  );
};

export default CartCartPage;
