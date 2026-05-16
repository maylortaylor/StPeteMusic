CREATE TABLE IF NOT EXISTS featured_venues (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id       UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  featured_month VARCHAR(7) NOT NULL,
  event_id       UUID REFERENCES events(id) ON DELETE SET NULL,
  callout_text   TEXT,
  status         TEXT NOT NULL DEFAULT 'draft',
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (featured_month)
);

CREATE INDEX IF NOT EXISTS idx_featured_venues_month    ON featured_venues(featured_month);
CREATE INDEX IF NOT EXISTS idx_featured_venues_venue_id ON featured_venues(venue_id);
CREATE INDEX IF NOT EXISTS idx_featured_venues_status   ON featured_venues(status);
