import { getDb, youtube_videos, youtube_config, artists, eq } from '@stpetemusic/db';
import { listRecentVideos } from '@/lib/youtube-client';
import { fetchEventsInRange, matchVideoToEvent } from '@/lib/google-calendar';
import {
  generateProposal,
  type YoutubeConfigData,
  type ArtistLink,
} from '@/lib/youtube-metadata';

// Shared secret prevents accidental or unauthorized cron triggers
function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get('authorization');
  return header === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) return new Response('Unauthorized', { status: 401 });

  let added = 0;
  const errors: string[] = [];

  try {
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const recentVideos = await listRecentVideos(since);

    if (recentVideos.length === 0) {
      return Response.json({ added: 0, errors: [] });
    }

    const db = getDb();

    // Filter to only videos not already in DB
    const existingRows = await db
      .select({ video_id: youtube_videos.video_id })
      .from(youtube_videos)
      .where(eq(youtube_videos.video_id, recentVideos[0].videoId)); // quick existence check

    const existingIds = new Set(
      await db
        .select({ video_id: youtube_videos.video_id })
        .from(youtube_videos)
        .then((rows) => rows.map((r) => r.video_id)),
    );

    const newVideos = recentVideos.filter((v) => !existingIds.has(v.videoId));

    if (newVideos.length === 0) {
      return Response.json({ added: 0, errors: [] });
    }

    const [allArtists, configRows] = await Promise.all([
      db.select({ id: artists.id, name: artists.name, instagram_url: artists.instagram_url, website: artists.website }).from(artists),
      db.select().from(youtube_config).limit(1),
    ]);

    const rawConfig = configRows[0];
    const config: YoutubeConfigData = {
      footer_links: rawConfig?.footer_links ?? [],
      channel_bio: rawConfig?.channel_bio ?? '',
      contact_emails: rawConfig?.contact_emails ?? ['TheBurgMusic@gmail.com', 'Suite.E.StPete@gmail.com'],
      prompt_version: rawConfig?.prompt_version ?? 'v1',
    };

    for (const video of newVideos) {
      try {
        const rangeStart = new Date(video.publishedAt.getTime() - 7 * 24 * 60 * 60 * 1000);
        const rangeEnd = new Date(video.publishedAt.getTime() + 7 * 24 * 60 * 60 * 1000);

        let calendarEvent = null;
        let confidence: 'confirmed' | 'guessed' | 'none' = 'none';

        try {
          const events = await fetchEventsInRange(rangeStart, rangeEnd);
          const match = matchVideoToEvent(video.publishedAt, video.title, events);
          calendarEvent = match.event;
          confidence = match.confidence;
        } catch {
          // Continue without calendar data
        }

        const matchedArtists: ArtistLink[] = calendarEvent
          ? allArtists
              .filter((a) => `${calendarEvent!.title} ${calendarEvent!.description}`.toLowerCase().includes(a.name.toLowerCase()))
              .map((a) => ({ name: a.name, instagram_url: a.instagram_url, website: a.website }))
          : [];

        const venueName = calendarEvent?.location
          ? (calendarEvent.location.toLowerCase().includes('suite e') ? 'Suite E Studios' : calendarEvent.location.split(',')[0].trim())
          : 'Suite E Studios';

        const proposal = await generateProposal({
          videoId: video.videoId,
          existingTitle: video.title,
          existingDescription: video.description,
          publishedAt: video.publishedAt,
          isLivestream: video.isLivestream,
          isShort: video.isShort,
          calendarEvent,
          confidence,
          artists: matchedArtists,
          venueName,
          config,
        });

        await db.insert(youtube_videos).values({
          video_id: video.videoId,
          title: video.title,
          description: video.description,
          tags: video.tags,
          thumbnail_url: video.thumbnailUrl,
          duration_seconds: video.durationSeconds,
          published_at: video.publishedAt,
          is_livestream: video.isLivestream,
          is_short: video.isShort,
          proposed_title: proposal.proposedTitle,
          proposed_description: proposal.proposedDescription,
          proposed_tags: proposal.proposedTags,
          calendar_event_id: calendarEvent?.id ?? null,
          calendar_event_link: calendarEvent?.htmlLink ?? null,
          calendar_match_confidence: confidence,
          prompt_version: proposal.promptVersion,
          status: video.isLivestream ? 'needs_timestamps' : 'pending_review',
        });

        added++;
      } catch (err) {
        errors.push(`${video.videoId}: ${String(err)}`);
      }
    }

    return Response.json({ added, errors });
  } catch (error) {
    console.error('Daily YouTube poll failed:', error);
    return Response.json({ error: 'Daily poll failed', details: String(error) }, { status: 500 });
  }
}
