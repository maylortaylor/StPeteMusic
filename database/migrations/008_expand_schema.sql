-- Migration 008: Expand schema for expandability
-- Adds: home_base + visible_on_website + extra_data to artists
--       instagram/role/company/tags/extra_links/extra_data/visible_on_website to persons
--       neighborhood/av_setup/partnership_level/visible_on_website/extra_data to venues
--       Creates: organizations, organization_members tables
-- All statements are idempotent (IF NOT EXISTS / column checks not needed — ADD COLUMN IF NOT EXISTS)

-- ---------------------------------------------------------------------------
-- ARTISTS — new columns
-- ---------------------------------------------------------------------------

ALTER TABLE artists ADD COLUMN IF NOT EXISTS home_base          TEXT;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS visible_on_website BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS extra_data         JSONB   NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_artists_visible ON artists (visible_on_website);

-- ---------------------------------------------------------------------------
-- PERSONS — new columns
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- VENUES — new columns
-- ---------------------------------------------------------------------------

ALTER TABLE venues ADD COLUMN IF NOT EXISTS neighborhood        TEXT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS av_setup            TEXT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS partnership_level   TEXT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS visible_on_website  BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS extra_data          JSONB   NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_venues_visible      ON venues (visible_on_website);
CREATE INDEX IF NOT EXISTS idx_venues_partnership  ON venues (partnership_level);

-- ---------------------------------------------------------------------------
-- ORGANIZATIONS — new table for non-individual collaborating entities
-- (record stores, nonprofits, media outlets, arts orgs, photographers, etc.)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS organizations (
  id                  UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT    NOT NULL,
  type                TEXT,
  -- type values: record-store | nonprofit | org | market | media | arts-org | photographer
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

-- ---------------------------------------------------------------------------
-- ORGANIZATION_MEMBERS — junction: persons ↔ organizations
-- (mirrors artist_members pattern)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS organization_members (
  organization_id    UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  person_id          UUID NOT NULL REFERENCES persons (id)       ON DELETE CASCADE,
  role               TEXT,           -- member | partner | contact | founder | staff
  is_primary_contact BOOLEAN NOT NULL DEFAULT false,
  joined_at          TIMESTAMPTZ,
  PRIMARY KEY (organization_id, person_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_person ON organization_members (person_id);

COMMENT ON TABLE organizations IS 'Non-individual collaborating entities: record stores, nonprofits, media, arts orgs, etc.';
COMMENT ON TABLE organization_members IS 'Junction table linking persons to organizations with role context';
COMMENT ON COLUMN artists.visible_on_website IS 'Operator toggle — when true, artist gets a public page on the website';
COMMENT ON COLUMN venues.visible_on_website  IS 'Operator toggle — when true, venue gets a public page on the website';
COMMENT ON COLUMN persons.visible_on_website IS 'Reserved for future use — no public person pages at launch';
COMMENT ON COLUMN organizations.visible_on_website IS 'Reserved for future use — no public org pages at launch';
