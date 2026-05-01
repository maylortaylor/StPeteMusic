-- Migration 001: Add public display fields to artists and venues
-- Run: psql $DATABASE_URL -f database/migrations/001_add_public_fields.sql

-- ── ARTISTS ──────────────────────────────────────────────────────────────────
-- Drop encrypted email BYTEA, replace with plain TEXT (booking email, can be shown publicly)
ALTER TABLE artists DROP COLUMN IF EXISTS email;
ALTER TABLE artists
  ADD COLUMN IF NOT EXISTS email          TEXT,
  ADD COLUMN IF NOT EXISTS slug           TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS description    TEXT,
  ADD COLUMN IF NOT EXISTS hero_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS genres         TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tags           TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS bandcamp_url   TEXT,
  ADD COLUMN IF NOT EXISTS spotify_url    TEXT,
  ADD COLUMN IF NOT EXISTS soundcloud_url TEXT,
  ADD COLUMN IF NOT EXISTS extra_links    JSONB   DEFAULT '[]';

-- Existing columns (already present, no ADD needed):
--   name, username, type, instagram_handle, instagram_url, facebook_url,
--   youtube_url, website, linktree_url, venmo, zelle, other_payment,
--   notes, is_active, created_at, updated_at

CREATE INDEX IF NOT EXISTS idx_artists_slug   ON artists (slug);
CREATE INDEX IF NOT EXISTS idx_artists_genres ON artists USING gin (genres);
CREATE INDEX IF NOT EXISTS idx_artists_tags   ON artists USING gin (tags);

-- ── VENUES ───────────────────────────────────────────────────────────────────
-- Drop encrypted email/phone BYTEA, replace with plain TEXT (public business contact info)
ALTER TABLE venues DROP COLUMN IF EXISTS email;
ALTER TABLE venues DROP COLUMN IF EXISTS phone;
ALTER TABLE venues
  ADD COLUMN IF NOT EXISTS email          TEXT,
  ADD COLUMN IF NOT EXISTS phone          TEXT,
  ADD COLUMN IF NOT EXISTS slug           TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS description    TEXT,
  ADD COLUMN IF NOT EXISTS hero_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS capacity       INTEGER,
  ADD COLUMN IF NOT EXISTS tags           TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS website        TEXT,
  ADD COLUMN IF NOT EXISTS lat            NUMERIC(9,6),
  ADD COLUMN IF NOT EXISTS lng            NUMERIC(9,6),
  ADD COLUMN IF NOT EXISTS extra_links    JSONB   DEFAULT '[]';

-- Existing columns (already present, no ADD needed):
--   name, address, instagram_url, instagram_username,
--   facebook_url, facebook_username, contact_name,
--   notes, is_active, created_at, updated_at

CREATE INDEX IF NOT EXISTS idx_venues_slug ON venues (slug);
CREATE INDEX IF NOT EXISTS idx_venues_tags ON venues USING gin (tags);
