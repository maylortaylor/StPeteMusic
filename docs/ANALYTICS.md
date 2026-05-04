# Analytics — GTM + GA4 Strategy, Setup & Execution

**Property:** StPeteMusic (`stpetemusic.live`)
**GTM Container:** `GTM-WW7MSP3L` (account `6353011060`, container `251155771`)
**GA4 Property:** `535560580` (measurement ID `G-RZJP9NFXX4`)
**Service account:** `stpetemusic-scripts@stpetemusic-analytics.iam.gserviceaccount.com`

---

## Strategy

We track user intent signals — not page views. Every event answers one question:
**"What did a visitor care about?"**

| Event | Intent signal |
|---|---|
| `event_click` | User is interested in a specific event |
| `ticket_link_click` | Highest-intent action — clicked a ticket purchase link |
| `artist_click` | User explored an artist |
| `venue_click` | User explored a venue |
| `cta_click` | User engaged with a hero / featured CTA |
| `outbound_link_click` | User left the site via a link |
| `newsletter_signup` | Lead gen — subscribed to the newsletter |
| `contact_form_submit` | Lead gen / booking inquiry |
| `video_engage` | User watched or interacted with a video |
| `events_filter` | User narrowed down events by type or venue |
| `events_view_toggle` | User switched between calendar and list views |
| `discover_search` | User searched in the Discover section |
| `discover_filter` | User filtered in the Discover section |
| `artist_social_click` | User followed an artist's social link |
| `venue_social_click` | User followed a venue's social link |

### Key Events (GA4 "Conversions")

| Event | Why it's a key event |
|---|---|
| `ticket_link_click` | Closest proxy to a ticket sale |
| `cta_click` | Hero / featured action engagement |
| `event_click` | Primary intent indicator |
| `newsletter_signup` | Lead capture |
| `contact_form_submit` | Booking / inquiry lead |

---

## Architecture

```
Browser (Next.js)
  └── window.dataLayer.push({ event: '...', param: '...' })
        └── GTM container GTM-WW7MSP3L
              └── Custom Event Trigger (SPM-*)
                    └── GA4 Event Tag (SPM-GA4-*)
                          └── GA4 Property 535560580
```

All events flow through the `dataLayer` — no direct GA4 calls from component code.
GTM is the single dispatch layer; GA4 receives clean, structured events.

### dataLayer Parameters

| Parameter | Type | Description |
|---|---|---|
| `event_title` | string | Event name |
| `event_venue` | string | Venue name |
| `event_date` | string | ISO 8601 start time |
| `link_url` | string | Outbound or ticket URL |
| `link_text` | string | Visible link text |
| `link_category` | string | `ticket`, `social`, `external` |
| `link_label` | string | Label for social links |
| `cta_label` | string | CTA identifier (`get_tickets`, `tune_in`) |
| `cta_location` | string | Where CTA appears (`hero`, `featured_event`) |
| `artist_name` | string | Artist name |
| `artist_genre` | string | Primary genre |
| `venue_name` | string | Venue name |
| `video_title` | string | Video title |
| `video_url` | string | Video URL |
| `filter_type` | string | `venue`, `event_type` |
| `filter_value` | string | Selected filter value |
| `results_count` | number | Items shown after filter |
| `view_mode` | string | `calendar` or `list` |
| `search_query` | string | Search term entered |

---

## Infrastructure (IaC)

GTM and GA4 are managed as code via `apps/web/scripts/`. The desired state lives in
`gtm-config.json` — edit that file and re-run `gtm:apply` to update the live container.

### Files

| File | Purpose |
|---|---|
| `scripts/gtm-config.json` | Desired state — variables, triggers, tags, key events |
| `scripts/gtm-apply.mjs` | Apply config to live GTM + GA4. Idempotent, publishes on change. |
| `scripts/gtm-validate.mjs` | Validate live published container matches config. |
| `scripts/gtm-backup.mjs` | Download current container state to `data/gtm-backup-*.json`. |
| `scripts/ga4-conversions.mjs` | Mark events as GA4 key events (standalone, same list as config). |
| `scripts/google-auth.mjs` | Shared SA credential loader (used by all scripts). |
| `scripts/sa-key.json` | Service account key file (gitignored). |

