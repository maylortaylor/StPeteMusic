import { auth } from '@clerk/nextjs/server';
import { getDb, social_posts, eq } from '@stpetemusic/db';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const { id } = await params;
    const data = await request.json().catch(() => ({}));
    const { notes } = data as { notes?: string };

    const db = getDb();
    const result = await db
      .update(social_posts)
      .set({
        status: 'approved',
        approved_by: userId,
        approval_notes: notes ?? null,
        approval_timestamp: new Date(),
      })
      .where(eq(social_posts.id, id))
      .returning();

    if (result.length === 0) {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }

    return Response.json(result[0]);
  } catch (error) {
    console.error('Failed to approve social post:', error);
    return Response.json({ error: 'Failed to approve social post' }, { status: 500 });
  }
}
