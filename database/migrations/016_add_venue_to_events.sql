-- Migration 016: Add venue column to events table
-- Back-fills all existing rows as 'suite-e-studios' (current only source).
-- New venues are populated by the updated n8n gcal-to-db-sync workflow.

ALTER TABLE events ADD COLUMN IF NOT EXISTS venue TEXT;

UPDATE events SET venue = 'suite-e-studios' WHERE venue IS NULL;

CREATE INDEX IF NOT EXISTS idx_events_venue ON events(venue);
