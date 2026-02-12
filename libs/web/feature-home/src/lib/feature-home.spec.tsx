import { render } from '@testing-library/react';

import ServirFeatureHome from './feature-home';

describe('ServirFeatureHome', () => {
  it('should render successfully', () => {
    const { baseElement } = render(
      <ServirFeatureHome healthStatus="ok" details="All systems operational" />,
    );
    expect(baseElement).toBeTruthy();
  });
});
