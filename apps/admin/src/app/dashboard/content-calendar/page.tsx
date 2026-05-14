'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar, RefreshCw, Plus, Check, X, Clock, ExternalLink } from 'lucide-react';

type SocialPostStatus = 'draft' | 'pending_approval' | 'approved' | 'scheduled' | 'published' | 'failed' | 'archived';

interface SocialPost {
  id: string;
  platform: string;
  content_type: string;
  status: SocialPostStatus;
  title: string | null;
  caption: string | null;
  hashtags: string[];
  scheduled_publish_at: string | null;
  published_at: string | null;
  approved_by: string | null;
  approval_notes: string | null;
  approval_timestamp: string | null;
  platform_post_id: string | null;
  artist_name: string | null;
  artist_instagram_handle: string | null;
  created_at: string;
}

const PLATFORMS = ['all', 'instagram', 'facebook', 'youtube', 'newsletter'] as const;
const STATUSES = ['all', 'draft', 'pending_approval', 'approved', 'scheduled', 'published', 'archived'] as const;

const STATUS_CONFIG: Record<SocialPostStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-muted text-muted-foreground' },
  pending_approval: { label: 'Pending Approval', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  approved: { label: 'Approved', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  scheduled: { label: 'Scheduled', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  published: { label: 'Published ✓', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  archived: { label: 'Archived', color: 'bg-muted text-muted-foreground opacity-60' },
};

const PLATFORM_ICONS: Record<string, string> = {
  instagram: 'IG',
  facebook: 'FB',
  youtube: 'YT',
  newsletter: 'NL',
};

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function ContentCalendarPage() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [approving, setApproving] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [newPost, setNewPost] = useState({ platform: 'instagram', content_type: 'post', title: '', caption: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (platformFilter !== 'all') params.set('platform', platformFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await fetch(`/api/social-posts?${params}`);
      if (!res.ok) throw new Error('Failed to fetch posts');
      const data = await res.json();
      setPosts(data.posts ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [platformFilter, statusFilter]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleApprove = async (id: string) => {
    setApproving(id);
    try {
      const res = await fetch(`/api/social-posts/${id}/approve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      if (!res.ok) throw new Error('Failed to approve');
      fetchPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve post');
    } finally {
      setApproving(null);
    }
  };

  const handleArchive = async (id: string) => {
    if (!confirm('Archive this post?')) return;
    try {
      const res = await fetch(`/api/social-posts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to archive');
      fetchPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive post');
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.platform) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/social-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPost),
      });
      if (!res.ok) throw new Error('Failed to create post');
      setShowNewPostForm(false);
      setNewPost({ platform: 'instagram', content_type: 'post', title: '', caption: '' });
      fetchPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Content Calendar</h1>
          <p className="mt-1 text-muted-foreground">Social post drafts, approvals, and publishing queue</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchPosts}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowNewPostForm(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            New Draft
          </button>
        </div>
      </div>

      {/* New Post Form */}
      {showNewPostForm && (
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">New Post Draft</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Platform</label>
              <select
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={newPost.platform}
                onChange={(e) => setNewPost((p) => ({ ...p, platform: e.target.value }))}
              >
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="youtube">YouTube</option>
                <option value="newsletter">Newsletter</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Content Type</label>
              <select
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={newPost.content_type}
                onChange={(e) => setNewPost((p) => ({ ...p, content_type: e.target.value }))}
              >
                <option value="post">Post</option>
                <option value="reel">Reel</option>
                <option value="story">Story</option>
                <option value="short">Short</option>
                <option value="carousel">Carousel</option>
                <option value="video">Video</option>
                <option value="email">Email</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Title (optional)</label>
            <input
              type="text"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              placeholder="e.g. 02.27.2026 || @Beach_Terror at @Suite.E.Studios"
              value={newPost.title}
              onChange={(e) => setNewPost((p) => ({ ...p, title: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Caption</label>
            <textarea
              rows={4}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              placeholder="Post caption..."
              value={newPost.caption}
              onChange={(e) => setNewPost((p) => ({ ...p, caption: e.target.value }))}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCreatePost}
              disabled={submitting || !newPost.platform}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Draft'}
            </button>
            <button
              onClick={() => setShowNewPostForm(false)}
              className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Platform:</span>
          <div className="flex gap-1">
            {PLATFORMS.map((p) => (
              <button
                key={p}
                onClick={() => setPlatformFilter(p)}
                className={`rounded-md px-3 py-1 text-sm font-medium capitalize transition-colors ${platformFilter === p ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:bg-muted'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <select
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? 'All statuses' : STATUS_CONFIG[s as SocialPostStatus]?.label ?? s}
              </option>
            ))}
          </select>
        </div>
        <span className="ml-auto text-sm text-muted-foreground">{posts.length} posts</span>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Post List */}
      {loading ? (
        <div className="py-12 text-center text-muted-foreground">Loading posts...</div>
      ) : posts.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-border p-12 text-center">
          <Calendar className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">No posts found. Create a draft or generate one with <code className="rounded bg-muted px-1 py-0.5 text-xs">/content-cycle</code> in Claude Code.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const statusCfg = STATUS_CONFIG[post.status] ?? STATUS_CONFIG['draft'];
            const isExpanded = expanded === post.id;

            return (
              <div key={post.id} className="rounded-lg border border-border bg-card overflow-hidden">
                <div className="flex items-start gap-4 p-4">
                  {/* Platform badge */}
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-bold text-foreground">
                    {PLATFORM_ICONS[post.platform] ?? post.platform.slice(0, 2).toUpperCase()}
                  </div>

                  {/* Main content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                      <span className="text-xs text-muted-foreground capitalize">{post.content_type}</span>
                      {post.artist_name && (
                        <span className="text-xs text-muted-foreground">· {post.artist_name}</span>
                      )}
                      {post.scheduled_publish_at && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDateTime(post.scheduled_publish_at)}
                        </span>
                      )}
                    </div>

                    {post.title && (
                      <p className="mt-1 text-sm font-medium text-foreground truncate">{post.title}</p>
                    )}
                    {post.caption && (
                      <p className={`mt-1 text-sm text-muted-foreground ${isExpanded ? 'whitespace-pre-wrap' : 'line-clamp-2'}`}>
                        {post.caption}
                      </p>
                    )}
                    {post.hashtags.length > 0 && (
                      <p className="mt-1 text-xs text-muted-foreground truncate">
                        {post.hashtags.slice(0, 5).join(' ')}{post.hashtags.length > 5 ? ' ...' : ''}
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setExpanded(isExpanded ? null : post.id)}
                        className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                      >
                        {isExpanded ? 'Show less' : 'Show more'}
                      </button>
                      <span className="text-xs text-muted-foreground">· Created {formatDate(post.created_at)}</span>
                      {post.platform_post_id && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <ExternalLink className="h-3 w-3" />
                          Published ID: {post.platform_post_id}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-2">
                    {(post.status === 'draft' || post.status === 'pending_approval') && (
                      <button
                        onClick={() => handleApprove(post.id)}
                        disabled={approving === post.id}
                        className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                      >
                        {approving === post.id ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )}
                        Approve
                      </button>
                    )}
                    {post.status !== 'published' && post.status !== 'archived' && (
                      <button
                        onClick={() => handleArchive(post.id)}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
