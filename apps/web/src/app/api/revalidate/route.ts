import { revalidatePath, revalidateTag } from 'next/cache';

export async function POST(request: Request) {
  const secret = process.env.REVALIDATION_SECRET;
  const authHeader = request.headers.get('Authorization');

  // Fail closed. This was previously `if (secret && authHeader !== ...)`, which skipped the auth
  // check entirely whenever REVALIDATION_SECRET was unset — and it *was* unset in production, so
  // anyone could POST here and force cache invalidation in a loop. A missing secret is a
  // misconfiguration, never permission to serve unauthenticated revalidation.
  // 503 rather than 401 so a misconfigured deploy is distinguishable from a bad token in logs.
  if (!secret) {
    return Response.json({ error: 'Revalidation is not configured' }, { status: 503 });
  }

  if (authHeader !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { slug, oldSlug, scope } = body as { slug?: string; oldSlug?: string; scope?: string };

  if (scope === 'eventbrite') {
    revalidateTag('eventbrite-events', {});
    revalidatePath('/tickets', 'page');
    return Response.json({ revalidated: true, scope: 'eventbrite' });
  }

  if (scope === 'tickets') {
    // Anything that can change what's shown on /tickets — Eventbrite-sourced
    // or the show_on_tickets-flagged events (Facebook, Google Calendar, etc.)
    revalidateTag('eventbrite-events', {});
    revalidateTag('featured-tickets', {});
    revalidatePath('/tickets', 'page');
    return Response.json({ revalidated: true, scope: 'tickets' });
  }

  if (slug) {
    revalidatePath(`/discover/${slug}`, 'page');
    revalidatePath(`/venues/${slug}`, 'page');
    revalidatePath(`/blog/${slug}`, 'page');
    if (oldSlug && oldSlug !== slug) {
      revalidatePath(`/discover/${oldSlug}`, 'page');
      revalidatePath(`/venues/${oldSlug}`, 'page');
      revalidatePath(`/blog/${oldSlug}`, 'page');
    }
  }

  revalidatePath('/discover', 'page');
  revalidatePath('/venues', 'page');
  revalidatePath('/blog', 'page');
  revalidatePath('/events', 'page');
  revalidatePath('/tickets', 'page');

  return Response.json({ revalidated: true });
}
