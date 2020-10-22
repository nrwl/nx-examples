import React from 'react';
import { render } from '@testing-library/react';

import Sample from './sample';

describe('Sample', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<Sample />);
    expect(baseElement).toBeTruthy();
  });
});
