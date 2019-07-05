import './product.element';
import { ProductElement } from './product.element';

describe('ProductElement', () => {
  let product: ProductElement;

  beforeEach(() => {
    product = document.createElement('nx-example-product') as ProductElement;
  });

  it('can be created', () => {
    expect(product).toBeTruthy();
  });

  it('displays the name', () => {
    product.name = 'Test Name';
    product.connectedCallback();
    expect(product.textContent).toContain('Test Name');
  });

  it('displays the price', () => {
    product.price = 1000;
    product.connectedCallback();
    expect(product.textContent).toContain('Price: $10.00');
  });
});
