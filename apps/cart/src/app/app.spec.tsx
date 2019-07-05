import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, cleanup } from 'react-testing-library';

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

  it('should display a title', () => {
    expect(render(
      <MemoryRouter initialEntries={['/cart']}>
        <App />
      </MemoryRouter>
    ).baseElement.textContent).toContain('Welcome to cart!');
  });
});
