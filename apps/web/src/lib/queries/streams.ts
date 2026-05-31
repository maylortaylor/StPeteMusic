import { query } from '@/lib/db';

export interface PastLivestream {
  video_id: string;
  title: string | null;
  proposed_title: string | null;
  description: string | null;
  proposed_description: string | null;
  thumbnail_url: string | null;
  published_at: string | null;
  view_count: number | null;
  duration_seconds: number | null;
}

export async function getPastLivestreams(): Promise<PastLivestream[]> {
  return query<PastLivestream>(`
    SELECT video_id, title, proposed_title, description, proposed_description,
           thumbnail_url, published_at::TEXT AS published_at,
           view_count, duration_seconds
    FROM youtube_videos
    WHERE is_livestream = true
      AND privacy_status = 'public'
      AND status = 'published'
    ORDER BY published_at DESC
    LIMIT 20
  `);
}
