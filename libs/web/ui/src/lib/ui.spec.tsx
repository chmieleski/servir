import { render } from '@testing-library/react';

import ServirUi from './ui';

describe('ServirUi', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<ServirUi />);
    expect(baseElement).toBeTruthy();
  });
});
