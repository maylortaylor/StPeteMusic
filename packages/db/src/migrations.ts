export type Migration = { filename: string; sql: string };

export const MIGRATIONS: Migration[] = [
  {
    filename: 'schema.sql',
    sql: `
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS persons (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name    TEXT NOT NULL,
  last_name     TEXT,
  email         BYTEA,
  phone         BYTEA,
  skills        TEXT[]   DEFAULT '{}',
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_persons_last_name ON persons (last_name);

CREATE TABLE IF NOT EXISTS artists (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             TEXT NOT NULL,
  username         TEXT,
  type             TEXT NOT NULL
                   CHECK (type IN ('Band', 'Solo Artist', 'DJ', 'Event Producer', 'Creative', 'Other')),
  email            BYTEA,
  instagram_handle TEXT,
  instagram_url    TEXT,
  facebook_url     TEXT,
  youtube_url      TEXT,
  website          TEXT,
  linktree_url     TEXT,
  venmo            BYTEA,
  zelle            BYTEA,
  other_payment    BYTEA,
  notes            TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_artists_name       ON artists (name);
CREATE INDEX IF NOT EXISTS idx_artists_type       ON artists (type);
CREATE INDEX IF NOT EXISTS idx_artists_username   ON artists (username);
CREATE INDEX IF NOT EXISTS idx_artists_is_active  ON artists (is_active);

CREATE TABLE IF NOT EXISTS venues (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT NOT NULL,
  address             TEXT,
  phone               BYTEA,
  email               BYTEA,
  instagram_url       TEXT,
  instagram_username  TEXT,
  facebook_url        TEXT,
  facebook_username   TEXT,
  contact_name        TEXT,
  notes               TEXT,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_venues_name ON venues (name);

CREATE TABLE IF NOT EXISTS artist_members (
  artist_id          UUID NOT NULL REFERENCES artists (id) ON DELETE CASCADE,
  person_id          UUID NOT NULL REFERENCES persons (id) ON DELETE CASCADE,
  role               TEXT,
  is_primary_contact BOOLEAN NOT NULL DEFAULT false,
  joined_at          TIMESTAMPTZ,
  PRIMARY KEY (artist_id, person_id)
);
CREATE INDEX IF NOT EXISTS idx_artist_members_person ON artist_members (person_id);

CREATE TABLE IF NOT EXISTS post_stats (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform         TEXT NOT NULL
                   CHECK (platform IN ('instagram', 'youtube', 'facebook', 'tiktok')),
  post_type        TEXT,
  platform_post_id TEXT UNIQUE,
  permalink        TEXT,
  caption          TEXT,
  published_at     TIMESTAMPTZ,
  duration_sec     INTEGER,
  views            BIGINT,
  reach            BIGINT,
  likes            BIGINT,
  shares           BIGINT,
  saves            BIGINT,
  follows          BIGINT,
  comments_count   BIGINT,
  artist_id        UUID REFERENCES artists (id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_post_stats_platform    ON post_stats (platform);
CREATE INDEX IF NOT EXISTS idx_post_stats_published   ON post_stats (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_stats_artist      ON post_stats (artist_id);

CREATE TABLE IF NOT EXISTS account_snapshots (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform       TEXT NOT NULL
                 CHECK (platform IN ('instagram', 'youtube', 'facebook', 'tiktok')),
  recorded_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  followers      BIGINT,
  following      BIGINT,
  posts_count    BIGINT,
  extra_metrics  JSONB DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_snapshots_platform    ON account_snapshots (platform);
CREATE INDEX IF NOT EXISTS idx_snapshots_recorded    ON account_snapshots (recorded_at DESC);

CREATE TABLE IF NOT EXISTS ig_mentions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instagram_handle    TEXT NOT NULL UNIQUE,
  total_mentions      INTEGER NOT NULL DEFAULT 0,
  first_mentioned_at  TIMESTAMPTZ,
  last_mentioned_at   TIMESTAMPTZ,
  artist_id           UUID REFERENCES artists (id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ig_mentions_handle    ON ig_mentions (instagram_handle);
CREATE INDEX IF NOT EXISTS idx_ig_mentions_artist    ON ig_mentions (artist_id);

CREATE TABLE IF NOT EXISTS templates (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  platform   TEXT,
  type       TEXT NOT NULL
             CHECK (type IN ('post', 'caption', 'description', 'youtube_hashtags', 'prompt', 'email')),
  content    JSONB NOT NULL DEFAULT '{}',
  is_active  BOOLEAN NOT NULL DEFAULT true,
  tags       TEXT[]  DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_youtube_hashtags_length
    CHECK (type <> 'youtube_hashtags' OR length(content->>'raw') <= 500)
);
CREATE INDEX IF NOT EXISTS idx_templates_type      ON templates (type);
CREATE INDEX IF NOT EXISTS idx_templates_platform  ON templates (platform);
CREATE INDEX IF NOT EXISTS idx_templates_is_active ON templates (is_active);
CREATE INDEX IF NOT EXISTS idx_templates_tags      ON templates USING gin (tags);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_persons_updated_at
  BEFORE UPDATE ON persons
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_artists_updated_at
  BEFORE UPDATE ON artists
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_venues_updated_at
  BEFORE UPDATE ON venues
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_post_stats_updated_at
  BEFORE UPDATE ON post_stats
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_ig_mentions_updated_at
  BEFORE UPDATE ON ig_mentions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
`,
  },
  {
    filename: 'seed.sql',
    sql: `
INSERT INTO artists (name, username, type, instagram_url, facebook_url, website, linktree_url, notes)
VALUES
  ('The Pleasantries', '@Thepleasantriesband', 'Band', NULL, 'https://www.facebook.com/profile.php?id=61569111645941', NULL, NULL, NULL),
  ('Dandy Lush', '@dandylushmusic', 'Band', NULL, 'https://www.facebook.com/dandylushmusic', NULL, NULL, NULL),
  ('Harlow Gold', '@o.g.harlowgold', 'Band', NULL, 'https://www.facebook.com/profile.php?id=61550795590638', NULL, NULL, NULL),
  ('MoonShow', '@moonshowband', 'Band', NULL, NULL, 'https://linktr.ee/moonshowband', 'https://linktr.ee/moonshowband', NULL),
  ('Sedque', '@sedque.music', 'Band', 'https://www.instagram.com/sedque.music', NULL, NULL, NULL, NULL),
  ('Willie Jones', '@williejones_cocktailhour', 'Solo Artist', NULL, 'https://www.facebook.com/alex.mcdonald.735', NULL, NULL, 'Cocktail hour act'),
  ('Brother Bear', '@brotherbear.boi', 'DJ', NULL, 'https://www.facebook.com/brotherbearboii', NULL, NULL, NULL),
  ('Khoury Affinity', '@khoury_affinity', 'DJ', NULL, 'https://www.facebook.com/khoury.ahwesh', NULL, NULL, NULL),
  ('Accentrik', '@accentrik', 'DJ', NULL, 'https://www.facebook.com/accentrik.music', NULL, NULL, NULL),
  ('Nico the Alchemist', '@nicosalchemy', 'DJ', NULL, 'https://www.facebook.com/nicothealchemist', NULL, NULL, NULL),
  ('SlamChops', '@slamchopss', 'Solo Artist', NULL, 'https://www.facebook.com/profile.php?id=61579011129960', NULL, NULL, NULL),
  ('Wyatt Norton', '@wyatt_norton', 'Solo Artist', NULL, 'https://www.facebook.com/wyatt.norton.777', NULL, NULL, NULL),
  ('Allen Fereti', '@allenfereti06', 'Solo Artist', 'https://www.instagram.com/allenfereti06', NULL, NULL, NULL, 'Email in CSV has typo: allenfereti066gmail.com'),
  ('Physical Plant', '@physical_plant', 'Band', NULL, 'https://www.facebook.com/physicalplants', 'https://www.physicalplantmusic.com/', 'https://linktr.ee/physicalplant', NULL),
  ('Seems', '@seemsband', 'Band', 'https://www.instagram.com/allenfereti06', NULL, NULL, NULL, NULL),
  ('Little Giver Band', '@littlegiverband', 'Band', 'https://www.instagram.com/littlegiverband', 'https://www.facebook.com/profile.php?id=61583532835592', 'https://www.littlegiverband.com/', NULL, 'Contact: Leah @leahivelise'),
  ('Liam Bauman', '@liam_bauman', 'Solo Artist', 'https://www.instagram.com/liam_bauman', 'https://www.facebook.com/liambaumanmusic', 'https://liambauman.com', NULL, 'Publicity: Frank Keith / Sweetheart PR / frank@sweetheartpr.com'),
  ('Callaghan Keane', '@callaghan.keane', 'DJ', 'https://www.instagram.com/callaghan.keane', 'https://www.facebook.com/callaghan.keane', NULL, NULL, NULL),
  ('Brian Busto', '@djbrianbusto', 'DJ', 'https://www.instagram.com/djbrianbusto/', 'https://www.facebook.com/brian.busto.1', 'https://linktr.ee/djbrianbusto', NULL, 'Also: @serioussoul813'),
  ('Prophessor J Events', NULL, 'Event Producer', NULL, 'https://www.facebook.com/groups/803946243670033', NULL, NULL, NULL),
  ('Chriss (Clockworkxband)', '@chriss.3___', 'Band', 'https://www.instagram.com/chriss.3___/', NULL, NULL, 'https://linktr.ee/chriscriss', NULL),
  ('Dylan Dames', '@DylanDames', 'Band', 'https://www.instagram.com/dylandames/', NULL, NULL, NULL, NULL),
  ('JoheeMason', '@Joheemason', 'Solo Artist', 'https://www.instagram.com/joheemason', NULL, NULL, NULL, NULL),
  ('Mel With A Period', '@melwithaperiod', 'Solo Artist', 'https://www.instagram.com/melwithaperiod', NULL, NULL, 'https://linktr.ee/melwithaperiod', NULL),
  ('Movie Props', '@moviepropsband', 'Band', 'https://www.instagram.com/moviepropsband/', 'https://www.facebook.com/profile.php?id=100078849106149', NULL, NULL, NULL),
  ('Then There''s Me', '@ThenTheresMeOfficial', 'Band', 'http://instagram.com/thentheresmeofficial', NULL, 'www.thentheresmeofficial.com', 'https://linktr.ee/thentheresmeband', NULL),
  ('Beach Terror', '@beach_terror', 'Band', 'https://www.instagram.com/beach_terror', NULL, NULL, NULL, NULL),
  ('Viorica', '@Viorica.Band', 'Band', 'https://www.instagram.com/viorica.band', NULL, NULL, NULL, 'Contact: John (daddy kool)'),
  ('Aliqua', '@_aliqua', 'Band', 'https://www.instagram.com/_aliquia', NULL, NULL, NULL, NULL),
  ('Spanish Bombs', '@SpanishBombsFL', 'Band', 'https://www.instagram.com/SpanishBombsFL', NULL, NULL, NULL, NULL),
  ('House of I', '@HouseOfI', 'Band', 'https://www.instagram.com/houseofi', NULL, NULL, NULL, NULL),
  ('The Tilt', '@TheTiltOrchestra', 'Band', 'https://www.instagram.com/thetiltorchestra', NULL, NULL, NULL, NULL)
ON CONFLICT DO NOTHING;

INSERT INTO persons (first_name, last_name, skills, notes)
VALUES
  ('Steven',   'Sanchez',     ARRAY['artist', 'musician'],            'Contact for The Pleasantries and Accentrik (DJ)'),
  ('Pam',      NULL,          ARRAY['artist', 'musician'],            'Contact for Dandy Lush'),
  ('Harlow',   NULL,          ARRAY['artist', 'musician'],            'Contact for Harlow Gold'),
  ('Josh',     'Barbour',     ARRAY['artist', 'musician'],            'Contact for MoonShow'),
  ('James',    'Fitzpatrick', ARRAY['artist', 'musician'],            'Contact for Sedque'),
  ('Alex',     'McDonald',    ARRAY['artist', 'musician'],            'Contact for Willie Jones cocktail hour'),
  ('Josh',     'Glogau',      ARRAY['artist', 'dj'],                  'Contact for Brother Bear (DJ). Mgmt: mgmt@alchemyprod.com'),
  ('Khoury',   'Ahwesh',      ARRAY['artist', 'dj'],                  'Contact for Khoury Affinity'),
  ('Liam',     'Walsh',       ARRAY['artist', 'musician'],            'Contact for SlamChops'),
  ('Wyatt',    'Norton',      ARRAY['artist', 'musician'],            'Contact for Wyatt Norton solo and Beach Terror'),
  ('Allen',    'Fereti',      ARRAY['artist', 'musician'],            'Solo artist @allenfereti06'),
  ('Leah',     NULL,          ARRAY['artist', 'musician'],            'Contact for Little Giver Band @leahivelise'),
  ('Liam',     'Bauman',      ARRAY['artist', 'musician'],            'Solo artist, publicity via Sweetheart PR'),
  ('Callaghan','Keane',       ARRAY['artist', 'dj'],                  'DJ @callaghan.keane'),
  ('Brian',    'Busto',       ARRAY['artist', 'dj'],                  'DJ @djbrianbusto'),
  ('Jarryd',   'Thompson',    ARRAY['producer', 'event producer'],    'Prophessor J Events'),
  ('Tyson',    NULL,          ARRAY['artist', 'musician'],            'Contact for Seems band'),
  ('Joheem',   NULL,          ARRAY['artist', 'musician'],            'Solo artist @joheemason'),
  ('Mel',      NULL,          ARRAY['artist', 'musician'],            'Solo artist @melwithaperiod'),
  ('Bina',     NULL,          ARRAY['creative', 'artist'],            'She.Devil.Ink — tattoo/creative @RentedTechnology'),
  ('Matt',     NULL,          ARRAY['creative', 'musician'],          '@bassguitarwizard — Rented Technology'),
  ('Josiah',   'Selby',       ARRAY['artist', 'musician'],            'Co-lead Then There''s Me'),
  ('Hannah',   'Selby',       ARRAY['artist', 'musician'],            'Co-lead Then There''s Me'),
  ('John',     NULL,          ARRAY['artist', 'musician'],            'Daddy Kool Records / Viorica contact'),
  ('Jillian',  'Plauche',     ARRAY['other'],                         'Phone: (727) 678-8378, Venmo: @npc170')
ON CONFLICT DO NOTHING;

INSERT INTO venues (name, address, instagram_url, instagram_username, notes)
VALUES ('Suite E Studios', '2505 N. Ware Blvd, St. Petersburg, FL 33713',
  'https://www.instagram.com/suite.e.studios', '@suite.e.studios',
  'Partner venue — Warehouse Arts District, ~1700 sqft')
ON CONFLICT DO NOTHING;

INSERT INTO templates (name, platform, type, content, tags) VALUES
  ('StPeteMusic YouTube Post Creator — System Prompt', 'youtube', 'prompt',
    jsonb_build_object('raw', 'You are an AI assistant for StPeteMusic, a music promoter in St. Petersburg, FL. Your job is to generate YouTube post metadata for live performance videos. Output a single flat JSON object.', 'version', '1.0'),
    ARRAY['youtube', 'ai_prompt', 'post_creator']),
  ('Final Friday — Instagram Reel Caption', 'instagram', 'caption',
    jsonb_build_object('raw', '🎸 [BAND] at Final Friday\n📅 Last Friday of the month\n📍 Suite E Studios\n#FinalFriday #StPeteMusic #SuiteEStudios #StPeteFL #TampaBay #LiveMusic', 'variables', jsonb_build_array('BAND', 'BAND_INSTAGRAM')),
    ARRAY['instagram', 'final_friday', 'reel']),
  ('Final Friday — YouTube Description', 'youtube', 'description',
    jsonb_build_object('raw', 'Live at Suite E Studios — St. Petersburg, FL\nRecorded at Final Friday, [DATE]\n\n[BAND] performing live in the Warehouse Arts District.\nFollow the band: [BAND_INSTAGRAM]', 'variables', jsonb_build_array('DATE', 'BAND', 'BAND_INSTAGRAM')),
    ARRAY['youtube', 'final_friday', 'description']),
  ('YouTube Hashtags — General StPeteMusic', 'youtube', 'youtube_hashtags',
    jsonb_build_object('raw', '#StPeteMusic #SuiteEStudios #StPeteFL #TampaBay #LiveMusic #WarehouseArtsDistrict #FinalFriday #InstantNoodles #LocalBands #FloridaMusic #TampaBayMusic #IndieMusic'),
    ARRAY['youtube', 'hashtags', 'general']),
  ('YouTube Hashtags — Final Friday', 'youtube', 'youtube_hashtags',
    jsonb_build_object('raw', '#FinalFriday #StPeteMusic #SuiteEStudios #StPeteFL #TampaBay #LiveMusic #WarehouseArtsDistrict #FinalFridayStPete #IndieMusic #LocalBands #FloridaMusic #TampaBayMusic'),
    ARRAY['youtube', 'hashtags', 'final_friday']),
  ('Booking Inquiry — Outreach Email', NULL, 'email',
    jsonb_build_object('subject', 'Booking Inquiry — StPeteMusic x [ARTIST_NAME]', 'body', 'Hey [CONTACT_NAME],\n\nMy name is Matt, I run @StPeteMusic...', 'variables', jsonb_build_array('CONTACT_NAME', 'ARTIST_NAME', 'DATES')),
    ARRAY['email', 'booking', 'outreach']),
  ('Booking Confirmation — Artist Email', NULL, 'email',
    jsonb_build_object('subject', 'Confirmed: [ARTIST_NAME] at Final Friday — [DATE]', 'body', 'Hey [CONTACT_NAME]!\n\nYou''re officially booked for Final Friday on [DATE] at Suite E Studios!', 'variables', jsonb_build_array('CONTACT_NAME', 'ARTIST_NAME', 'DATE', 'SET_TIME', 'PAYMENT_AMOUNT', 'PAYMENT_METHOD')),
    ARRAY['email', 'booking', 'confirmation'])
ON CONFLICT DO NOTHING;
`,
  },
  {
    filename: '001_add_public_fields.sql',
    sql: `
ALTER TABLE artists DROP COLUMN IF EXISTS email;
ALTER TABLE artists
  ADD COLUMN IF NOT EXISTS email          TEXT,
  ADD COLUMN IF NOT EXISTS slug           TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS description    TEXT,
  ADD COLUMN IF NOT EXISTS hero_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS genres         TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tags           TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS bandcamp_url   TEXT,
  ADD COLUMN IF NOT EXISTS spotify_url    TEXT,
  ADD COLUMN IF NOT EXISTS soundcloud_url TEXT,
  ADD COLUMN IF NOT EXISTS extra_links    JSONB   DEFAULT '[]';
CREATE INDEX IF NOT EXISTS idx_artists_slug   ON artists (slug);
CREATE INDEX IF NOT EXISTS idx_artists_genres ON artists USING gin (genres);
CREATE INDEX IF NOT EXISTS idx_artists_tags   ON artists USING gin (tags);

ALTER TABLE venues DROP COLUMN IF EXISTS email;
ALTER TABLE venues DROP COLUMN IF EXISTS phone;
ALTER TABLE venues
  ADD COLUMN IF NOT EXISTS email          TEXT,
  ADD COLUMN IF NOT EXISTS phone          TEXT,
  ADD COLUMN IF NOT EXISTS slug           TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS description    TEXT,
  ADD COLUMN IF NOT EXISTS hero_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS capacity       INTEGER,
  ADD COLUMN IF NOT EXISTS tags           TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS website        TEXT,
  ADD COLUMN IF NOT EXISTS lat            NUMERIC(9,6),
  ADD COLUMN IF NOT EXISTS lng            NUMERIC(9,6),
  ADD COLUMN IF NOT EXISTS extra_links    JSONB   DEFAULT '[]';
CREATE INDEX IF NOT EXISTS idx_venues_slug ON venues (slug);
CREATE INDEX IF NOT EXISTS idx_venues_tags ON venues USING gin (tags);
`,
  },
  {
    filename: '002_add_artist_shows.sql',
    sql: `
CREATE TABLE IF NOT EXISTS artist_shows (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id   UUID NOT NULL REFERENCES artists (id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  youtube_url TEXT,
  show_date   DATE,
  venue_name  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_artist_shows_artist ON artist_shows (artist_id);
CREATE INDEX IF NOT EXISTS idx_artist_shows_date   ON artist_shows (show_date DESC);
`,
  },
  {
    filename: '003_seed_venues.sql',
    sql: `
INSERT INTO venues (name, slug, address, instagram_url, instagram_username, website, tags, lat, lng)
VALUES
  ('Cage Brewing', 'cage-brewing', '1514 2nd Ave N, St. Petersburg, FL 33713',
    'https://www.instagram.com/cagebrewing', '@cagebrewing', 'https://cagebrewing.com',
    ARRAY['brewery','venue','st-pete'], 27.773700, -82.669000),
  ('Bayboro Brewing', 'bayboro-brewing', '2390 5th Ave S, St. Petersburg, FL 33712',
    'https://www.instagram.com/bayborobrewing', '@bayborobrewing', 'https://www.bayborobrewing.com',
    ARRAY['brewery','venue','st-pete'], 27.758400, -82.664800),
  ('Ruby''s Elixir', 'rubys-elixir', 'St. Petersburg, FL', NULL, NULL, NULL,
    ARRAY['bar','venue','st-pete'], NULL, NULL),
  ('The Nest at St Pete Brewing', 'the-nest', '544 1st Ave N, St. Petersburg, FL 33701',
    NULL, NULL, NULL, ARRAY['brewery','venue','st-pete'], 27.776200, -82.640000),
  ('The Blueberry Patch', 'the-blueberry-patch', 'St. Petersburg, FL',
    NULL, NULL, NULL, ARRAY['venue','st-pete'], NULL, NULL)
ON CONFLICT (slug) DO NOTHING;

UPDATE venues
SET slug = 'suite-e-studios', lat = 27.740980, lng = -82.676340,
    tags = ARRAY['studio','venue','warehouse-arts-district','st-pete']
WHERE name = 'Suite E Studios' AND slug IS NULL;
`,
  },
  {
    filename: '004_seed_artist_slugs.sql',
    sql: `
UPDATE artists SET slug = 'the-pleasantries'   WHERE name = 'The Pleasantries'        AND slug IS NULL;
UPDATE artists SET slug = 'dandy-lush'          WHERE name = 'Dandy Lush'              AND slug IS NULL;
UPDATE artists SET slug = 'harlow-gold'         WHERE name = 'Harlow Gold'             AND slug IS NULL;
UPDATE artists SET slug = 'moonshow'            WHERE name = 'MoonShow'                AND slug IS NULL;
UPDATE artists SET slug = 'sedque'              WHERE name = 'Sedque'                  AND slug IS NULL;
UPDATE artists SET slug = 'willie-jones'        WHERE name = 'Willie Jones'            AND slug IS NULL;
UPDATE artists SET slug = 'brother-bear'        WHERE name = 'Brother Bear'            AND slug IS NULL;
UPDATE artists SET slug = 'khoury-affinity'     WHERE name = 'Khoury Affinity'         AND slug IS NULL;
UPDATE artists SET slug = 'accentrik'           WHERE name = 'Accentrik'               AND slug IS NULL;
UPDATE artists SET slug = 'nico-the-alchemist'  WHERE name = 'Nico the Alchemist'      AND slug IS NULL;
UPDATE artists SET slug = 'slamchops'           WHERE name = 'SlamChops'               AND slug IS NULL;
UPDATE artists SET slug = 'wyatt-norton'        WHERE name = 'Wyatt Norton'            AND slug IS NULL;
UPDATE artists SET slug = 'allen-fereti'        WHERE name = 'Allen Fereti'            AND slug IS NULL;
UPDATE artists SET slug = 'kieth-penu'          WHERE name = 'Kieth Penu'              AND slug IS NULL;
UPDATE artists SET slug = 'physical-plant'      WHERE name = 'Physical Plant'          AND slug IS NULL;
UPDATE artists SET slug = 'seems'               WHERE name = 'Seems'                   AND slug IS NULL;
UPDATE artists SET slug = 'little-giver-band'   WHERE name = 'Little Giver Band'       AND slug IS NULL;
UPDATE artists SET slug = 'liam-bauman'         WHERE name = 'Liam Bauman'             AND slug IS NULL;
UPDATE artists SET slug = 'callaghan-keane'     WHERE name = 'Callaghan Keane'         AND slug IS NULL;
UPDATE artists SET slug = 'brian-busto'         WHERE name = 'Brian Busto'             AND slug IS NULL;
UPDATE artists SET slug = 'bryan-edward'        WHERE name = 'Bryan Edward'            AND slug IS NULL;
UPDATE artists SET slug = 'prophessor-j-events' WHERE name = 'Prophessor J Events'     AND slug IS NULL;
UPDATE artists SET slug = 'clockworkxband'      WHERE name = 'Chriss (Clockworkxband)' AND slug IS NULL;
UPDATE artists SET slug = 'dylan-dames'         WHERE name = 'Dylan Dames'             AND slug IS NULL;
UPDATE artists SET slug = 'johee-mason'         WHERE name = 'JoheeMason'              AND slug IS NULL;
UPDATE artists SET slug = 'mel-with-a-period'   WHERE name = 'Mel With A Period'       AND slug IS NULL;
UPDATE artists SET slug = 'movie-props'         WHERE name = 'Movie Props'             AND slug IS NULL;
UPDATE artists SET slug = 'then-theres-me'      WHERE name = 'Then There''s Me'        AND slug IS NULL;
UPDATE artists SET slug = 'beach-terror'        WHERE name = 'Beach Terror'            AND slug IS NULL;
UPDATE artists SET slug = 'viorica'             WHERE name = 'Viorica'                 AND slug IS NULL;
UPDATE artists SET slug = 'aliqua'              WHERE name = 'Aliqua'                  AND slug IS NULL;
UPDATE artists SET slug = 'spanish-bombs'       WHERE name = 'Spanish Bombs'           AND slug IS NULL;
UPDATE artists SET slug = 'house-of-i'          WHERE name = 'House of I'              AND slug IS NULL;
UPDATE artists SET slug = 'the-tilt'            WHERE name = 'The Tilt'                AND slug IS NULL;
`,
  },
  {
    filename: '005_fix_artist_slugs.sql',
    sql: `
UPDATE artists SET slug = 'the-pleasantries'   WHERE name = 'The Pleasantries'        AND slug IS NULL;
UPDATE artists SET slug = 'dandy-lush'          WHERE name = 'Dandy Lush'              AND slug IS NULL;
UPDATE artists SET slug = 'harlow-gold'         WHERE name = 'Harlow Gold'             AND slug IS NULL;
UPDATE artists SET slug = 'moonshow'            WHERE name = 'MoonShow'                AND slug IS NULL;
UPDATE artists SET slug = 'sedque'              WHERE name = 'Sedque'                  AND slug IS NULL;
UPDATE artists SET slug = 'willie-jones'        WHERE name = 'Willie Jones'            AND slug IS NULL;
UPDATE artists SET slug = 'brother-bear'        WHERE name = 'Brother Bear'            AND slug IS NULL;
UPDATE artists SET slug = 'khoury-affinity'     WHERE name = 'Khoury Affinity'         AND slug IS NULL;
UPDATE artists SET slug = 'accentrik'           WHERE name = 'Accentrik'               AND slug IS NULL;
UPDATE artists SET slug = 'nico-the-alchemist'  WHERE name = 'Nico the Alchemist'      AND slug IS NULL;
UPDATE artists SET slug = 'slamchops'           WHERE name = 'SlamChops'               AND slug IS NULL;
UPDATE artists SET slug = 'wyatt-norton'        WHERE name = 'Wyatt Norton'            AND slug IS NULL;
UPDATE artists SET slug = 'allen-fereti'        WHERE name = 'Allen Fereti'            AND slug IS NULL;
UPDATE artists SET slug = 'kieth-penu'          WHERE name = 'Kieth Penu'              AND slug IS NULL;
UPDATE artists SET slug = 'physical-plant'      WHERE name = 'Physical Plant'          AND slug IS NULL;
UPDATE artists SET slug = 'seems'               WHERE name = 'Seems'                   AND slug IS NULL;
UPDATE artists SET slug = 'little-giver-band'   WHERE name = 'Little Giver Band'       AND slug IS NULL;
UPDATE artists SET slug = 'liam-bauman'         WHERE name = 'Liam Bauman'             AND slug IS NULL;
UPDATE artists SET slug = 'callaghan-keane'     WHERE name = 'Callaghan Keane'         AND slug IS NULL;
UPDATE artists SET slug = 'brian-busto'         WHERE name = 'Brian Busto'             AND slug IS NULL;
UPDATE artists SET slug = 'bryan-edward'        WHERE name = 'Bryan Edward'            AND slug IS NULL;
UPDATE artists SET slug = 'prophessor-j-events' WHERE name = 'Prophessor J Events'     AND slug IS NULL;
UPDATE artists SET slug = 'clockworkxband'      WHERE name = 'Chriss (Clockworkxband)' AND slug IS NULL;
UPDATE artists SET slug = 'dylan-dames'         WHERE name = 'Dylan Dames'             AND slug IS NULL;
UPDATE artists SET slug = 'johee-mason'         WHERE name = 'JoheeMason'              AND slug IS NULL;
UPDATE artists SET slug = 'mel-with-a-period'   WHERE name = 'Mel With A Period'       AND slug IS NULL;
UPDATE artists SET slug = 'movie-props'         WHERE name = 'Movie Props'             AND slug IS NULL;
UPDATE artists SET slug = 'then-theres-me'      WHERE name = 'Then There''s Me'        AND slug IS NULL;
UPDATE artists SET slug = 'beach-terror'        WHERE name = 'Beach Terror'            AND slug IS NULL;
UPDATE artists SET slug = 'viorica'             WHERE name = 'Viorica'                 AND slug IS NULL;
UPDATE artists SET slug = 'aliqua'              WHERE name = 'Aliqua'                  AND slug IS NULL;
UPDATE artists SET slug = 'spanish-bombs'       WHERE name = 'Spanish Bombs'           AND slug IS NULL;
UPDATE artists SET slug = 'house-of-i'          WHERE name = 'House of I'              AND slug IS NULL;
UPDATE artists SET slug = 'the-tilt'            WHERE name = 'The Tilt'                AND slug IS NULL;
`,
  },
  {
    filename: '006_rename_sr_producer_remove_artists.sql',
    sql: `
UPDATE artists SET type = 'Event Producer' WHERE type = 'SR. PRODUCER';
ALTER TABLE artists DROP CONSTRAINT IF EXISTS artists_type_check;
ALTER TABLE artists ADD CONSTRAINT artists_type_check
  CHECK (type IN ('Band', 'Solo Artist', 'DJ', 'Event Producer', 'Creative', 'Other'));
DELETE FROM artists WHERE name IN ('Kieth Penu', 'Bryan Edward');
DELETE FROM persons WHERE (first_name = 'Kieth' AND last_name = 'Penu')
                       OR (first_name = 'Bryan' AND last_name = 'Edward');
`,
  },
  {
    filename: '007_fix_event_producer_type.sql',
    sql: `
ALTER TABLE artists DROP CONSTRAINT IF EXISTS artists_type_check;
UPDATE artists SET type = 'Event Producer' WHERE type = 'SR. PRODUCER';
ALTER TABLE artists ADD CONSTRAINT artists_type_check
  CHECK (type IN ('Band', 'Solo Artist', 'DJ', 'Event Producer', 'Creative', 'Other'));
DELETE FROM artists WHERE name IN ('Kieth Penu', 'Bryan Edward');
DELETE FROM persons
  WHERE (first_name = 'Kieth' AND last_name = 'Penu')
     OR (first_name = 'Bryan' AND last_name = 'Edward');
`,
  },
  {
    filename: '008_expand_schema.sql',
    sql: `
ALTER TABLE artists ADD COLUMN IF NOT EXISTS home_base          TEXT;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS visible_on_website BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS extra_data         JSONB   NOT NULL DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_artists_visible ON artists (visible_on_website);

ALTER TABLE persons ADD COLUMN IF NOT EXISTS instagram_handle   TEXT;
ALTER TABLE persons ADD COLUMN IF NOT EXISTS instagram_url      TEXT;
ALTER TABLE persons ADD COLUMN IF NOT EXISTS role               TEXT;
ALTER TABLE persons ADD COLUMN IF NOT EXISTS company            TEXT;
ALTER TABLE persons ADD COLUMN IF NOT EXISTS tags               TEXT[]  NOT NULL DEFAULT '{}';
ALTER TABLE persons ADD COLUMN IF NOT EXISTS extra_links        JSONB   NOT NULL DEFAULT '[]';
ALTER TABLE persons ADD COLUMN IF NOT EXISTS extra_data         JSONB   NOT NULL DEFAULT '{}';
ALTER TABLE persons ADD COLUMN IF NOT EXISTS visible_on_website BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_persons_role    ON persons (role);
CREATE INDEX IF NOT EXISTS idx_persons_company ON persons (company);
CREATE INDEX IF NOT EXISTS idx_persons_tags    ON persons USING gin (tags);

ALTER TABLE venues ADD COLUMN IF NOT EXISTS neighborhood        TEXT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS av_setup            TEXT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS partnership_level   TEXT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS visible_on_website  BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS extra_data          JSONB   NOT NULL DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_venues_visible      ON venues (visible_on_website);
CREATE INDEX IF NOT EXISTS idx_venues_partnership  ON venues (partnership_level);

CREATE TABLE IF NOT EXISTS organizations (
  id                  UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT    NOT NULL,
  type                TEXT,
  instagram_handle    TEXT,
  instagram_url       TEXT,
  facebook_url        TEXT,
  website             TEXT,
  slug                TEXT    UNIQUE,
  description         TEXT,
  tags                TEXT[]  NOT NULL DEFAULT '{}',
  extra_links         JSONB   NOT NULL DEFAULT '[]',
  extra_data          JSONB   NOT NULL DEFAULT '{}',
  notes               TEXT,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  visible_on_website  BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_organizations_name    ON organizations (name);
CREATE INDEX IF NOT EXISTS idx_organizations_type    ON organizations (type);
CREATE INDEX IF NOT EXISTS idx_organizations_slug    ON organizations (slug);
CREATE INDEX IF NOT EXISTS idx_organizations_tags    ON organizations USING gin (tags);
CREATE INDEX IF NOT EXISTS idx_organizations_visible ON organizations (visible_on_website);
CREATE OR REPLACE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS organization_members (
  organization_id    UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  person_id          UUID NOT NULL REFERENCES persons (id)       ON DELETE CASCADE,
  role               TEXT,
  is_primary_contact BOOLEAN NOT NULL DEFAULT false,
  joined_at          TIMESTAMPTZ,
  PRIMARY KEY (organization_id, person_id)
);
CREATE INDEX IF NOT EXISTS idx_org_members_person ON organization_members (person_id);
`,
  },
  {
    filename: '009_seed_new_artists.sql',
    sql: `
INSERT INTO artists (name, slug, type, instagram_handle, instagram_url, home_base, visible_on_website)
VALUES
  ('Ajeva','ajeva','Band','@ajevamusic','https://www.instagram.com/ajevamusic','St. Pete, FL',false),
  ('Animal Prince','animal-prince','Band','@animalprince_','https://www.instagram.com/animalprince_','St. Pete, FL',false),
  ('Antelope (Phish Tribute)','antelope-phish-tribute','Band','@antelopephishtribute','https://www.instagram.com/antelopephishtribute','St. Pete, FL',false),
  ('Dead Reef','dead-reef','Band','@deadreef.fl','https://www.instagram.com/deadreef.fl','St. Pete, FL',false),
  ('Dionysus','dionysus','Band','@dionysus.band','https://www.instagram.com/dionysus.band','St. Pete, FL',false),
  ('Displace','displace','Band','@displacemusic','https://www.instagram.com/displacemusic','St. Pete, FL',false),
  ('Donzii','donzii','Band','@_donzii','https://www.instagram.com/_donzii','St. Pete, FL',false),
  ('Earth Girl','earth-girl','Band','@earthgirl','https://www.instagram.com/earthgirl','St. Pete, FL',false),
  ('Frog Shaman','frog-shaman','Band','@frogshamanband','https://www.instagram.com/frogshamanband','St. Pete, FL',false),
  ('Gabe Hernandez','gabe-hernandez','Band','@gabehernandezmusic','https://www.instagram.com/gabehernandezmusic','St. Pete, FL',false),
  ('Golden Hour Trees','golden-hour-trees','Band','@goldenhourtrees','https://www.instagram.com/goldenhourtrees','St. Pete, FL',false),
  ('Holy River','holy-river','Band','@holyrivermusic','https://www.instagram.com/holyrivermusic','St. Pete, FL',false),
  ('Humankinda','humankinda','Band','@humankindaband','https://www.instagram.com/humankindaband','St. Pete, FL',false),
  ('In Case U Didn''t Joe','in-case-u-didnt-joe','Band','@incaseu.didntjoe','https://www.instagram.com/incaseu.didntjoe','St. Pete, FL',false),
  ('JT Brown & Co','jt-brown-and-co','Band','@jtbrownandco','https://www.instagram.com/jtbrownandco','St. Pete, FL',false),
  ('Joy Wagon','joy-wagon','Band','@joywagonband','https://www.instagram.com/joywagonband','St. Pete, FL',false),
  ('Katara','katara','Band','@wearekatara','https://www.instagram.com/wearekatara','St. Pete, FL',false),
  ('Kollect Inc','kollect-inc','Band','@kollectinc','https://www.instagram.com/kollectinc','St. Pete, FL',false),
  ('Legacy Music','legacy-music','Band','@legacymusic859','https://www.instagram.com/legacymusic859','St. Pete, FL',false),
  ('Legacy Orchestra Collective','legacy-orchestra-collective','Band','@legacyorchestracollective','https://www.instagram.com/legacyorchestracollective','St. Pete, FL',false),
  ('Lesa Silvermore','lesa-silvermore','Band','@lesasilvermoremusic','https://www.instagram.com/lesasilvermoremusic','St. Pete, FL',false),
  ('Light the Wire','light-the-wire','Band','@light.the.wire','https://www.instagram.com/light.the.wire','St. Pete, FL',false),
  ('Liquid Pennies','liquid-pennies','Band','@liquidpenniesband','https://www.instagram.com/liquidpenniesband','St. Pete, FL',false),
  ('Minim','minim','Band','@minim_music','https://www.instagram.com/minim_music','St. Pete, FL',false),
  ('Mr. Whiskers and the Nine Lives','mr-whiskers-and-the-nine-lives','Band','@mr.whiskers_and_the_nine_lives','https://www.instagram.com/mr.whiskers_and_the_nine_lives','St. Pete, FL',false),
  ('North Star','north-star','Band','@northstarstpete','https://www.instagram.com/northstarstpete','St. Pete, FL',false),
  ('Razor and the Boogie Men','razor-and-the-boogie-men','Band','@razorandtheboogiemen','https://www.instagram.com/razorandtheboogiemen','St. Pete, FL',false),
  ('Sauce Pocket Funk','sauce-pocket-funk','Band','@saucepocketfunk','https://www.instagram.com/saucepocketfunk','St. Pete, FL',false),
  ('Stripes','stripes','Band','@stripes520','https://www.instagram.com/stripes520','St. Pete, FL',false),
  ('Tamayo','tamayo','Band','@tamayo_band','https://www.instagram.com/tamayo_band','St. Pete, FL',false),
  ('The George Band','the-george-band','Band','@thegeorgebandd','https://www.instagram.com/thegeorgebandd','St. Pete, FL',false),
  ('The Pilot Waves','the-pilot-waves','Band','@the_pilotwaves','https://www.instagram.com/the_pilotwaves','St. Pete, FL',false),
  ('The Real Gore Wizard','the-real-gore-wizard','Band','@therealgorewizard','https://www.instagram.com/therealgorewizard','St. Pete, FL',false),
  ('The Venus Band','the-venus-band','Band','@thevenus_band','https://www.instagram.com/thevenus_band','St. Pete, FL',false),
  ('The Wandering Hours','the-wandering-hours','Band','@TheWanderingHours','https://www.instagram.com/TheWanderingHours','St. Pete, FL',false),
  ('Tropico Blvd','tropico-blvd','Band','@tropicoblvd','https://www.instagram.com/tropicoblvd','St. Pete, FL',false)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO artists (name, slug, type, instagram_handle, instagram_url, home_base, genres, linktree_url, visible_on_website)
VALUES
  ('Alex Borst','alex-borst','Solo Artist','@_alexborst','https://www.instagram.com/_alexborst','St. Pete, FL','{}',NULL,false),
  ('Ava Iri','ava-iri','Solo Artist','@ava.iri','https://www.instagram.com/ava.iri','St. Pete, FL',ARRAY['Soul','R&B','Hip-hop'],'https://linktr.ee/ava_iri',false),
  ('Billy M. Beck','billy-m-beck','Solo Artist','@billymbeck','https://www.instagram.com/billymbeck','St. Pete, FL','{}',NULL,false),
  ('Corporate Guest','corporate-guest','Solo Artist','@corporateguest','https://www.instagram.com/corporateguest','St. Pete, FL','{}',NULL,false),
  ('Dean Mischief','dean-mischief','Solo Artist','@deanmischiefmusic','https://www.instagram.com/deanmischiefmusic','St. Pete, FL','{}',NULL,false),
  ('Doorman the DJ','doorman-the-dj','DJ','@doormanthedj','https://www.instagram.com/doormanthedj','St. Pete, FL','{}',NULL,false),
  ('Infinite Third','infinite-third','Solo Artist','@infinitethird','https://www.instagram.com/infinitethird','St. Pete, FL','{}',NULL,false),
  ('J Rose Loops','j-rose-loops','Solo Artist','@jroseloops','https://www.instagram.com/jroseloops','St. Pete, FL','{}',NULL,false),
  ('Jimpster','jimpster','Solo Artist','@jimpster_gram','https://www.instagram.com/jimpster_gram','St. Pete, FL','{}',NULL,false),
  ('Jon Berg','jon-berg','Solo Artist','@xjonberg','https://www.instagram.com/xjonberg','St. Pete, FL','{}',NULL,false),
  ('Kelsey Sharp','kelsey-sharp','Solo Artist','@kelseysharpmusic','https://www.instagram.com/kelseysharpmusic','St. Pete, FL','{}',NULL,false),
  ('Lynn Hawkins','lynn-hawkins','Solo Artist','@lynnhawkins_','https://www.instagram.com/lynnhawkins_','St. Pete, FL','{}',NULL,false),
  ('Michael May James','michael-may-james','Solo Artist','@michaelmayjames','https://www.instagram.com/michaelmayjames','St. Pete, FL','{}',NULL,false),
  ('Mike Blenda','mike-blenda','Solo Artist','@mikeblenda','https://www.instagram.com/mikeblenda','St. Pete, FL','{}',NULL,false),
  ('Mouth Council','mouth-council','Solo Artist','@mouthcouncil','https://www.instagram.com/mouthcouncil','St. Pete, FL','{}',NULL,false),
  ('Not Julia Powell','not-julia-powell','Solo Artist','@not_julia_powell','https://www.instagram.com/not_julia_powell','St. Pete, FL','{}',NULL,false),
  ('Only1Two','only1two','Solo Artist','@only1two','https://www.instagram.com/only1two','St. Pete, FL','{}',NULL,false),
  ('Public Speaking','public-speaking','Solo Artist','@public__speaking','https://www.instagram.com/public__speaking','St. Pete, FL','{}',NULL,false),
  ('Rat Galactic','rat-galactic','Solo Artist','@rat_galactic','https://www.instagram.com/rat_galactic','St. Pete, FL','{}',NULL,false),
  ('Red Feather','red-feather','Solo Artist','@redfeathermusic','https://www.instagram.com/redfeathermusic','St. Pete, FL','{}',NULL,false),
  ('Roger Thomas','roger-thomas','Solo Artist','@rogerthomasmusic','https://www.instagram.com/rogerthomasmusic','St. Pete, FL','{}',NULL,false),
  ('Savannah Lee','savannah-lee','Solo Artist','@savannahlee475','https://www.instagram.com/savannahlee475','St. Pete, FL','{}',NULL,false),
  ('Shua Harrell','shua-harrell','Solo Artist','@shuaharrell','https://www.instagram.com/shuaharrell','St. Pete, FL','{}',NULL,false),
  ('Slam Duncan','slam-duncan','Solo Artist','@slamduncan710','https://www.instagram.com/slamduncan710','St. Pete, FL','{}',NULL,false),
  ('Tizzi','tizzi','Solo Artist','@inatizzi','https://www.instagram.com/inatizzi','St. Pete, FL','{}',NULL,false),
  ('Warren Buchholz','warren-buchholz','Solo Artist','@warrenbuchholz','https://www.instagram.com/warrenbuchholz','St. Pete, FL','{}',NULL,false)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO artists (name, slug, type, instagram_handle, instagram_url, home_base, visible_on_website)
VALUES ('Freeman Sound Mindset','freeman-sound-mindset','Band','@freemansoundmindset','https://www.instagram.com/freemansoundmindset','St. Pete, FL',false)
ON CONFLICT (slug) DO NOTHING;

UPDATE artists SET genres = ARRAY['Sludge Metal','Metal','Doom'] WHERE slug = 'dead-reef' AND genres = '{}';
UPDATE artists SET genres = ARRAY['Indie','Alternative'] WHERE slug = 'earth-girl' AND genres = '{}';
`,
  },
  {
    filename: '010_backfill_existing.sql',
    sql: `
UPDATE artists SET instagram_handle = username WHERE instagram_handle IS NULL AND username IS NOT NULL;
UPDATE artists SET instagram_handle = '@' || substring(instagram_url FROM 'instagram\\.com/([^/?]+)')
  WHERE instagram_handle IS NULL AND instagram_url IS NOT NULL AND instagram_url LIKE '%instagram.com%';
UPDATE artists SET home_base = 'St. Pete, FL' WHERE home_base IS NULL;

UPDATE artists SET visible_on_website = true WHERE slug IN (
  'the-pleasantries','dandy-lush','harlow-gold','moonshow','sedque','willie-jones',
  'brother-bear','khoury-affinity','accentrik','nico-the-alchemist','slamchops',
  'wyatt-norton','allen-fereti','physical-plant','seems','little-giver-band',
  'liam-bauman','callaghan-keane','brian-busto','prophessor-j-events','clockworkxband',
  'dylan-dames','johee-mason','mel-with-a-period','movie-props','then-theres-me',
  'beach-terror','viorica','aliqua','spanish-bombs','house-of-i','the-tilt'
);

UPDATE venues SET visible_on_website = true
  WHERE name IN ('Cage Brewing','Bayboro Brewing','Ruby''s Elixir','The Nest at St Pete Brewing','The Blueberry Patch','Suite E Studios');

UPDATE artists SET name = 'The Tilt Orchestra' WHERE name = 'The Tilt' AND slug = 'the-tilt';
`,
  },
  {
    filename: '011_seed_venues.sql',
    sql: `
INSERT INTO venues (name, slug, instagram_url, instagram_username, is_active, visible_on_website)
VALUES
  ('3 Daughters Brewing','3-daughters-brewing','https://www.instagram.com/3daughtersbrewing','@3daughtersbrewing',true,false),
  ('Jannus Live','jannus-live','https://www.instagram.com/JannusLive','@JannusLive',true,false),
  ('Mandarin Hide','mandarin-hide','https://www.instagram.com/mandarinhide','@mandarinhide',true,false),
  ('St. Pete Brewing Co','st-pete-brewing-co','https://www.instagram.com/stpetebrewingco','@stpetebrewingco',true,false),
  ('The Bends','the-bends','https://www.instagram.com/the_bends','@the_bends',true,false),
  ('Paper Crane','paper-crane','https://www.instagram.com/papercranelive','@papercranelive',false,false),
  ('The Loft St. Pete','the-loft-st-pete','https://www.instagram.com/theloftstpete','@theloftstpete',false,false)
ON CONFLICT (slug) DO NOTHING;

UPDATE venues SET neighborhood='Warehouse Arts District', av_setup='Full PA, lighting, recording capability', partnership_level='primary' WHERE name='Suite E Studios';
UPDATE venues SET neighborhood='St. Petersburg', partnership_level='collaboration' WHERE name='Cage Brewing';
UPDATE venues SET neighborhood='St. Petersburg', partnership_level='collaboration' WHERE name='Bayboro Brewing';
UPDATE venues SET neighborhood='Downtown St. Petersburg', av_setup='Professional', partnership_level='collaboration' WHERE name='Jannus Live';
`,
  },
  {
    filename: '012_seed_persons.sql',
    sql: `
INSERT INTO persons (first_name, last_name, role, company, skills, notes)
VALUES
  ('Austen','Van Der Bleek','Co-founder, Director of Programming','Suite E Studios (Tangent LLC)',
    ARRAY['dj','event producer','booking'],'Resident DJ. Handles day-to-day programming, booking, and artist relationships.'),
  ('Rob','Morey','Co-founder','Suite E Studios (Tangent LLC)',ARRAY['other'],'Suite E co-founder and support.'),
  ('Daniel','Owen','Booking contact','Dead Reef',ARRAY['artist','musician'],'Booking contact for Dead Reef.'),
  ('Josh','Scheible','Booking contact','Physical Plant',ARRAY['artist','musician'],'Primary booking contact for Physical Plant.'),
  ('Matt','Taylor','Owner / Promoter','@StPeteMusic / Tangent LLC',ARRAY['producer','event producer','booking'],'Runs @StPeteMusic. Co-owner of Suite E Studios.')
ON CONFLICT DO NOTHING;

UPDATE persons SET role='Co-founder', company='Suite E Studios (Tangent LLC)'
  WHERE first_name='Alex' AND last_name='McDonald' AND role IS NULL;
`,
  },
  {
    filename: '013_seed_organizations.sql',
    sql: `
INSERT INTO organizations (name, slug, type, instagram_handle, instagram_url, is_active, visible_on_website)
VALUES
  ('Daddy Kool Records','daddy-kool-records','record-store','@daddykoolrecords','https://www.instagram.com/daddykoolrecords',true,false),
  ('Groove Hive Market','groove-hive-market','market','@groovehivemarket','https://www.instagram.com/groovehivemarket',true,false),
  ('NPO Aura','npo-aura','nonprofit','@npo.aura','https://www.instagram.com/npo.aura',true,false),
  ('Queer Expressions St. Pete','queer-expressions-st-pete','org','@queerexpressionstpete','https://www.instagram.com/queerexpressionstpete',true,false),
  ('Saint Paint Arts','saint-paint-arts','arts-org','@saintpaintarts','https://www.instagram.com/saintpaintarts',true,false),
  ('Silvermore Photography','silvermore-photography','photographer','@silvermorephotography','https://www.instagram.com/silvermorephotography',true,false),
  ('Tangible Record Shop','tangible-record-shop','record-store','@tangiblerecordshop','https://www.instagram.com/tangiblerecordshop',true,false),
  ('WUSF Jazz','wusf-jazz','media','@wusfjazz','https://www.instagram.com/wusfjazz',true,false),
  ('WUSF Public Media','wusf-public-media','media','@wusfpublicmedia','https://www.instagram.com/wusfpublicmedia',true,false)
ON CONFLICT (slug) DO NOTHING;
`,
  },
  {
    filename: '014_update_venues.sql',
    sql: `
INSERT INTO venues (name, slug, address, instagram_url, instagram_username, tags, is_active, visible_on_website)
VALUES ('The Potion Portal','the-potion-portal','2329 28th St N, St. Petersburg, FL 33713',
  'https://www.instagram.com/thepotionportal','@thepotionportal',ARRAY['bar','cocktails','live-music','st-pete'],true,true)
ON CONFLICT (slug) DO NOTHING;

UPDATE venues SET address='222 22nd St S, St. Petersburg, FL 33712', tags=ARRAY['brewery','venue','st-pete'], visible_on_website=true WHERE slug='3-daughters-brewing';
UPDATE venues SET tags=ARRAY['brewery','food','venue','st-pete'], visible_on_website=true WHERE slug='bayboro-brewing';
UPDATE venues SET address='2001 1st Ave S, St. Petersburg, FL 33712', tags=ARRAY['brewery','food','venue','st-pete'], lat=NULL, lng=NULL, visible_on_website=true WHERE slug='cage-brewing';
UPDATE venues SET address='200 1st Ave N STE 206, St. Petersburg, FL 33701', tags=ARRAY['venue','st-pete'], visible_on_website=true WHERE slug='jannus-live';
UPDATE venues SET address='231 Central Ave, St. Petersburg, FL 33701', tags=ARRAY['bar','cocktails','djs','st-pete'], visible_on_website=true WHERE slug='mandarin-hide';
UPDATE venues SET address='15 3rd St N, St. Petersburg, FL 33701', instagram_url='https://www.instagram.com/rubys_elixir', instagram_username='@rubys_elixir', tags=ARRAY['bar','cocktails','live-music','st-pete'], visible_on_website=true WHERE slug='rubys-elixir';
UPDATE venues SET address='544 1st Ave N, St. Petersburg, FL 33701', tags=ARRAY['brewery','food','st-pete'], visible_on_website=true WHERE slug='st-pete-brewing-co';
UPDATE venues SET address='919 1st Ave N, St. Petersburg, FL 33705', tags=ARRAY['bar','live-music','djs','st-pete'], visible_on_website=true WHERE slug='the-bends';
UPDATE venues SET address='4923 20th Ave S, Gulfport, FL 33707', instagram_url='https://www.instagram.com/blueberrypatchgulfport', instagram_username='@blueberrypatchgulfport', website='https://www.blueberrypatch.org', tags=ARRAY['byob','venue','live-music','gulfport'], visible_on_website=true WHERE slug='the-blueberry-patch';
UPDATE venues SET name='The Nest at St Pete Brewing Co', instagram_url='https://www.instagram.com/thenestatstpetebrewingco', instagram_username='@thenestatstpetebrewingco', tags=ARRAY['live-music','djs','brewery','st-pete'], visible_on_website=true WHERE slug='the-nest';
UPDATE venues SET address='615 27th St S, Suite E, St. Petersburg, FL 33713', email='suite.e.stpete@gmail.com', website='https://www.suiteestudios.com', facebook_url='https://www.facebook.com/suite.e.stpete', facebook_username='suite.e.stpete', tags=ARRAY['studio','third-space','warehouse-arts-district','st-pete'], visible_on_website=true WHERE slug='suite-e-studios';
`,
  },
  {
    filename: '015_add_events_table.sql',
    sql: `
CREATE TABLE IF NOT EXISTS events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_event_id TEXT UNIQUE NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  start_time      TIMESTAMPTZ NOT NULL,
  end_time        TIMESTAMPTZ,
  location        TEXT,
  tag             TEXT,
  ticket_url      TEXT,
  is_active       BOOLEAN DEFAULT true,
  synced_at       TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS event_performers (
  event_id    UUID REFERENCES events(id) ON DELETE CASCADE,
  artist_id   UUID REFERENCES artists(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, artist_id)
);
CREATE INDEX IF NOT EXISTS idx_events_start_time     ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_tag            ON events(tag);
CREATE INDEX IF NOT EXISTS idx_events_google_event_id ON events(google_event_id);
`,
  },
  {
    filename: '016_add_venue_to_events.sql',
    sql: `
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue TEXT;
UPDATE events SET venue = 'suite-e-studios' WHERE venue IS NULL;
CREATE INDEX IF NOT EXISTS idx_events_venue ON events(venue);
`,
  },
  {
    filename: '017_add_venue_platform_ids.sql',
    sql: `
ALTER TABLE venues
  ADD COLUMN IF NOT EXISTS facebook_page_id   TEXT,
  ADD COLUMN IF NOT EXISTS instagram_page_id  TEXT,
  ADD COLUMN IF NOT EXISTS google_calendar_id TEXT,
  ADD COLUMN IF NOT EXISTS events_sources     JSONB NOT NULL DEFAULT '[]';

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS image_url   TEXT,
  ADD COLUMN IF NOT EXISTS extra_data  JSONB NOT NULL DEFAULT '{}';

UPDATE venues SET google_calendar_id = '98a6b333df9c0d145983eab458358c58692344b3436a7c292772019118db6e19@group.calendar.google.com' WHERE slug = 'suite-e-studios';
UPDATE venues SET google_calendar_id = '71e2433f12b9a7ffe5cfa52bb00dba523406043b321fe5f9dcf354476ea08555@group.calendar.google.com' WHERE slug = 'blueberry-patch';
UPDATE venues SET google_calendar_id = 'e0cc088fc8847d4de888142b6d18c69c6de370afaa268432ccae930d6e1b7108@group.calendar.google.com' WHERE slug = 'cage-brewing';
UPDATE venues SET google_calendar_id = 'ac1f54b2bbdd7ba7e94d95ec6a6090b26af944c614e35e3a01582f956ed275dd@group.calendar.google.com' WHERE slug = 'rubys-elixir';
UPDATE venues SET google_calendar_id = '2c1103fbae69f2a222a4a163203aff4decaa5af400fb9a68a0dada62860d7f38@group.calendar.google.com' WHERE slug = 'the-bends';
UPDATE venues SET events_sources = '[{"type":"facebook","url":"https://www.facebook.com/cagebrewing/events"}]'::jsonb WHERE slug = 'cage-brewing';

CREATE INDEX IF NOT EXISTS idx_venues_google_calendar_id ON venues(google_calendar_id) WHERE google_calendar_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_extra_data ON events USING GIN (extra_data);
`,
  },
  {
    filename: '018_add_featured_artists_and_blog_posts.sql',
    sql: `
CREATE TABLE IF NOT EXISTS featured_artists (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id        UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  featured_month   VARCHAR(7) NOT NULL,
  order_position   INTEGER NOT NULL CHECK (order_position IN (1, 2)),
  status           TEXT NOT NULL DEFAULT 'pending_enrichment',
  scraped_raw      JSONB NOT NULL DEFAULT '{}',
  enrichment_notes TEXT,
  newsletter_blurb TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (artist_id, featured_month),
  UNIQUE (featured_month, order_position)
);

CREATE INDEX IF NOT EXISTS idx_featured_artists_month ON featured_artists(featured_month);
CREATE INDEX IF NOT EXISTS idx_featured_artists_artist_id ON featured_artists(artist_id);
CREATE INDEX IF NOT EXISTS idx_featured_artists_status ON featured_artists(status);

CREATE TABLE IF NOT EXISTS blog_posts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_type           TEXT NOT NULL DEFAULT 'general',
  title               VARCHAR(500) NOT NULL,
  slug                VARCHAR(500) NOT NULL UNIQUE,
  excerpt             TEXT,
  body                TEXT NOT NULL,
  featured_image_url  VARCHAR(500),
  tags                TEXT[] NOT NULL DEFAULT '{}',
  seo_title           VARCHAR(255),
  seo_description     TEXT,
  status              TEXT NOT NULL DEFAULT 'draft',
  publish_date        TIMESTAMPTZ,
  author_name         VARCHAR(255),
  author_clerk_id     VARCHAR(255),
  artist_id           UUID REFERENCES artists(id) ON DELETE SET NULL,
  featured_artist_id  UUID REFERENCES featured_artists(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_publish_date ON blog_posts(publish_date);
CREATE INDEX IF NOT EXISTS idx_blog_posts_post_type ON blog_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_blog_posts_artist_id ON blog_posts(artist_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
`,
  },
  {
    filename: '019_add_social_posts_and_brand_guidelines.sql',
    sql: `
CREATE TABLE IF NOT EXISTS social_posts (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform             TEXT NOT NULL,
  content_type         TEXT NOT NULL DEFAULT 'post',
  status               TEXT NOT NULL DEFAULT 'draft',
  title                VARCHAR(500),
  caption              TEXT,
  media_urls           TEXT[] NOT NULL DEFAULT '{}',
  hashtags             TEXT[] NOT NULL DEFAULT '{}',
  scheduled_publish_at TIMESTAMPTZ,
  published_at         TIMESTAMPTZ,
  artist_id            UUID REFERENCES artists(id) ON DELETE SET NULL,
  created_by           VARCHAR(255),
  approved_by          VARCHAR(255),
  approval_notes       TEXT,
  approval_timestamp   TIMESTAMPTZ,
  n8n_workflow_id      VARCHAR(255),
  platform_post_id     VARCHAR(255),
  performance_stats    JSONB NOT NULL DEFAULT '{}',
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_social_posts_platform ON social_posts(platform);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON social_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled ON social_posts(scheduled_publish_at);
CREATE INDEX IF NOT EXISTS idx_social_posts_artist_id ON social_posts(artist_id);

CREATE TABLE IF NOT EXISTS brand_guidelines (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version           INTEGER NOT NULL DEFAULT 1,
  name              VARCHAR(255) NOT NULL,
  system_prompt     TEXT NOT NULL,
  tone_descriptors  TEXT[] NOT NULL DEFAULT '{}',
  hashtag_library   TEXT[] NOT NULL DEFAULT '{}',
  example_posts     TEXT[] NOT NULL DEFAULT '{}',
  is_active         BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_brand_guidelines_is_active ON brand_guidelines(is_active);
`,
  },
  {
    filename: '020_add_event_review_queue.sql',
    sql: `
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS source        TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_by  TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_events_review_status ON events(review_status);
CREATE INDEX IF NOT EXISTS idx_events_source        ON events(source);

UPDATE events SET source = extra_data->>'source' WHERE extra_data->>'source' IS NOT NULL;
`,
  },
];
