import { auth } from '@clerk/nextjs/server';
import { getDb, youtube_playlists } from '@stpetemusic/db';

export async function GET(_request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const db = getDb();
    const playlists = await db.select().from(youtube_playlists);

    return Response.json({ playlists });
  } catch (error) {
    console.error('Failed to fetch playlists:', error);
    return Response.json({ error: 'Failed to fetch playlists' }, { status: 500 });
  }
}
