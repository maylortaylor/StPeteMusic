-- Migration 009: Seed 63 new artists from Obsidian Contacts
-- Source: /obsidian_vault/Contacts/Artists/ (47 Bands + 29 Solo folders)
-- Rule: only artists with ≥1 social link (instagram/facebook/linktree/website)
-- All 63 entries have at least an Instagram handle.
-- visible_on_website defaults to false — operator must manually enable each.
-- Excluded (user deleted from vault): DJ Shafiq, DJ Soul R, Filipe Bergson,
--   Lars LB, LVL Jetsetter, MC Pizza, The Ella Meno Beat, Tori Bious Monk
-- Already in DB (skipped): The Pleasantries, Dandy Lush, Harlow Gold, MoonShow,
--   Physical Plant, Little Giver Band, Liam Bauman, Movie Props, Beach Terror,
--   House of I, The Tilt/The Tilt Orchestra, CHRISS/Chriss (Clockworkxband),
--   Willie Jones, Callaghan Keane

-- ---------------------------------------------------------------------------
-- NEW BANDS (36)
-- ---------------------------------------------------------------------------

INSERT INTO artists (name, slug, type, instagram_handle, instagram_url, home_base, visible_on_website)
VALUES
  ('Ajeva',                          'ajeva',                          'Band',
    '@ajevamusic',          'https://www.instagram.com/ajevamusic',           'St. Pete, FL', false),

  ('Animal Prince',                  'animal-prince',                  'Band',
    '@animalprince_',       'https://www.instagram.com/animalprince_',        'St. Pete, FL', false),

  ('Antelope (Phish Tribute)',        'antelope-phish-tribute',         'Band',
    '@antelopephishtribute','https://www.instagram.com/antelopephishtribute', 'St. Pete, FL', false),

  ('Dead Reef',                      'dead-reef',                      'Band',
    '@deadreef.fl',         'https://www.instagram.com/deadreef.fl',          'St. Pete, FL', false),

  ('Dionysus',                       'dionysus',                       'Band',
    '@dionysus.band',       'https://www.instagram.com/dionysus.band',        'St. Pete, FL', false),

  ('Displace',                       'displace',                       'Band',
    '@displacemusic',       'https://www.instagram.com/displacemusic',        'St. Pete, FL', false),

  ('Donzii',                         'donzii',                         'Band',
    '@_donzii',             'https://www.instagram.com/_donzii',              'St. Pete, FL', false),

  ('Earth Girl',                     'earth-girl',                     'Band',
    '@earthgirl',           'https://www.instagram.com/earthgirl',            'St. Pete, FL', false),

  ('Frog Shaman',                    'frog-shaman',                    'Band',
    '@frogshamanband',      'https://www.instagram.com/frogshamanband',       'St. Pete, FL', false),

  ('Gabe Hernandez',                 'gabe-hernandez',                 'Band',
    '@gabehernandezmusic',  'https://www.instagram.com/gabehernandezmusic',   'St. Pete, FL', false),

  ('Golden Hour Trees',              'golden-hour-trees',              'Band',
    '@goldenhourtrees',     'https://www.instagram.com/goldenhourtrees',      'St. Pete, FL', false),

  ('Holy River',                     'holy-river',                     'Band',
    '@holyrivermusic',      'https://www.instagram.com/holyrivermusic',       'St. Pete, FL', false),

  ('Humankinda',                     'humankinda',                     'Band',
    '@humankindaband',      'https://www.instagram.com/humankindaband',       'St. Pete, FL', false),

  ('In Case U Didn''t Joe',          'in-case-u-didnt-joe',            'Band',
    '@incaseu.didntjoe',    'https://www.instagram.com/incaseu.didntjoe',     'St. Pete, FL', false),

  ('JT Brown & Co',                  'jt-brown-and-co',                'Band',
    '@jtbrownandco',        'https://www.instagram.com/jtbrownandco',         'St. Pete, FL', false),

  ('Joy Wagon',                      'joy-wagon',                      'Band',
    '@joywagonband',        'https://www.instagram.com/joywagonband',         'St. Pete, FL', false),

  ('Katara',                         'katara',                         'Band',
    '@wearekatara',         'https://www.instagram.com/wearekatara',          'St. Pete, FL', false),

  ('Kollect Inc',                    'kollect-inc',                    'Band',
    '@kollectinc',          'https://www.instagram.com/kollectinc',           'St. Pete, FL', false),

  ('Legacy Music',                   'legacy-music',                   'Band',
    '@legacymusic859',      'https://www.instagram.com/legacymusic859',       'St. Pete, FL', false),

  ('Legacy Orchestra Collective',    'legacy-orchestra-collective',    'Band',
    '@legacyorchestracollective', 'https://www.instagram.com/legacyorchestracollective', 'St. Pete, FL', false),

  ('Lesa Silvermore',                'lesa-silvermore',                'Band',
    '@lesasilvermoremusic', 'https://www.instagram.com/lesasilvermoremusic',  'St. Pete, FL', false),

  ('Light the Wire',                 'light-the-wire',                 'Band',
    '@light.the.wire',      'https://www.instagram.com/light.the.wire',       'St. Pete, FL', false),

  ('Liquid Pennies',                 'liquid-pennies',                 'Band',
    '@liquidpenniesband',   'https://www.instagram.com/liquidpenniesband',    'St. Pete, FL', false),

  ('Minim',                          'minim',                          'Band',
    '@minim_music',         'https://www.instagram.com/minim_music',          'St. Pete, FL', false),

  ('Mr. Whiskers and the Nine Lives','mr-whiskers-and-the-nine-lives', 'Band',
    '@mr.whiskers_and_the_nine_lives', 'https://www.instagram.com/mr.whiskers_and_the_nine_lives', 'St. Pete, FL', false),

  ('North Star',                     'north-star',                     'Band',
    '@northstarstpete',     'https://www.instagram.com/northstarstpete',      'St. Pete, FL', false),

  ('Razor and the Boogie Men',       'razor-and-the-boogie-men',       'Band',
    '@razorandtheboogiemen','https://www.instagram.com/razorandtheboogiemen', 'St. Pete, FL', false),

  ('Sauce Pocket Funk',              'sauce-pocket-funk',              'Band',
    '@saucepocketfunk',     'https://www.instagram.com/saucepocketfunk',      'St. Pete, FL', false),

  ('Stripes',                        'stripes',                        'Band',
    '@stripes520',          'https://www.instagram.com/stripes520',           'St. Pete, FL', false),

  ('Tamayo',                         'tamayo',                         'Band',
    '@tamayo_band',         'https://www.instagram.com/tamayo_band',          'St. Pete, FL', false),

  ('The George Band',                'the-george-band',                'Band',
    '@thegeorgebandd',      'https://www.instagram.com/thegeorgebandd',       'St. Pete, FL', false),

  ('The Pilot Waves',                'the-pilot-waves',                'Band',
    '@the_pilotwaves',      'https://www.instagram.com/the_pilotwaves',       'St. Pete, FL', false),

  ('The Real Gore Wizard',           'the-real-gore-wizard',           'Band',
    '@therealgorewizard',   'https://www.instagram.com/therealgorewizard',    'St. Pete, FL', false),

  ('The Venus Band',                 'the-venus-band',                 'Band',
    '@thevenus_band',       'https://www.instagram.com/thevenus_band',        'St. Pete, FL', false),

  ('The Wandering Hours',            'the-wandering-hours',            'Band',
    '@TheWanderingHours',   'https://www.instagram.com/TheWanderingHours',    'St. Pete, FL', false),

  ('Tropico Blvd',                   'tropico-blvd',                   'Band',
    '@tropicoblvd',         'https://www.instagram.com/tropicoblvd',          'St. Pete, FL', false)

ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- NEW SOLO ARTISTS + DJs (26)
-- ---------------------------------------------------------------------------

