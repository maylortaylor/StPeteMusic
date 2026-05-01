-- Migration 002: Add artist_shows table for past show highlights with YouTube links
-- Run: psql $DATABASE_URL -f database/migrations/002_add_artist_shows.sql

CREATE TABLE IF NOT EXISTS artist_shows (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id   UUID NOT NULL REFERENCES artists (id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  youtube_url TEXT,
  show_date   DATE,
  venue_name  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_artist_shows_artist ON artist_shows (artist_id);
CREATE INDEX IF NOT EXISTS idx_artist_shows_date   ON artist_shows (show_date DESC);
