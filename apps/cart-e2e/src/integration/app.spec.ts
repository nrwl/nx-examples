import { getPage } from '../support/app.po';

describe('cart', () => {
  beforeEach(() => cy.visit('/cart'));

  it('should display welcome message', () => {
    getPage().contains('Welcome to cart!');
  });
});
