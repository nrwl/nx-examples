import './header.element';
import { HeaderElement } from './header.element';

describe('HeaderElement', () => {
  let headerElement: HeaderElement;

  beforeEach(() => {
    headerElement = document.createElement(
      'nx-example-header'
    ) as HeaderElement;
    headerElement.connectedCallback();
  });

  it('can be created', () => {
    expect(headerElement).toBeTruthy();
  });

  it('should display the application title', () => {
    expect(headerElement.textContent).toContain('Nx Store');
  });

  it('should display the given heading', async () => {
    headerElement.title = 'Test Title';

    await Promise.resolve();

    expect(headerElement.textContent).toContain('Test Title');
  });
});
