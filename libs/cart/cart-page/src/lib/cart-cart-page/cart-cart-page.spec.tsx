import React from 'react';
import { render, cleanup } from 'react-testing-library';

import CartCartPage from './cart-cart-page';

describe(' CartCartPage', () => {
  afterEach(cleanup);

  it('should render successfully', () => {
    const { baseElement } = render(<CartCartPage />);
    expect(baseElement).toBeTruthy();
  });

  it('should render products', () => {
    expect(
      render(<CartCartPage />).baseElement.querySelectorAll(
        'nx-example-product'
      ).length
    ).toEqual(2);
  });
});
