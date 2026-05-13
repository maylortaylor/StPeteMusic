-- Migration 017: Add platform IDs and events automation fields
--
-- Venues:
--   facebook_page_id  — numeric FB Page ID for Graph API calls (distinct from facebook_username)
--   instagram_page_id — numeric IG account ID for Instagram Graph API (distinct from instagram_username)
--   google_calendar_id — moves the GCal IDs out of the hardcoded venues.ts into the DB
--   events_sources    — array of automated scraping sources per venue:
--                       [{ "type": "facebook"|"website"|"instagram", "url": "..." }]
--                       Supports multi-source venues (e.g. Blueberry Patch: website + facebook).
--
-- Events:
--   image_url  — event cover image URL (from FB/website). Cleared after event passes by
--                the venue-events-sync weekly cleanup step.
--   extra_data — source metadata: fb_event_url, event_by, dedup_id, source type.
--                NOT updated by spm-multi-gcal-to-db-sync — that upsert never sets this column.

ALTER TABLE venues
  ADD COLUMN IF NOT EXISTS facebook_page_id   TEXT,
  ADD COLUMN IF NOT EXISTS instagram_page_id  TEXT,
  ADD COLUMN IF NOT EXISTS google_calendar_id TEXT,
  ADD COLUMN IF NOT EXISTS events_sources     JSONB NOT NULL DEFAULT '[]';

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS image_url   TEXT,
  ADD COLUMN IF NOT EXISTS extra_data  JSONB NOT NULL DEFAULT '{}';

-- Backfill Google Calendar IDs for all active venues (sourced from apps/web/src/lib/venues.ts)
UPDATE venues SET google_calendar_id = '98a6b333df9c0d145983eab458358c58692344b3436a7c292772019118db6e19@group.calendar.google.com'
  WHERE slug = 'suite-e-studios';
UPDATE venues SET google_calendar_id = '71e2433f12b9a7ffe5cfa52bb00dba523406043b321fe5f9dcf354476ea08555@group.calendar.google.com'
  WHERE slug = 'blueberry-patch';
UPDATE venues SET google_calendar_id = 'e0cc088fc8847d4de888142b6d18c69c6de370afaa268432ccae930d6e1b7108@group.calendar.google.com'
  WHERE slug = 'cage-brewing';
UPDATE venues SET google_calendar_id = 'ac1f54b2bbdd7ba7e94d95ec6a6090b26af944c614e35e3a01582f956ed275dd@group.calendar.google.com'
  WHERE slug = 'rubys-elixir';
UPDATE venues SET google_calendar_id = '2c1103fbae69f2a222a4a163203aff4decaa5af400fb9a68a0dada62860d7f38@group.calendar.google.com'
  WHERE slug = 'the-bends';

-- Seed Cage Brewing as the first venue with an automated FB events source.
-- facebook_page_id must be populated manually after running:
--   GET https://graph.facebook.com/v21.0/cagebrewing?fields=id&access_token={FB_APP_ID}|{FB_APP_SECRET}
UPDATE venues
  SET events_sources = '[{"type":"facebook","url":"https://www.facebook.com/cagebrewing/events"}]'::jsonb
  WHERE slug = 'cage-brewing';

CREATE INDEX IF NOT EXISTS idx_venues_google_calendar_id
  ON venues(google_calendar_id)
  WHERE google_calendar_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_events_extra_data
  ON events USING GIN (extra_data);
