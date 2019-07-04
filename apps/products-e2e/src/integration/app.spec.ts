import { getPage } from '../support/app.po';

describe('products', () => {
  beforeEach(() => cy.visit('/'));

  it('should display welcome message', () => {
    getPage().contains('Welcome to products!');
  });
});
