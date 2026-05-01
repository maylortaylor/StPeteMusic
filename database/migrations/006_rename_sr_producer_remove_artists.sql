-- Migration 006: Rename SR. PRODUCER → Event Producer; remove Kieth Penu and Bryan Edward
--
-- Run:
--   psql -U stpetemusic -d stpetemusic -f database/migrations/006_rename_sr_producer_remove_artists.sql

-- 1. Rename the type value on existing rows
UPDATE artists SET type = 'Event Producer' WHERE type = 'SR. PRODUCER';

-- 2. Drop old CHECK constraint and add updated one
ALTER TABLE artists DROP CONSTRAINT IF EXISTS artists_type_check;
ALTER TABLE artists
  ADD CONSTRAINT artists_type_check
  CHECK (type IN ('Band', 'Solo Artist', 'DJ', 'Event Producer', 'Creative', 'Other'));

-- 3. Remove Kieth Penu and Bryan Edward artists
DELETE FROM artists WHERE name IN ('Kieth Penu', 'Bryan Edward');

-- 4. Remove their person records
DELETE FROM persons WHERE (first_name = 'Kieth' AND last_name = 'Penu')
                       OR (first_name = 'Bryan' AND last_name = 'Edward');
