import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    return NextResponse.json({ error: 'DATABASE_URL not set' }, { status: 500 });
  }

  // Mask password for safe logging
  const masked = url.replace(/:([^@]+)@/, ':***@');

  try {
    const rows = await query('SELECT COUNT(*) AS count FROM artists');
    const venues = await query('SELECT COUNT(*) AS count FROM venues');
    return NextResponse.json({
      ok: true,
      url: masked,
      artists: rows[0],
      venues: venues[0],
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      url: masked,
      error: err instanceof Error ? err.message : String(err),
    }, { status: 500 });
  }
}
