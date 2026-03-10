-- StPeteMusic Seed Data
--
-- Seeds from source files:
--   n8n/local-files/Contacts_StPeteMusic.csv
--   n8n/workflows/StPeteMusic/system-prompt.md (AI prompt templates)
--
-- ENCRYPTION: All PII fields (email, phone, venmo, zelle, other_payment) should be
-- encrypted using pgp_sym_encrypt(). This seed currently uses placeholder values
-- for development. For production with real PII:
--
-- 1. Run with encryption key set:
--    export PGPASSWORD="your_postgres_password"
--    PGOPTIONS="-c app.encryption_key=YOUR_ENCRYPTION_KEY" \
--      psql -U stpetemusic -d stpetemusic -f database/seed.sql
--
-- 2. Replace PII values with encrypted versions:
--    OLD:  email TEXT
--    NEW:  email BYTEA = pgp_sym_encrypt('user@example.com', current_setting('app.encryption_key'))
--
-- Example encrypted insert:
--    INSERT INTO persons (first_name, last_name, email)
--    VALUES (
--      'John',
--      'Doe',
--      pgp_sym_encrypt('john@example.com', current_setting('app.encryption_key'))
--    );
--
-- To decrypt in queries:
--    SELECT pgp_sym_decrypt(email, current_setting('app.encryption_key'))::TEXT AS email
--    FROM persons WHERE first_name = 'John';

-- ---------------------------------------------------------------------------
-- ARTISTS (from Contacts_StPeteMusic.csv)
-- ---------------------------------------------------------------------------

