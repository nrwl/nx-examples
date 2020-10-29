import React from 'react';
import { render } from '@testing-library/react';

import BuildableFoo from './buildable-foo';

describe('BuildableFoo', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<BuildableFoo />);
    expect(baseElement).toBeTruthy();
  });
});
