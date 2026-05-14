import { auth } from '@clerk/nextjs/server';
import { getDb, events, eq } from '@stpetemusic/db';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const { id } = await params;
    const db = getDb();

    const result = await db
      .update(events)
      .set({
        review_status: 'approved',
        is_active: true,
        reviewed_by: userId,
        reviewed_at: new Date(),
      })
      .where(eq(events.id, id))
      .returning();

    if (result.length === 0) {
      return Response.json({ error: 'Event not found' }, { status: 404 });
    }

    return Response.json(result[0]);
  } catch (error) {
    console.error('Failed to approve event:', error);
    return Response.json({ error: 'Failed to approve event' }, { status: 500 });
  }
}
