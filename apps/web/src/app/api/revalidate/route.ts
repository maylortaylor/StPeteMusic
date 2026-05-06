import { revalidatePath } from 'next/cache';

export async function POST(request: Request) {
  const secret = process.env.REVALIDATION_SECRET;
  const authHeader = request.headers.get('Authorization');

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug, oldSlug } = await request.json();

  revalidatePath(`/discover/${slug}`);
  if (oldSlug && oldSlug !== slug) {
    revalidatePath(`/discover/${oldSlug}`);
  }
  revalidatePath('/discover');

  return Response.json({ revalidated: true });
}
