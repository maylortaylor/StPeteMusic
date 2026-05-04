# GTM Variable Setup Checklist

## Problem
GTM container `GTM-WW7MSP3L` (theburgmusic@gmail.com) cannot publish due to missing Data Layer Variable definitions. Tags reference 12 variables prefixed `DL - ` that must be created in GTM.

## Status
✅ Code changes completed — `event_date` and `artist_genre` now pushed from components
⏳ GTM UI changes pending — you must create variables in Tag Manager UI

---

## GTM Setup Steps (Manual — requires GTM UI access)

### 1. Create 11 Data Layer Variables

Go to **GTM Container** → **Variables** → **User-Defined Variables** → **New**

For each row below, create a **Data Layer Variable** with:
- **Variable Type**: Data Layer Variable
- **Variable Name**: Set to the "GTM Variable Name" column value
- **Data Layer Variable Name**: Set to the "Data Layer Key" column value

| GTM Variable Name | Data Layer Key | Purpose |
|---|---|---|
| `DL - artist_name` | `artist_name` | Artist name from card click |
| `DL - artist_genre` | `artist_genre` | First genre tag from artist click |
| `DL - venue_name` | `venue_name` | Venue name from venue card click |
| `DL - event_title` | `event_title` | Event title from event click |
| `DL - event_venue` | `event_venue` | Event venue from event click |
| `DL - event_date` | `event_date` | Event start time (ISO 8601) from event click |
| `DL - cta_label` | `cta_label` | CTA identifier (e.g., 'get_tickets') |
| `DL - cta_location` | `cta_location` | Where CTA appears (e.g., 'hero') |
| `DL - link_url` | `link_url` | Outbound link URL |
| `DL - link_text` | `link_text` | Outbound link text |
| `DL - video_title` | `video_title` | Video title from video engage |

### 2. Remove `venue_neighborhood` from Tag

Edit the **`SPM-GA4-venue_click`** tag:
- Find the row/parameter that references `DL - venue_neighborhood`
- Delete it (no matching data exists)

### 3. Publish

Click **Submit** → **Publish** to deploy the changes.

---

## Verification Steps

After publishing:

1. **Open GTM Preview Mode**
   - Click "Preview" in GTM UI
   - Enter staging URL: https://develop.d1fjwgk99cbqor.amplifyapp.com
   - Open the preview iframe

2. **Test Event Tracking**
   - Artist Card: Click on an artist → check GTM console for `artist_click` with `artist_name` + `artist_genre`
   - Event: Click on an event → check for `event_click` with `event_title` + `event_venue` + `event_date`
   - Venue Card: Click on a venue → check for `venue_click` with `venue_name`
   - Outbound Link: Click YouTube/social links → check for `outbound_link_click` with `link_url` + `link_text`

3. **Confirm GA4 Events**
   - Go to Google Analytics → Configure → **DebugView** (or Reports → Realtime)
   - Refresh staging URL, trigger events
   - Verify events appear with correct parameters

---

## Code Changes Deployed

Commit: `cd8cd25` — feat(analytics): add artist_genre and event_date to dataLayer pushes

Files changed:
- `apps/web/src/components/ArtistCard.tsx` — added `artist_genre: genres[0] ?? ''`
- `apps/web/src/components/events/ListView.tsx` — added `event_date: event.start_time`
- `apps/web/src/components/events/CalendarGrid.tsx` — added `event_date: event.start_time`

These changes are already merged to `develop` and will deploy to staging automatically.

---

## Next Steps

1. ✅ Code deployed to develop branch
2. ⏳ **Create GTM variables** (manual UI steps above)
3. ⏳ **Remove `venue_neighborhood` from tag** (manual UI step above)
4. ⏳ **Publish GTM container**
5. ⏳ **Verify in Preview + GA4**
6. ⏳ **Test on production** (after release)

---

## Reference

- **GTM Container ID**: GTM-WW7MSP3L
- **GA4 Measurement ID**: G-RZJP9NFXX4
- **GTM Access**: Log in with theburgmusic@gmail.com
- **Related Files**:
  - `.claude/plans/wiggly-jumping-neumann.md` — full implementation plan
  - `.claude/infrastructure.md` — GTM/GA4 reference docs
  - `docs/plans/ANALYTICS_PLAN.md` — analytics strategy
