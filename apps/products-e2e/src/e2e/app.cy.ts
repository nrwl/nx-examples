import { getHeader } from '@nx-example/shared/e2e-utils';

import { getPage } from '../support/app.po';

describe('products', () => {
  before(() => cy.visit('/'));

  it('should display the header', () => {
    getHeader().should('exist');
  });

  it('should display products', () => {
    getPage().get('li figure').should('have.length', 5);
  });

  it('should navigate to product details', () => {
    getPage().get('li a').first().click();

    cy.url().should('include', '/product/1');
  });
});
