-- YouTube integration tables

CREATE TABLE IF NOT EXISTS youtube_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  footer_links JSONB NOT NULL DEFAULT '[]',
  channel_bio TEXT NOT NULL DEFAULT '',
  contact_emails JSONB NOT NULL DEFAULT '[]',
  prompt_version VARCHAR(50) NOT NULL DEFAULT 'v1',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default config (idempotent)
INSERT INTO youtube_config (footer_links, channel_bio, contact_emails)
SELECT
  '[{"label":"St Pete Music","url":"https://StPeteMusic.live"},{"label":"St Pete Music Instagram","url":"https://www.instagram.com/stpetemusic/"},{"label":"St Pete Music Facebook","url":"https://www.facebook.com/stpeteflmusic/"},{"label":"Suite E Studios","url":"https://SuiteEStudios.com/"}]',
  'StPete Music is a youtube channel, website, and community that is dedicated to showing off the best musicians, artists, bands, and performers in the Greater Tampa Bay and St Petersburg, FL area. Our website has links to all the bands and venues you see.',
  '["TheBurgMusic@gmail.com","Suite.E.StPete@gmail.com"]'
WHERE NOT EXISTS (SELECT 1 FROM youtube_config);

CREATE TABLE IF NOT EXISTS youtube_videos (
  video_id VARCHAR(20) PRIMARY KEY,
  title TEXT,
  description TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  published_at TIMESTAMPTZ,
  is_livestream BOOLEAN NOT NULL DEFAULT FALSE,
  is_short BOOLEAN NOT NULL DEFAULT FALSE,
  proposed_title TEXT,
  proposed_description TEXT,
  proposed_tags TEXT[] NOT NULL DEFAULT '{}',
  proposed_playlist_ids TEXT[] NOT NULL DEFAULT '{}',
  -- status: pending_review | approved | published | needs_timestamps | skipped
  status TEXT NOT NULL DEFAULT 'pending_review',
  prompt_version VARCHAR(50),
  calendar_event_id TEXT,
  calendar_event_link TEXT,
  -- calendar_match_confidence: confirmed | guessed | none
  calendar_match_confidence TEXT NOT NULL DEFAULT 'none',
  -- timestamps: [{time: "1:14:30", band_name: "...", artist_id?: "uuid"}]
  timestamps JSONB NOT NULL DEFAULT '[]',
  reviewed_at TIMESTAMPTZ,
  published_to_youtube_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_youtube_videos_status ON youtube_videos(status);
CREATE INDEX IF NOT EXISTS idx_youtube_videos_published_at ON youtube_videos(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_youtube_videos_confidence ON youtube_videos(calendar_match_confidence);

CREATE TABLE IF NOT EXISTS youtube_playlists (
  playlist_id VARCHAR(50) PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  video_count INTEGER NOT NULL DEFAULT 0,
  -- playlist_type: venue | year | series | content_type
  playlist_type TEXT NOT NULL DEFAULT 'venue',
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