INSERT INTO artists (name, username, type, instagram_url, facebook_url, website, linktree_url, notes)
VALUES
  ('The Pleasantries', '@Thepleasantriesband', 'Band',
    NULL, 'https://www.facebook.com/profile.php?id=61569111645941', NULL, NULL, NULL),

  ('Dandy Lush', '@dandylushmusic', 'Band',
    NULL, 'https://www.facebook.com/dandylushmusic', NULL, NULL, NULL),

  ('Harlow Gold', '@o.g.harlowgold', 'Band',
    NULL, 'https://www.facebook.com/profile.php?id=61550795590638', NULL, NULL, NULL),

  ('MoonShow', '@moonshowband', 'Band',
    NULL, NULL, 'https://linktr.ee/moonshowband', 'https://linktr.ee/moonshowband', NULL),

  ('Sedque', '@sedque.music', 'Band',
    'https://www.instagram.com/sedque.music', NULL, NULL, NULL, NULL),

  ('Willie Jones', '@williejones_cocktailhour', 'Solo Artist',
    NULL, 'https://www.facebook.com/alex.mcdonald.735', NULL, NULL, 'Cocktail hour act'),

  ('Brother Bear', '@brotherbear.boi', 'DJ',
    NULL, 'https://www.facebook.com/brotherbearboii', NULL, NULL, NULL),

  ('Khoury Affinity', '@khoury_affinity', 'DJ',
    NULL, 'https://www.facebook.com/khoury.ahwesh', NULL, NULL, NULL),

  ('Accentrik', '@accentrik', 'DJ',
    NULL, 'https://www.facebook.com/accentrik.music', NULL, NULL, NULL),

  ('Nico the Alchemist', '@nicosalchemy', 'DJ',
    NULL, 'https://www.facebook.com/nicothealchemist', NULL, NULL, NULL),

  ('SlamChops', '@slamchopss', 'Solo Artist',
    NULL, 'https://www.facebook.com/profile.php?id=61579011129960', NULL, NULL, NULL),

  ('Wyatt Norton', '@wyatt_norton', 'Solo Artist',
    NULL, 'https://www.facebook.com/wyatt.norton.777', NULL, NULL, NULL),

  ('Allen Fereti', '@allenfereti06', 'Solo Artist',
    'https://www.instagram.com/allenfereti06', NULL, NULL, NULL, 'Email in CSV has typo: allenfereti066gmail.com'),

  ('Kieth Penu', '@kwell_creates', 'SR. PRODUCER',
    NULL, 'https://www.facebook.com/keith.penu', NULL, NULL, NULL),

  ('Physical Plant', '@physical_plant', 'Band',
    NULL, 'https://www.facebook.com/physicalplants', 'https://www.physicalplantmusic.com/', 'https://linktr.ee/physicalplant', NULL),

  ('Seems', '@seemsband', 'Band',
    'https://www.instagram.com/allenfereti06', NULL, NULL, NULL, NULL),

  ('Little Giver Band', '@littlegiverband', 'Band',
    'https://www.instagram.com/littlegiverband', 'https://www.facebook.com/profile.php?id=61583532835592', 'https://www.littlegiverband.com/', NULL, 'Contact: Leah @leahivelise'),

  ('Liam Bauman', '@liam_bauman', 'Solo Artist',
    'https://www.instagram.com/liam_bauman', 'https://www.facebook.com/liambaumanmusic', 'https://liambauman.com', NULL, 'Publicity: Frank Keith / Sweetheart PR / frank@sweetheartpr.com'),

  ('Callaghan Keane', '@callaghan.keane', 'DJ',
    'https://www.instagram.com/callaghan.keane', 'https://www.facebook.com/callaghan.keane', NULL, NULL, NULL),

  ('Brian Busto', '@djbrianbusto', 'DJ',
    'https://www.instagram.com/djbrianbusto/', 'https://www.facebook.com/brian.busto.1', 'https://linktr.ee/djbrianbusto', NULL, 'Also: @serioussoul813'),

  ('Bryan Edward', '@bryanedwardcreative', 'Creative',
    'https://www.instagram.com/bryanedwardcreative/', 'https://www.facebook.com/bryanedwardalpha', NULL, NULL, NULL),

  ('Prophessor J Events', NULL, 'SR. PRODUCER',
    NULL, 'https://www.facebook.com/groups/803946243670033', NULL, NULL, NULL),

  ('Chriss (Clockworkxband)', '@chriss.3___', 'Band',
    'https://www.instagram.com/chriss.3___/', NULL, NULL, 'https://linktr.ee/chriscriss', NULL),

  ('Dylan Dames', '@DylanDames', 'Band',
    'https://www.instagram.com/dylandames/', NULL, NULL, NULL, NULL),

  ('JoheeMason', '@Joheemason', 'Solo Artist',
    'https://www.instagram.com/joheemason', NULL, NULL, NULL, NULL),

  ('Mel With A Period', '@melwithaperiod', 'Solo Artist',
    'https://www.instagram.com/melwithaperiod', NULL, NULL, 'https://linktr.ee/melwithaperiod', NULL),

  ('Movie Props', '@moviepropsband', 'Band',
    'https://www.instagram.com/moviepropsband/', 'https://www.facebook.com/profile.php?id=100078849106149', NULL, NULL, NULL),

  ('Then There''s Me', '@ThenTheresMeOfficial', 'Band',
    'http://instagram.com/thentheresmeofficial', NULL, 'www.thentheresmeofficial.com', 'https://linktr.ee/thentheresmeband', NULL),

  ('Beach Terror', '@beach_terror', 'Band',
    'https://www.instagram.com/beach_terror', NULL, NULL, NULL, NULL),

  ('Viorica', '@Viorica.Band', 'Band',
    'https://www.instagram.com/viorica.band', NULL, NULL, NULL, 'Contact: John (daddy kool)'),

  ('Aliqua', '@_aliqua', 'Band',
    'https://www.instagram.com/_aliquia', NULL, NULL, NULL, NULL),

  ('Spanish Bombs', '@SpanishBombsFL', 'Band',
    'https://www.instagram.com/SpanishBombsFL', NULL, NULL, NULL, NULL),

  ('House of I', '@HouseOfI', 'Band',
    'https://www.instagram.com/houseofi', NULL, NULL, NULL, NULL),

  ('The Tilt', '@TheTiltOrchestra', 'Band',
    'https://www.instagram.com/thetiltorchestra', NULL, NULL, NULL, NULL)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- PERSONS (from Contacts_StPeteMusic.csv — named contacts)
