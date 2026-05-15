import { auth } from '@clerk/nextjs/server';
import { getDb, youtube_videos, youtube_config, artists, eq } from '@stpetemusic/db';
import { fetchEventsInRange, matchVideoToEvent } from '@/lib/google-calendar';
import {
  generateProposal,
  type YoutubeConfigData,
  type ArtistLink,
} from '@/lib/youtube-metadata';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const { id } = await params;
    const db = getDb();

    const rows = await db
      .select()
      .from(youtube_videos)
      .where(eq(youtube_videos.video_id, id))
      .limit(1);

    if (rows.length === 0) {
      return Response.json({ error: 'Video not found' }, { status: 404 });
    }

    const video = rows[0];
    const publishedAt = video.published_at ?? new Date();

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

    const rangeStart = new Date(publishedAt.getTime() - 7 * 24 * 60 * 60 * 1000);
    const rangeEnd = new Date(publishedAt.getTime() + 7 * 24 * 60 * 60 * 1000);

    let calendarEvent = null;
    let confidence: 'confirmed' | 'guessed' | 'none' = 'none';

    try {
      const events = await fetchEventsInRange(rangeStart, rangeEnd);
      const match = matchVideoToEvent(publishedAt, video.title ?? '', events);
      calendarEvent = match.event;
      confidence = match.confidence;
    } catch {
      // Calendar unavailable — regenerate without it
    }

    const matchedArtists: ArtistLink[] = calendarEvent
      ? allArtists
          .filter((a) => {
            const text = `${calendarEvent.title} ${calendarEvent.description}`.toLowerCase();
            return text.includes(a.name.toLowerCase());
          })
          .map((a) => ({ name: a.name, instagram_url: a.instagram_url, website: a.website }))
      : [];

    const venueName =
      calendarEvent?.location
        ? (calendarEvent.location.toLowerCase().includes('suite e') ? 'Suite E Studios' : calendarEvent.location.split(',')[0].trim())
        : 'Suite E Studios';

    const proposal = await generateProposal({
      videoId: video.video_id,
      existingTitle: video.title ?? '',
      existingDescription: video.description ?? '',
      publishedAt,
      isLivestream: video.is_livestream ?? false,
      isShort: video.is_short ?? false,
      calendarEvent,
      confidence,
      artists: matchedArtists,
      venueName,
      config,
    });

    const updated = await db
      .update(youtube_videos)
      .set({
        proposed_title: proposal.proposedTitle,
        proposed_description: proposal.proposedDescription,
        proposed_tags: proposal.proposedTags,
        calendar_event_id: calendarEvent?.id ?? video.calendar_event_id,
        calendar_event_link: calendarEvent?.htmlLink ?? video.calendar_event_link,
        calendar_match_confidence: confidence,
        prompt_version: proposal.promptVersion,
      })
      .where(eq(youtube_videos.video_id, id))
      .returning();

    return Response.json(updated[0]);
  } catch (error) {
    console.error('Failed to regenerate proposal:', error);
    return Response.json({ error: 'Failed to regenerate proposal' }, { status: 500 });
  }
}
