import { cleanup, fireEvent, render } from '@testing-library/react';

import CartCartPage from './cart-cart-page';

describe(' CartCartPage', () => {
  afterEach(cleanup);

  it('should render successfully', () => {
    const { baseElement } = render(<CartCartPage />);
    expect(baseElement).toBeTruthy();
  });

  it('should render products', () => {
    expect(
      render(<CartCartPage />).baseElement.querySelectorAll('li figure').length
    ).toEqual(5);
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
