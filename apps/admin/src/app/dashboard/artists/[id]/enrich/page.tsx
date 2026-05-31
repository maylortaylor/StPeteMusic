'use client';

import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  RefreshCw,
  Sparkles,
  Star,
  Trash2,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ArtistLink } from '@stpetemusic/types';
import { PlatformIcon } from '@/components/platform-icon';
import { canSetFeatured } from '@/lib/artist-links';

const KNOWN_PLATFORMS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'bandcamp', label: 'Bandcamp' },
  { value: 'spotify', label: 'Spotify' },
  { value: 'soundcloud', label: 'SoundCloud' },
  { value: 'linktree', label: 'Linktree' },
  { value: 'website', label: 'Website' },
  { value: 'bandsintown', label: 'Bandsintown' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'twitter', label: 'Twitter / X' },
  { value: 'threads', label: 'Threads' },
  { value: 'custom', label: 'Custom' },
];

interface CoverImageCandidate {
  url: string;
  source: string;
  platform: string;
}

interface ArtistData {
  id: string;
  name: string;
  slug: string;
  enrichment_status?: string | null;
  extra_data?: Record<string, unknown>;
}

interface EnrichmentData {
  scrapedRaw?: Record<string, string | null>;
  synthesizedNotes?: string | null;
  coverImageCandidates?: CoverImageCandidate[];
}

const inputClass =
  'mt-2 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring';

const labelClass = 'block text-sm font-medium text-foreground';

