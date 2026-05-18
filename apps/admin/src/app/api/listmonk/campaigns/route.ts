export const runtime = 'nodejs';

import { auth } from '@clerk/nextjs/server';

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

interface ListmonkCampaignsResponse {
  data: {
    results: ListmonkCampaign[];
    total: number;
    page: number;
    per_page: number;
  };
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const apiUrl = process.env.LISTMONK_API_URL;
  const username = process.env.LISTMONK_USERNAME;
  const password = process.env.LISTMONK_PASSWORD;

  if (!apiUrl || !username || !password) {
    return Response.json(
      { error: 'Listmonk is not configured. Set LISTMONK_API_URL, LISTMONK_USERNAME, and LISTMONK_PASSWORD.' },
      { status: 503 },
    );
  }

  const credentials = Buffer.from(`${username}:${password}`).toString('base64');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  let res: Response;
  try {
    res = await fetch(
      `${apiUrl}/api/campaigns?per_page=20&order_by=created_at&order=DESC`,
      {
        signal: controller.signal,
        headers: {
          Authorization: `Basic ${credentials}`,
        },
        cache: 'no-store',
      },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[listmonk] Unreachable:', msg);
    return Response.json({ error: 'Listmonk service unreachable.' }, { status: 503 });
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('[listmonk] Campaigns fetch failed:', res.status, body);
    return Response.json({ error: 'Failed to fetch campaigns from Listmonk.' }, { status: 502 });
  }

  const json = (await res.json()) as ListmonkCampaignsResponse;
  return Response.json({ campaigns: json.data.results, total: json.data.total });
}
