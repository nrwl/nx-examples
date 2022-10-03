import { JSXify } from '@nx-example/shared/jsxify';

enum ProductPriceElementAttribute {
  Value = 'value',
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'nx-example-product-price': JSXify<ProductPriceElement>;
    }
  }
}

export class ProductPriceElement extends HTMLElement {
  static observedAttributes = [ProductPriceElementAttribute.Value];

  private get displayPrice(): string {
    return '$' + (this.value / 100).toFixed(2);
  }

  get value(): number {
    return +this.getAttribute(ProductPriceElementAttribute.Value);
  }
  set value(price: number) {
    this.setAttribute(ProductPriceElementAttribute.Value, price.toString());
  }

  attributeChangedCallback(name: ProductPriceElementAttribute) {
    switch (name) {
      case ProductPriceElementAttribute.Value: {
        this.textContent = this.displayPrice;
        break;
      }
    }
  }
}
customElements.define('nx-example-product-price', ProductPriceElement);
