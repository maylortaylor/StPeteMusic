-- Add YouTube video statistics captured at import time
ALTER TABLE youtube_videos
  ADD COLUMN IF NOT EXISTS view_count INTEGER,
  ADD COLUMN IF NOT EXISTS like_count INTEGER,
  ADD COLUMN IF NOT EXISTS comment_count INTEGER,
  ADD COLUMN IF NOT EXISTS privacy_status VARCHAR(20);
