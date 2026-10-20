describe('readiness-webpack', () => {
  beforeEach(() => cy.visit('/'));

  it('renders messages from both APIs', () => {
    cy.get('h1').should('have.text', 'readiness-webpack');
    cy.get('[data-testid="api-node"]').should('have.text', 'Hello from node');
    cy.get('[data-testid="api-tsx"]').should('have.text', 'Hello from tsx');
  });
});