### Required Env Vars

Stored in root `.env` (gitignored). See `.env.example` for the full list.

```
GOOGLE_SA_KEY_FILE=./scripts/sa-key.json
GTM_ACCOUNT_ID=6353011060
GTM_CONTAINER_ID=251155771
GTM_WORKSPACE_ID=1
GA4_PROPERTY_ID=535560580
GA4_MEASUREMENT_ID=G-RZJP9NFXX4
```

### Service Account Permissions

| System | Permission level |
|---|---|
| GTM container | Publish (includes Edit) |
| GA4 property | Editor (for key event management) |

---

## Execution

All commands run from `apps/web/`:

```bash
# Validate live container matches config (read-only, exit 1 if anything missing)
npm run gtm:validate

# Apply config changes to GTM + GA4 (idempotent, publishes new version only if changed)
npm run gtm:apply

# Snapshot current container state to data/gtm-backup-YYYY-MM-DD.json
npm run gtm:backup

# Mark GA4 key events (standalone — useful if you only need to update key events)
npm run ga4:conversions
```

### Updating the GTM config

1. Edit `scripts/gtm-config.json` — add/remove variables, triggers, tags, or key events
2. Run `npm run gtm:apply` — the script diffs against the live container and applies only what changed
3. Run `npm run gtm:validate` — confirms everything is live

---

## Validation

Run after any GTM deploy to confirm the live container is correct:

```bash
cd apps/web && npm run gtm:validate
```

Expected output (all passing):
```
🔍 Fetching live GTM container: accounts/6353011060/containers/251155771
   Checking version: 6 (gtm-apply-2026-05-04-1433)

📦 Variables:
  ✅ DL - event_title
  ✅ DL - event_venue
  ... (19 total)

⚡ Triggers:
  ✅ SPM-event_click
  ... (15 total)

🏷️  Tags:
  ✅ SPM-GA4-event_click
  ... (15 total)

📊 GA4 Key Events:
  ✅ ticket_link_click
  ✅ cta_click
  ✅ event_click
  ✅ newsletter_signup
  ✅ contact_form_submit

──────────────────────────────────────────────────
✅ All 54 checks passed — GTM + GA4 config is fully live.
```

If any check fails, re-run `npm run gtm:apply` to reconcile.

---

## Source code — dataLayer push locations

| Event | File |
|---|---|
| `event_click` | `apps/web/src/components/events/ListView.tsx`, `CalendarGrid.tsx` |
| `ticket_link_click` | `apps/web/src/components/events/ListView.tsx` |
| `artist_click` | `apps/web/src/components/ArtistCard.tsx` |
| `venue_click` | `apps/web/src/components/VenueCard.tsx` |
| `cta_click` | `apps/web/src/components/Hero.tsx` |
| `outbound_link_click` | `apps/web/src/components/OutboundLink.tsx` |
| `newsletter_signup` | `apps/web/src/components/NewsletterForm.tsx` |
| `contact_form_submit` | `apps/web/src/app/contact/page.tsx` |
| `video_engage` | `apps/web/src/components/VideoPlayer.tsx` |
| `events_filter` | `apps/web/src/components/events/FilterBar.tsx` |
| `events_view_toggle` | `apps/web/src/components/events/ViewToggle.tsx` |
| `discover_search` | `apps/web/src/components/discover/SearchBar.tsx` |
| `discover_filter` | `apps/web/src/components/discover/FilterBar.tsx` |
| `artist_social_click` | `apps/web/src/components/ArtistCard.tsx` |
| `venue_social_click` | `apps/web/src/components/VenueCard.tsx` |
