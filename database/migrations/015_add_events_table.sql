-- Migration 015: Add events table and event_performers join table
-- Stores Google Calendar events synced via n8n every 96 hours

CREATE TABLE IF NOT EXISTS events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_event_id TEXT UNIQUE NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  start_time      TIMESTAMPTZ NOT NULL,
  end_time        TIMESTAMPTZ,
  location        TEXT,
  tag             TEXT,  -- one of: final-friday, community-jam, art-walk, workshop-class, ohc, community
  ticket_url      TEXT,
  is_active       BOOLEAN DEFAULT true,
  synced_at       TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_performers (
  event_id    UUID REFERENCES events(id) ON DELETE CASCADE,
  artist_id   UUID REFERENCES artists(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, artist_id)
);

CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_tag ON events(tag);
CREATE INDEX IF NOT EXISTS idx_events_google_event_id ON events(google_event_id);
