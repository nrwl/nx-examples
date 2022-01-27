import { render } from '@testing-library/react';

import TestStorybook from './test-storybook';

describe('TestStorybook', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<TestStorybook />);
    expect(baseElement).toBeTruthy();
  });
});
