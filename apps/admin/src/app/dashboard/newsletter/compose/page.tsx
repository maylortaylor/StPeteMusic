'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from '@/lib/toast';

interface FeaturedBlurb {
  id: string;
  order_position: number;
  status: string;
  newsletter_blurb: string | null;
  artist_name: string | null;
  artist_instagram_handle: string | null;
  artist_genres: string[];
  artist_home_base: string | null;
}

interface EventItem {
  id: string;
  title: string;
  start_time: string;
  end_time: string | null;
  venue: string | null;
  tag: string | null;
  ticket_url: string | null;
  location: string | null;
  performer_count: number;
}

interface BrandGuideline {
  id: string;
  is_active: boolean;
  hashtag_library: string[];
}

interface FeaturedVenue {
  id: string;
  venue_name: string | null;
  venue_instagram_username: string | null;
  venue_website: string | null;
  event_title: string | null;
  event_start_time: string | null;
  event_ticket_url: string | null;
  callout_text: string | null;
  status: string;
}

const ANCHOR_TAGS = ['final-friday', 'final_friday', 'instant-noodles', 'instant_noodles'];

function formatDateET(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function formatTimeET(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function nextMonth(ym: string) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m, 1);
  return d.toISOString().slice(0, 7);
}

function prevMonth(ym: string) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return d.toISOString().slice(0, 7);
}

