import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Footer } from '@/components/Footer';

describe('Footer', () => {
  it('renders the StPeteMusic brand name', () => {
    render(<Footer />);
    expect(screen.getByAltText('StPeteMusic')).toBeInTheDocument();
  });

  it('renders all link column headings', () => {
    render(<Footer />);
    expect(screen.getByText('Follow')).toBeInTheDocument();
    expect(screen.getByText('Friends')).toBeInTheDocument();
  });

  it('renders the Suite E Studios link under Friends', () => {
    render(<Footer />);
    const link = screen.getByText('Suite E Studios').closest('a');
    expect(link).toHaveAttribute('href', 'https://www.suiteestudios.com');
  });

  it('renders the Instagram link', () => {
    render(<Footer />);
    const link = screen.getByText('Instagram').closest('a');
    expect(link).toHaveAttribute('href', 'https://www.instagram.com/StPeteMusic');
  });

  it('renders copyright with current year', () => {
    render(<Footer />);
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
  });

  it('renders the St. Pete location text', () => {
    render(<Footer />);
    expect(screen.getByText('St. Petersburg, FL')).toBeInTheDocument();
  });

  it('renders the tagline instead of Warehouse Arts District', () => {
    render(<Footer />);
    expect(screen.getByText('Community Driven Music')).toBeInTheDocument();
  });
});
