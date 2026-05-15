import { auth } from '@clerk/nextjs/server';
import { getDb, youtube_playlists } from '@stpetemusic/db';
import { createPlaylist } from '@/lib/youtube-client';

const VALID_TYPES = ['venue', 'year', 'series', 'content_type'] as const;
type PlaylistType = (typeof VALID_TYPES)[number];

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const body = await request.json();
    const { name, description, playlist_type } = body as {
      name?: string;
      description?: string;
      playlist_type?: string;
    };

    if (!name?.trim()) {
      return Response.json({ error: 'name is required' }, { status: 400 });
    }

    const type: PlaylistType = VALID_TYPES.includes(playlist_type as PlaylistType)
      ? (playlist_type as PlaylistType)
      : 'venue';

    const db = getDb();

    const youtubePlaylistId = await createPlaylist(name.trim(), description?.trim() ?? '');

    const [record] = await db
      .insert(youtube_playlists)
      .values({
        playlist_id: youtubePlaylistId,
        name: name.trim(),
        description: description?.trim() ?? '',
        video_count: 0,
        playlist_type: type,
        synced_at: new Date(),
      })
      .returning();

    return Response.json(record, { status: 201 });
  } catch (error) {
    console.error('Failed to create playlist:', error);
    return Response.json({ error: 'Failed to create playlist' }, { status: 500 });
  }
}
