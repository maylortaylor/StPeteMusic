-- Migration 027: Fix Suite E Google Calendar ID
-- Migration 017 backfilled the wrong group calendar ID. The real calendar is suite.e.stpete@gmail.com.
UPDATE venues
  SET google_calendar_id = 'suite.e.stpete@gmail.com'
  WHERE slug = 'suite-e-studios';
