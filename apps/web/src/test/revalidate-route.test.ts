import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The route calls into Next's cache primitives; stub them so the tests exercise only the guard.
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

import { POST } from '../app/api/revalidate/route';

const SECRET = 'test-revalidation-secret';

function post(headers: Record<string, string> = {}, body: unknown = {}) {
  return POST(
    new Request('https://web.test/api/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    }),
  );
}

describe('POST /api/revalidate auth guard', () => {
  const original = process.env.REVALIDATION_SECRET;

  beforeEach(() => {
    delete process.env.REVALIDATION_SECRET;
  });

  afterEach(() => {
    if (original === undefined) delete process.env.REVALIDATION_SECRET;
    else process.env.REVALIDATION_SECRET = original;
  });

  // The regression this file exists for: the guard used to be `if (secret && ...)`, so an unset
  // secret disabled auth instead of denying the request, leaving the endpoint publicly callable.
  it('fails closed with 503 when REVALIDATION_SECRET is unset', async () => {
    const res = await post();
    expect(res.status).toBe(503);
  });

  it('still fails closed when the secret is unset even if a bearer token is supplied', async () => {
    const res = await post({ Authorization: `Bearer ${SECRET}` });
    expect(res.status).toBe(503);
  });

  it('rejects a request with no Authorization header', async () => {
    process.env.REVALIDATION_SECRET = SECRET;
    const res = await post();
    expect(res.status).toBe(401);
  });

  it('rejects a wrong token', async () => {
    process.env.REVALIDATION_SECRET = SECRET;
    const res = await post({ Authorization: 'Bearer not-the-secret' });
    expect(res.status).toBe(401);
  });

  it('accepts a correct token', async () => {
    process.env.REVALIDATION_SECRET = SECRET;
    const res = await post({ Authorization: `Bearer ${SECRET}` }, { scope: 'eventbrite' });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ revalidated: true, scope: 'eventbrite' });
  });
});
