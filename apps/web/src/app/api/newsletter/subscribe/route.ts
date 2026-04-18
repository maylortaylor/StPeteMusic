import { NextRequest, NextResponse } from 'next/server';

const LISTMONK_API_URL = process.env.LISTMONK_API_URL ?? 'http://localhost:9000';
const LISTMONK_USERNAME = process.env.LISTMONK_USERNAME ?? 'admin';
const LISTMONK_PASSWORD = process.env.LISTMONK_PASSWORD ?? '';
// The default list ID in Listmonk — set via env after first setup
const LISTMONK_LIST_ID = Number(process.env.LISTMONK_LIST_ID ?? '1');

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email: unknown = body?.email;

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ message: 'Valid email required.' }, { status: 400 });
  }

  const credentials = Buffer.from(`${LISTMONK_USERNAME}:${LISTMONK_PASSWORD}`).toString('base64');

  const res = await fetch(`${LISTMONK_API_URL}/api/subscribers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify({
      email,
      name: '',
      status: 'enabled',
      lists: [LISTMONK_LIST_ID],
      preconfirm_subscriptions: true,
    }),
  });

  if (res.ok) {
    return NextResponse.json({ message: 'Subscribed.' }, { status: 200 });
  }

  // 409 = already subscribed — treat as success
  if (res.status === 409) {
    return NextResponse.json({ message: 'Already subscribed.' }, { status: 200 });
  }

  return NextResponse.json({ message: 'Subscription failed. Try again.' }, { status: 500 });
}
