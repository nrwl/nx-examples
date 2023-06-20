import { MemoryRouter } from 'react-router-dom';

import { cleanup, render } from '@testing-library/react';

jest.doMock('@nx-example/cart/cart-page');
// eslint-disable-next-line
import App from './app';

describe('App', () => {
  afterEach(cleanup);

  it('should render successfully', () => {
    const { baseElement } = render(
      <MemoryRouter initialEntries={['/cart']}>
        <App />
      </MemoryRouter>
    );
    expect(baseElement).toBeTruthy();
  });

  it('should display the header', () => {
    expect(
      render(
        <MemoryRouter initialEntries={['/cart']}>
          <App />
        </MemoryRouter>
      ).baseElement.querySelector('nx-example-header')
    ).toBeTruthy();
  });
});
