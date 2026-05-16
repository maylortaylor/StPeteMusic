'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export default function LiveStreamControlPage() {
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/live-override')
      .then((r) => r.json())
      .then((d) => setActiveVideoId(d.videoId ?? null))
      .catch(() => toast.error('Failed to load override status'))
      .finally(() => setLoading(false));
  }, []);

  const activate = async () => {
    if (!input.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/live-override', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: input.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      setActiveVideoId(data.videoId);
      setInput('');
      toast.success('Live override activated — /live now shows your stream');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to activate override');
    } finally {
      setSaving(false);
    }
  };

  const clear = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/live-override', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: null }),
      });
      if (!res.ok) throw new Error();
      setActiveVideoId(null);
      toast.success('Override cleared — /live is back to YouTube API detection');
    } catch {
      toast.error('Failed to clear override');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-10 px-6">
      <h1 className="text-2xl font-bold text-foreground mb-1">Live Stream Control</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Paste a YouTube URL to force the public /live page to show a specific stream,
        bypassing the YouTube API quota check. Clear it when the stream ends.
      </p>

      {/* Status */}
      <div className={`flex items-center gap-2 rounded-lg border px-4 py-3 mb-8 text-sm font-medium ${
        activeVideoId
          ? 'border-green-300 bg-green-50 text-green-800'
          : 'border-border bg-muted text-muted-foreground'
      }`}>
        <span className={`w-2 h-2 rounded-full ${activeVideoId ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'}`} />
        {loading
          ? 'Loading…'
          : activeVideoId
            ? <>Override active — <code className="font-mono">{activeVideoId}</code></>
            : 'No override — using YouTube API detection'
        }
      </div>

      {/* Set override */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-foreground">
          YouTube URL or Video ID
        </label>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && activate()}
          placeholder="https://youtube.com/watch?v=… or video ID"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="flex gap-3">
          <button
            onClick={activate}
            disabled={saving || !input.trim()}
            className="flex-1 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            {saving ? 'Saving…' : 'Activate Override'}
          </button>
          {activeVideoId && (
            <button
              onClick={clear}
              disabled={saving}
              className="rounded-md border border-destructive px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-40 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {activeVideoId && (
        <p className="mt-6 text-xs text-muted-foreground">
          The public site will show this stream until you clear the override. Remember to clear it
          when you stop streaming.
        </p>
      )}
    </div>
  );
}
