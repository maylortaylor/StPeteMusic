import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ExternalEventCard } from '../components/ExternalEventCard';
import type { FeaturedTicketEvent } from '../lib/queries/tickets-extras';

const baseEvent: FeaturedTicketEvent = {
  id: '1',
  title: 'Test Show',
  start_time: '2026-08-01T20:00:00Z',
  end_time: null,
  location: null,
  image_url: null,
  ticket_url: null,
  source: 'facebook',
  extra_data: '{}',
};

describe('ExternalEventCard', () => {
  it('links to ticket_url and shows "Get Tickets" when present', () => {
    render(<ExternalEventCard event={{ ...baseEvent, ticket_url: 'https://tickets.example.com' }} />);
    const links = screen.getAllByRole('link', { name: /Get Tickets|View Test Show/ });
    expect(links.some((a) => a.getAttribute('href') === 'https://tickets.example.com')).toBe(true);
    expect(screen.getByText(/Get Tickets/)).toBeInTheDocument();
  });

  it('falls back to fb_event_url from extra_data and shows "View Event"', () => {
    render(
      <ExternalEventCard
        event={{ ...baseEvent, extra_data: JSON.stringify({ fb_event_url: 'https://facebook.com/events/123' }) }}
      />,
    );
    expect(screen.getByText(/View Event/)).toBeInTheDocument();
  });

  it('renders with no link when neither ticket_url nor fb_event_url is present', () => {
    render(<ExternalEventCard event={baseEvent} />);
    expect(screen.queryByText(/Get Tickets|View Event/)).not.toBeInTheDocument();
  });

  it('tolerates malformed extra_data JSON', () => {
    render(<ExternalEventCard event={{ ...baseEvent, extra_data: 'not json' }} />);
    expect(screen.getByText('Test Show')).toBeInTheDocument();
  });

  it('shows location when present', () => {
    render(<ExternalEventCard event={{ ...baseEvent, location: 'Suite E Studios' }} />);
    expect(screen.getByText('Suite E Studios')).toBeInTheDocument();
  });
});
