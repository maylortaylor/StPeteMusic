'use client';

import { useState, useEffect, useCallback } from 'react';
import { Zap, RefreshCw, Plus, Check } from 'lucide-react';

interface BrandGuideline {
  id: string;
  version: number;
  name: string;
  system_prompt: string;
  tone_descriptors: string[];
  hashtag_library: string[];
  example_posts: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function BrandVoicePage() {
  const [guidelines, setGuidelines] = useState<BrandGuideline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activating, setActivating] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<BrandGuideline>>({});
  const [saving, setSaving] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newGuideline, setNewGuideline] = useState({ name: '', system_prompt: '', tone_descriptors: '', hashtag_library: '', example_posts: '' });
  const [creating, setCreating] = useState(false);

  const fetchGuidelines = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/brand-guidelines');
      if (!res.ok) throw new Error('Failed to fetch guidelines');
      const data = await res.json();
      setGuidelines(data.guidelines ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGuidelines(); }, [fetchGuidelines]);

  const handleActivate = async (id: string) => {
    setActivating(id);
    try {
      const res = await fetch(`/api/brand-guidelines/${id}/activate`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to activate');
      fetchGuidelines();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate');
    } finally {
      setActivating(null);
    }
  };

  const handleStartEdit = (g: BrandGuideline) => {
    setEditing(g.id);
    setEditDraft({ name: g.name, system_prompt: g.system_prompt, tone_descriptors: g.tone_descriptors, hashtag_library: g.hashtag_library, example_posts: g.example_posts });
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/brand-guidelines/${editing}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editDraft),
      });
      if (!res.ok) throw new Error('Failed to save');
      setEditing(null);
      fetchGuidelines();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!newGuideline.name || !newGuideline.system_prompt) return;
    setCreating(true);
    try {
      const res = await fetch('/api/brand-guidelines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGuideline.name,
          system_prompt: newGuideline.system_prompt,
          tone_descriptors: newGuideline.tone_descriptors ? newGuideline.tone_descriptors.split(',').map((s) => s.trim()) : [],
          hashtag_library: newGuideline.hashtag_library ? newGuideline.hashtag_library.split(',').map((s) => s.trim()) : [],
          example_posts: newGuideline.example_posts ? newGuideline.example_posts.split('\n').filter(Boolean) : [],
        }),
      });
      if (!res.ok) throw new Error('Failed to create');
      setShowNewForm(false);
      setNewGuideline({ name: '', system_prompt: '', tone_descriptors: '', hashtag_library: '', example_posts: '' });
      fetchGuidelines();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Brand Voice</h1>
          <p className="mt-1 text-muted-foreground">
            Manage the system prompt used by AI agents for all content generation.{' '}
            <span className="text-xs">Active version is loaded by n8n workflows and <code className="rounded bg-muted px-1 py-0.5">/content-cycle</code>.</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchGuidelines} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button onClick={() => setShowNewForm(true)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            New Version
          </button>
        </div>
      </div>

      {/* Active source callout */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/30 dark:bg-amber-900/20 dark:text-amber-400">
        <strong>Source file:</strong> <code>.agents/context/brand-voice.md</code> is the static fallback used by agents in this repo.
        The <strong>active version below</strong> is fetched dynamically by n8n workflows at runtime.
        Keep them in sync when making major voice changes.
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">{error}</div>
      )}

      {/* New version form */}
      {showNewForm && (
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">New Brand Voice Version</h2>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Name</label>
            <input
              type="text"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              placeholder="e.g. Core Voice v2, Hype Mode, Educational"
              value={newGuideline.name}
              onChange={(e) => setNewGuideline((g) => ({ ...g, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">System Prompt</label>
            <textarea
              rows={8}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono"
              placeholder="You are the social media content manager for @StPeteMusic..."
              value={newGuideline.system_prompt}
              onChange={(e) => setNewGuideline((g) => ({ ...g, system_prompt: e.target.value }))}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Tone descriptors (comma-separated)</label>
              <input
                type="text"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                placeholder="enthusiastic, authentic, community-oriented"
                value={newGuideline.tone_descriptors}
                onChange={(e) => setNewGuideline((g) => ({ ...g, tone_descriptors: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Hashtag library (comma-separated)</label>
              <input
                type="text"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                placeholder="#StPeteMusic, #SuiteEStudios, #StPeteFL"
                value={newGuideline.hashtag_library}
                onChange={(e) => setNewGuideline((g) => ({ ...g, hashtag_library: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Example posts (one per line)</label>
            <textarea
              rows={3}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              placeholder="🎸 02.23 @BadWolf || Suite.E.Studios&#10;🔥 The vibes were perfect!&#10;#StPeteMusic #SuiteEStudios"
              value={newGuideline.example_posts}
              onChange={(e) => setNewGuideline((g) => ({ ...g, example_posts: e.target.value }))}
            />
          </div>
          <div className="flex gap-3">
            <button onClick={handleCreate} disabled={creating || !newGuideline.name || !newGuideline.system_prompt} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {creating ? 'Creating...' : 'Create Version'}
            </button>
            <button onClick={() => setShowNewForm(false)} className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted">Cancel</button>
          </div>
        </div>
      )}

      {/* Guidelines list */}
      {loading ? (
        <div className="py-12 text-center text-muted-foreground">Loading...</div>
      ) : guidelines.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-border p-12 text-center">
          <Zap className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">No brand voice versions yet. Create one to start managing AI content tone.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {guidelines.map((g) => (
            <div key={g.id} className={`rounded-lg border bg-card overflow-hidden ${g.is_active ? 'border-primary' : 'border-border'}`}>
              <div className="flex items-start justify-between gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-foreground">{g.name}</h3>
                    <span className="text-xs text-muted-foreground">v{g.version}</span>
                    {g.is_active && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        <Check className="h-3 w-3" />
                        Active
                      </span>
                    )}
                  </div>
                  {g.tone_descriptors.length > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">{g.tone_descriptors.join(', ')}</p>
                  )}
                  {g.hashtag_library.length > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">{g.hashtag_library.slice(0, 5).join(' ')}{g.hashtag_library.length > 5 ? ' ...' : ''}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  {!g.is_active && (
                    <button
                      onClick={() => handleActivate(g.id)}
                      disabled={activating === g.id}
                      className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted disabled:opacity-50"
                    >
                      {activating === g.id ? 'Activating...' : 'Set Active'}
                    </button>
                  )}
                  <button
                    onClick={() => editing === g.id ? setEditing(null) : handleStartEdit(g)}
                    className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                  >
                    {editing === g.id ? 'Cancel' : 'Edit'}
                  </button>
                </div>
              </div>

              {/* Inline edit form */}
              {editing === g.id && (
                <div className="border-t border-border p-4 space-y-4 bg-muted/30">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">Name</label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      value={editDraft.name ?? ''}
                      onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">System Prompt</label>
                    <textarea
                      rows={10}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono"
                      value={editDraft.system_prompt ?? ''}
                      onChange={(e) => setEditDraft((d) => ({ ...d, system_prompt: e.target.value }))}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">{(editDraft.system_prompt ?? '').length} characters</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleSaveEdit} disabled={saving} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button onClick={() => setEditing(null)} className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted">Cancel</button>
                  </div>
                </div>
              )}

              {/* System prompt preview (collapsed) */}
              {editing !== g.id && (
                <div className="border-t border-border px-4 py-3 bg-muted/20">
                  <p className="line-clamp-3 text-xs font-mono text-muted-foreground">{g.system_prompt}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
