'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, RefreshCw } from 'lucide-react';

interface FeaturedArtist {
  id: string;
  artist_name: string | null;
  status: string;
  scraped_raw: Record<string, unknown>;
  enrichment_notes: string | null;
}

export default function EnrichmentReviewPage({
  params,
}: {
  params: Promise<{ featuredId: string }>;
}) {
  const [featuredId, setFeaturedId] = useState<string | null>(null);
  const [record, setRecord] = useState<FeaturedArtist | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [retriggering, setRetriggering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    params.then(({ featuredId: id }) => {
      setFeaturedId(id);
      fetch(`/api/featured/${id}`)
        .then((r) => r.json())
        .then((data) => {
          setRecord(data);
          setNotes(data.enrichment_notes || '');
        })
        .catch(() => setError('Failed to load featured artist'))
        .finally(() => setLoading(false));
    });
  }, [params]);

  const handleRetrigger = async () => {
    if (!featuredId) return;
    setRetriggering(true);
    setError(null);
    try {
      const res = await fetch(`/api/featured/${featuredId}/enrich`, { method: 'POST' });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to retrigger');
      }
      router.push('/dashboard/featured');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setRetriggering(false);
    }
  };

  const handleApprove = async () => {
    if (!featuredId || !notes.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/featured/${featuredId}/enrichment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrichmentNotes: notes }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to save');
      }
      router.push('/dashboard/featured');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12">Loading...</div>;
  }

  const scraped = record?.scraped_raw as Record<string, string | null | undefined> ?? {};
  const platforms = ['facebook', 'instagram', 'linktree', 'website', 'bandcamp'];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/featured"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Featured
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Review Enrichment — {record?.artist_name}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Review scraped data and approve enrichment notes
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {record?.status === 'enrichment_failed' && (
        <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
          <p className="text-sm font-medium text-red-700 dark:text-red-400">
            Enrichment failed — the scraper encountered errors.
          </p>
          <button
            onClick={handleRetrigger}
            disabled={retriggering}
            className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {retriggering && <RefreshCw className="h-3 w-3 animate-spin" />}
            Retry Enrichment
          </button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Raw Scraped Data</h2>
          {platforms.map((platform) => {
            const content = scraped[platform];
            return (
              <details key={platform} className="rounded-lg border border-border bg-card">
                <summary className="cursor-pointer px-4 py-3 text-sm font-medium capitalize text-foreground">
                  {platform}
                  {!content && <span className="ml-2 text-xs text-muted-foreground">(no data)</span>}
                </summary>
                {content && (
                  <pre className="max-h-48 overflow-auto border-t border-border px-4 py-3 text-xs text-muted-foreground whitespace-pre-wrap">
                    {typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
                  </pre>
                )}
              </details>
            );
          })}
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Enrichment Notes</h2>
          <p className="text-xs text-muted-foreground">
            Edit the synthesized notes below. These will be used to generate the newsletter blurb and blog post.
          </p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={18}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Synthesized enrichment notes will appear here after scraping..."
          />
          <button
            onClick={handleApprove}
            disabled={saving || !notes.trim()}
            className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Approve & Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
