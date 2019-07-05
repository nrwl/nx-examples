import { JSXify } from '@nx-example/shared/jsxify';

enum ProductElementAttribute {
  Name = 'name',
  Price = 'price'
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'nx-example-product': JSXify<ProductElement>;
    }
  }
}

export class ProductElement extends HTMLElement {
  static observedAttributes = [
    ProductElementAttribute.Name,
    ProductElementAttribute.Price
  ];

  get name(): string {
    return this.getAttribute(ProductElementAttribute.Name);
  }
  set name(name: string) {
    this.setAttribute(ProductElementAttribute.Name, name);
  }

  private get displayPrice(): string {
    return '$' + (this.price / 100).toFixed(2);
  }

  get price(): number {
    return +this.getAttribute(ProductElementAttribute.Price);
  }
  set price(price: number) {
    this.setAttribute(ProductElementAttribute.Price, price.toString());
  }

  private nameElement: HTMLHeadingElement = document.createElement('h2');

  private priceElement: HTMLSpanElement = document.createElement('span');

  connectedCallback() {
    const p = document.createElement('p');
    p.appendChild(document.createTextNode('Price: '));
    p.appendChild(this.priceElement);
    this.appendChild(this.nameElement);
    this.appendChild(p);
  }

  attributeChangedCallback(name: ProductElementAttribute) {
    switch (name) {
      case ProductElementAttribute.Name: {
        this.nameElement.textContent = this.name;
        break;
      }
      case ProductElementAttribute.Price: {
        this.priceElement.textContent = this.displayPrice;
        break;
      }
    }
  }
}
customElements.define('nx-example-product', ProductElement);
