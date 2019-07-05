import { getPage } from '../support/app.po';
import { getProducts } from '@nx-example/shared/product/e2e-utils';

describe('cart', () => {
  beforeEach(() => cy.visit('/cart'));

  it('should display welcome message', () => {
    getPage().contains('Welcome to cart!');
  });

  it('should display products', () => {
    getProducts().should('have.length', 2);
  });
});
