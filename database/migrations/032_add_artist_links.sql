-- platform values: instagram | facebook | youtube | bandcamp | spotify | soundcloud
--                  | linktree | website | bandsintown | tiktok | twitter | threads | custom
-- is_featured: max 3 per artist; featured links shown prominently on the public artist page
CREATE TABLE IF NOT EXISTS artist_links (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id     UUID        NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  platform      VARCHAR(50) NOT NULL,
  url           VARCHAR(500) NOT NULL,
  label         VARCHAR(255) NOT NULL,
  display_order INTEGER     NOT NULL DEFAULT 0,
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  is_featured   BOOLEAN     NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_artist_links_artist_id ON artist_links (artist_id);
