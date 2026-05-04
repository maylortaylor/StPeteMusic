# GTM + GA4 Infrastructure-as-Code

> All GTM and GA4 configuration is code-controlled. Edit `scripts/gtm-config.json` to add or change
> tracking, then run `npm run gtm:apply` to provision. Safe to re-run — fully idempotent.

---

## Prerequisites

### Service Account Permissions (one-time manual setup)

The service account (`scripts/sa-key.json`) needs elevated access before scripts can write to GTM/GA4:

**GTM:** GTM UI → Admin → Container Access → find service account email → set to **Publish**

**GA4:** GA4 Admin → Property → Property Access Management → add service account email → **Editor**

### Required Environment Variables

All vars live in the root `.env` (loaded automatically by all scripts):

```
GOOGLE_SA_KEY_FILE=./sa-key.json
GTM_ACCOUNT_ID=6353011060        # from GTM URL: accounts/{id}/containers/...
GTM_CONTAINER_ID=251155771       # from GTM URL: .../containers/{id}/...
GTM_WORKSPACE_ID=1               # default workspace is always 1
GA4_PROPERTY_ID=535560580        # from GA4 Admin → Property Settings
GA4_MEASUREMENT_ID=G-RZJP9NFXX4
NEXT_PUBLIC_GTM_ID=GTM-WW7MSP3L  # loads GTM snippet on the website
```

---

## How It Works

```
gtm-config.json  →  gtm-apply.mjs  →  GTM API  →  live container published
                                    →  GA4 API  →  conversion events marked
```

`gtm-config.json` is the single source of truth. It declares:
- **Variables** — DataLayer variables GTM uses to extract event params
- **Triggers** — Custom event triggers listening for each `pushEvent()` call
- **Tags** — GA4 Event tags that fire on each trigger and forward params to GA4
- **Conversions** — Event names to mark as conversion goals in GA4

`gtm-apply.mjs` reads the config, diffs it against the live GTM workspace, creates only what's missing,
and publishes a new version. Running it twice with no config changes produces no new version.

---

## Event Schema

All events are pushed from React components via `src/lib/analytics.ts:pushEvent()`.

### Tier 1 — Already Instrumented in Code

| Event | Params | Source |
|---|---|---|
| `event_click` | `event_title`, `event_venue`, `event_date` | CalendarGrid, ListView |
| `ticket_link_click` | `event_title`, `event_venue`, `link_url` | ListView, EventModal |
| `outbound_link_click` | `link_url`, `link_text`, `link_category` | Nav, Footer, Hero, YouTubeGrid, EventModal, ListView |
| `cta_click` | `cta_label`, `cta_location` | Hero |
| `contact_form_submit` | — | ContactSection |
| `newsletter_signup` | — | NewsletterSignup |
| `video_engage` | `video_title`, `video_url` | YouTubeGrid |
| `artist_click` | `artist_name`, `artist_genre` | ArtistCard |
| `venue_click` | `venue_name` | VenueCard |
| `events_filter` | `filter_type`, `filter_value`, `results_count` | EventsPageClient |
| `events_view_toggle` | `view_mode` | EventsPageClient |
| `discover_search` | `search_query` | DiscoverClientGrid |
| `discover_filter` | `filter_type`, `filter_value` | DiscoverClientGrid |

### Tier 2 — GTM Configured, Code Not Yet Added

| Event | Params | Where to Add |
|---|---|---|
| `artist_social_click` | `artist_name`, `link_label`, `link_url` | `/discover/[slug]` — needs client component wrapper |
| `venue_social_click` | `venue_name`, `link_label`, `link_url` | `/venues/[slug]` — needs client component wrapper |

### Conversion Events

Configured in `gtm-config.json` → `conversions` array, applied by `npm run ga4:conversions`:

| Event | Funnel Stage |
|---|---|
| `ticket_link_click` | Highest intent — clicked ticket purchase link |
| `cta_click` | Hero Get Tickets / tune_in CTA |
| `event_click` | Showed interest in a specific event |
| `newsletter_signup` | Lead gen |
| `contact_form_submit` | Lead gen / booking inquiry |

---

## Scripts

Run all scripts from `apps/web/`:

```bash
# 1. Snapshot current GTM state before making changes
npm run gtm:backup

# 2. Apply gtm-config.json to live GTM container (idempotent)
npm run gtm:apply

# 3. Mark conversion events in GA4 (idempotent, reads from ga4-conversions.mjs)
npm run ga4:conversions

# 4. Export last 30 days of GA4 event data to CSV
npm run ga4:export
```

---

## Adding New Tracking

1. Add `pushEvent('my_event', { param1: value })` in the relevant component
2. Add to `gtm-config.json`:
   - Variable entry for each new param (if not already there)
   - Trigger entry for the new event name
   - Tag entry mapping the trigger to a GA4 event with the params
3. If it's a conversion, add the event name to the `conversions` array
4. Run `npm run gtm:backup && npm run gtm:apply`

---

## Verification

### GTM is Loading

Open browser DevTools console on `localhost:3000` or `stpetemusic.live` and run:
```js
window.dataLayer
```
Should show an array with a `gtm.js` event as the first entry.

### Events Are Firing

1. Go to GTM UI → Preview → enter the site URL
2. Trigger UI actions (click an event, use filter, click tickets)
3. Events should appear in the GTM debug sidebar with correct param values

### GA4 is Receiving Events

1. GA4 → Configure → DebugView (requires GTM Preview mode or `?gtm_debug=x` param)
2. Trigger events — they should appear within 30-60 seconds
3. Confirm event params are populated

### Idempotency Check

Run `npm run gtm:apply` twice in a row with no config changes.
The second run should show all `✅ (exists)` and output `⏭️  No GTM changes — skipping publish.`

---

## Troubleshooting

| Error | Fix |
|---|---|
| `403 Insufficient permissions` | Service account needs Publish (GTM) and Editor (GA4) — see Prerequisites |
| `Missing env vars` | Check root `.env` has `GTM_ACCOUNT_ID`, `GTM_CONTAINER_ID`, `GA4_PROPERTY_ID` |
| `trigger not found` | Trigger name in `tags[].trigger` must match exactly a name in `triggers[].name` |
| `ENOENT sa-key.json` | `GOOGLE_SA_KEY_FILE=./sa-key.json` resolves relative to `scripts/` — file must be at `apps/web/scripts/sa-key.json` |
| Events not reaching GA4 | Confirm `NEXT_PUBLIC_GTM_ID` is set in env — GTM snippet won't load without it |
