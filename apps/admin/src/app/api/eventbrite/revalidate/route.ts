import { auth } from '@clerk/nextjs/server';

export async function POST() {
  const { userId } = await auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const webAppUrl = process.env.WEB_APP_URL;
  const secret = process.env.REVALIDATION_SECRET;

  if (!webAppUrl || !secret) {
    return Response.json(
      { error: 'WEB_APP_URL or REVALIDATION_SECRET not configured on admin app' },
      { status: 500 },
    );
  }

  try {
    const res = await fetch(`${webAppUrl}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ scope: 'eventbrite' }),
    });

    if (!res.ok) {
      const body = await res.text();
      return Response.json(
        { error: `Revalidation returned ${res.status}: ${body}` },
        { status: 502 },
      );
    }

    return Response.json({ revalidated: true });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Failed to reach web app' },
      { status: 502 },
    );
  }
}
