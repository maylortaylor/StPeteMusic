-- Migration 012: Seed new persons + update existing with role/company
-- Source: /obsidian_vault/Contacts/Collaborators/ + band contact-name fields
-- PII (email, phone) not included — add via encrypted update when available.
-- visible_on_website defaults to false — no public person pages at launch.

-- ---------------------------------------------------------------------------
-- NEW PERSONS
-- ---------------------------------------------------------------------------

INSERT INTO persons (first_name, last_name, role, company, skills, notes)
VALUES
  ('Austen', 'Van Der Bleek',
    'Co-founder, Director of Programming',
    'Suite E Studios (Tangent LLC)',
    ARRAY['dj', 'event producer', 'booking'],
    'Resident DJ. Handles day-to-day programming, booking, and artist relationships. Monthly Spotify playlists for Patreon Tier 2.'),

  ('Rob', 'Morey',
    'Co-founder',
    'Suite E Studios (Tangent LLC)',
    ARRAY['other'],
    'Suite E co-founder and support.'),

  ('Daniel', 'Owen',
    'Booking contact',
    'Dead Reef',
    ARRAY['artist', 'musician'],
    'Booking contact for Dead Reef. First contact via Creative Support Group (March 2026).'),

  ('Josh', 'Scheible',
    'Booking contact',
    'Physical Plant',
    ARRAY['artist', 'musician'],
    'Primary booking contact for Physical Plant.'),

  ('Matt', 'Taylor',
    'Owner / Promoter',
    '@StPeteMusic / Tangent LLC',
    ARRAY['producer', 'event producer', 'booking'],
    'Runs @StPeteMusic. Co-owner of Suite E Studios.')

ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- UPDATE EXISTING: Alex McDonald — add role + company
-- He was seeded as a general contact; now we have his full context.
-- ---------------------------------------------------------------------------

UPDATE persons
SET
  role    = 'Co-founder',
  company = 'Suite E Studios (Tangent LLC)'
WHERE first_name = 'Alex'
  AND last_name  = 'McDonald'
  AND role IS NULL;
