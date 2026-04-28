import { NextResponse } from 'next/server';

const LISTMONK_API_URL = process.env.LISTMONK_API_URL ?? 'http://localhost:9000';

export async function GET() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  let result: Record<string, unknown>;
  try {
    const res = await fetch(`${LISTMONK_API_URL}/api/health`, {
      signal: controller.signal,
      method: 'GET',
    });
    result = {
      ok: true,
      status: res.status,
      url: LISTMONK_API_URL,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const cause = err instanceof Error && 'cause' in err
      ? String((err as NodeJS.ErrnoException & { cause?: unknown }).cause)
      : undefined;
    result = {
      ok: false,
      error: msg,
      cause,
      url: LISTMONK_API_URL,
    };
  } finally {
    clearTimeout(timeout);
  }

  return NextResponse.json(result);
}