function monthLabel(ym: string) {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function isApproved(status: string) {
  return ['newsletter_approved', 'blog_generated', 'blog_approved'].includes(status);
}

export default function ComposePage() {
  const [month, setMonth] = useState(currentMonth());
  const [includeNextMonth, setIncludeNextMonth] = useState(false);

  const [blurbs, setBlurbs] = useState<FeaturedBlurb[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [guidelines, setGuidelines] = useState<BrandGuideline | null>(null);
  const [featuredVenue, setFeaturedVenue] = useState<FeaturedVenue | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedBlurbs, setSelectedBlurbs] = useState<Set<string>>(new Set());
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [subject, setSubject] = useState('');
  const [intro, setIntro] = useState('');

  const fetchData = useCallback(async (m: string, withNext: boolean) => {
    setLoading(true);
    try {
      const months = [m, ...(withNext ? [nextMonth(m)] : [])];
      const [blurbsRes, venueRes, ...eventReses] = await Promise.all([
        fetch(`/api/featured/blurbs/admin?month=${m}`),
        fetch(`/api/featured-venues?month=${m}`),
        ...months.map((mo) => fetch(`/api/events?month=${mo}`)),
        fetch('/api/brand-guidelines'),
      ]);

      const guidelinesRes = await fetch('/api/brand-guidelines');
      const [blurbsData, venueData, guidelinesData] = await Promise.all([
        blurbsRes.json(),
        venueRes.json(),
        guidelinesRes.json(),
      ]);

      const allEvents: EventItem[] = [];
      for (const res of eventReses) {
        const d = await res.json();
        allEvents.push(...(d.events ?? []));
      }
      // Deduplicate by id
      const seen = new Set<string>();
      const deduped = allEvents.filter((e) => { if (seen.has(e.id)) return false; seen.add(e.id); return true; });

      setBlurbs(blurbsData.blurbs ?? []);
      setFeaturedVenue(venueData.featured_venue ?? null);
      setEvents(deduped.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()));

      const active = (guidelinesData as BrandGuideline[]).find((g) => g.is_active) ?? null;
      setGuidelines(active);

      // Auto-select: approved blurbs + anchor-tagged events
      const autoBlurbs = new Set<string>((blurbsData.blurbs ?? []).filter((b: FeaturedBlurb) => isApproved(b.status)).map((b: FeaturedBlurb) => b.id));
      const autoEvents = new Set<string>(deduped.filter((e) => e.tag && ANCHOR_TAGS.includes(e.tag.toLowerCase())).map((e) => e.id));
      setSelectedBlurbs(autoBlurbs);
      setSelectedEvents(autoEvents);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(month, includeNextMonth); }, [fetchData, month, includeNextMonth]);

  const toggleBlurb = (id: string) =>
    setSelectedBlurbs((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleEvent = (id: string) =>
    setSelectedEvents((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const chosenBlurbs = blurbs.filter((b) => selectedBlurbs.has(b.id));
  const chosenEvents = events.filter((e) => selectedEvents.has(e.id));
  const hashtags = guidelines?.hashtag_library ?? [];

  const plainText = useMemo(() => {
    const lines: string[] = [];
    if (intro.trim()) { lines.push(intro.trim(), ''); }

    if (chosenBlurbs.length > 0) {
      lines.push('🎵 FEATURED THIS MONTH', '');
      for (const b of chosenBlurbs) {
        lines.push(`${b.artist_name ?? 'Artist'}${b.artist_instagram_handle ? ` (${b.artist_instagram_handle})` : ''}`);
        if (b.newsletter_blurb) lines.push(b.newsletter_blurb);
        lines.push('---', '');
      }
    }

    if (chosenEvents.length > 0) {
      lines.push('📅 UPCOMING SHOWS', '');
      for (const e of chosenEvents) {
        lines.push(`${e.title} — ${formatDateET(e.start_time)}`);
        if (e.start_time) lines.push(`⏰ ${formatTimeET(e.start_time)}`);
        if (e.venue) lines.push(`📍 ${e.venue}`);
        if (e.ticket_url) lines.push(`🎟 ${e.ticket_url}`);
        lines.push('');
      }
    }

    if (featuredVenue?.callout_text) {
      lines.push('📍 VENUE SPOTLIGHT', '');
      lines.push(featuredVenue.venue_name ?? '');
      lines.push(featuredVenue.callout_text);
      if (featuredVenue.venue_instagram_username) lines.push(featuredVenue.venue_instagram_username);
      lines.push('');
    }

    if (hashtags.length > 0) {
      lines.push('---', '', hashtags.join(' '));
    }

    return lines.join('\n');
  }, [intro, chosenBlurbs, chosenEvents, featuredVenue, hashtags]);

  const htmlText = useMemo(() => {
    const parts: string[] = [];
    if (intro.trim()) { parts.push(`<p>${intro.trim().replace(/\n/g, '<br>')}</p>`); }

    if (chosenBlurbs.length > 0) {
      parts.push('<p><strong>🎵 FEATURED THIS MONTH</strong></p>');
      for (const b of chosenBlurbs) {
        parts.push(`<p><strong>${b.artist_name ?? 'Artist'}${b.artist_instagram_handle ? ` (${b.artist_instagram_handle})` : ''}</strong></p>`);
        if (b.newsletter_blurb) parts.push(`<p>${b.newsletter_blurb.replace(/\n/g, '<br>')}</p>`);
        parts.push('<hr>');
      }
    }

    if (chosenEvents.length > 0) {
      parts.push('<p><strong>📅 UPCOMING SHOWS</strong></p>');
      for (const e of chosenEvents) {
        parts.push(`<p><strong>${e.title}</strong> — ${formatDateET(e.start_time)}<br>⏰ ${formatTimeET(e.start_time)}${e.venue ? `<br>📍 ${e.venue}` : ''}${e.ticket_url ? `<br>🎟 <a href="${e.ticket_url}">${e.ticket_url}</a>` : ''}</p>`);
      }
    }

    if (featuredVenue?.callout_text) {
      parts.push('<p><strong>📍 VENUE SPOTLIGHT</strong></p>');
      parts.push(`<p><strong>${featuredVenue.venue_name ?? ''}</strong></p>`);
      parts.push(`<p>${featuredVenue.callout_text.replace(/\n/g, '<br>')}</p>`);
      if (featuredVenue.venue_instagram_username) {
        const handle = featuredVenue.venue_instagram_username.replace(/^@/, '');
        parts.push(`<p><a href="https://www.instagram.com/${handle}">${featuredVenue.venue_instagram_username}</a></p>`);
      }
    }

    if (hashtags.length > 0) {
      parts.push('<hr>', `<p>${hashtags.join(' ')}</p>`);
    }

    return parts.join('\n');
  }, [intro, chosenBlurbs, chosenEvents, featuredVenue, hashtags]);

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch {
      toast.error('Copy failed — try selecting and copying manually');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Newsletter Composer</h1>
        <p className="mt-1 text-muted-foreground">
          Assemble the monthly newsletter, then copy the body into Listmonk.
        </p>
      </div>

      {/* Setup */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <h2 className="text-base font-semibold text-foreground">1. Setup</h2>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setMonth(prevMonth(month))}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
          >
            ←
          </button>
          <span className="text-sm font-medium text-foreground">{monthLabel(month)}</span>
          <button
            onClick={() => setMonth(nextMonth(month))}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
          >
            →
          </button>
          <label className="ml-2 flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={includeNextMonth}
              onChange={(e) => setIncludeNextMonth(e.target.checked)}
              className="rounded"
            />
            Include {monthLabel(nextMonth(month))} events
          </label>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Subject line
          </label>
          <div className="flex gap-2">
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={`🎶 ${monthLabel(month)} Spotlight`}
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={() => copy(subject || `🎶 ${monthLabel(month)} Spotlight`, 'Subject line')}
              className="rounded-md border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted"
            >
              Copy
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Intro / opening paragraph (optional)
          </label>
          <textarea
            value={intro}
            onChange={(e) => setIntro(e.target.value)}
            rows={3}
            placeholder="Hey St. Pete! Here's what's happening this month…"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary resize-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="rounded-lg border border-border bg-card px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">Loading content…</p>
        </div>
      ) : (
        <>
          {/* Content selector */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Featured artists */}
            <div className="rounded-lg border border-border bg-card p-5 space-y-3">
              <h2 className="text-base font-semibold text-foreground">
                2a. Featured Artists
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  ({blurbs.length} this month)
                </span>
              </h2>
              {blurbs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No featured artists for {monthLabel(month)}.</p>
              ) : (
                <ul className="space-y-3">
                  {blurbs.map((b) => {
                    const approved = isApproved(b.status);
                    return (
                      <li key={b.id} className={`flex gap-3 ${!approved ? 'opacity-50' : ''}`}>
                        <input
                          type="checkbox"
                          checked={selectedBlurbs.has(b.id)}
                          disabled={!approved}
                          onChange={() => toggleBlurb(b.id)}
                          className="mt-0.5 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {b.artist_name}
                            {b.artist_instagram_handle && (
                              <span className="ml-1 text-muted-foreground font-normal">
                                {b.artist_instagram_handle}
                              </span>
                            )}
                            {!approved && (
                              <span className="ml-2 rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                {b.status.replace(/_/g, ' ')}
                              </span>
                            )}
                          </p>
                          {b.newsletter_blurb && (
                            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                              {b.newsletter_blurb}
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Events */}
            <div className="rounded-lg border border-border bg-card p-5 space-y-3">
              <h2 className="text-base font-semibold text-foreground">
                2b. Events
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  ({events.length} found)
                </span>
              </h2>
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground">No events found for the selected months.</p>
              ) : (
                <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {events.map((e) => (
                    <li key={e.id} className="flex gap-3">
                      <input
                        type="checkbox"
                        checked={selectedEvents.has(e.id)}
                        onChange={() => toggleEvent(e.id)}
                        className="mt-0.5 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground leading-snug">{e.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateET(e.start_time)}
                          {e.tag && (
                            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs">
                              {e.tag}
                            </span>
                          )}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Venue Spotlight */}
          <div className="rounded-lg border border-border bg-card p-5 space-y-3">
            <h2 className="text-base font-semibold text-foreground">
              2c. Venue Spotlight
              {featuredVenue && (
                <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                  featuredVenue.status === 'approved'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}>
                  {featuredVenue.status}
                </span>
              )}
            </h2>
            {featuredVenue ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">{featuredVenue.venue_name}</p>
                {featuredVenue.venue_instagram_username && (
                  <p className="text-xs text-muted-foreground">{featuredVenue.venue_instagram_username}</p>
                )}
                {featuredVenue.event_title && (
                  <p className="text-xs text-muted-foreground">
                    Event: {featuredVenue.event_title}
                    {featuredVenue.event_start_time && ` — ${formatDateET(featuredVenue.event_start_time)}`}
                  </p>
                )}
                {featuredVenue.callout_text ? (
                  <p className="text-xs text-foreground whitespace-pre-wrap border-l-2 border-primary pl-3">
                    {featuredVenue.callout_text}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No callout text yet — edit in Featured dashboard.</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No venue spotlight set for {monthLabel(month)}.{' '}
                <a href="/dashboard/featured" className="text-primary hover:underline">Add one →</a>
              </p>
            )}
          </div>

          {/* Preview */}
          <div className="rounded-lg border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">3. Preview &amp; Copy</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => copy(plainText, 'Plain text')}
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  Copy plain text
                </button>
                <button
                  onClick={() => copy(htmlText, 'HTML')}
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  Copy HTML
                </button>
              </div>
            </div>
            <pre className="max-h-96 overflow-y-auto rounded-md bg-muted p-4 text-xs text-foreground whitespace-pre-wrap font-mono leading-relaxed">
              {plainText || 'Select content above to see a preview here.'}
            </pre>
          </div>
        </>
      )}
    </div>
  );
}
