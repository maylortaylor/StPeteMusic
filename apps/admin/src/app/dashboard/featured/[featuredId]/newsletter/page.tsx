'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Sparkles } from 'lucide-react';

interface FeaturedArtist {
  id: string;
  artist_name: string | null;
  status: string;
  enrichment_notes: string | null;
  newsletter_blurb: string | null;
}

export default function NewsletterBlurbPage({
  params,
}: {
  params: Promise<{ featuredId: string }>;
}) {
  const [featuredId, setFeaturedId] = useState<string | null>(null);
  const [record, setRecord] = useState<FeaturedArtist | null>(null);
  const [blurb, setBlurb] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    params.then(({ featuredId: id }) => {
      setFeaturedId(id);
      fetch(`/api/featured/${id}`)
        .then((r) => r.json())
        .then((data) => {
          setRecord(data);
          setBlurb(data.newsletter_blurb || '');
        })
        .catch(() => setError('Failed to load featured artist'))
        .finally(() => setLoading(false));
    });
  }, [params]);

  const handleGenerate = async () => {
    if (!featuredId) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/featured/${featuredId}/newsletter`, { method: 'POST' });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to generate');
      }
      const data = await res.json();
      setBlurb(data.blurb);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = async () => {
    if (!featuredId || !blurb.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/featured/${featuredId}/newsletter`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newsletterBlurb: blurb }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to approve');
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
          Newsletter Blurb — {record?.artist_name}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Generate and approve the newsletter spotlight for this artist
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {record?.enrichment_notes && (
        <details className="rounded-lg border border-border bg-card">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-foreground">
            Enrichment Notes (reference)
          </summary>
          <pre className="border-t border-border px-4 py-3 text-xs text-muted-foreground whitespace-pre-wrap">
            {record.enrichment_notes}
          </pre>
        </details>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Newsletter Blurb (~100-150 words)</h2>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
          >
            <Sparkles className="h-3 w-3" />
            {generating ? 'Generating...' : blurb ? 'Regenerate' : 'Generate with AI'}
          </button>
        </div>

        <textarea
          value={blurb}
          onChange={(e) => setBlurb(e.target.value)}
          rows={10}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Click 'Generate with AI' to create a newsletter blurb, or write one manually..."
        />

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{blurb.split(/\s+/).filter(Boolean).length} words</span>
          <span>Target: 100–150 words</span>
        </div>

        <button
          onClick={handleApprove}
          disabled={saving || !blurb.trim()}
          className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? 'Approving...' : 'Approve & Continue to Blog Post'}
        </button>
      </div>
    </div>
  );
}
