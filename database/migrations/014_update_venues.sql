-- Migration 014: Update venue details + add The Potion Portal
-- Adds correct addresses, tags, social links for 11 existing venues.
-- Inserts The Potion Portal as a new venue.
-- Sets visible_on_website = true for all venues in this list.

-- ---------------------------------------------------------------------------
-- NEW VENUES
-- ---------------------------------------------------------------------------

INSERT INTO venues (name, slug, address, instagram_url, instagram_username, tags, is_active, visible_on_website)
VALUES (
  'The Potion Portal',
  'the-potion-portal',
  '2329 28th St N, St. Petersburg, FL 33713',
  'https://www.instagram.com/thepotionportal', '@thepotionportal',
  ARRAY['bar','cocktails','live-music','st-pete'],
  true, true
)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- UPDATE EXISTING VENUES
-- ---------------------------------------------------------------------------

UPDATE venues
SET
  address            = '222 22nd St S, St. Petersburg, FL 33712',
  tags               = ARRAY['brewery','venue','st-pete'],
  visible_on_website = true
WHERE slug = '3-daughters-brewing';

UPDATE venues
SET
  tags               = ARRAY['brewery','food','venue','st-pete'],
  visible_on_website = true
WHERE slug = 'bayboro-brewing';

-- Confirmed correct address (old seed had wrong street).
-- Null out stale coordinates from migration 003.
UPDATE venues
SET
  address            = '2001 1st Ave S, St. Petersburg, FL 33712',
  tags               = ARRAY['brewery','food','venue','st-pete'],
  lat                = NULL,
  lng                = NULL,
  visible_on_website = true
WHERE slug = 'cage-brewing';

UPDATE venues
SET
  address            = '200 1st Ave N STE 206, St. Petersburg, FL 33701',
  tags               = ARRAY['venue','st-pete'],
  visible_on_website = true
WHERE slug = 'jannus-live';

UPDATE venues
SET
  address            = '231 Central Ave, St. Petersburg, FL 33701',
  tags               = ARRAY['bar','cocktails','djs','st-pete'],
  visible_on_website = true
WHERE slug = 'mandarin-hide';

UPDATE venues
SET
  address            = '15 3rd St N, St. Petersburg, FL 33701',
  instagram_url      = 'https://www.instagram.com/rubys_elixir',
  instagram_username = '@rubys_elixir',
  tags               = ARRAY['bar','cocktails','live-music','st-pete'],
  visible_on_website = true
WHERE slug = 'rubys-elixir';

UPDATE venues
SET
  address            = '544 1st Ave N, St. Petersburg, FL 33701',
  tags               = ARRAY['brewery','food','st-pete'],
  visible_on_website = true
WHERE slug = 'st-pete-brewing-co';

UPDATE venues
SET
  address            = '919 1st Ave N, St. Petersburg, FL 33705',
  tags               = ARRAY['bar','live-music','djs','st-pete'],
  visible_on_website = true
WHERE slug = 'the-bends';

UPDATE venues
SET
  address            = '4923 20th Ave S, Gulfport, FL 33707',
  instagram_url      = 'https://www.instagram.com/blueberrypatchgulfport',
  instagram_username = '@blueberrypatchgulfport',
  website            = 'https://www.blueberrypatch.org',
  tags               = ARRAY['byob','venue','live-music','gulfport'],
  visible_on_website = true
WHERE slug = 'the-blueberry-patch';

UPDATE venues
SET
  name               = 'The Nest at St Pete Brewing Co',
  instagram_url      = 'https://www.instagram.com/thenestatstpetebrewingco',
  instagram_username = '@thenestatstpetebrewingco',
  tags               = ARRAY['live-music','djs','brewery','st-pete'],
  visible_on_website = true
WHERE slug = 'the-nest';

UPDATE venues
SET
  address            = '615 27th St S, Suite E, St. Petersburg, FL 33713',
  email              = 'suite.e.stpete@gmail.com',
  website            = 'https://www.suiteestudios.com',
  facebook_url       = 'https://www.facebook.com/suite.e.stpete',
  facebook_username  = 'suite.e.stpete',
  tags               = ARRAY['studio','third-space','warehouse-arts-district','st-pete'],
  visible_on_website = true
WHERE slug = 'suite-e-studios';
