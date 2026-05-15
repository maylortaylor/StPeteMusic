import { google } from 'googleapis';

// ─── Types ────────────────────────────────────────────────────────────────────

export type VideoDetails = {
  videoId: string;
  title: string;
  description: string;
  tags: string[];
  thumbnailUrl: string;
  durationSeconds: number;
  publishedAt: Date;
  isLivestream: boolean;
  isShort: boolean;
};

export type PlaylistDetails = {
  playlistId: string;
  name: string;
  description: string;
  videoCount: number;
};

export type VideoUpdatePayload = {
  title: string;
  description: string;
  tags: string[];
  categoryId?: string;
  defaultAudioLanguage?: string;
};

/** Quota cost (units) per API call type — YouTube Data API v3 daily limit: 10,000. */
export const QUOTA_COST = {
  VIDEOS_LIST: 1,       // per request of up to 50 videos
  VIDEOS_UPDATE: 50,    // per video updated
  PLAYLISTS_INSERT: 50,
  PLAYLIST_ITEMS_INSERT: 50,
  COMMENT_INSERT: 50,
} as const;

// ─── Auth ─────────────────────────────────────────────────────────────────────

function buildOAuth2Client() {
  const clientId = process.env.YOUTUBE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      'Missing YouTube OAuth env vars: YOUTUBE_OAUTH_CLIENT_ID, YOUTUBE_OAUTH_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN',
    );
  }

  const auth = new google.auth.OAuth2(clientId, clientSecret);
  auth.setCredentials({ refresh_token: refreshToken });
  return auth;
}

function yt() {
  return google.youtube({ version: 'v3', auth: buildOAuth2Client() });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Parse ISO 8601 duration (PT1H2M3S) to total seconds. */
function parseDuration(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] ?? '0') * 3600) + (parseInt(m[2] ?? '0') * 60) + parseInt(m[3] ?? '0');
}

function detectShort(durationSeconds: number, title: string, description: string): boolean {
  if (durationSeconds > 0 && durationSeconds < 180) return true;
  const combined = `${title} ${description}`.toLowerCase();
  return combined.includes('#shorts');
}

async function getUploadsPlaylistId(): Promise<string> {
  const res = await yt().channels.list({ part: ['contentDetails'], mine: true });
  const id = res.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!id) throw new Error('Could not find uploads playlist for authenticated channel');
  return id;
}

// ─── Channel Videos ──────────────────────────────────────────────────────────

/**
 * Fetch every video uploaded to the channel.
 * Quota cost: ~(totalVideos / 50) + (totalVideos / 50) units — very cheap.
 */
export async function listAllVideos(): Promise<VideoDetails[]> {
  const client = yt();
  const uploadsPlaylistId = await getUploadsPlaylistId();

  // Collect all video IDs by paging through the uploads playlist
  const videoIds: string[] = [];
  let pageToken: string | undefined;

  do {
    const res = await client.playlistItems.list({
      part: ['contentDetails'],
      playlistId: uploadsPlaylistId,
      maxResults: 50,
      pageToken,
    });
    for (const item of res.data.items ?? []) {
      const id = item.contentDetails?.videoId;
      if (id) videoIds.push(id);
    }
    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);

  // Fetch full details in batches of 50 (1 quota unit per batch)
  const videos: VideoDetails[] = [];

  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const res = await client.videos.list({
      part: ['snippet', 'contentDetails', 'liveStreamingDetails'],
      id: batch,
    });

    for (const item of res.data.items ?? []) {
      const durationSeconds = parseDuration(item.contentDetails?.duration ?? '');
      const title = item.snippet?.title ?? '';
      const description = item.snippet?.description ?? '';

      videos.push({
        videoId: item.id!,
        title,
        description,
        tags: item.snippet?.tags ?? [],
        thumbnailUrl:
          item.snippet?.thumbnails?.maxres?.url ??
          item.snippet?.thumbnails?.high?.url ??
          '',
        durationSeconds,
        publishedAt: new Date(item.snippet?.publishedAt ?? Date.now()),
        isLivestream: !!item.liveStreamingDetails,
        isShort: detectShort(durationSeconds, title, description),
      });
    }
  }

  return videos;
}

// ─── Video Metadata ───────────────────────────────────────────────────────────

/**
 * Write updated metadata to a YouTube video.
 * Costs QUOTA_COST.VIDEOS_UPDATE (50 units) per call.
 */
