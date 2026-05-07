import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const PIXEL_ID = process.env.FACEBOOK_PIXEL_ID;
const ACCESS_TOKEN = process.env.FACEBOOK_SYSTEM_USER_TOKEN;

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

export async function POST(request: NextRequest) {
  if (!PIXEL_ID || !ACCESS_TOKEN) {
    return NextResponse.json({ error: 'Pixel not configured' }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.event_name) {
    return NextResponse.json({ error: 'event_name required' }, { status: 400 });
  }

  const { event_name, event_id, event_source_url, email, fbp, fbc, custom_data } = body;

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    '';
  const userAgent = request.headers.get('user-agent') ?? '';

  const userData: Record<string, string> = {};
  if (ip) userData.client_ip_address = ip;
  if (userAgent) userData.client_user_agent = userAgent;
  if (fbp) userData.fbp = fbp;
  if (fbc) userData.fbc = fbc;
  if (email) userData.em = sha256(email);

  const payload = {
    data: [
      {
        event_name,
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        ...(event_id ? { event_id } : {}),
        ...(event_source_url ? { event_source_url } : {}),
        user_data: userData,
        ...(custom_data ? { custom_data } : {}),
      },
    ],
  };

  const res = await fetch(
    `https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  );

  const result = await res.json();

  if (!res.ok) {
    return NextResponse.json({ error: result }, { status: 502 });
  }

  return NextResponse.json({ success: true, events_received: result.events_received });
}
