import { revalidatePath, revalidateTag } from 'next/cache';

export async function POST(request: Request) {
  const secret = process.env.REVALIDATION_SECRET;
  const authHeader = request.headers.get('Authorization');

  if (secret && authHeader !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { slug, oldSlug, scope } = body as { slug?: string; oldSlug?: string; scope?: string };

  if (scope === 'eventbrite') {
    revalidateTag('eventbrite-events', {});
    revalidatePath('/tickets', 'page');
    return Response.json({ revalidated: true, scope: 'eventbrite' });
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