export async function updateVideo(videoId: string, payload: VideoUpdatePayload): Promise<void> {
  await yt().videos.update({
    part: ['snippet'],
    requestBody: {
      id: videoId,
      snippet: {
        title: payload.title,
        description: payload.description,
        tags: payload.tags,
        categoryId: payload.categoryId ?? '10',
        defaultAudioLanguage: payload.defaultAudioLanguage ?? 'en',
      },
    },
  });
}

// ─── Playlists ────────────────────────────────────────────────────────────────

export async function listPlaylists(): Promise<PlaylistDetails[]> {
  const client = yt();
  const playlists: PlaylistDetails[] = [];
  let pageToken: string | undefined;

  do {
    const res = await client.playlists.list({
      part: ['snippet', 'contentDetails'],
      mine: true,
      maxResults: 50,
      pageToken,
    });
    for (const item of res.data.items ?? []) {
      playlists.push({
        playlistId: item.id!,
        name: item.snippet?.title ?? '',
        description: item.snippet?.description ?? '',
        videoCount: item.contentDetails?.itemCount ?? 0,
      });
    }
    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);

  return playlists;
}

/** Create a public playlist. Returns the new playlist ID. */
export async function createPlaylist(name: string, description: string): Promise<string> {
  const res = await yt().playlists.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: { title: name, description },
      status: { privacyStatus: 'public' },
    },
  });
  const id = res.data.id;
  if (!id) throw new Error('Playlist creation returned no ID');
  return id;
}

export async function addVideoToPlaylist(playlistId: string, videoId: string): Promise<void> {
  await yt().playlistItems.insert({
    part: ['snippet'],
    requestBody: {
      snippet: {
        playlistId,
        resourceId: { kind: 'youtube#video', videoId },
      },
    },
  });
}

// ─── Channel Info ─────────────────────────────────────────────────────────────

/** Returns the authenticated channel's YouTube channel ID. */
export async function getChannelId(): Promise<string> {
  const res = await yt().channels.list({ part: ['id'], mine: true });
  const id = res.data.items?.[0]?.id;
  if (!id) throw new Error('Could not determine authenticated channel ID');
  return id;
}

/**
 * Fetch videos uploaded since `since`. Pages through the uploads playlist
 * newest-first and stops once items are older than the cutoff.
 * Much cheaper than a full sync for the daily-poll use case.
 */
export async function listRecentVideos(since: Date): Promise<VideoDetails[]> {
  const client = yt();
  const uploadsPlaylistId = await getUploadsPlaylistId();

  const recentIds: string[] = [];
  let pageToken: string | undefined;
  let done = false;

  do {
    const res = await client.playlistItems.list({
      part: ['contentDetails'],
      playlistId: uploadsPlaylistId,
      maxResults: 50,
      pageToken,
    });

    for (const item of res.data.items ?? []) {
      const publishedAt = item.contentDetails?.videoPublishedAt;
      const id = item.contentDetails?.videoId;
      if (!id || !publishedAt) continue;

      if (new Date(publishedAt) >= since) {
        recentIds.push(id);
      } else {
        done = true;
        break;
      }
    }

    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken && !done);

  if (recentIds.length === 0) return [];

  const res = await client.videos.list({
    part: ['snippet', 'contentDetails', 'liveStreamingDetails'],
    id: recentIds,
  });

  return (res.data.items ?? []).map((item) => {
    const durationSeconds = parseDuration(item.contentDetails?.duration ?? '');
    const title = item.snippet?.title ?? '';
    const description = item.snippet?.description ?? '';
    return {
      videoId: item.id!,
      title,
      description,
      tags: item.snippet?.tags ?? [],
      thumbnailUrl:
        item.snippet?.thumbnails?.maxres?.url ??
        item.snippet?.thumbnails?.high?.url ??
        '',
      durationSeconds,
      publishedAt: new Date(item.snippet?.publishedAt ?? Date.now()),
      isLivestream: !!item.liveStreamingDetails,
      isShort: detectShort(durationSeconds, title, description),
    };
  });
}

// ─── Comments ─────────────────────────────────────────────────────────────────

/**
 * Post a top-level comment on a video as the channel owner.
 * Note: the YouTube Data API v3 does not support pinning comments programmatically.
 * After posting, pin manually in YouTube Studio if desired.
 */
export async function postComment(videoId: string, text: string): Promise<string> {
  const res = await yt().commentThreads.insert({
    part: ['snippet'],
    requestBody: {
      snippet: {
        videoId,
        topLevelComment: { snippet: { textOriginal: text } },
      },
    },
  });
  const id = res.data.id;
  if (!id) throw new Error('Comment insertion returned no ID');
  return id;
}
