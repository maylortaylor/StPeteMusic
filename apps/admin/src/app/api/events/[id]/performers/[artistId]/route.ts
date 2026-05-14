import { auth } from '@clerk/nextjs/server';
import { getDb, event_performers, eq, and } from '@stpetemusic/db';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; artistId: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { id, artistId } = await params;
    const db = getDb();

    await db
      .delete(event_performers)
      .where(
        and(
          eq(event_performers.event_id, id),
          eq(event_performers.artist_id, artistId),
        ),
      );

    return Response.json({ success: true });
  } catch (error) {
    console.error('Failed to remove performer:', error);
    return Response.json({ error: 'Failed to remove performer' }, { status: 500 });
  }
}
