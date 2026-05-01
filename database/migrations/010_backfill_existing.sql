-- Migration 010: Backfill existing artists and venues
-- 1. Set instagram_handle on all existing artists from their username or instagram_url
-- 2. Set home_base = 'St. Pete, FL' for all existing artists
-- 3. Set visible_on_website = true for existing 32 seeded artists (they're already live)
-- 4. Set visible_on_website = true for existing 6 seeded venues
-- 5. Rename "The Tilt" → "The Tilt Orchestra" to match Obsidian

-- ---------------------------------------------------------------------------
-- 1 & 2. instagram_handle + home_base on existing artists
--    The seed used `username` for the @handle. Copy it to instagram_handle.
--    For artists where username is NULL but instagram_url exists, extract from URL.
-- ---------------------------------------------------------------------------

-- Primary: copy from username column (already has @handle format)
UPDATE artists
SET instagram_handle = username
WHERE instagram_handle IS NULL
  AND username IS NOT NULL;

-- Fallback: extract from instagram_url for any remaining gaps
UPDATE artists
SET instagram_handle = '@' || substring(instagram_url FROM 'instagram\.com/([^/?]+)')
WHERE instagram_handle IS NULL
  AND instagram_url IS NOT NULL
  AND instagram_url LIKE '%instagram.com%';

-- Set home_base for all artists that don't have one yet
UPDATE artists
SET home_base = 'St. Pete, FL'
WHERE home_base IS NULL;

-- ---------------------------------------------------------------------------
-- 3. Enable existing seeded artists for public website
--    These were all hand-curated in seed.sql and already have public pages.
-- ---------------------------------------------------------------------------

UPDATE artists
SET visible_on_website = true
WHERE slug IN (
  'the-pleasantries',
  'dandy-lush',
  'harlow-gold',
  'moonshow',
  'sedque',
  'willie-jones',
  'brother-bear',
  'khoury-affinity',
  'accentrik',
  'nico-the-alchemist',
  'slamchops',
  'wyatt-norton',
  'allen-fereti',
  'physical-plant',
  'seems',
  'little-giver-band',
  'liam-bauman',
  'callaghan-keane',
  'brian-busto',
  'prophessor-j-events',
  'clockworkxband',
  'dylan-dames',
  'johee-mason',
  'mel-with-a-period',
  'movie-props',
  'then-theres-me',
  'beach-terror',
  'viorica',
  'aliqua',
  'spanish-bombs',
  'house-of-i',
  'the-tilt'         -- slug stays as-is; name rename handled below
);

-- ---------------------------------------------------------------------------
-- 4. Enable existing seeded venues for public website
-- ---------------------------------------------------------------------------

UPDATE venues
SET visible_on_website = true
WHERE name IN (
  'Cage Brewing',
  'Bayboro Brewing',
  'Ruby''s Elixir',
  'The Nest at St Pete Brewing',
  'The Blueberry Patch',
  'Suite E Studios'
);

-- ---------------------------------------------------------------------------
-- 5. Rename "The Tilt" → "The Tilt Orchestra" (matches Obsidian)
--    Keep slug as 'the-tilt' — changing slugs breaks URLs, so we leave it.
-- ---------------------------------------------------------------------------

UPDATE artists
SET name = 'The Tilt Orchestra'
WHERE name = 'The Tilt'
  AND slug = 'the-tilt';