-- PII fields (email, phone) shown here as plaintext.
-- In production, replace values with: pgp_sym_encrypt('value', current_setting('app.encryption_key'))
-- ---------------------------------------------------------------------------

-- NOTE: emails/phones are stored encrypted in production.
-- This seed uses a placeholder pattern — adapt to encrypt at insert time.

INSERT INTO persons (first_name, last_name, skills, notes)
VALUES
  ('Steven',   'Sanchez',    ARRAY['artist', 'musician'],                        'Contact for The Pleasantries and Accentrik (DJ)'),
  ('Pam',      NULL,         ARRAY['artist', 'musician'],                        'Contact for Dandy Lush'),
  ('Harlow',   NULL,         ARRAY['artist', 'musician'],                        'Contact for Harlow Gold'),
  ('Josh',     'Barbour',    ARRAY['artist', 'musician'],                        'Contact for MoonShow'),
  ('James',    'Fitzpatrick', ARRAY['artist', 'musician'],                       'Contact for Sedque'),
  ('Alex',     'McDonald',   ARRAY['artist', 'musician'],                        'Contact for Willie Jones cocktail hour'),
  ('Josh',     'Glogau',     ARRAY['artist', 'dj'],                              'Contact for Brother Bear (DJ). Mgmt: mgmt@alchemyprod.com'),
  ('Khoury',   'Ahwesh',     ARRAY['artist', 'dj'],                              'Contact for Khoury Affinity'),
  ('Liam',     'Walsh',      ARRAY['artist', 'musician'],                        'Contact for SlamChops'),
  ('Wyatt',    'Norton',     ARRAY['artist', 'musician'],                        'Contact for Wyatt Norton solo and Beach Terror'),
  ('Allen',    'Fereti',     ARRAY['artist', 'musician'],                        'Solo artist @allenfereti06'),
  ('Kieth',    'Penu',       ARRAY['producer'],                                  'SR. PRODUCER @kwell_creates'),
  ('Leah',     NULL,         ARRAY['artist', 'musician'],                        'Contact for Little Giver Band @leahivelise'),
  ('Liam',     'Bauman',     ARRAY['artist', 'musician'],                        'Solo artist, publicity via Sweetheart PR'),
  ('Callaghan', 'Keane',     ARRAY['artist', 'dj'],                              'DJ @callaghan.keane'),
  ('Brian',    'Busto',      ARRAY['artist', 'dj'],                              'DJ @djbrianbusto'),
  ('Bryan',    'Edward',     ARRAY['creative', 'videographer', 'photographer'],  'Creative @bryanedwardcreative'),
  ('Jarryd',   'Thompson',   ARRAY['producer', 'event producer'],                'Prophessor J Events'),
  ('Tyson',    NULL,         ARRAY['artist', 'musician'],                        'Contact for Seems band'),
  ('Joheem',   NULL,         ARRAY['artist', 'musician'],                        'Solo artist @joheemason'),
  ('Mel',      NULL,         ARRAY['artist', 'musician'],                        'Solo artist @melwithaperiod'),
  ('Bina',     NULL,         ARRAY['creative', 'artist'],                        'She.Devil.Ink — tattoo/creative @RentedTechnology'),
  ('Matt',     NULL,         ARRAY['creative', 'musician'],                      '@bassguitarwizard — Rented Technology'),
  ('Josiah',   'Selby',      ARRAY['artist', 'musician'],                        'Co-lead Then There''s Me'),
  ('Hannah',   'Selby',      ARRAY['artist', 'musician'],                        'Co-lead Then There''s Me'),
  ('John',     NULL,         ARRAY['artist', 'musician'],                        'Daddy Kool Records / Viorica contact'),
  ('Jillian',  'Plauche',    ARRAY['other'],                                     'Phone: (727) 678-8378, Venmo: @npc170')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- VENUES — Suite E Studios (our primary venue)
