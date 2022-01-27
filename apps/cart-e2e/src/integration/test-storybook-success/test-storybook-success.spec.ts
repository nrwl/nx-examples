describe('cart: TestStorybookSuccess component', () => {
  beforeEach(() => cy.visit('/iframe.html?id=teststorybooksuccess--primary'));
    
    it('should render the component', () => {
      cy.get('h1').should('contain', 'Welcome to TestStorybookSuccess!');
    });
});
