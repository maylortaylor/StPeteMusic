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
    revalidateTag('eventbrite-events');
    revalidatePath('/tickets');
    return Response.json({ revalidated: true, scope: 'eventbrite' });
  }

  if (slug) {
    revalidatePath(`/discover/${slug}`);
    revalidatePath(`/venues/${slug}`);
    revalidatePath(`/blog/${slug}`);
    if (oldSlug && oldSlug !== slug) {
      revalidatePath(`/discover/${oldSlug}`);
      revalidatePath(`/venues/${oldSlug}`);
      revalidatePath(`/blog/${oldSlug}`);
    }
  }

  revalidatePath('/discover');
  revalidatePath('/venues');
  revalidatePath('/blog');
  revalidatePath('/events');
  revalidatePath('/tickets');

  return Response.json({ revalidated: true });
}
