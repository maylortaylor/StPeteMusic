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

export default function BlogPostPage({
  params,
}: {
  params: Promise<{ featuredId: string }>;
}) {
  const [featuredId, setFeaturedId] = useState<string | null>(null);
  const [record, setRecord] = useState<FeaturedArtist | null>(null);
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [body, setBody] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [publishDate, setPublishDate] = useState('');
  const [tags, setTags] = useState('');
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
          if (data.artist_name) {
            setTitle(`Spotlight: ${data.artist_name}`);
          }
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
      const res = await fetch(`/api/featured/${featuredId}/blog`, { method: 'POST' });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to generate');
      }
      const data = await res.json();
      if (data.title && !title) setTitle(data.title);
      setBody(data.body);
      // Generate a quick excerpt from the first sentence
      const firstSentence = data.body.split(/[.!?]/)[0];
      if (firstSentence && !excerpt) {
        setExcerpt(firstSentence.trim() + '.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = async () => {
    if (!featuredId || !title.trim() || !body.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/featured/${featuredId}/blog`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          excerpt: excerpt.trim() || null,
          body: body.trim(),
          featuredImageUrl: featuredImage.trim() || null,
          publishDate: publishDate || null,
          tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to save blog post');
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
          Blog Post — {record?.artist_name}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Generate and approve the artist spotlight blog post
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Excerpt</label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={2}
              placeholder="1-2 sentence preview shown on blog index..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Body (Markdown)</label>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
              >
                <Sparkles className="h-3 w-3" />
                {generating ? 'Generating...' : body ? 'Regenerate' : 'Generate with AI'}
              </button>
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={20}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Click 'Generate with AI' or write your blog post here..."
            />
            <div className="mt-1 text-right text-xs text-muted-foreground">
              {body.split(/\s+/).filter(Boolean).length} words (target: 400–600)
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Featured Image URL
            </label>
            <input
              type="url"
              value={featuredImage}
              onChange={(e) => setFeaturedImage(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Publish Date
            </label>
            <input
              type="datetime-local"
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Leave blank to save as draft without a publish date
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="local music, spotlight, st pete"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {record?.enrichment_notes && (
            <details className="rounded-lg border border-border bg-card">
              <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-muted-foreground">
                Enrichment Notes (reference)
              </summary>
              <pre className="max-h-40 overflow-auto border-t border-border px-3 py-2 text-xs text-muted-foreground whitespace-pre-wrap">
                {record.enrichment_notes}
              </pre>
            </details>
          )}

          <button
            onClick={handleApprove}
            disabled={saving || !title.trim() || !body.trim()}
            className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Approve & Save Blog Post'}
          </button>
        </div>
      </div>
    </div>
  );
}
