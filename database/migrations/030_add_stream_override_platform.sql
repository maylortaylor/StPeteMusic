-- Extend stream override to support Facebook and Twitch in addition to YouTube.
-- stream_override_video_id widened to TEXT (Facebook URLs exceed 20 chars).
-- stream_override_platform tracks which embed to render on the public /live page.
ALTER TABLE youtube_config
  ALTER COLUMN stream_override_video_id TYPE TEXT,
  ADD COLUMN IF NOT EXISTS stream_override_platform VARCHAR(20) DEFAULT 'youtube';