export default function ArtistEnrichPage() {
  const { id } = useParams<{ id: string }>();

  const [artist, setArtist] = useState<ArtistData | null>(null);
  const [links, setLinks] = useState<ArtistLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add-link form state
  const [addPlatform, setAddPlatform] = useState('website');
  const [addUrl, setAddUrl] = useState('');
  const [addLabel, setAddLabel] = useState('');
  const [addSubmitting, setAddSubmitting] = useState(false);

  // Enrichment state
  const [enriching, setEnriching] = useState(false);
  const [enrichError, setEnrichError] = useState<string | null>(null);

  // Review state
  const [selectedCoverUrl, setSelectedCoverUrl] = useState<string>('');
  const [editedNotes, setEditedNotes] = useState('');
  const [approving, setApproving] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);
  const [expandedPlatforms, setExpandedPlatforms] = useState<Set<string>>(new Set());

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchArtist = useCallback(async () => {
    const res = await fetch(`/api/artists/${id}`);
    if (!res.ok) throw new Error('Failed to fetch artist');
    return res.json() as Promise<ArtistData>;
  }, [id]);

  const fetchLinks = useCallback(async () => {
    const res = await fetch(`/api/artists/${id}/links`);
    if (!res.ok) throw new Error('Failed to fetch links');
    const data = await res.json() as { links: ArtistLink[] };
    return data.links;
  }, [id]);

  useEffect(() => {
    Promise.all([fetchArtist(), fetchLinks()])
      .then(([a, l]) => {
        setArtist(a);
        setLinks(l);
        if (a.enrichment_status === 'enrichment_ready') {
          const enrichmentData = (a.extra_data?.enrichment ?? {}) as EnrichmentData;
          setEditedNotes(enrichmentData.synthesizedNotes ?? '');
        }
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [fetchArtist, fetchLinks]);

  // Poll while pending
  useEffect(() => {
    if (artist?.enrichment_status !== 'pending') {
      if (pollingRef.current) clearInterval(pollingRef.current);
      return;
    }
    pollingRef.current = setInterval(async () => {
      try {
        const a = await fetchArtist();
        setArtist(a);
        if (a.enrichment_status !== 'pending') {
          if (pollingRef.current) clearInterval(pollingRef.current);
          if (a.enrichment_status === 'enrichment_ready') {
            const enrichmentData = (a.extra_data?.enrichment ?? {}) as EnrichmentData;
            setEditedNotes(enrichmentData.synthesizedNotes ?? '');
          }
        }
      } catch {
        // Silent polling failures — user can use manual refresh
      }
    }, 5000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [artist?.enrichment_status, fetchArtist]);

  async function handleAddLink(e: React.FormEvent) {
    e.preventDefault();
    if (!addUrl || !addLabel) return;
    setAddSubmitting(true);
    try {
      const res = await fetch(`/api/artists/${id}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: addPlatform, url: addUrl, label: addLabel }),
      });
      if (!res.ok) {
        const body = await res.json() as { error?: string };
        throw new Error(body.error ?? 'Failed to add link');
      }
      const newLink = await res.json() as ArtistLink;
      setLinks((prev) => [...prev, newLink]);
      setAddUrl('');
      setAddLabel('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to add link');
    } finally {
      setAddSubmitting(false);
    }
  }

  async function handleDeleteLink(linkId: string) {
    const res = await fetch(`/api/artists/${id}/links/${linkId}`, { method: 'DELETE' });
    if (res.ok) setLinks((prev) => prev.filter((l) => l.id !== linkId));
  }

  async function handleToggleFeatured(link: ArtistLink) {
    if (!link.is_featured && !canSetFeatured(links)) {
      alert('Maximum 3 featured links. Remove a starred link first.');
      return;
    }
    const res = await fetch(`/api/artists/${id}/links/${link.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_featured: !link.is_featured }),
    });
    if (res.ok) {
      const updated = await res.json() as ArtistLink;
      setLinks((prev) => prev.map((l) => (l.id === link.id ? updated : l)));
    }
  }

  async function handleMoveOrder(link: ArtistLink, direction: 'up' | 'down') {
    const idx = links.findIndex((l) => l.id === link.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= links.length) return;

    const swapLink = links[swapIdx];
    const [resA, resB] = await Promise.all([
      fetch(`/api/artists/${id}/links/${link.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_order: swapLink.display_order }),
      }),
      fetch(`/api/artists/${id}/links/${swapLink.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_order: link.display_order }),
      }),
    ]);
    if (resA.ok && resB.ok) {
      const newLinks = [...links];
      newLinks[idx] = { ...link, display_order: swapLink.display_order };
      newLinks[swapIdx] = { ...swapLink, display_order: link.display_order };
      newLinks.sort((a, b) => a.display_order - b.display_order);
      setLinks(newLinks);
    }
  }

  async function handleStartEnrichment() {
    setEnrichError(null);
    setEnriching(true);
    try {
      const res = await fetch(`/api/artists/${id}/enrich`, { method: 'POST' });
      if (!res.ok) {
        const body = await res.json() as { error?: string };
        throw new Error(body.error ?? 'Failed to trigger enrichment');
      }
      setArtist((prev) => prev ? { ...prev, enrichment_status: 'pending' } : prev);
    } catch (e: unknown) {
      setEnrichError(e instanceof Error ? e.message : 'Failed to start enrichment');
    } finally {
      setEnriching(false);
    }
  }

  async function handleApprove() {
    setApproveError(null);
    setApproving(true);
    try {
      const enrichmentData = (artist?.extra_data?.enrichment ?? {}) as EnrichmentData;
      const res = await fetch(`/api/artists/${id}/enrich/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hero_photo_url: selectedCoverUrl || undefined,
          synthesizedNotes: editedNotes,
        }),
      });
      if (!res.ok) {
        const body = await res.json() as { error?: string };
        throw new Error(body.error ?? 'Failed to approve enrichment');
      }
      setArtist((prev) =>
        prev ? { ...prev, enrichment_status: 'enrichment_approved', extra_data: { ...prev.extra_data, enrichment: undefined } } : prev,
      );
    } catch (e: unknown) {
      setApproveError(e instanceof Error ? e.message : 'Approval failed');
    } finally {
      setApproving(false);
    }
  }

  async function handleRetry() {
    setArtist((prev) => prev ? { ...prev, enrichment_status: null } : prev);
    await handleStartEnrichment();
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center py-20'>
        <Loader2 className='animate-spin text-muted-foreground' size={32} />
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className='rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700'>
        {error ?? 'Artist not found'}
      </div>
    );
  }

  const enrichmentData = (artist.extra_data?.enrichment ?? {}) as EnrichmentData;
  const status = artist.enrichment_status;

  return (
    <div className='max-w-4xl'>
      {/* Header */}
      <div className='mb-8'>
        <Link
          href={`/dashboard/artists/${id}`}
          className='mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground'
        >
          <ArrowLeft size={14} />
          Edit Artist
        </Link>
        <h1 className='text-3xl font-bold text-foreground'>{artist.name}</h1>
        <p className='mt-1 text-muted-foreground'>Enrich artist profile with web-scraped data</p>
      </div>

      {/* STATE A — Links management (null or approved) */}
      {(status == null || status === 'enrichment_approved') && (
        <div className='space-y-8'>
          {status === 'enrichment_approved' && (
            <div className='rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700'>
              ✓ Enrichment was previously approved. You can update links and run enrichment again.
            </div>
          )}

          {/* Links list */}
          <section className='space-y-4 rounded-xl border border-border bg-card p-6'>
            <h2 className='text-lg font-semibold text-foreground'>Links</h2>

            {links.length === 0 && (
              <p className='text-sm text-muted-foreground'>No links yet. Add one below.</p>
            )}

            <ul className='space-y-2'>
              {links.map((link, idx) => (
                <li
                  key={link.id}
                  className='flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2'
                >
                  <PlatformIcon platform={link.platform} size={16} showExternalIndicator={false} />
                  <div className='min-w-0 flex-1'>
                    <span className='text-sm font-medium text-foreground'>{link.label}</span>
                    <a
                      href={link.url}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='ml-2 inline-flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground'
                    >
                      {link.url.length > 50 ? link.url.slice(0, 50) + '…' : link.url}
                      <ExternalLink size={10} />
                    </a>
                  </div>

                  {/* Featured star */}
                  <button
                    type='button'
                    onClick={() => handleToggleFeatured(link)}
                    title={
                      link.is_featured
                        ? 'Remove from featured'
                        : canSetFeatured(links)
                          ? 'Feature this link (max 3)'
                          : 'Remove a starred link first (max 3)'
                    }
                    className='text-amber-400 hover:text-amber-500'
                  >
                    <Star
                      size={16}
                      fill={link.is_featured ? 'currentColor' : 'none'}
                    />
                  </button>

                  {/* Order */}
                  <div className='flex flex-col gap-0.5'>
                    <button
                      type='button'
                      disabled={idx === 0}
                      onClick={() => handleMoveOrder(link, 'up')}
                      className='text-muted-foreground hover:text-foreground disabled:opacity-30'
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      type='button'
                      disabled={idx === links.length - 1}
                      onClick={() => handleMoveOrder(link, 'down')}
                      className='text-muted-foreground hover:text-foreground disabled:opacity-30'
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>

                  <button
                    type='button'
                    onClick={() => handleDeleteLink(link.id)}
                    className='text-muted-foreground hover:text-red-500'
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>

            {/* Add link form */}
            <form onSubmit={handleAddLink} className='flex flex-wrap gap-3 border-t border-border pt-4'>
              <select
                value={addPlatform}
                onChange={(e) => {
                  setAddPlatform(e.target.value);
                  const p = KNOWN_PLATFORMS.find((p) => p.value === e.target.value);
                  if (p) setAddLabel(p.label);
                }}
                className='rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring'
              >
                {KNOWN_PLATFORMS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              <input
                type='url'
                placeholder='https://...'
                value={addUrl}
                onChange={(e) => setAddUrl(e.target.value)}
                required
                className='flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring'
              />
              <input
                type='text'
                placeholder='Label'
                value={addLabel}
                onChange={(e) => setAddLabel(e.target.value)}
                required
                className='w-36 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring'
              />
              <button
                type='submit'
                disabled={addSubmitting}
                className='inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50'
              >
                Add
              </button>
            </form>
          </section>

          {/* Start enrichment */}
          {enrichError && (
            <p className='text-sm text-red-500' role='alert'>{enrichError}</p>
          )}
          {links.length > 0 && (
            <button
              type='button'
              onClick={handleStartEnrichment}
              disabled={enriching}
              className='inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50'
            >
              {enriching ? (
                <Loader2 size={16} className='animate-spin' />
              ) : (
                <Sparkles size={16} />
              )}
              Start Enrichment
            </button>
          )}
        </div>
      )}

      {/* STATE B — Pending */}
      {status === 'pending' && (
        <div className='space-y-4 rounded-xl border border-border bg-card p-8 text-center'>
          <Loader2 size={32} className='mx-auto animate-spin text-muted-foreground' />
          <p className='text-foreground'>Enrichment in progress…</p>
          <p className='text-sm text-muted-foreground'>
            The page will update automatically when ready.
          </p>
          <div className='flex justify-center gap-4'>
            <button
              type='button'
              onClick={async () => {
                const a = await fetchArtist();
                setArtist(a);
              }}
              className='inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground'
            >
              <RefreshCw size={14} />
              Check Status
            </button>
            <button
              type='button'
              onClick={handleRetry}
              disabled={enriching}
              className='inline-flex items-center gap-2 text-sm text-red-500 hover:text-red-700 disabled:opacity-50'
            >
              {enriching ? <Loader2 size={14} className='animate-spin' /> : <RefreshCw size={14} />}
              Retry
            </button>
          </div>
        </div>
      )}

      {/* STATE C — Review */}
      {status === 'enrichment_ready' && (
        <div className='space-y-6'>
          {/* Cover photo picker */}
          {enrichmentData.coverImageCandidates && enrichmentData.coverImageCandidates.length > 0 && (
            <section className='rounded-xl border border-border bg-card p-6'>
              <h2 className='mb-4 text-lg font-semibold text-foreground'>
                Choose Cover Photo
              </h2>
              <div className='grid grid-cols-2 gap-4 sm:grid-cols-3'>
                {enrichmentData.coverImageCandidates.map((img) => (
                  <button
                    key={img.url}
                    type='button'
                    onClick={() => setSelectedCoverUrl(img.url)}
                    className={`group relative overflow-hidden rounded-lg border-2 transition-colors ${
                      selectedCoverUrl === img.url
                        ? 'border-primary'
                        : 'border-border hover:border-foreground/40'
                    }`}
                    style={{ aspectRatio: '16/9' }}
                  >
                    <Image
                      src={img.url}
                      alt={img.source}
                      fill
                      className='object-cover'
                      unoptimized
                    />
                    <span className='absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white'>
                      {img.source}
                    </span>
                    {selectedCoverUrl === img.url && (
                      <div className='absolute inset-0 bg-primary/20' />
                    )}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Raw scraped data */}
          {enrichmentData.scrapedRaw && Object.keys(enrichmentData.scrapedRaw).length > 0 && (
            <section className='rounded-xl border border-border bg-card p-6'>
              <h2 className='mb-4 text-lg font-semibold text-foreground'>Raw Scraped Data</h2>
              <div className='space-y-2'>
                {Object.entries(enrichmentData.scrapedRaw).map(([platform, text]) => (
                  <details
                    key={platform}
                    open={expandedPlatforms.has(platform)}
                    onToggle={(e) => {
                      const open = (e.target as HTMLDetailsElement).open;
                      setExpandedPlatforms((prev) => {
                        const next = new Set(prev);
                        if (open) next.add(platform);
                        else next.delete(platform);
                        return next;
                      });
                    }}
                  >
                    <summary className='cursor-pointer select-none rounded px-2 py-1 text-sm font-medium capitalize text-foreground hover:bg-muted'>
                      {platform} {text ? `(${text.length} chars)` : '(no data)'}
                    </summary>
                    <pre className='mt-2 max-h-40 overflow-y-auto rounded bg-muted px-3 py-2 text-xs text-muted-foreground'>
                      {text ?? 'No data scraped'}
                    </pre>
                  </details>
                ))}
              </div>
            </section>
          )}

          {/* Synthesized notes */}
          <section className='rounded-xl border border-border bg-card p-6'>
            <h2 className='mb-4 text-lg font-semibold text-foreground'>Synthesized Notes</h2>
            <textarea
              value={editedNotes}
              onChange={(e) => setEditedNotes(e.target.value)}
              rows={16}
              className={inputClass}
              placeholder='No notes synthesized. You can enter them manually here.'
            />
          </section>

          {approveError && (
            <p className='text-sm text-red-500' role='alert'>{approveError}</p>
          )}

          <div className='flex gap-3'>
            <button
              type='button'
              onClick={handleApprove}
              disabled={approving}
              className='inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50'
            >
              {approving ? <Loader2 size={16} className='animate-spin' /> : null}
              Approve & Save
            </button>
            <button
              type='button'
              onClick={handleRetry}
              className='inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted'
            >
              <RefreshCw size={14} />
              Retry Enrichment
            </button>
          </div>
        </div>
      )}

      {/* STATE D — Failed */}
      {status === 'enrichment_failed' && (
        <div className='space-y-4 rounded-xl border border-red-200 bg-red-50 p-6'>
          <p className='font-medium text-red-700'>Enrichment failed.</p>
          <p className='text-sm text-red-600'>
            The scraping or synthesis step encountered an error. You can retry or enter notes manually.
          </p>
          <div className='flex gap-3'>
            <button
              type='button'
              onClick={handleRetry}
              className='inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700'
            >
              <RefreshCw size={14} />
              Retry Enrichment
            </button>
            <button
              type='button'
              onClick={() => setArtist((prev) => prev ? { ...prev, enrichment_status: 'enrichment_ready', extra_data: { ...prev.extra_data, enrichment: {} } } : prev)}
              className='inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted'
            >
              Enter Manually
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
