import { revalidatePath } from 'next/cache';

export async function POST(request: Request) {
  const secret = process.env.REVALIDATION_SECRET;
  const authHeader = request.headers.get('Authorization');

  // If a secret is configured, enforce it. If not, allow open access (cache-bust only, not destructive).
  if (secret && authHeader !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug, oldSlug } = await request.json();

  revalidatePath(`/discover/${slug}`);
  revalidatePath(`/venues/${slug}`);
  revalidatePath(`/blog/${slug}`);
  if (oldSlug && oldSlug !== slug) {
    revalidatePath(`/discover/${oldSlug}`);
    revalidatePath(`/venues/${oldSlug}`);
    revalidatePath(`/blog/${oldSlug}`);
  }
  revalidatePath('/discover');
  revalidatePath('/venues');
  revalidatePath('/blog');
  revalidatePath('/events');

  return Response.json({ revalidated: true });
}
