import { JSXify } from '@nx-example/shared/jsxify';

const enum HeaderElementAttribute {
  Heading = 'heading',
  Href = 'href'
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'nx-example-header': JSXify<HeaderElement>;
    }
  }
}

export class HeaderElement extends HTMLElement {
  static observedAttributes = [
    HeaderElementAttribute.Heading,
    HeaderElementAttribute.Href
  ];

  get heading() {
    return this.getAttribute(HeaderElementAttribute.Heading) || 'Nx Store';
  }
  set heading(heading: string) {
    this.setAttribute(HeaderElementAttribute.Heading, heading);
  }

  get href() {
    return this.getAttribute(HeaderElementAttribute.Href) || '/';
  }
  set href(heading: string) {
    this.setAttribute(HeaderElementAttribute.Href, heading);
  }

  private githubLink = document.createElement('a');
  private headingLink = document.createElement('a');
  private headingElement = document.createElement('h2');

  connectedCallback() {
    const leftSide = document.createElement('div');
    this.headingLink.href = this.href;
    this.headingElement.textContent = this.heading;
    this.headingLink.appendChild(this.headingElement);
    leftSide.appendChild(this.headingLink);

    const rightSide = document.createElement('div');
    const icon = document.createElement('span');

    this.githubLink.href = 'https://github.com/nrwl/nx-examples';
    icon.classList.add('icon', 'icon-github');
    this.githubLink.appendChild(icon);

    rightSide.appendChild(this.githubLink);

    this.appendChild(leftSide);
    this.appendChild(rightSide);
  }

  attributeChangedCallback(name: HeaderElementAttribute) {
    switch (name) {
      case HeaderElementAttribute.Heading: {
        this.headingElement.textContent = this.heading;
        break;
      }
      case HeaderElementAttribute.Href: {
        this.headingLink.href = this.href;
        break;
      }
    }
  }
}
customElements.define('nx-example-header', HeaderElement);
