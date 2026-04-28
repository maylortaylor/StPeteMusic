import { NextResponse } from 'next/server';

const LISTMONK_API_URL = process.env.LISTMONK_API_URL ?? 'http://localhost:9000';
const LISTMONK_USERNAME = process.env.LISTMONK_USERNAME ?? 'admin';
const LISTMONK_PASSWORD = process.env.LISTMONK_PASSWORD ?? '';

export async function GET() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  const credentials = Buffer.from(`${LISTMONK_USERNAME}:${LISTMONK_PASSWORD}`).toString('base64');

  let result: Record<string, unknown>;
  try {
    const res = await fetch(`${LISTMONK_API_URL}/api/subscribers`, {
      signal: controller.signal,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Basic ${credentials}` },
      body: JSON.stringify({ email: 'healthcheck@example.com', name: '', status: 'enabled', lists: [1], preconfirm_subscriptions: true }),
    });
    const body = await res.text();
    result = {
      url: LISTMONK_API_URL,
      username: LISTMONK_USERNAME,
      passwordSet: LISTMONK_PASSWORD !== '',
      status: res.status,
      ok: res.ok,
      body: body.slice(0, 200),
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result = { ok: false, error: msg, url: LISTMONK_API_URL };
  } finally {
    clearTimeout(timeout);
  }

  return NextResponse.json(result);
}
