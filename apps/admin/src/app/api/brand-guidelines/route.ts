import { auth } from '@clerk/nextjs/server';
import { getDb, brand_guidelines, eq, desc } from '@stpetemusic/db';

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    const db = getDb();

    const results = activeOnly
      ? await db.select().from(brand_guidelines).where(eq(brand_guidelines.is_active, true))
      : await db.select().from(brand_guidelines).orderBy(desc(brand_guidelines.created_at));

    return Response.json({ guidelines: results });
  } catch (error) {
    console.error('Failed to fetch brand guidelines:', error);
    return Response.json({ error: 'Failed to fetch brand guidelines' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const data = await request.json();
    const { name, system_prompt, tone_descriptors, hashtag_library, example_posts } = data;

    if (!name || !system_prompt) {
      return Response.json({ error: 'name and system_prompt are required' }, { status: 400 });
    }

    const db = getDb();

    // Get next version number
    const existing = await db.select({ version: brand_guidelines.version }).from(brand_guidelines).orderBy(desc(brand_guidelines.version));
    const nextVersion = existing.length > 0 ? (existing[0].version ?? 0) + 1 : 1;

    const result = await db
      .insert(brand_guidelines)
      .values({
        version: nextVersion,
        name,
        system_prompt,
        tone_descriptors: tone_descriptors ?? [],
        hashtag_library: hashtag_library ?? [],
        example_posts: example_posts ?? [],
        is_active: false,
      })
      .returning();

    return Response.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Failed to create brand guidelines:', error);
    return Response.json({ error: 'Failed to create brand guidelines' }, { status: 500 });
  }
}
