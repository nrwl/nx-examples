import React from 'react';
import { render } from '@testing-library/react';

import BuildableBar from './buildable-bar';

describe('BuildableBar', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<BuildableBar />);
    expect(baseElement).toBeTruthy();
  });
});
