import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PlatformIcon } from '../components/platform-icon';

describe('PlatformIcon (web)', () => {
  it('renders without crashing for known platforms', () => {
    const knownPlatforms = ['instagram', 'facebook', 'youtube', 'twitter'];
    for (const platform of knownPlatforms) {
      const { unmount } = render(<PlatformIcon platform={platform} />);
      unmount();
    }
  });

  it('renders for unknown platforms without throwing', () => {
    render(<PlatformIcon platform='bandcamp' />);
    render(<PlatformIcon platform='threads' />);
    render(<PlatformIcon platform='custom' />);
  });

  it('shows external link indicator by default', () => {
    const { container } = render(<PlatformIcon platform='instagram' />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBe(2);
  });

  it('hides external indicator when showExternalIndicator=false', () => {
    const { container } = render(
      <PlatformIcon platform='facebook' showExternalIndicator={false} />,
    );
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBe(1);
  });
});
