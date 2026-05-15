import { auth } from '@clerk/nextjs/server';
import { getDb, youtube_playlists, eq } from '@stpetemusic/db';
import { listPlaylists } from '@/lib/youtube-client';

/** Classify playlist type from its name. */
function inferPlaylistType(name: string): string {
  const lower = name.toLowerCase();
  if (/^\d{4}$/.test(lower)) return 'year';
  if (lower.includes('livestream')) return 'content_type';
  if (lower.includes('short')) return 'content_type';
  if (lower.includes('final friday') || lower.includes('instant noodle')) return 'series';
  return 'venue';
}

export async function POST(_request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const db = getDb();

    const ytPlaylists = await listPlaylists();

    let added = 0;
    let updated = 0;

    for (const pl of ytPlaylists) {
      const existing = await db
        .select({ playlist_id: youtube_playlists.playlist_id })
        .from(youtube_playlists)
        .where(eq(youtube_playlists.playlist_id, pl.playlistId))
        .limit(1);

      const record = {
        name: pl.name,
        description: pl.description,
        video_count: pl.videoCount,
        playlist_type: inferPlaylistType(pl.name),
        synced_at: new Date(),
      };

      if (existing.length === 0) {
        await db.insert(youtube_playlists).values({ playlist_id: pl.playlistId, ...record });
        added++;
      } else {
        await db
          .update(youtube_playlists)
          .set(record)
          .where(eq(youtube_playlists.playlist_id, pl.playlistId));
        updated++;
      }
    }

    return Response.json({ added, updated, total: ytPlaylists.length });
  } catch (error) {
    console.error('Playlist sync failed:', error);
    return Response.json({ error: 'Playlist sync failed' }, { status: 500 });
  }
}
