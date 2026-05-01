-- Migration 003: Seed partner venues + update Suite E Studios with slug and GPS
-- Run: psql $DATABASE_URL -f database/migrations/003_seed_venues.sql

INSERT INTO venues (name, slug, address, instagram_url, instagram_username, website, tags, lat, lng)
VALUES
  (
    'Cage Brewing', 'cage-brewing',
    '1514 2nd Ave N, St. Petersburg, FL 33713',
    'https://www.instagram.com/cagebrewing', '@cagebrewing',
    'https://cagebrewing.com',
    ARRAY['brewery','venue','st-pete'],
    27.773700, -82.669000
  ),
  (
    'Bayboro Brewing', 'bayboro-brewing',
    '2390 5th Ave S, St. Petersburg, FL 33712',
    'https://www.instagram.com/bayborobrewing', '@bayborobrewing',
    'https://www.bayborobrewing.com',
    ARRAY['brewery','venue','st-pete'],
    27.758400, -82.664800
  ),
  (
    'Ruby''s Elixir', 'rubys-elixir',
    'St. Petersburg, FL',
    NULL, NULL, NULL,
    ARRAY['bar','venue','st-pete'],
    NULL, NULL
  ),
  (
    'The Nest at St Pete Brewing', 'the-nest',
    '544 1st Ave N, St. Petersburg, FL 33701',
    NULL, NULL, NULL,
    ARRAY['brewery','venue','st-pete'],
    27.776200, -82.640000
  ),
  (
    'The Blueberry Patch', 'the-blueberry-patch',
    'St. Petersburg, FL',
    NULL, NULL, NULL,
    ARRAY['venue','st-pete'],
    NULL, NULL
  )
ON CONFLICT (slug) DO NOTHING;

-- Update Suite E Studios with slug, GPS, and tags
UPDATE venues
SET
  slug = 'suite-e-studios',
  lat  = 27.740980,
  lng  = -82.676340,
  tags = ARRAY['studio','venue','warehouse-arts-district','st-pete']
WHERE name = 'Suite E Studios' AND slug IS NULL;
