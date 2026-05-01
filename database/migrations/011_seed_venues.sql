-- Migration 011: Seed 7 new venues + enrich existing venues with new columns
-- Source: /obsidian_vault/Contacts/Venues/
-- Paper Crane and The Loft St. Pete are closed — inserted with is_active = false.
-- All new venues default visible_on_website = false (operator review required).

-- ---------------------------------------------------------------------------
-- NEW VENUES (7)
-- ---------------------------------------------------------------------------

INSERT INTO venues (name, slug, instagram_url, instagram_username, is_active, visible_on_website)
VALUES
  ('3 Daughters Brewing',
    '3-daughters-brewing',
    'https://www.instagram.com/3daughtersbrewing', '@3daughtersbrewing',
    true, false),

  ('Jannus Live',
    'jannus-live',
    'https://www.instagram.com/JannusLive', '@JannusLive',
    true, false),

  ('Mandarin Hide',
    'mandarin-hide',
    'https://www.instagram.com/mandarinhide', '@mandarinhide',
    true, false),

  ('St. Pete Brewing Co',
    'st-pete-brewing-co',
    'https://www.instagram.com/stpetebrewingco', '@stpetebrewingco',
    true, false),

  ('The Bends',
    'the-bends',
    'https://www.instagram.com/the_bends', '@the_bends',
    true, false),

  -- Closed venues: is_active = false, visible_on_website = false
  ('Paper Crane',
    'paper-crane',
    'https://www.instagram.com/papercranelive', '@papercranelive',
    false, false),

  ('The Loft St. Pete',
    'the-loft-st-pete',
    'https://www.instagram.com/theloftstpete', '@theloftstpete',
    false, false)

ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- ENRICH EXISTING VENUES with neighborhood / av_setup / partnership_level
-- ---------------------------------------------------------------------------

UPDATE venues
SET
  neighborhood      = 'Warehouse Arts District',
  av_setup          = 'Full PA, lighting, recording capability',
  partnership_level = 'primary'
WHERE name = 'Suite E Studios';

UPDATE venues
SET
  neighborhood      = 'St. Petersburg',
  partnership_level = 'collaboration'
WHERE name = 'Cage Brewing';

UPDATE venues
SET
  neighborhood      = 'St. Petersburg',
  partnership_level = 'collaboration'
WHERE name = 'Bayboro Brewing';

UPDATE venues
SET
  neighborhood      = 'Downtown St. Petersburg',
  av_setup          = 'Professional',
  partnership_level = 'collaboration'
WHERE name = 'Jannus Live';
