import { render } from '@testing-library/react';

import TestStorybookSuccess from './test-storybook-success';

describe('TestStorybookSuccess', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<TestStorybookSuccess />);
    expect(baseElement).toBeTruthy();
  });
});
