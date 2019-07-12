import { JSXify } from '@nx-example/shared/jsxify';

enum HeaderElementAttribute {
  Heading = 'heading'
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'nx-example-header': JSXify<HeaderElement>;
    }
  }
}

export class HeaderElement extends HTMLElement {
  static observedAttributes = [HeaderElementAttribute.Heading];

  private headingElement = document.createElement('h2');

  get heading(): string {
    return this.getAttribute(HeaderElementAttribute.Heading) || 'Nx Store';
  }
  set heading(heading: string) {
    this.setAttribute(HeaderElementAttribute.Heading, heading);
  }

  connectedCallback() {
    this.headingElement.textContent = this.heading;
    this.appendChild(this.headingElement);
  }

  attributeChangedCallback(name: string) {
    switch (name) {
      case HeaderElementAttribute.Heading: {
        this.headingElement.textContent = this.heading;
      }
    }
  }
}
customElements.define('nx-example-header', HeaderElement);
