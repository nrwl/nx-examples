import { getPage } from '../support/app.po';
import { getProducts } from '@nx-example/shared/product/e2e-utils';

describe('products', () => {
  beforeEach(() => cy.visit('/'));

  it('should display welcome message', () => {
    getPage().contains('Welcome to products!');
  });

  it('should display products', () => {
    getProducts().should('have.length', 2);
  });
});