INSERT INTO artists (name, slug, type, instagram_handle, instagram_url, home_base, genres, linktree_url, visible_on_website)
VALUES
  ('Alex Borst',       'alex-borst',       'Solo Artist',
    '@_alexborst',          'https://www.instagram.com/_alexborst',          'St. Pete, FL', '{}', NULL, false),

  ('Ava Iri',          'ava-iri',          'Solo Artist',
    '@ava.iri',             'https://www.instagram.com/ava.iri',             'St. Pete, FL',
    ARRAY['Soul', 'R&B', 'Hip-hop'], 'https://linktr.ee/ava_iri', false),

  ('Billy M. Beck',    'billy-m-beck',     'Solo Artist',
    '@billymbeck',          'https://www.instagram.com/billymbeck',          'St. Pete, FL', '{}', NULL, false),

  ('Corporate Guest',  'corporate-guest',  'Solo Artist',
    '@corporateguest',      'https://www.instagram.com/corporateguest',      'St. Pete, FL', '{}', NULL, false),

  ('Dean Mischief',    'dean-mischief',    'Solo Artist',
    '@deanmischiefmusic',   'https://www.instagram.com/deanmischiefmusic',   'St. Pete, FL', '{}', NULL, false),

  ('Doorman the DJ',   'doorman-the-dj',   'DJ',
    '@doormanthedj',        'https://www.instagram.com/doormanthedj',        'St. Pete, FL', '{}', NULL, false),

  ('Infinite Third',   'infinite-third',   'Solo Artist',
    '@infinitethird',       'https://www.instagram.com/infinitethird',       'St. Pete, FL', '{}', NULL, false),

  ('J Rose Loops',     'j-rose-loops',     'Solo Artist',
    '@jroseloops',          'https://www.instagram.com/jroseloops',          'St. Pete, FL', '{}', NULL, false),

  ('Jimpster',         'jimpster',         'Solo Artist',
    '@jimpster_gram',       'https://www.instagram.com/jimpster_gram',       'St. Pete, FL', '{}', NULL, false),

  ('Jon Berg',         'jon-berg',         'Solo Artist',
    '@xjonberg',            'https://www.instagram.com/xjonberg',            'St. Pete, FL', '{}', NULL, false),

  ('Kelsey Sharp',     'kelsey-sharp',     'Solo Artist',
    '@kelseysharpmusic',    'https://www.instagram.com/kelseysharpmusic',    'St. Pete, FL', '{}', NULL, false),

  ('Lynn Hawkins',     'lynn-hawkins',     'Solo Artist',
    '@lynnhawkins_',        'https://www.instagram.com/lynnhawkins_',        'St. Pete, FL', '{}', NULL, false),

  ('Michael May James','michael-may-james','Solo Artist',
    '@michaelmayjames',     'https://www.instagram.com/michaelmayjames',     'St. Pete, FL', '{}', NULL, false),

  ('Mike Blenda',      'mike-blenda',      'Solo Artist',
    '@mikeblenda',          'https://www.instagram.com/mikeblenda',          'St. Pete, FL', '{}', NULL, false),

  ('Mouth Council',    'mouth-council',    'Solo Artist',
    '@mouthcouncil',        'https://www.instagram.com/mouthcouncil',        'St. Pete, FL', '{}', NULL, false),

  ('Not Julia Powell', 'not-julia-powell', 'Solo Artist',
    '@not_julia_powell',    'https://www.instagram.com/not_julia_powell',    'St. Pete, FL', '{}', NULL, false),

  ('Only1Two',         'only1two',         'Solo Artist',
    '@only1two',            'https://www.instagram.com/only1two',            'St. Pete, FL', '{}', NULL, false),

  ('Public Speaking',  'public-speaking',  'Solo Artist',
    '@public__speaking',    'https://www.instagram.com/public__speaking',    'St. Pete, FL', '{}', NULL, false),

  ('Rat Galactic',     'rat-galactic',     'Solo Artist',
    '@rat_galactic',        'https://www.instagram.com/rat_galactic',        'St. Pete, FL', '{}', NULL, false),

  ('Red Feather',      'red-feather',      'Solo Artist',
    '@redfeathermusic',     'https://www.instagram.com/redfeathermusic',     'St. Pete, FL', '{}', NULL, false),

  ('Roger Thomas',     'roger-thomas',     'Solo Artist',
    '@rogerthomasmusic',    'https://www.instagram.com/rogerthomasmusic',    'St. Pete, FL', '{}', NULL, false),

  ('Savannah Lee',     'savannah-lee',     'Solo Artist',
    '@savannahlee475',      'https://www.instagram.com/savannahlee475',      'St. Pete, FL', '{}', NULL, false),

  ('Shua Harrell',     'shua-harrell',     'Solo Artist',
    '@shuaharrell',         'https://www.instagram.com/shuaharrell',         'St. Pete, FL', '{}', NULL, false),

  ('Slam Duncan',      'slam-duncan',      'Solo Artist',
    '@slamduncan710',       'https://www.instagram.com/slamduncan710',       'St. Pete, FL', '{}', NULL, false),

  ('Tizzi',            'tizzi',            'Solo Artist',
    '@inatizzi',            'https://www.instagram.com/inatizzi',            'St. Pete, FL', '{}', NULL, false),

  ('Warren Buchholz',  'warren-buchholz',  'Solo Artist',
    '@warrenbuchholz',      'https://www.instagram.com/warrenbuchholz',      'St. Pete, FL', '{}', NULL, false)

ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- COLLABORATOR-CATEGORY BAND (1)
-- Freeman Sound Mindset was in the Collaborators folder but is a band profile
-- ---------------------------------------------------------------------------

INSERT INTO artists (name, slug, type, instagram_handle, instagram_url, home_base, visible_on_website)
VALUES
  ('Freeman Sound Mindset', 'freeman-sound-mindset', 'Band',
    '@freemansoundmindset', 'https://www.instagram.com/freemansoundmindset', 'St. Pete, FL', false)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- SET genres for bands with known genre data
-- ---------------------------------------------------------------------------

UPDATE artists SET genres = ARRAY['Sludge Metal', 'Metal', 'Doom']
  WHERE slug = 'dead-reef' AND genres = '{}';

UPDATE artists SET genres = ARRAY['Indie', 'Alternative']
  WHERE slug = 'earth-girl' AND genres = '{}';
