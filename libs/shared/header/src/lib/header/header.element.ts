import { JSXify } from '@nx-example/shared/jsxify';

enum HeaderElementAttribute {
  Title = 'title',
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'nx-example-header': JSXify<HeaderElement>;
    }
  }
}

export class HeaderElement extends HTMLElement {
  static observedAttributes = [HeaderElementAttribute.Title];

  get title() {
    return this.getAttribute(HeaderElementAttribute.Title);
  }
  set title(title: string) {
    this.setAttribute(HeaderElementAttribute.Title, title);
  }

  private titleElement = document.createElement('h2');

  connectedCallback() {
    this.appendChild(this.createLeftSide());
    this.appendChild(this.createRightSide());
  }

  attributeChangedCallback(name: HeaderElementAttribute) {
    switch (name) {
      case HeaderElementAttribute.Title: {
        this.titleElement.textContent = this.title;
        break;
      }
    }
  }

  private createLeftSide() {
    const leftSide = document.createElement('div');
    const homeLink = document.createElement('a');
    const homeLinkText = document.createElement('h2');
    homeLink.href = '/';
    homeLinkText.textContent = 'Nx Store';
    homeLink.appendChild(homeLinkText);
    leftSide.appendChild(homeLink);

    this.titleElement.textContent = this.title;
    leftSide.appendChild(this.titleElement);
    return leftSide;
  }

  private createRightSide() {
    const githubLink = document.createElement('a');
    const icon = document.createElement('span');

    githubLink.href = 'https://github.com/nrwl/nx-examples';
    icon.classList.add('icon', 'icon-github');
    githubLink.appendChild(icon);

    const rightSide = document.createElement('div');
    rightSide.appendChild(githubLink);
    return rightSide;
  }
}
customElements.define('nx-example-header', HeaderElement);
