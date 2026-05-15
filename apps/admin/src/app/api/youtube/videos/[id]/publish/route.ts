import { auth } from '@clerk/nextjs/server';
import { getDb, youtube_videos, artists, eq, sql } from '@stpetemusic/db';
import { updateVideo, addVideoToPlaylist, postComment } from '@/lib/youtube-client';
import { buildPinnedComment, type ArtistLink } from '@/lib/youtube-metadata';

const DAILY_PUBLISH_CAP = 50;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const { id } = await params;
    const db = getDb();

    // Quota gate: count publishes since UTC midnight
    const todayMidnight = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z');

    const [quotaRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(youtube_videos)
      .where(sql`published_to_youtube_at >= ${todayMidnight}`);

    const publishedToday = quotaRow?.count ?? 0;
    if (publishedToday >= DAILY_PUBLISH_CAP) {
      return Response.json(
        { error: `Daily publish cap of ${DAILY_PUBLISH_CAP} reached. Remaining videos stay queued and will be available tomorrow.`, publishedToday },
        { status: 429 },
      );
    }

    // Load video — must be approved or already published (re-publish)
    const rows = await db
      .select()
      .from(youtube_videos)
      .where(eq(youtube_videos.video_id, id))
      .limit(1);

    if (rows.length === 0) {
      return Response.json({ error: 'Video not found' }, { status: 404 });
    }

    const video = rows[0];
    if (video.status !== 'approved' && video.status !== 'published') {
      return Response.json(
        { error: `Video must be approved before publishing (current status: ${video.status})` },
        { status: 400 },
      );
    }

    const proposedTitle = video.proposed_title ?? video.title ?? '';
    const proposedDescription = video.proposed_description ?? video.description ?? '';
    const proposedTags = video.proposed_tags ?? video.tags ?? [];

    // Write metadata to YouTube
    await updateVideo(id, {
      title: proposedTitle,
      description: proposedDescription,
      tags: proposedTags,
      categoryId: '10',
      defaultAudioLanguage: 'en',
    });

    // Add to proposed playlists (ignore if already in playlist)
    for (const playlistId of video.proposed_playlist_ids ?? []) {
      try {
        await addVideoToPlaylist(playlistId, id);
      } catch {
        // 409 / duplicate — video already in this playlist, safe to ignore
      }
    }

    // Build and post pinned comment
    const timestamps = (video.timestamps as { time: string; band_name: string; artist_id?: string }[] | null) ?? [];

    // Fetch artist links for comment
    const artistLinks: ArtistLink[] = [];
    for (const ts of timestamps) {
      if (ts.artist_id) {
        const artistRows = await db
          .select({ name: artists.name, instagram_url: artists.instagram_url, website: artists.website })
          .from(artists)
          .where(eq(artists.id, ts.artist_id))
          .limit(1);
        if (artistRows[0]) artistLinks.push(artistRows[0]);
      }
    }

    const commentText = buildPinnedComment({ timestamps, artists: artistLinks });
    if (commentText) {
      try {
        await postComment(id, commentText);
      } catch {
        // Comment posting is best-effort — don't fail the publish
      }
    }

    // Update DB record
    const [updated] = await db
      .update(youtube_videos)
      .set({ status: 'published', published_to_youtube_at: new Date() })
      .where(eq(youtube_videos.video_id, id))
      .returning();

    return Response.json({ ...updated, publishedToday: publishedToday + 1 });
  } catch (error) {
    console.error('Failed to publish video to YouTube:', error);
    return Response.json({ error: 'Failed to publish video' }, { status: 500 });
  }
}
