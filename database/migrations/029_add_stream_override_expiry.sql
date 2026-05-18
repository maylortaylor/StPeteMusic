-- Add expiry timestamp to admin stream override.
-- When set, the override is ignored after this time — prevents "forgot to clear" from lasting indefinitely.
ALTER TABLE youtube_config
  ADD COLUMN IF NOT EXISTS stream_override_expires_at TIMESTAMPTZ;
