import { auth } from '@clerk/nextjs/server';
import { getDb, brand_guidelines, eq } from '@stpetemusic/db';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const { id } = await params;
    const db = getDb();
    const result = await db.select().from(brand_guidelines).where(eq(brand_guidelines.id, id));

    if (result.length === 0) {
      return Response.json({ error: 'Guidelines not found' }, { status: 404 });
    }

    return Response.json(result[0]);
  } catch (error) {
    console.error('Failed to fetch brand guidelines:', error);
    return Response.json({ error: 'Failed to fetch brand guidelines' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const { id } = await params;
    const data = await request.json();
    const { name, system_prompt, tone_descriptors, hashtag_library, example_posts } = data;

    const db = getDb();
    const result = await db
      .update(brand_guidelines)
      .set({
        ...(name !== undefined && { name }),
        ...(system_prompt !== undefined && { system_prompt }),
        ...(tone_descriptors !== undefined && { tone_descriptors }),
        ...(hashtag_library !== undefined && { hashtag_library }),
        ...(example_posts !== undefined && { example_posts }),
      })
      .where(eq(brand_guidelines.id, id))
      .returning();

    if (result.length === 0) {
      return Response.json({ error: 'Guidelines not found' }, { status: 404 });
    }

    return Response.json(result[0]);
  } catch (error) {
    console.error('Failed to update brand guidelines:', error);
    return Response.json({ error: 'Failed to update brand guidelines' }, { status: 500 });
  }
}
