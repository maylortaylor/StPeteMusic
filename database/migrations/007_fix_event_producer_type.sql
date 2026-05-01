\set ON_ERROR_STOP 1

-- Drop old constraint first so the UPDATE isn't blocked by it
ALTER TABLE artists DROP CONSTRAINT IF EXISTS artists_type_check;

-- Rename SR. PRODUCER → Event Producer
UPDATE artists SET type = 'Event Producer' WHERE type = 'SR. PRODUCER';

-- Add updated constraint
ALTER TABLE artists
  ADD CONSTRAINT artists_type_check
  CHECK (type IN ('Band', 'Solo Artist', 'DJ', 'Event Producer', 'Creative', 'Other'));

-- Remove Kieth Penu and Bryan Edward (safe to re-run — deletes 0 rows if already gone)
DELETE FROM artists WHERE name IN ('Kieth Penu', 'Bryan Edward');
DELETE FROM persons
  WHERE (first_name = 'Kieth' AND last_name = 'Penu')
     OR (first_name = 'Bryan' AND last_name = 'Edward');
