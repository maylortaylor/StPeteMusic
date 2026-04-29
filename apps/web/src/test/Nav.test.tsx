import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Nav } from '@/components/Nav';

// next/link renders as <a> in the browser; mock it for jsdom tests
vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string; [k: string]: unknown }) => (
    <a href={href} {...(rest as object)}>{children}</a>
  ),
}));

describe('Nav', () => {
  it('renders the StPeteMusic brand link', () => {
    render(<Nav />);
    expect(screen.getByAltText('StPeteMusic')).toBeInTheDocument();
  });

  it('renders all navigation links', () => {
    render(<Nav />);
    expect(screen.getByText('Events')).toBeInTheDocument();
    expect(screen.getByText('Discover')).toBeInTheDocument();
    expect(screen.getByText('YouTube')).toBeInTheDocument();
  });

  it('renders the Get Tickets CTA with correct href', () => {
    render(<Nav />);
    const cta = screen.getByText('Get Tickets');
    expect(cta).toBeInTheDocument();
    expect(cta.closest('a')).toHaveAttribute('href', 'https://final-friday.eventbrite.com/');
  });

  it('brand link points to homepage', () => {
    render(<Nav />);
    const brand = screen.getByAltText('StPeteMusic');
    expect(brand.closest('a')).toHaveAttribute('href', '/');
  });
});
