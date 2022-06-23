import React from 'react';
import { render } from '@testing-library/react-native';

import ExpoBtn from './expo-btn';

describe('ExpoBtn', () => {
  it('should render successfully', () => {
    const { container } = render(< ExpoBtn />);
    expect(container).toBeTruthy();
  });
});
