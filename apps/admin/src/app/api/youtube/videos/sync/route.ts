import { auth } from '@clerk/nextjs/server';
import {
  getDb,
  youtube_videos,
  youtube_playlists,
  youtube_config,
  artists,
  eq,
  sql,
} from '@stpetemusic/db';
import {
  listAllVideos,
  listVideosBatch,
  getUploadsPlaylistId,
  type VideoDetails,
} from '@/lib/youtube-client';
import { fetchEventsInRange, matchVideoToEvent, type CalendarEvent } from '@/lib/google-calendar';
// import { generateProposal, type YoutubeConfigData, type ArtistLink } from '@/lib/youtube-metadata';

// Allows long-running sync on EC2 / non-serverless deployments
export const maxDuration = 300;

// ─── Types ────────────────────────────────────────────────────────────────────

type DbPlaylist = { playlist_id: string; name: string; playlist_type: string };
type DbArtist = { id: string; name: string; instagram_url: string | null; website: string | null };

// ─── Helpers ─────────────────────────────────────────────────────────────────

type ArtistLink = { name: string; instagram_url: string | null; website: string | null };

/** Find artists from DB whose names appear in the event text. */
function matchArtistsToEvent(event: CalendarEvent, allArtists: DbArtist[]): ArtistLink[] {
  const text = `${event.title} ${event.description}`.toLowerCase();
  return allArtists
    .filter((a) => text.includes(a.name.toLowerCase()))
    .map((a) => ({ name: a.name, instagram_url: a.instagram_url, website: a.website }));
}

/** Extract venue name from calendar event location or fall back to Suite E. */
function extractVenue(event: CalendarEvent | null): string {
  if (!event?.location) return 'Suite E Studios';
  // Normalize common variant spellings
  if (event.location.toLowerCase().includes('suite e')) return 'Suite E Studios';
  return event.location.split(',')[0].trim();
}

/** Determine which stored playlists a video should belong to. */
function assignPlaylistIds(
  video: VideoDetails,
  event: CalendarEvent | null,
  playlists: DbPlaylist[],
): string[] {
  const ids: string[] = [];
  const year = video.publishedAt.getFullYear().toString();

  for (const pl of playlists) {
    const nameLower = pl.name.toLowerCase();

    if (video.isLivestream && nameLower.includes('livestream')) {
      ids.push(pl.playlist_id);
    } else if (video.isShort && nameLower.includes('short')) {
      ids.push(pl.playlist_id);
    } else if (pl.playlist_type === 'year' && nameLower === year) {
      ids.push(pl.playlist_id);
    } else if (
      event &&
      pl.playlist_type === 'series' &&
      event.title.toLowerCase().includes('final friday') &&
      nameLower.includes('final friday')
    ) {
      ids.push(pl.playlist_id);
    } else if (event?.location && pl.playlist_type === 'venue') {
      const locationLower = event.location.toLowerCase();
      if (locationLower.includes(pl.name.toLowerCase().split(' ')[0])) {
        ids.push(pl.playlist_id);
      }
    }
  }

  return ids;
}

