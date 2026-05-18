-- Admin-controlled live stream override + DB-level YouTube API response cache.
-- Override: when set, /api/stream/youtube-status returns this video as live without calling YouTube API.
-- Cache: stores last YouTube API result so force-dynamic route doesn't hit API on every request.
ALTER TABLE youtube_config
  ADD COLUMN IF NOT EXISTS stream_override_video_id VARCHAR(20),
  ADD COLUMN IF NOT EXISTS yt_cache_video_id        VARCHAR(20),
  ADD COLUMN IF NOT EXISTS yt_cache_is_live         BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS yt_cache_title           TEXT,
  ADD COLUMN IF NOT EXISTS yt_cache_expires_at      TIMESTAMPTZ;
