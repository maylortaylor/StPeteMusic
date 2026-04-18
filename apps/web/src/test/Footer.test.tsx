import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Footer } from '@/components/Footer';

describe('Footer', () => {
  it('renders the StPeteMusic brand name', () => {
    render(<Footer />);
    expect(screen.getByText('StPeteMusic')).toBeInTheDocument();
  });

  it('renders all link column headings', () => {
    render(<Footer />);
    expect(screen.getByText('Shows')).toBeInTheDocument();
    expect(screen.getByText('Follow')).toBeInTheDocument();
    expect(screen.getByText('More')).toBeInTheDocument();
  });

  it('renders the Final Friday link with correct href', () => {
    render(<Footer />);
    const link = screen.getByText('Final Friday').closest('a');
    expect(link).toHaveAttribute('href', 'https://final-friday.eventbrite.com/');
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
});
