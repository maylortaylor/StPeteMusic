-- StPeteMusic PostgreSQL Schema
-- Requires: pgcrypto extension for column-level encryption
--
-- Run: psql -U postgres -d stpetemusic -f schema.sql
--
-- ENCRYPTION: All decryption of PII requires the encryption key to be set:
--   psql: PGOPTIONS="-c app.encryption_key=YOUR_KEY" psql -U stpetemusic -d stpetemusic
--   docker exec: docker exec -i postgres bash -c 'PGOPTIONS="-c app.encryption_key=YOUR_KEY" psql -U stpetemusic -d stpetemusic'
--
-- Example query to decrypt email:
--   SELECT pgp_sym_decrypt(email, current_setting('app.encryption_key'))::TEXT FROM persons;

-- ---------------------------------------------------------------------------
-- EXTENSIONS
-- ---------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- PERSONS
-- People in the StPeteMusic network. May be artists, crew, staff, etc.
-- Sensitive PII fields (email, phone) are encrypted with pgcrypto.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS persons (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name    TEXT NOT NULL,
  last_name     TEXT,
  -- Encrypted: use pgp_sym_decrypt(email, current_setting('app.encryption_key')) to read
  email         BYTEA,
  phone         BYTEA,
  skills        TEXT[]   DEFAULT '{}',  -- e.g. ['artist', 'photographer', 'sound engineer']
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_persons_last_name ON persons (last_name);

COMMENT ON COLUMN persons.email IS 'pgp_sym_encrypt encrypted — use pgp_sym_decrypt(email, key) to read';
COMMENT ON COLUMN persons.phone IS 'pgp_sym_encrypt encrypted — use pgp_sym_decrypt(phone, key) to read';
COMMENT ON COLUMN persons.skills IS 'Array of roles, e.g. {artist,musician,photographer,sound engineer,door person,bartender,videographer,producer}';

-- ---------------------------------------------------------------------------
-- ARTISTS
-- Bands, solo acts, DJs, or creative entities.
-- Payment info (venmo, zelle, other_payment) is encrypted.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS artists (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             TEXT NOT NULL,
  username         TEXT,                       -- @handle used across platforms
  type             TEXT NOT NULL               -- Band | Solo Artist | DJ | SR. PRODUCER | Creative | Other
                   CHECK (type IN ('Band', 'Solo Artist', 'DJ', 'SR. PRODUCER', 'Creative', 'Other')),
  email            BYTEA,
  instagram_handle TEXT,
  instagram_url    TEXT,
  facebook_url     TEXT,
  youtube_url      TEXT,
  website          TEXT,
  linktree_url     TEXT,
  -- Payment info encrypted
  venmo            BYTEA,
  zelle            BYTEA,
  other_payment    BYTEA,
  notes            TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_artists_name       ON artists (name);
CREATE INDEX IF NOT EXISTS idx_artists_type       ON artists (type);
CREATE INDEX IF NOT EXISTS idx_artists_username   ON artists (username);
CREATE INDEX IF NOT EXISTS idx_artists_is_active  ON artists (is_active);

COMMENT ON COLUMN artists.email         IS 'pgp_sym_encrypt encrypted';
COMMENT ON COLUMN artists.venmo         IS 'pgp_sym_encrypt encrypted';
COMMENT ON COLUMN artists.zelle         IS 'pgp_sym_encrypt encrypted';
COMMENT ON COLUMN artists.other_payment IS 'pgp_sym_encrypt encrypted';

-- ---------------------------------------------------------------------------
-- VENUES
-- Performance venues, partner locations.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS venues (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT NOT NULL,
  address             TEXT,
  phone               BYTEA,
  email               BYTEA,
  instagram_url       TEXT,
  instagram_username  TEXT,
  facebook_url        TEXT,
  facebook_username   TEXT,
  contact_name        TEXT,
  notes               TEXT,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_venues_name ON venues (name);

COMMENT ON COLUMN venues.phone IS 'pgp_sym_encrypt encrypted';
COMMENT ON COLUMN venues.email IS 'pgp_sym_encrypt encrypted';

-- ---------------------------------------------------------------------------
-- ARTIST_MEMBERS  (many-to-many: persons ↔ artists)
-- A person can be in multiple bands; a band has multiple members.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS artist_members (
  artist_id          UUID NOT NULL REFERENCES artists (id) ON DELETE CASCADE,
  person_id          UUID NOT NULL REFERENCES persons (id) ON DELETE CASCADE,
  role               TEXT,           -- e.g. 'vocalist', 'guitarist', 'manager', 'booking agent'
  is_primary_contact BOOLEAN NOT NULL DEFAULT false,
  joined_at          TIMESTAMPTZ,
  PRIMARY KEY (artist_id, person_id)
);

CREATE INDEX IF NOT EXISTS idx_artist_members_person ON artist_members (person_id);

-- ---------------------------------------------------------------------------
-- POST_STATS
-- Per-post performance metrics for Instagram, YouTube, Facebook, TikTok.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS post_stats (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform         TEXT NOT NULL
                   CHECK (platform IN ('instagram', 'youtube', 'facebook', 'tiktok')),
  post_type        TEXT,           -- reel | photo | carousel | short | video | story
  platform_post_id TEXT UNIQUE,   -- native ID from the platform
  permalink        TEXT,
  caption          TEXT,           -- full post caption / description text
  published_at     TIMESTAMPTZ,
  duration_sec     INTEGER,        -- for video/reel/short
  views            BIGINT,
  reach            BIGINT,
  likes            BIGINT,
  shares           BIGINT,
  saves            BIGINT,
  follows          BIGINT,
  comments_count   BIGINT,
  artist_id        UUID REFERENCES artists (id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_post_stats_platform    ON post_stats (platform);
CREATE INDEX IF NOT EXISTS idx_post_stats_published   ON post_stats (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_stats_artist      ON post_stats (artist_id);

-- ---------------------------------------------------------------------------
-- ACCOUNT_SNAPSHOTS
-- Periodic snapshots of account-level metrics (followers, following, posts).
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS account_snapshots (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform       TEXT NOT NULL
                 CHECK (platform IN ('instagram', 'youtube', 'facebook', 'tiktok')),
  recorded_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  followers      BIGINT,
  following      BIGINT,
  posts_count    BIGINT,
  extra_metrics  JSONB DEFAULT '{}'  -- platform-specific extras (reach_30d, impressions, etc.)
);

CREATE INDEX IF NOT EXISTS idx_snapshots_platform    ON account_snapshots (platform);
CREATE INDEX IF NOT EXISTS idx_snapshots_recorded    ON account_snapshots (recorded_at DESC);

-- ---------------------------------------------------------------------------
-- IG_MENTIONS
-- Tracks how often handles are mentioned in @StPeteMusic posts.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ig_mentions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instagram_handle    TEXT NOT NULL UNIQUE,
  total_mentions      INTEGER NOT NULL DEFAULT 0,
  first_mentioned_at  TIMESTAMPTZ,
  last_mentioned_at   TIMESTAMPTZ,
  artist_id           UUID REFERENCES artists (id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ig_mentions_handle    ON ig_mentions (instagram_handle);
CREATE INDEX IF NOT EXISTS idx_ig_mentions_artist    ON ig_mentions (artist_id);

-- ---------------------------------------------------------------------------
-- TEMPLATES
-- Reusable content blocks: captions, descriptions, hashtag sets, prompts, emails.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS templates (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  platform   TEXT,           -- instagram | youtube | facebook | tiktok | all | null (platform-agnostic)
  type       TEXT NOT NULL
             CHECK (type IN ('post', 'caption', 'description', 'youtube_hashtags', 'prompt', 'email')),
  content    JSONB NOT NULL DEFAULT '{}',
             -- Structure varies by type:
             -- post/caption/description: { "raw": "...", "variables": ["bandName"] }
             -- youtube_hashtags:         { "raw": "#StPeteMusic #TampaBay ..." }  (≤ 500 chars)
             -- prompt:                   { "raw": "You are an AI assistant for StPeteMusic..." }
             -- email:                    { "subject": "...", "body": "..." }
  is_active  BOOLEAN NOT NULL DEFAULT true,
  tags       TEXT[]  DEFAULT '{}',    -- e.g. {final_friday, instagram_reel, booking}
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- YouTube hashtag character limit (max allowed by YouTube)
  CONSTRAINT chk_youtube_hashtags_length
    CHECK (
      type <> 'youtube_hashtags'
      OR length(content->>'raw') <= 500
    )
);

CREATE INDEX IF NOT EXISTS idx_templates_type      ON templates (type);
CREATE INDEX IF NOT EXISTS idx_templates_platform  ON templates (platform);
CREATE INDEX IF NOT EXISTS idx_templates_is_active ON templates (is_active);
CREATE INDEX IF NOT EXISTS idx_templates_tags      ON templates USING gin (tags);

-- ---------------------------------------------------------------------------
-- AUTO-UPDATE updated_at via trigger function
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_persons_updated_at
  BEFORE UPDATE ON persons
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER trg_artists_updated_at
  BEFORE UPDATE ON artists
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER trg_venues_updated_at
  BEFORE UPDATE ON venues
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER trg_post_stats_updated_at
  BEFORE UPDATE ON post_stats
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER trg_ig_mentions_updated_at
  BEFORE UPDATE ON ig_mentions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER trg_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
