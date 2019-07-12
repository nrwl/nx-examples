import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { cleanup, render } from 'react-testing-library';

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
