# Database Data Fixes

This file tracks small SQL data corrections that don't warrant their own migration file. When enough accumulate, they can be batched into a numbered migration (e.g., `015_data_fixes.sql`).

Each entry includes:
- **Record affected:** Venue, artist, organization, etc.
- **Issue:** What needs to be corrected
- **Fix SQL:** The UPDATE statement
- **Status:** `pending` or `applied (migration NNN)`

---

## Pending Fixes

### Blueberry Patch: Correct website URL

**Record:** Venue (`the-blueberry-patch`)

**Issue:** Migration `014_update_venues.sql` set `website = 'https://www.blueberrypatch.org'`, but the site does not use HTTPS (no SSL certificate). Should be `http://` instead.

**Fix SQL:**
```sql
UPDATE venues
SET website = 'http://www.blueberrypatch.org'
WHERE slug = 'the-blueberry-patch';
```

**Status:** `pending`

---

### Suite E Studios Partner Organizations — pending migration 016 (or batched)

**Source:** Suite E Studios website "A Creative Home To" section

**Issue:** 5 new organizations need to be added to the `organizations` table. 1 existing row (`npo-aura`) needs to be renamed/updated. `Tangible Record Shop` already exists in migration 013 — skipped. The `community` type also needs to be added to the CHECK constraint.

**Step 1 — Extend the type CHECK constraint**

```sql
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_type_check;
ALTER TABLE organizations ADD CONSTRAINT organizations_type_check
  CHECK (type IN (
    'record-store','nonprofit','org','market','media',
    'arts-org','photographer','community'
  ));
```

**Status:** `pending`

---

**Step 2 — Update NPO Aura → Aura Creative Inc.**

**Record:** Organization (`npo-aura`)

**Issue:** `NPO Aura` (seeded in migration 013) is the same entity as `Aura Creative Inc.`. Update the name, slug, website, and description to reflect the correct identity.

```sql
UPDATE organizations
SET
  name        = 'Aura Creative Inc.',
  slug        = 'aura-creative-studio',
  website     = 'https://auracreativestudio.org',
  description = 'Non-profit creative agency.'
WHERE slug = 'npo-aura';
```

**Status:** `pending`

---

**Step 3 — Insert new organizations**

**Records:** 5 new organizations (St. Pete Music, ZenLike Orbitz, Open House Conspiracy, Freeman Sound, b-flat brews)

**Notes:**
- Source HTML had bad href links for Open House Conspiracy and Freeman Sound (both pointed to `@tangiblerecordshop`); correct values confirmed by operator.
- `b-flat brews` uses `@eatingkino` (personal IG for the popup owner) — confirmed correct, `visible_on_website = true`.

```sql
INSERT INTO organizations (name, slug, type, description, instagram_handle, instagram_url, website, linktree_url, is_active, visible_on_website)
VALUES
  ('St. Pete Music',
   'st-pete-music',
   'org',
   'Documenting and promoting local music in the greater St. Petersburg, FL area since 2013.',
   '@stpetemusic',
   'https://www.instagram.com/StPeteMusic',
   NULL,
   'https://linktr.ee/stpetemusic',
   true, false),

  ('ZenLike Orbitz',
   'zenlike-orbitz',
   'photographer',
   'Aerial videography & photography services.',
   '@zenlikeorbitz',
   'https://www.instagram.com/zenlikeorbitz',
   NULL, NULL,
   true, false),

  ('Open House Conspiracy',
   'open-house-conspiracy',
   'community',
   'Underground dance party running for over a decade and a half.',
   '@openhouseconspiracy',
   'https://www.instagram.com/openhouseconspiracy/',
   'https://openhouseconspiracy.com/',
   NULL,
   true, false),

  ('Freeman Sound',
   'freeman-sound',
   'nonprofit',
   'Non-profit organization promoting mental health through music.',
   '@freemansoundmindset',
   'https://www.instagram.com/freemansoundmindset',
   'https://www.freemansound.org/events',
   NULL,
   true, false),

  ('b-flat brews',
   'b-flat-brews',
   'org',
   'Musically aligned coffee popup.',
   '@eatingkino',
   'https://www.instagram.com/eatingkino',
   NULL, NULL,
   true, true)

ON CONFLICT (slug) DO NOTHING;
```

**Status:** `pending`

---

### ALiqua: Update Instagram URL

**Record:** Artist (`aliqua` or similar slug)

**Issue:** Instagram handle/URL needs to be updated to the new account.

**Fix SQL:**
```sql
UPDATE artists
SET
  instagram_handle = '_aliqua',
  instagram_url    = 'https://www.instagram.com/_aliqua/'
WHERE name ILIKE 'aliqua';
```

**Status:** `pending`

---

---

### Events: Fix wrong venue assignments from $runIndex bug in multi-gcal-to-db-sync

**Root cause:** The `Add Venue Slug` n8n node used `$runIndex` to map loop iterations to venue slugs. When a venue had no calendar events, it was skipped by the `Has Events?` filter, causing all subsequent venues to be offset by one. Ruby's Elixir events were stored as `venue='cage-brewing'`; Blueberry Patch past events were frozen as `venue='suite-e-studios'` from the migration 016 backfill.

**Primary fix:** Run the updated workflow with a 6-month lookback window (change `timeMin` to `$now.minus(6, 'months').startOf('month').toISO()`, trigger manually, then revert). The `ON CONFLICT ... DO UPDATE` clause will correct venues + tags for any events still in the source GCal.

**Safety-net SQL** (for events no longer in GCal or outside any lookback window):

```sql
-- Fix Ruby's Elixir events incorrectly stored as cage-brewing.
-- Only run after extended re-sync if any remain.
UPDATE events
SET venue = 'rubys-elixir', tag = 'live-band'
WHERE venue = 'cage-brewing'
  AND title NOT ILIKE '%cage%'
  AND title NOT ILIKE '%brewing%';

-- Fix Blueberry Patch events incorrectly stored as suite-e-studios.
UPDATE events
SET venue = 'blueberry-patch'
WHERE venue = 'suite-e-studios'
  AND EXTRACT(DAY FROM start_time) IN (1, 7, 11, 22)
  AND (
    title ILIKE '%open mic%'
    OR title ILIKE '%community jam%'
    OR title ILIKE '%blueberry%'
  );

-- Fix tags on blueberry-patch events missing tags (by day of month).
UPDATE events SET tag = 'open-mic'
WHERE venue = 'blueberry-patch' AND tag IS NULL
  AND EXTRACT(DAY FROM start_time) IN (1, 7);

UPDATE events SET tag = 'community-jam'
WHERE venue = 'blueberry-patch' AND tag IS NULL
  AND EXTRACT(DAY FROM start_time) = 11;

UPDATE events SET tag = 'live-band'
WHERE venue = 'blueberry-patch' AND tag IS NULL
  AND EXTRACT(DAY FROM start_time) = 22;
```

**Status:** `pending` — run SELECT first to confirm scope before applying.

---

## Applied Fixes

(None yet — will be moved here with migration number once batched and deployed)
