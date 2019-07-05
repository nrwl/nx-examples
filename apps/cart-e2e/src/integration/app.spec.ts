import { getPage } from '../support/app.po';

describe('cart', () => {
  before(() => cy.visit('/cart'));

  it('should display welcome message', () => {
    getPage().contains('Welcome to cart!');
  });

  it('should display products', () => {
    getPage()
      .get('li figure')
      .should('have.length', 5);
  });

  it('should have the total price', () => {
    getPage()
      .get('li:last-of-type nx-example-product-price')
      .contains('$500.00');
  });
});
