'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

type FooterLink = { label: string; url: string };

type Config = {
  footer_links: FooterLink[];
  channel_bio: string;
  contact_emails: string[];
  prompt_version: string;
};

export default function YouTubeConfigPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  // Local editable state
  const [bio, setBio] = useState('');
  const [footerLinks, setFooterLinks] = useState<FooterLink[]>([]);
  const [emails, setEmails] = useState<string[]>([]);
  const [promptVersion, setPromptVersion] = useState('v1');

  useEffect(() => {
    fetch('/api/youtube/config')
      .then((r) => r.json())
      .then((c: Config) => {
        setConfig(c);
        setBio(c.channel_bio ?? '');
        setFooterLinks(c.footer_links ?? []);
        setEmails(c.contact_emails ?? []);
        setPromptVersion(c.prompt_version ?? 'v1');
      })
      .catch(() => toast.error('Failed to load config'))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/youtube/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel_bio: bio,
          footer_links: footerLinks,
          contact_emails: emails,
          prompt_version: promptVersion,
        }),
      });
      if (!res.ok) throw new Error();
      const updated: Config = await res.json();
      setConfig(updated);
      toast.success('Config saved');
    } catch {
      toast.error('Failed to save config');
    } finally {
      setSaving(false);
    }
  };

  const subscribe = async () => {
    setSubscribing(true);
    try {
      const res = await fetch('/api/youtube/subscribe', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Subscribed — lease: ${data.leaseDays} days. Callback: ${data.callbackUrl}`);
    } catch (err) {
      toast.error(`Subscription failed: ${String(err)}`);
    } finally {
      setSubscribing(false);
    }
  };

  const updateLink = (i: number, field: keyof FooterLink, value: string) => {
    setFooterLinks((prev) => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l));
  };

  const removeLink = (i: number) => setFooterLinks((prev) => prev.filter((_, idx) => idx !== i));
  const addLink = () => setFooterLinks((prev) => [...prev, { label: '', url: '' }]);

  const updateEmail = (i: number, value: string) => {
    setEmails((prev) => prev.map((e, idx) => idx === i ? value : e));
  };

  const removeEmail = (i: number) => setEmails((prev) => prev.filter((_, idx) => idx !== i));
  const addEmail = () => setEmails((prev) => [...prev, '']);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">YouTube Config</h1>
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/dashboard/youtube" className="text-sm text-muted-foreground hover:text-foreground">
              ← Queue
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-foreground">YouTube Config</h1>
          <p className="mt-1 text-muted-foreground">
            Settings used when generating video descriptions and tags. Changes take effect on the next sync or regeneration.
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {/* Channel bio */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Channel Bio</label>
        <p className="text-xs text-muted-foreground mb-2">
          Appears at the bottom of every video description.
        </p>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
        />
      </div>

      {/* Footer links */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Footer Links</label>
        <p className="text-xs text-muted-foreground mb-3">
          "Things you should check out" — band links are added dynamically from the DB.
        </p>
        <div className="space-y-2">
          {footerLinks.map((link, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={link.label}
                onChange={(e) => updateLink(i, 'label', e.target.value)}
                placeholder="Label"
                className="w-40 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <input
                type="url"
                value={link.url}
                onChange={(e) => updateLink(i, 'url', e.target.value)}
                placeholder="https://…"
                className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                onClick={() => removeLink(i)}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors px-1"
              >
                ✕
              </button>
            </div>
          ))}
          <button onClick={addLink} className="text-xs text-primary hover:underline">
            + Add link
          </button>
        </div>
      </div>

      {/* Contact emails */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Contact Emails</label>
        <p className="text-xs text-muted-foreground mb-3">
          Shown at the bottom of every description under // EMAIL //
        </p>
        <div className="space-y-2">
          {emails.map((email, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => updateEmail(i, e.target.value)}
                placeholder="contact@example.com"
                className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                onClick={() => removeEmail(i)}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors px-1"
              >
                ✕
              </button>
            </div>
          ))}
          <button onClick={addEmail} className="text-xs text-primary hover:underline">
            + Add email
          </button>
        </div>
      </div>

      {/* Prompt version */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Prompt Version</label>
        <p className="text-xs text-muted-foreground mb-2">
          Tracks which Claude prompt generated each proposal. Bump this when you change generation logic to re-generate only old-version videos.
        </p>
        <input
          type="text"
          value={promptVersion}
          onChange={(e) => setPromptVersion(e.target.value)}
          placeholder="v1"
          className="w-24 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* PubSubHubbub */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-medium text-foreground mb-1">YouTube Webhook Subscription</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Subscribes to PubSubHubbub so new uploads auto-appear in the review queue. Lease is 7 days — re-subscribe before it expires, or set up a cron to call this weekly.
        </p>
        <button
          onClick={subscribe}
          disabled={subscribing}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {subscribing ? 'Subscribing…' : 'Subscribe / Renew Webhook'}
        </button>
      </div>

      {/* Daily poll info */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-medium text-foreground mb-1">Daily Poll Cron</h3>
        <p className="text-xs text-muted-foreground">
          Fallback for missed webhook notifications. Hit{' '}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">
            GET /api/youtube/cron/daily-poll
          </code>{' '}
          with{' '}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">
            Authorization: Bearer $CRON_SECRET
          </code>{' '}
          daily (e.g. via EC2 cron or GitHub Actions schedule). Checks the last 48 h for new uploads not in the DB.
        </p>
      </div>
    </div>
  );
}
