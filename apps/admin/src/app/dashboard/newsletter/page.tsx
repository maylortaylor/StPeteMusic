export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

interface ListmonkCampaign {
  id: number;
  name: string;
  subject: string;
  status: 'draft' | 'running' | 'scheduled' | 'paused' | 'cancelled' | 'finished';
  send_at: string | null;
  created_at: string;
  stats: {
    sent: number;
    views: number;
    clicks: number;
  };
}

const STATUS_STYLES: Record<ListmonkCampaign['status'], string> = {
  draft: 'bg-muted text-muted-foreground',
  running: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  scheduled: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  paused: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  finished: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
};

async function fetchCampaigns(): Promise<{ campaigns: ListmonkCampaign[]; error?: string }> {
  const apiUrl = process.env.LISTMONK_API_URL;
  const username = process.env.LISTMONK_USERNAME;
  const password = process.env.LISTMONK_PASSWORD;

  if (!apiUrl || !username || !password) {
    return {
      campaigns: [],
      error: 'Listmonk is not configured. Set LISTMONK_API_URL, LISTMONK_USERNAME, and LISTMONK_PASSWORD in your environment.',
    };
  }

  const credentials = Buffer.from(`${username}:${password}`).toString('base64');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(
      `${apiUrl}/api/campaigns?per_page=20&order_by=created_at&order=DESC`,
      {
        signal: controller.signal,
        headers: { Authorization: `Basic ${credentials}` },
        cache: 'no-store',
      },
    );
    clearTimeout(timeout);

    if (!res.ok) {
      console.error('[listmonk] Campaigns fetch failed:', res.status);
      return { campaigns: [], error: `Listmonk returned ${res.status}. Check credentials.` };
    }

    const json = await res.json() as { data: { results: ListmonkCampaign[] } };
    return { campaigns: json.data.results };
  } catch (err) {
    clearTimeout(timeout);
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[listmonk] Unreachable:', msg);
    return { campaigns: [], error: 'Could not connect to Listmonk. Is it running?' };
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function openRate(campaign: ListmonkCampaign): string {
  const { sent, views } = campaign.stats;
  if (!sent) return '—';
  return `${Math.round((views / sent) * 100)}%`;
}

export default async function NewsletterPage() {
  const listmonkUrl = process.env.LISTMONK_API_URL ?? 'https://listmonk.stpetemusic.live';
  const { campaigns, error } = await fetchCampaigns();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Newsletter</h1>
          <p className="mt-2 text-muted-foreground">
            Recent campaigns from Listmonk
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`${listmonkUrl}/campaigns/new`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            + New Campaign
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <Link
            href={listmonkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Open Listmonk
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {!error && campaigns.length === 0 && (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
          No campaigns found. Create your first campaign in Listmonk.
        </div>
      )}

      {campaigns.length > 0 && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Campaign</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Sent</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Open rate</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Created</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c, i) => (
                <tr
                  key={c.id}
                  className={i < campaigns.length - 1 ? 'border-b border-border' : ''}
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`${listmonkUrl}/campaigns/${c.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-foreground hover:underline"
                    >
                      {c.name}
                    </Link>
                    {c.subject && (
                      <p className="mt-0.5 text-xs text-muted-foreground truncate max-w-xs">
                        {c.subject}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[c.status]}`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {c.stats.sent ? c.stats.sent.toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {openRate(c)}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {formatDate(c.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
