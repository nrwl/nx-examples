import { getHeader } from '@nx-example/shared/e2e-utils';

import { getPage } from '../support/app.po';

describe('cart', () => {
  before(() => cy.visit('/cart'));

  it('should display the header', () => {
    getHeader().should('exist');
  });

  it('should display products', () => {
    getPage().get('li figure').should('have.length', 5);
  });

  it('should have the total price', () => {
    getPage()
      .get('li:last-of-type nx-example-product-price')
      .contains('$500.00');
  });

  it('should update total price', () => {
    getPage().get('li select').first().select('3');
    getPage()
      .get('li:last-of-type nx-example-product-price')
      .contains('$700.00');
  });
});