/** Initial status for a freshly-generated proposal. */
function initialStatus(video: VideoDetails): string {
  return video.isLivestream ? 'needs_timestamps' : 'pending_review';
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    force?: boolean;
    batchMode?: boolean;
    pageToken?: string;
    uploadsPlaylistId?: string;
  };
  const force = body.force === true;
  const batchMode = body.batchMode === true;

  const errors: string[] = [];
  let added = 0;
  let updated = 0;
  let skipped = 0;
  let proposalsGenerated = 0;

  try {
    const db = getDb();

    // ── 1. Load supporting data ───────────────────────────────────────────────

    const [allArtists, allPlaylists, configRows] = await Promise.all([
      db
        .select({
          id: artists.id,
          name: artists.name,
          instagram_url: artists.instagram_url,
          website: artists.website,
        })
        .from(artists),
      db
        .select({
          playlist_id: youtube_playlists.playlist_id,
          name: youtube_playlists.name,
          playlist_type: youtube_playlists.playlist_type,
        })
        .from(youtube_playlists)
        .then((rows) => rows.map((r) => ({ ...r, playlist_type: r.playlist_type ?? 'venue' }))),
      db.select().from(youtube_config).limit(1),
    ]);

    const rawConfig = configRows[0];
    const config = {
      footer_links: rawConfig?.footer_links ?? [],
      channel_bio:
        rawConfig?.channel_bio ??
        'StPete Music is a youtube channel, website, and community that is dedicated to showing off the best musicians, artists, bands, and performers in the Greater Tampa Bay and St Petersburg, FL area.',
      contact_emails: rawConfig?.contact_emails ?? ['TheBurgMusic@gmail.com', 'Suite.E.StPete@gmail.com'],
      prompt_version: rawConfig?.prompt_version ?? 'v1',
    };

    // ── 2. Fetch YouTube videos (batch or full) ───────────────────────────────

    let ytVideos: VideoDetails[];
    let nextPageToken: string | undefined;
    let uploadsPlaylistId: string | undefined;

    try {
      if (batchMode) {
        uploadsPlaylistId = body.uploadsPlaylistId ?? (await getUploadsPlaylistId());
        const result = await listVideosBatch(uploadsPlaylistId, body.pageToken);
        ytVideos = result.videos;
        nextPageToken = result.nextPageToken;
      } else {
        ytVideos = await listAllVideos();
      }
    } catch (err) {
      console.error('YouTube API error during sync:', err);
      const msg = err instanceof Error ? err.message : String(err);
      return Response.json(
        { error: 'Failed to fetch videos from YouTube API', details: msg },
        { status: 502 },
      );
    }

    if (ytVideos.length === 0) {
      return Response.json({ added: 0, updated: 0, skipped: 0, proposalsGenerated: 0, errors: [] });
    }

    // ── 3. Determine which videos need proposals ───────────────────────────────

    const existingRows = await db
      .select({ video_id: youtube_videos.video_id, status: youtube_videos.status })
      .from(youtube_videos);

    const existingMap = new Map(existingRows.map((r) => [r.video_id, r.status]));

    // ── Batch mode: upsert raw YouTube data only, no Claude calls ─────────────
    if (batchMode) {
      for (const v of ytVideos) {
        const isNew = !existingMap.has(v.videoId);
        await db
          .insert(youtube_videos)
          .values({
            video_id: v.videoId,
            title: v.title,
            description: v.description,
            tags: v.tags,
            thumbnail_url: v.thumbnailUrl,
            duration_seconds: v.durationSeconds,
            published_at: v.publishedAt,
            is_livestream: v.isLivestream,
            is_short: v.isShort,
            view_count: v.viewCount,
            like_count: v.likeCount,
            comment_count: v.commentCount,
            privacy_status: v.privacyStatus,
            status: 'pending_review',
          })
          .onConflictDoUpdate({
            target: youtube_videos.video_id,
            set: {
              title: v.title,
              description: v.description,
              tags: v.tags,
              thumbnail_url: v.thumbnailUrl,
              duration_seconds: v.durationSeconds,
              is_livestream: v.isLivestream,
              is_short: v.isShort,
              view_count: v.viewCount,
              like_count: v.likeCount,
              comment_count: v.commentCount,
              privacy_status: v.privacyStatus,
              // status intentionally excluded — don't downgrade approved/published videos
            },
          });
        if (isNew) added++;
        else updated++;
      }
      return Response.json({
        added,
        updated,
        nextPageToken,
        uploadsPlaylistId,
        hasMore: !!nextPageToken,
      });
    }

    const needsProposal = (v: VideoDetails): boolean => {
      const status = existingMap.get(v.videoId);
      if (!status) return true; // new video
      if (force) return status === 'pending_review' || status === 'needs_timestamps';
      return false; // already has a proposal
    };

    // ── 4. Fetch calendar events for the full date range ──────────────────────

    let allEvents: CalendarEvent[] = [];
    const timestamps = ytVideos.map((v) => v.publishedAt.getTime());
    const rangeStart = new Date(Math.min(...timestamps) - 7 * 24 * 60 * 60 * 1000);
    const rangeEnd = new Date(Math.max(...timestamps) + 7 * 24 * 60 * 60 * 1000);

    try {
      allEvents = await fetchEventsInRange(rangeStart, rangeEnd);
    } catch (err) {
      errors.push(`Calendar API unavailable — videos will sync without calendar matching: ${String(err)}`);
    }

    // ── 5. Process each video ─────────────────────────────────────────────────

    for (const video of ytVideos) {
      const isNew = !existingMap.has(video.videoId);
      const generateForThis = needsProposal(video);

      const { event, confidence } = matchVideoToEvent(
        video.publishedAt,
        video.title,
        allEvents,
      );

      const venueName = extractVenue(event);
      const matchedArtists = event ? matchArtistsToEvent(event, allArtists) : [];
      const proposedPlaylistIds = assignPlaylistIds(video, event, allPlaylists);

      const baseFields = {
        title: video.title,
        description: video.description,
        tags: video.tags,
        thumbnail_url: video.thumbnailUrl,
        duration_seconds: video.durationSeconds,
        published_at: video.publishedAt,
        is_livestream: video.isLivestream,
        is_short: video.isShort,
        view_count: video.viewCount,
        like_count: video.likeCount,
        comment_count: video.commentCount,
        privacy_status: video.privacyStatus,
        calendar_event_id: event?.id ?? null,
        calendar_event_link: event?.htmlLink ?? null,
        calendar_match_confidence: confidence,
        proposed_playlist_ids: proposedPlaylistIds,
      };

      if (!generateForThis) {
        // Just update base metadata — don't touch proposals or status
        if (!isNew) {
          await db
            .update(youtube_videos)
            .set(baseFields)
            .where(eq(youtube_videos.video_id, video.videoId));
          skipped++;
        }
        continue;
      }

      // Generate proposal via Claude (commented out — re-enable when ready)
      const proposal = null;
      /*
      let proposal: Awaited<ReturnType<typeof generateProposal>> | null = null;
      try {
        proposal = await generateProposal({
          videoId: video.videoId,
          existingTitle: video.title,
          existingDescription: video.description,
          publishedAt: video.publishedAt,
          isLivestream: video.isLivestream,
          isShort: video.isShort,
          calendarEvent: event,
          confidence,
          artists: matchedArtists,
          venueName,
          config,
        });
        proposalsGenerated++;
      } catch (err) {
        errors.push(`Proposal generation failed for ${video.videoId}: ${String(err)}`);
      }
      */

      // Proposal generation is disabled — set status directly
      const fullRecord = {
        ...baseFields,
        status: 'pending_review',
      };

      if (isNew) {
        await db.insert(youtube_videos).values({ video_id: video.videoId, ...fullRecord });
        added++;
      } else {
        await db
          .update(youtube_videos)
          .set(fullRecord)
          .where(eq(youtube_videos.video_id, video.videoId));
        updated++;
      }
    }

    return Response.json({ added, updated, skipped, proposalsGenerated, errors });
  } catch (error) {
    console.error('YouTube sync failed:', error);
    return Response.json({ error: 'Sync failed', details: String(error) }, { status: 500 });
  }
}
