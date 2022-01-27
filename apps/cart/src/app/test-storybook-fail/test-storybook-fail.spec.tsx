import { render } from '@testing-library/react';

import TestStorybookFail from './test-storybook-fail';

describe('TestStorybookFail', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<TestStorybookFail />);
    expect(baseElement).toBeTruthy();
  });
});
