import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PlatformIcon } from './platform-icon';

describe('PlatformIcon', () => {
  it('renders without crashing for known platforms', () => {
    const knownPlatforms = [
      'instagram', 'facebook', 'youtube', 'twitter',
    ];
    for (const platform of knownPlatforms) {
      const { unmount } = render(<PlatformIcon platform={platform} />);
      unmount();
    }
  });

  it('renders for unknown/custom platforms without throwing', () => {
    render(<PlatformIcon platform='bandcamp' />);
    render(<PlatformIcon platform='spotify' />);
    render(<PlatformIcon platform='custom' />);
    render(<PlatformIcon platform='threads' />);
  });

  it('shows external link indicator by default', () => {
    const { container } = render(<PlatformIcon platform='instagram' />);
    // Two SVG icons: platform icon + ExternalLink indicator
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBe(2);
  });

  it('hides external link indicator when showExternalIndicator=false', () => {
    const { container } = render(
      <PlatformIcon platform='instagram' showExternalIndicator={false} />,
    );
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBe(1);
  });

  it('applies custom className', () => {
    const { container } = render(
      <PlatformIcon platform='facebook' className='custom-class' />,
    );
    expect(container.querySelector('.custom-class')).toBeTruthy();
  });
});
