import './product-price.element';
import { ProductPriceElement } from './product-price.element';

describe('ProductElement', () => {
  let productPrice: ProductPriceElement;

  beforeEach(() => {
    productPrice = document.createElement(
      'nx-example-product-price'
    ) as ProductPriceElement;
  });

  it('can be created', () => {
    expect(productPrice).toBeTruthy();
  });

  it('displays the price', () => {
    productPrice.value = 12345;
    expect(productPrice.textContent).toContain('$123.45');
  });
});
