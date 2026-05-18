import { getDb, youtube_videos, youtube_config, artists, eq } from '@stpetemusic/db';
import { listRecentVideos } from '@/lib/youtube-client';
import { fetchEventsInRange, matchVideoToEvent } from '@/lib/google-calendar';
import {
  generateProposal,
  type YoutubeConfigData,
  type ArtistLink,
} from '@/lib/youtube-metadata';

// PubSubHubbub verification — YouTube sends GET with hub.challenge
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('hub.challenge');
  if (!challenge) return new Response('Missing hub.challenge', { status: 400 });
  return new Response(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } });
}

// New video notification — YouTube sends POST with Atom XML body
export async function POST(request: Request) {
  try {
    const body = await request.text();
    const videoId = extractVideoId(body);

    if (!videoId) {
      // Could be a deletion notice or malformed — return 200 to stop retries
      return new Response('OK', { status: 200 });
    }

    const db = getDb();

    // Skip if already in DB (duplicate notification or manual sync)
    const existing = await db
      .select({ video_id: youtube_videos.video_id })
      .from(youtube_videos)
      .where(eq(youtube_videos.video_id, videoId))
      .limit(1);

    if (existing.length > 0) {
      return new Response('OK', { status: 200 });
    }

    // Fetch full video details from YouTube (the notification only has minimal data)
    const recent = await listRecentVideos(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    const video = recent.find((v) => v.videoId === videoId);

    if (!video) {
      // Video not found (private, deleted, or too old) — acknowledge and move on
      return new Response('OK', { status: 200 });
    }

    // Load supporting data
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

    // Calendar matching
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
      // Calendar unavailable — queue without calendar data
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

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('YouTube webhook processing error:', error);
    // Return 200 to prevent YouTube from retrying indefinitely
    return new Response('OK', { status: 200 });
  }
}

function extractVideoId(xml: string): string | null {
  const match = xml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
  return match?.[1]?.trim() ?? null;
}
