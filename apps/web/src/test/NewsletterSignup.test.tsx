import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NewsletterSignup } from '@/components/NewsletterSignup';

// AnimateIn and ParallaxOrb use framer-motion hooks (useInView, useScroll, useSpring)
// that rely on browser APIs jsdom doesn't fully support. Mock the whole module so
// NewsletterSignup tests focus on form behavior, not animation library internals.
vi.mock('@/components/AnimateIn', () => ({
  AnimateIn: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  ParallaxOrb: () => null,
  ParallaxLayer: ({ children }: { children?: React.ReactNode }) => <>{children ?? null}</>,
}));

describe('NewsletterSignup', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders the email input and subscribe button (section variant)', () => {
    render(<NewsletterSignup />);
    expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument();
    expect(screen.getByText('Subscribe')).toBeInTheDocument();
  });

  it('renders the email input and subscribe button (inline variant)', () => {
    render(<NewsletterSignup variant="inline" />);
    expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument();
    expect(screen.getByText('Subscribe')).toBeInTheDocument();
  });

  it('shows success message after successful API response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Subscribed.' }),
    } as Response);

    render(<NewsletterSignup />);
    fireEvent.change(screen.getByPlaceholderText('your@email.com'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.click(screen.getByText('Subscribe'));

    await waitFor(() => {
      expect(
        screen.getByText("You're in. Monthly St. Pete music roundup incoming."),
      ).toBeInTheDocument();
    });
  });

  it('shows error message when API returns non-ok response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Subscription failed. Try again.' }),
    } as Response);

    render(<NewsletterSignup />);
    fireEvent.change(screen.getByPlaceholderText('your@email.com'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.click(screen.getByText('Subscribe'));

    await waitFor(() => {
      expect(screen.getByText('Subscription failed. Try again.')).toBeInTheDocument();
    });
  });

  it('shows fallback error message when API returns no message', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as Response);

    render(<NewsletterSignup />);
    fireEvent.change(screen.getByPlaceholderText('your@email.com'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.click(screen.getByText('Subscribe'));

    await waitFor(() => {
      expect(screen.getByText('Something went wrong. Try again.')).toBeInTheDocument();
    });
  });

  it('shows fallback error message on network failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    render(<NewsletterSignup />);
    fireEvent.change(screen.getByPlaceholderText('your@email.com'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.click(screen.getByText('Subscribe'));

    await waitFor(() => {
      expect(screen.getByText('Something went wrong. Try again.')).toBeInTheDocument();
    });
  });
});