-- ---------------------------------------------------------------------------

INSERT INTO venues (name, address, instagram_url, instagram_username, notes)
VALUES
  ('Suite E Studios', '2505 N. Ware Blvd, St. Petersburg, FL 33713',
    'https://www.instagram.com/suite.e.studios', '@suite.e.studios',
    'Partner venue — Warehouse Arts District, ~1700 sqft')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- TEMPLATES — AI Prompts, Captions, YouTube Hashtags
-- ---------------------------------------------------------------------------

-- StPeteMusic AI agent system prompt (from system-prompt.md)
INSERT INTO templates (name, platform, type, content, tags)
VALUES (
  'StPeteMusic YouTube Post Creator — System Prompt',
  'youtube',
  'prompt',
  jsonb_build_object(
    'raw', 'You are an AI assistant for StPeteMusic, a music promoter in St. Petersburg, FL.
Your job is to generate YouTube post metadata for live performance videos.

Output a single flat JSON object with these fields:
- bandName (string)
- bandInstagram (string, @handle)
- caption (string, short YouTube title)
- postDate (string, "YYYY-MM-DD HH:MM:SS", future weekday 3-7 days out, default 11:00:00)
- recordDate (string, "YYYY-MM-DD HH:MM:SS", when the performance happened)
- hashtags (array of strings)
- mentions (array of @handles)
- status ("draft")
- platform ("YouTube")
- suiteEStudios ("Suite E Studios")
- suiteEStudiosInstagram ("@suite.e.studios")
- eventType ("Music")
- mediaType ("Video")
- mediaLink ("")

Rules:
- Always tag @StPeteMusic and @suite.e.studios
- Ask for clarification if band name, Instagram handle, or record date is missing
- Use hashtags: #StPeteMusic #SuiteEStudios #StPeteFL #TampaBay + band-specific tags
- Keep captions concise and engaging',
    'version', '1.0'
  ),
  ARRAY['youtube', 'ai_prompt', 'post_creator']
);

-- Instagram Reel caption template
INSERT INTO templates (name, platform, type, content, tags)
VALUES (
  'Final Friday — Instagram Reel Caption',
  'instagram',
  'caption',
  jsonb_build_object(
    'raw', '🎸 [BAND] at Final Friday
📅 Last Friday of the month
📍 Suite E Studios — Warehouse Arts District, St. Pete
🎟️ Tickets: final-friday.eventbrite.com

Doors: 7pm | Band 1: 8-9pm | Band 2: 9-10:20pm | Band 3: 10:45pm-midnight

Tag: @StPeteMusic @suite.e.studios [BAND_INSTAGRAM]
#FinalFriday #StPeteMusic #SuiteEStudios #StPeteFL #TampaBay #LiveMusic #WareArtsDistrict',
    'variables', jsonb_build_array('BAND', 'BAND_INSTAGRAM')
  ),
  ARRAY['instagram', 'final_friday', 'reel']
);

-- Instagram Reel description template
INSERT INTO templates (name, platform, type, content, tags)
VALUES (
  'Final Friday — YouTube Description',
  'youtube',
  'description',
  jsonb_build_object(
    'raw', 'Live at Suite E Studios — St. Petersburg, FL
Recorded at Final Friday, [DATE]

[BAND] performing live in the Warehouse Arts District.
Follow the band: [BAND_INSTAGRAM]

---
StPeteMusic presents live music every month at Suite E Studios.
Subscribe for more live performances from the Tampa Bay music scene.

📍 Suite E Studios | 2505 N. Ware Blvd, St. Pete FL
🌐 https://linktr.ee/stpetemusic
📷 @StPeteMusic | @suite.e.studios',
    'variables', jsonb_build_array('DATE', 'BAND', 'BAND_INSTAGRAM')
  ),
  ARRAY['youtube', 'final_friday', 'description']
);

