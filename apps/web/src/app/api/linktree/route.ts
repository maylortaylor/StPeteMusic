import { NextResponse } from 'next/server';

const LINKTREE_API = 'https://qag1q0ijn5.execute-api.us-east-1.amazonaws.com/linktree';

export async function GET() {
  const res = await fetch(LINKTREE_API, { next: { revalidate: 300 } });

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch links' }, { status: res.status });
  }

  const data: unknown = await res.json();
  return NextResponse.json(data);
}
