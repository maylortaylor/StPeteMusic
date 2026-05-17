'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

type Platform = 'youtube' | 'facebook' | 'twitch' | null;

const PLATFORM_LABELS: Record<string, string> = {
  youtube: 'YouTube',
  facebook: 'Facebook',
  twitch: 'Twitch',
};

const PLATFORM_COLORS: Record<string, string> = {
  youtube: 'bg-red-100 text-red-700',
  facebook: 'bg-blue-100 text-blue-700',
  twitch: 'bg-purple-100 text-purple-700',
};

function formatExpiry(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function detectPlatform(input: string): Platform {
  if (!input.trim()) return null;
  const lower = input.toLowerCase();
  if (lower.includes('twitch.tv')) return 'twitch';
  if (lower.includes('facebook.com') || lower.includes('fb.watch')) return 'facebook';
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
  if (/^[a-zA-Z0-9_-]{11}$/.test(input.trim())) return 'youtube';
  return null;
}

export default function LiveStreamControlPage() {
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [activePlatform, setActivePlatform] = useState<Platform>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<{ live: boolean; videoId: string | null; title: string | null; error?: string } | null>(null);

  const detectedPlatform = detectPlatform(input);

  useEffect(() => {
    fetch('/api/live-override')
      .then((r) => r.json())
      .then((d) => {
        setActiveVideoId(d.videoId ?? null);
        setActivePlatform(d.platform ?? null);
        setExpiresAt(d.expiresAt ?? null);
      })
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
      setActivePlatform(data.platform ?? null);
      setExpiresAt(data.expiresAt ?? null);
      setInput('');
      toast.success(`${PLATFORM_LABELS[data.platform] ?? 'Stream'} override active — /live updated (auto-clears in 8 hours)`);
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
      setActivePlatform(null);
      setExpiresAt(null);
      toast.success('Override cleared — /live is back to YouTube API detection');
    } catch {
      toast.error('Failed to clear override');
    } finally {
      setSaving(false);
    }
  };

  const checkNow = async () => {
    setChecking(true);
    setCheckResult(null);
    try {
      const res = await fetch('/api/force-check', { method: 'POST' });
      const data = await res.json();
      setCheckResult(data);
      if (data.error === 'quota_exceeded') {
        toast.warning('YouTube API quota exceeded — check back tomorrow');
      } else if (data.live) {
        toast.success(`Live stream detected: ${data.title ?? data.videoId}`);
      } else {
        toast.info('No live stream found on YouTube right now');
      }
    } catch {
      toast.error('Check failed — try again');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-10 px-6">
      <h1 className="text-2xl font-bold text-foreground mb-1">Live Stream Control</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Paste a YouTube, Facebook, or Twitch URL to force the public /live page to show your stream.
        The override auto-clears 8 hours after activation.
      </p>

      {/* Override status */}
      <div className={`flex items-center gap-2 rounded-lg border px-4 py-3 mb-8 text-sm font-medium ${
        activeVideoId
          ? 'border-green-300 bg-green-50 text-green-800'
          : 'border-border bg-muted text-muted-foreground'
      }`}>
        <span className={`w-2 h-2 rounded-full shrink-0 ${activeVideoId ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'}`} />
        <span className="flex-1 min-w-0 truncate">
          {loading
            ? 'Loading…'
            : activeVideoId
              ? (
                <>
                  {activePlatform && (
                    <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-semibold mr-2 ${PLATFORM_COLORS[activePlatform] ?? ''}`}>
                      {PLATFORM_LABELS[activePlatform]}
                    </span>
                  )}
                  <code className="font-mono text-xs">{activeVideoId}</code>
                  {expiresAt && (
                    <span className="font-normal text-green-700 ml-2">
                      · clears at {formatExpiry(expiresAt)}
                    </span>
                  )}
                </>
              )
              : 'No override — using YouTube API detection'
          }
        </span>
      </div>

      {/* Set override */}
      <div className="space-y-3 mb-8">
        <label className="block text-sm font-medium text-foreground">
          YouTube, Facebook, or Twitch URL
        </label>
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && activate()}
            placeholder="https://youtube.com/watch?v=… · facebook.com/… · twitch.tv/…"
            className="w-full rounded-md border border-input bg-background px-3 py-2 pr-24 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {detectedPlatform && (
            <span className={`absolute right-3 top-1/2 -translate-y-1/2 rounded px-1.5 py-0.5 text-xs font-semibold ${PLATFORM_COLORS[detectedPlatform]}`}>
              {PLATFORM_LABELS[detectedPlatform]}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          YouTube embed · Facebook plugin iframe · Twitch player (all work without login for public streams)
        </p>
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

      {/* Manual YouTube check */}
      <div className="border-t border-border pt-6">
        <h2 className="text-sm font-semibold text-foreground mb-1">Check YouTube Now</h2>
        <p className="text-xs text-muted-foreground mb-3">
          Forces a live YouTube API check, bypassing the cache. Updates the shared cache so the
          public /live page picks it up immediately. Scheduled checks run at :10 and :40 past the hour.
        </p>
        <button
          onClick={checkNow}
          disabled={checking}
          className="rounded-md border border-input px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-40 transition-colors"
        >
          {checking ? 'Checking…' : 'Check YouTube Now'}
        </button>

        {checkResult && (
          <div className={`mt-3 rounded-lg border px-4 py-3 text-sm ${
            checkResult.error
              ? 'border-yellow-300 bg-yellow-50 text-yellow-800'
              : checkResult.live
                ? 'border-green-300 bg-green-50 text-green-800'
                : 'border-border bg-muted text-muted-foreground'
          }`}>
            {checkResult.error === 'quota_exceeded'
              ? 'Quota exceeded — YouTube API unavailable until tomorrow'
              : checkResult.live
                ? <>Live: <code className="font-mono">{checkResult.videoId}</code>{checkResult.title ? ` · ${checkResult.title}` : ''}</>
                : 'No live stream detected on YouTube'
            }
          </div>
        )}
      </div>
    </div>
  );
}
