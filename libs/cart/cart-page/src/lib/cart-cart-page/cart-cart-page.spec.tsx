import { useReducer } from 'react';
jest.doMock('./cart-page-hooks', () => {
  return {
    useProducts: (): ReturnType<typeof useProducts> => {
      const [cartState, dispatchCart] = useReducer(cartReducer, {
        items: products.map((p) => ({ productId: p.id, quantity: 1 })),
      });
      const [productsState, dispatchProducts] = useReducer(productsReducer, {
        products,
      });

      return [
        { cart: cartState, products: productsState },
        { cart: dispatchCart, products: dispatchProducts },
      ];
    },
  };
});

import { cleanup, fireEvent, render } from '@testing-library/react';
import { products } from '@nx-example/shared/product/data';

import { cartReducer } from '@nx-example/shared/cart/state/react';
import { productsReducer } from '@nx-example/shared/product/state/react';

import CartCartPage from './cart-cart-page';

import { useProducts } from './cart-page-hooks';
describe(' CartCartPage', () => {
  afterEach(cleanup);

  it('should render successfully', () => {
    const { baseElement } = render(<CartCartPage />);
    expect(baseElement).toBeTruthy();
  });

  it('should render products', () => {
    const { baseElement } = render(<CartCartPage />);

    expect(baseElement.querySelectorAll('li figure').length).toEqual(5);
  });

  it('should render a total', () => {
    expect(
      render(<CartCartPage />).baseElement.querySelector('li:last-of-type')
        .textContent
    ).toContain('Total');
  });

  it('should update the item cost', async () => {
    const result = render(<CartCartPage />);
    const cartPage = result.baseElement;
    const select: HTMLSelectElement = cartPage.querySelector('li select');
    select.value = '2';
    fireEvent.change(select);
    await Promise.resolve();
    expect(cartPage.querySelector('li p:last-of-type').textContent).toContain(
      '200.00'
    );
  });

  it('should update the total cost', async () => {
    const result = render(<CartCartPage />);
    const cartPage = result.baseElement;
    const select = cartPage.querySelector('li select');
    (select as HTMLSelectElement).value = '2';
    fireEvent.change(select);
    await Promise.resolve();
    expect(
      cartPage.querySelector('li:last-of-type p:last-of-type').textContent
    ).toContain('600.00');
  });
});