-- YouTube Hashtags — General (≤ 500 chars)
INSERT INTO templates (name, platform, type, content, tags)
VALUES (
  'YouTube Hashtags — General StPeteMusic',
  'youtube',
  'youtube_hashtags',
  jsonb_build_object(
    'raw', '#StPeteMusic #SuiteEStudios #StPeteFL #TampaBay #LiveMusic #WarehouseArtsDistrict #FinalFriday #InstantNoodles #LocalBands #FloridaMusic #TampaBayMusic #IndieMusic #SupportLocalMusic #StPetersburg #SuiteEStudiosStPete #LivePerformance #MusicScene #BandLife #OriginalMusic #FloridaBands'
  ),
  ARRAY['youtube', 'hashtags', 'general']
);

-- YouTube Hashtags — Final Friday (≤ 500 chars)
INSERT INTO templates (name, platform, type, content, tags)
VALUES (
  'YouTube Hashtags — Final Friday',
  'youtube',
  'youtube_hashtags',
  jsonb_build_object(
    'raw', '#FinalFriday #StPeteMusic #SuiteEStudios #StPeteFL #TampaBay #LiveMusic #WarehouseArtsDistrict #FinalFridayStPete #IndieMusic #LocalBands #FloridaMusic #TampaBayMusic #SupportLocalMusic #StPetersburg #LivePerformance #MusicScene #BandLife #OriginalMusic #FloridaBands #ConcertVideos'
  ),
  ARRAY['youtube', 'hashtags', 'final_friday']
);

-- Booking inquiry email template
INSERT INTO templates (name, platform, type, content, tags)
VALUES (
  'Booking Inquiry — Outreach Email',
  NULL,
  'email',
  jsonb_build_object(
    'subject', 'Booking Inquiry — StPeteMusic x [ARTIST_NAME]',
    'body', 'Hey [CONTACT_NAME],

My name is Matt, I run @StPeteMusic — a community music promoter based in St. Pete FL.

We host monthly events at Suite E Studios in the Warehouse Arts District, including Final Friday (last Friday of the month) and Instant Noodles (last Wednesday).

I''d love to have [ARTIST_NAME] perform at an upcoming event! Our shows typically run:

🎸 Final Friday
  Doors: 7pm | Sets: 8-9pm, 9-10:20pm, 10:45pm-midnight

📅 Upcoming dates: [DATES]

Let me know if you''d be interested in booking a set. Happy to chat about details, payment, and logistics.

Best,
Matt Taylor
@StPeteMusic
https://linktr.ee/stpetemusic',
    'variables', jsonb_build_array('CONTACT_NAME', 'ARTIST_NAME', 'DATES')
  ),
  ARRAY['email', 'booking', 'outreach']
);

-- Booking confirmation email template
INSERT INTO templates (name, platform, type, content, tags)
VALUES (
  'Booking Confirmation — Artist Email',
  NULL,
  'email',
  jsonb_build_object(
    'subject', 'Confirmed: [ARTIST_NAME] at Final Friday — [DATE]',
    'body', 'Hey [CONTACT_NAME]!

You''re officially booked for Final Friday on [DATE] at Suite E Studios!

📍 Suite E Studios — 2505 N. Ware Blvd, St. Petersburg, FL 33713
🕗 Doors: 7pm | Your set: [SET_TIME]
💰 Payment: [PAYMENT_AMOUNT] via [PAYMENT_METHOD]

A few things to note:
- Load-in: 30 minutes before your set
- Sound check will be available from 6:30pm
- Please tag @StPeteMusic and @suite.e.studios in any promo posts

If anything comes up, don''t hesitate to reach out. Can''t wait to have you!

Matt
@StPeteMusic',
    'variables', jsonb_build_array('CONTACT_NAME', 'ARTIST_NAME', 'DATE', 'SET_TIME', 'PAYMENT_AMOUNT', 'PAYMENT_METHOD')
  ),
  ARRAY['email', 'booking', 'confirmation']
);
