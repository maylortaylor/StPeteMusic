'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

type Timestamp = { time: string; band_name: string; artist_id?: string };

type Video = {
  video_id: string;
  title: string | null;
  description: string | null;
  tags: string[] | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  published_at: string | null;
  is_livestream: boolean | null;
  is_short: boolean | null;
  proposed_title: string | null;
  proposed_description: string | null;
  proposed_tags: string[] | null;
  proposed_playlist_ids: string[] | null;
  status: string | null;
  calendar_match_confidence: string | null;
  calendar_event_id: string | null;
  calendar_event_link: string | null;
  timestamps: Timestamp[] | null;
  review_notes: string | null;
  reviewed_at: string | null;
  published_to_youtube_at: string | null;
  prompt_version: string | null;
};

type Playlist = { playlist_id: string; name: string; playlist_type: string };

const CONFIDENCE_STYLES: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  guessed: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  none: 'bg-muted text-muted-foreground',
};

const STATUS_STYLES: Record<string, string> = {
  pending_review: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  needs_timestamps: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  published: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  skipped: 'bg-muted text-muted-foreground',
};

function tagsCharCount(tags: string[]): number {
  return tags.join(', ').length;
}

export default function YouTubeReviewPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const router = useRouter();

  const [video, setVideo] = useState<Video | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  // Editable fields (mirror proposed_* from DB)
  const [proposedTitle, setProposedTitle] = useState('');
  const [proposedDescription, setProposedDescription] = useState('');
  const [proposedTagsRaw, setProposedTagsRaw] = useState('');
  const [selectedPlaylistIds, setSelectedPlaylistIds] = useState<string[]>([]);
  const [timestamps, setTimestamps] = useState<Timestamp[]>([]);
  const [reviewNotes, setReviewNotes] = useState('');
  const [showTimestamps, setShowTimestamps] = useState(false);

  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [vRes, pRes] = await Promise.all([
        fetch(`/api/youtube/videos/${videoId}`),
        fetch('/api/youtube/playlists'),
      ]);
      const v: Video = await vRes.json();
      const { playlists: pl } = await pRes.json();

      setVideo(v);
      setPlaylists(pl ?? []);
      setProposedTitle(v.proposed_title ?? '');
      setProposedDescription(v.proposed_description ?? '');
      setProposedTagsRaw((v.proposed_tags ?? []).join(', '));
      setSelectedPlaylistIds(v.proposed_playlist_ids ?? []);
      setTimestamps(v.timestamps ?? []);
      setReviewNotes(v.review_notes ?? '');
      setShowTimestamps((v.timestamps?.length ?? 0) > 0 || v.is_livestream === true);
    } catch {
      toast.error('Failed to load video');
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/youtube/videos/${videoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposed_title: proposedTitle,
          proposed_description: proposedDescription,
          proposed_tags: proposedTagsRaw.split(',').map((t) => t.trim()).filter(Boolean),
          proposed_playlist_ids: selectedPlaylistIds,
          timestamps,
          review_notes: reviewNotes,
        }),
      });
      if (!res.ok) throw new Error();
      const updated: Video = await res.json();
      setVideo(updated);
      toast.success('Changes saved');
    } catch {
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const approve = async () => {
    await save();
    setApproving(true);
    try {
      const res = await fetch(`/api/youtube/videos/${videoId}/approve`, { method: 'POST' });
      if (!res.ok) throw new Error();
      const updated: Video = await res.json();
      setVideo(updated);
      toast.success('Video approved');
    } catch {
      toast.error('Failed to approve');
    } finally {
      setApproving(false);
    }
  };

  const skip = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/youtube/videos/${videoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'skipped' }),
      });
      if (!res.ok) throw new Error();
      toast.success('Video skipped');
      router.push('/dashboard/youtube');
    } catch {
      toast.error('Failed to skip');
    } finally {
      setSaving(false);
    }
  };

  const regenerate = async () => {
    setRegenerating(true);
    try {
      const res = await fetch(`/api/youtube/videos/${videoId}/regenerate`, { method: 'POST' });
      if (!res.ok) throw new Error();
      const updated: Video = await res.json();
      setVideo(updated);
      setProposedTitle(updated.proposed_title ?? '');
      setProposedDescription(updated.proposed_description ?? '');
      setProposedTagsRaw((updated.proposed_tags ?? []).join(', '));
      toast.success('Proposal regenerated');
    } catch {
      toast.error('Failed to regenerate proposal');
    } finally {
      setRegenerating(false);
    }
  };

  const addTimestamp = () => {
    setTimestamps((prev) => [...prev, { time: '0:00', band_name: '' }]);
  };

  const updateTimestamp = (i: number, field: keyof Timestamp, value: string) => {
    setTimestamps((prev) => prev.map((ts, idx) => idx === i ? { ...ts, [field]: value } : ts));
  };

  const removeTimestamp = (i: number) => {
    setTimestamps((prev) => prev.filter((_, idx) => idx !== i));
  };

  const togglePlaylist = (id: string) => {
    setSelectedPlaylistIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const tagCount = tagsCharCount(proposedTagsRaw.split(',').map((t) => t.trim()).filter(Boolean));

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Loading…</h1>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Video not found</h1>
        <Link href="/dashboard/youtube" className="text-sm text-primary underline">← Back to queue</Link>
      </div>
    );
  }

  const status = video.status ?? 'pending_review';
  const confidence = video.calendar_match_confidence ?? 'none';
  const isPublished = status === 'published';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/youtube" className="text-sm text-muted-foreground hover:text-foreground">
            ← Queue
          </Link>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status] ?? STATUS_STYLES.skipped}`}>
              {status.replace(/_/g, ' ')}
            </span>
            {video.is_livestream && (
              <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300">LIVESTREAM</span>
            )}
            {video.is_short && (
              <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">SHORT</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button
            onClick={regenerate}
            disabled={regenerating}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted disabled:opacity-50 transition-colors"
          >
            {regenerating ? 'Regenerating…' : 'Regenerate Proposal'}
          </button>
          <button
            onClick={skip}
            disabled={saving || isPublished}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted disabled:opacity-50 transition-colors"
          >
            Skip
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={approve}
            disabled={approving || isPublished}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {approving ? 'Approving…' : status === 'approved' ? 'Re-approve' : 'Approve'}
          </button>
          {status === 'approved' && (
            <Link
              href={`/api/youtube/videos/${videoId}/publish`}
              className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors"
              onClick={(e) => {
                e.preventDefault();
                fetch(`/api/youtube/videos/${videoId}/publish`, { method: 'POST' })
                  .then((r) => r.json())
                  .then((d) => {
                    if (d.error) throw new Error(d.error);
                    toast.success('Published to YouTube');
                    load();
                  })
                  .catch((err) => toast.error(`Publish failed: ${String(err)}`));
              }}
            >
              Publish to YouTube
            </Link>
          )}
          {isPublished && (
            <button
              onClick={() => {
                fetch(`/api/youtube/videos/${videoId}/publish`, { method: 'POST' })
                  .then((r) => r.json())
                  .then((d) => {
                    if (d.error) throw new Error(d.error);
                    toast.success('Re-published to YouTube');
                    load();
                  })
                  .catch((err) => toast.error(`Re-publish failed: ${String(err)}`));
              }}
              className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors"
            >
              Re-publish
            </button>
          )}
        </div>
      </div>

      {/* Thumbnail + Calendar match */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-1">
          {video.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={video.thumbnail_url}
              alt=""
              className="w-full rounded-lg object-cover aspect-video"
            />
          ) : (
            <div className="w-full rounded-lg bg-muted aspect-video" />
          )}
          <div className="mt-2 flex gap-2">
            <a
              href={`https://www.youtube.com/watch?v=${video.video_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary underline underline-offset-2 hover:no-underline"
            >
              Watch on YouTube ↗
            </a>
          </div>
        </div>

        <div className="col-span-2 space-y-3">
          {/* Calendar match */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-foreground">Calendar Match</h3>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CONFIDENCE_STYLES[confidence] ?? CONFIDENCE_STYLES.none}`}>
                {confidence}
              </span>
            </div>
            {video.calendar_event_id ? (
              <div className="space-y-1">
                <p className="text-sm text-foreground">{video.calendar_event_id}</p>
                {video.calendar_event_link && (
                  <a
                    href={video.calendar_event_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary underline underline-offset-2 hover:no-underline"
                  >
                    Open in Google Calendar ↗
                  </a>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No calendar event matched</p>
            )}
          </div>

          {/* Review notes */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Review Notes</label>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              rows={2}
              placeholder="Internal notes…"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>
        </div>
      </div>

      {/* Title diff */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Current Title <span className="text-[10px]">({(video.title ?? '').length}/100 chars)</span>
          </label>
          <p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground min-h-[40px]">
            {video.title ?? '—'}
          </p>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Proposed Title
            <span className={`ml-1 text-[10px] ${proposedTitle.length > 100 ? 'text-red-500' : ''}`}>
              ({proposedTitle.length}/100 chars)
            </span>
          </label>
          <input
            type="text"
            value={proposedTitle}
            onChange={(e) => setProposedTitle(e.target.value)}
            maxLength={110}
            className={`w-full rounded-md border px-3 py-2 text-sm text-foreground bg-background focus:outline-none focus:ring-1 focus:ring-ring ${
              proposedTitle.length > 100 ? 'border-red-500' : 'border-border'
            }`}
          />
        </div>
      </div>

      {/* Description diff */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Current Description</label>
          <pre className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground whitespace-pre-wrap h-64 overflow-y-auto font-sans">
            {video.description ?? '—'}
          </pre>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Proposed Description
            <span className="ml-1 text-[10px]">({proposedDescription.length}/5000 chars)</span>
          </label>
          <textarea
            value={proposedDescription}
            onChange={(e) => setProposedDescription(e.target.value)}
            rows={16}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none font-mono"
          />
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          Proposed Tags (comma-separated)
          <span className={`ml-1 text-[10px] ${tagCount > 500 ? 'text-red-500' : ''}`}>
            ({tagCount}/500 chars)
          </span>
        </label>
        <textarea
          value={proposedTagsRaw}
          onChange={(e) => setProposedTagsRaw(e.target.value)}
          rows={3}
          className={`w-full rounded-md border px-3 py-2 text-sm text-foreground bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none ${
            tagCount > 500 ? 'border-red-500' : 'border-border'
          }`}
        />
      </div>

      {/* Playlists */}
      {playlists.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-2">Playlist Assignments</label>
          <div className="grid grid-cols-3 gap-2">
            {playlists.map((pl) => (
              <label
                key={pl.playlist_id}
                className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedPlaylistIds.includes(pl.playlist_id)}
                  onChange={() => togglePlaylist(pl.playlist_id)}
                  className="rounded border-border"
                />
                <span className="text-xs text-foreground">{pl.name}</span>
                <span className="text-[10px] text-muted-foreground ml-auto">{pl.playlist_type}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Timestamps */}
      <div>
        <button
          onClick={() => setShowTimestamps((v) => !v)}
          className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
        >
          <span>{showTimestamps ? '▼' : '▶'}</span>
          Timestamps
          {timestamps.length > 0 && (
            <span className="rounded-full bg-muted px-1.5 text-xs text-muted-foreground">{timestamps.length}</span>
          )}
        </button>

        {showTimestamps && (
          <div className="mt-3 space-y-2">
            {timestamps.map((ts, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={ts.time}
                  onChange={(e) => updateTimestamp(i, 'time', e.target.value)}
                  placeholder="0:00"
                  className="w-20 rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <input
                  type="text"
                  value={ts.band_name}
                  onChange={(e) => updateTimestamp(i, 'band_name', e.target.value)}
                  placeholder="Band / Artist name"
                  className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <button
                  onClick={() => removeTimestamp(i)}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors px-1"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              onClick={addTimestamp}
              className="text-xs text-primary hover:underline"
            >
              + Add timestamp
            </button>
          </div>
        )}
      </div>

      {/* Prompt version */}
      {video.prompt_version && (
        <p className="text-[10px] text-muted-foreground">
          Prompt version: {video.prompt_version}
          {video.published_to_youtube_at && ` · Published: ${new Date(video.published_to_youtube_at).toLocaleString()}`}
        </p>
      )}
    </div>
  );
}
