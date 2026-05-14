import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

interface QuickLink {
  label: string;
  url: string;
  description: string;
}

const QUICK_LINKS: QuickLink[] = [
  { label: 'n8n', url: 'https://n8n.stpetemusic.live', description: 'Workflow automation' },
  { label: 'Listmonk', url: 'https://listmonk.stpetemusic.live', description: 'Newsletter management' },
  { label: 'Google Tag Manager', url: 'https://tagmanager.google.com/?authuser=0#/home', description: 'GTM container' },
  { label: 'Cloudflare', url: 'https://dash.cloudflare.com/c94347353e9e73208fedf5d889f260f2', description: 'DNS & security' },
  { label: 'Resend', url: 'https://resend.com/login', description: 'Email delivery' },
  { label: 'Google Cloud Console', url: 'https://console.cloud.google.com/welcome?project=spm-gcalendar-website', description: 'GCal website integration' },
  { label: 'AWS Console', url: 'https://console.aws.amazon.com', description: 'Cloud infrastructure' },
  { label: 'GitHub', url: 'https://github.com/maylortaylor/StPeteMusic', description: 'Source code' },
  { label: 'Clerk Dashboard', url: 'https://dashboard.clerk.com/apps/app_3DGkPMN8H4v1AxDdcBdAmgGTy4T/instances/ins_3DGkPNqfKc7Fh2nQH3aMQZjkHPR', description: 'Auth & user management' },
  { label: 'Microsoft Clarity', url: 'https://clarity.microsoft.com/projects/view/wnh6925i77/settings#setup', description: 'Analytics & heatmaps' },
];

// ── Social stat fetchers ────────────────────────────────────────────────────
// Returns { count, error } so the UI can distinguish "API error" from "not configured"

interface StatResult {
  count: number | null;
  error?: string;
}

async function fetchInstagramFollowers(): Promise<StatResult> {
  const igUserId = process.env.IG_USER_ID;
  const token = process.env.IG_ACCESS_TOKEN;
  if (!igUserId || !token) return { count: null };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${igUserId}?fields=followers_count&access_token=${token}`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return { count: null };
    const json = await res.json() as { followers_count?: number };
    return { count: json.followers_count ?? null };
  } catch {
    return { count: null };
  }
}

async function fetchFacebookFans(): Promise<StatResult> {
  const pageId = process.env.FB_PAGE_ID;
  const token = process.env.FB_ACCESS_TOKEN;
  if (!pageId || !token) return { count: null };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${pageId}?fields=fan_count&access_token=${token}`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: { message?: string } };
      return { count: null, error: body.error?.message ?? `HTTP ${res.status}` };
    }
    const json = await res.json() as { fan_count?: number };
    return { count: json.fan_count ?? null };
  } catch (e) {
    return { count: null, error: String(e) };
  }
}

async function fetchYouTubeSubscribers(): Promise<StatResult> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return { count: null };

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics&forHandle=StPeteMusic&key=${apiKey}`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: { message?: string } };
      return { count: null, error: body.error?.message ?? `HTTP ${res.status}` };
    }
    const json = await res.json() as {
      items?: { statistics?: { subscriberCount?: string } }[];
    };
    const raw = json.items?.[0]?.statistics?.subscriberCount;
    return { count: raw ? parseInt(raw, 10) : null };
  } catch (e) {
    return { count: null, error: String(e) };
  }
}

async function fetchListmonkSubscribers(): Promise<StatResult> {
  const apiUrl = process.env.LISTMONK_API_URL;
  const username = process.env.LISTMONK_USERNAME;
  const password = process.env.LISTMONK_PASSWORD;
  if (!apiUrl || !username || !password) return { count: null };

  try {
    const credentials = Buffer.from(`${username}:${password}`).toString('base64');
    const res = await fetch(`${apiUrl}/api/lists/3`, {
      headers: { Authorization: `Basic ${credentials}` },
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      return { count: null, error: `HTTP ${res.status}` };
    }
    const json = await res.json() as { data?: { subscriber_count?: number } };
    return { count: json.data?.subscriber_count ?? null };
  } catch (e) {
    return { count: null, error: String(e) };
  }
}

function formatCount(n: number | null): string {
  if (n === null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

// ── Page ────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const [instagram, facebook, youtube, listmonk] = await Promise.all([
    fetchInstagramFollowers(),
    fetchFacebookFans(),
    fetchYouTubeSubscribers(),
    fetchListmonkSubscribers(),
  ]);

  const stats = [
    { label: 'Instagram', sublabel: 'Followers', value: formatCount(instagram.count), configured: !!process.env.IG_USER_ID, error: instagram.error },
    { label: 'Facebook', sublabel: 'Page fans', value: formatCount(facebook.count), configured: !!process.env.FB_PAGE_ID, error: facebook.error },
    { label: 'YouTube', sublabel: 'Subscribers', value: formatCount(youtube.count), configured: !!process.env.YOUTUBE_API_KEY, error: youtube.error },
    { label: 'Newsletter', sublabel: 'Subscribers', value: formatCount(listmonk.count), configured: !!process.env.LISTMONK_API_URL, error: listmonk.error },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Welcome to the StPeteMusic admin dashboard</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-6">
            <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
            <p className="mt-2 text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">
              {!s.configured ? 'Not configured' : s.error ? 'API error' : s.sublabel}
            </p>
            {s.error && (
              <p className="mt-1 text-xs text-destructive truncate" title={s.error}>
                {s.error}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">Quick Links</h2>
        <div className="mt-4 grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start justify-between gap-2 rounded-md border border-border bg-background p-3 text-sm transition-colors hover:bg-muted"
            >
              <div className="min-w-0">
                <p className="font-medium text-foreground truncate">{link.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground truncate">{link.description}</p>
              </div>
              <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">Getting Started</h2>
        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
          <li>• Navigate to <strong>Artists</strong> to manage artist profiles</li>
          <li>• Use <strong>Venues</strong> to add performance locations</li>
          <li>• Organize content with <strong>Templates</strong></li>
          <li>• More features coming in Phase 2</li>
        </ul>
      </div>
    </div>
  );
}
