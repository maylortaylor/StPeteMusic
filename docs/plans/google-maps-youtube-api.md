# Plan: Google Maps + YouTube Data API Integration

**Date:** 2026-05-04  
**Branch:** feature/google-maps-youtube-api (branch off `develop`)

---

## Context

StPeteMusic.live has `/venues/[slug]` detail pages that currently show a plain "Open in Google Maps" text link using a search URL. Venue records already have `lat`, `lng`, `address`, and `extra_data` fields in the database.

The `YouTubeGrid` component on the homepage has 4 hardcoded artist video cards and a hardcoded playlist ID. There's no live data from YouTube — when new shows are recorded, someone has to manually edit the source code.

**Goal:** Make venue pages richer with an embedded interactive map + live Google Business data (rating, hours), and make the YouTube section self-updating by pulling from the YouTube Data API.

**APIs enabled:** Maps JavaScript API, Maps Embed API, Places API, YouTube Data API v3 (project `social-media-manager-eb123`, same GCP project as the service account).

---

## New Environment Variables

Add to `apps/web/.env.local` (and Amplify environment variables for production):

```
# Browser-safe key — restrict to stpetemusic.live in Google Cloud Console
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=

# Server-only — used in Next.js Server Components and API routes
YOUTUBE_API_KEY=
```

**How to create `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`:**
1. Google Cloud Console → APIs & Services → Credentials → Create Credential → API Key
2. Restrict it: Application restrictions → HTTP referrers → add `*.stpetemusic.live/*` and `localhost:3000/*`
3. API restrictions → restrict to: Maps JavaScript API, Maps Embed API, Places API

**`YOUTUBE_API_KEY`:** Already referenced in root `.env.example` for n8n — use the same key or create a separate one restricted to YouTube Data API v3.

---

## Part 1 — Google Maps on Venue Pages

### 1a. New component: `VenueMap.tsx`

**File:** `apps/web/src/components/VenueMap.tsx`

Uses the **Maps Embed API** (iframe-based — no JS SDK, no quota concerns, free).  
Falls back gracefully if lat/lng are missing (uses address as search query instead).

```tsx
// Server component — no 'use client' needed
interface VenueMapProps {
  name: string;
  address?: string;
  lat?: number;
  lng?: number;
}
```

Embed URL format (coordinates preferred, address fallback):
```
https://www.google.com/maps/embed/v1/place
  ?key=NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  &q=lat,lng           ← if lat/lng available
  &q=VENUE+NAME+FL     ← fallback
  &zoom=15
```

Renders a 400px-tall responsive iframe. Matches existing black/border aesthetic.

### 1b. New server utility: `apps/web/src/lib/queries/places.ts`

Fetches live Google Business data for a venue using the **Places API (New)**.

- Input: venue `name` + `address` (or stored `google_place_id` from `extra_data`)
- Output: `{ rating, userRatingCount, openNow, weekdayDescriptions }`
- Cached with `unstable_cache` — 6-hour revalidation (hours change daily, rating changes slowly)

**Two-step lookup if no place_id stored:**
1. `POST https://places.googleapis.com/v1/places:searchText` with `"textQuery": "Suite E Studios St Pete FL"`
2. Parse `places[0].id` → cache as the place ID
3. `GET https://places.googleapis.com/v1/places/{place_id}` with field mask: `rating,userRatingCount,regularOpeningHours,currentOpeningHours`

**Place ID storage:** Save discovered place IDs back into venue's `extra_data.google_place_id` via a one-time DB update script (`scripts/populate-place-ids.mjs`) — avoids repeated text search API calls (which cost more).

### 1c. New component: `PlaceBadge.tsx`

**File:** `apps/web/src/components/PlaceBadge.tsx`

Displays Google rating + open/closed status. Shown only if Places API returns data.

```
★ 4.8  (127 reviews)   ·   Open until 11 PM
```

Styled inline with existing `font-inter text-sm text-text-muted` pattern.

### 1d. Update: `apps/web/src/app/venues/[slug]/page.tsx`

**Replace** the existing plain Google Maps search link (line 175-184) with:

1. `<VenueMap>` component — full-width below the venue info section
2. `<PlaceBadge>` — inline next to address (shows rating if available)

The existing `await getVenueBySlug(slug)` call already returns `lat`, `lng`, `address`, and `extra_data` — no query changes needed.

---

## Part 2 — YouTube Data API for Dynamic Video Grid

### 2a. New server utility: `apps/web/src/lib/queries/youtube.ts`

**Two functions, both cached with `unstable_cache` (24hr revalidation):**

**`getLatestPlaylistVideos(playlistId, maxResults = 4)`**
- Calls: `GET https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId={id}&maxResults={n}&key=YOUTUBE_API_KEY`
- Returns: `{ videoId, title, publishedAt, thumbnail }[]`
- Used to replace the hardcoded `ARTISTS` array in `YouTubeGrid`

**`getChannelStats(channelHandle = '@StPeteMusic')`**
- Calls: `GET https://www.googleapis.com/youtube/v3/channels?part=statistics&forHandle={handle}&key=YOUTUBE_API_KEY`
- Returns: `{ subscriberCount, viewCount, videoCount }`
- Used for a stats display on the homepage

### 2b. Update: `apps/web/src/components/YouTubeGrid.tsx`

Currently a `'use client'` component with hardcoded data. Refactor:

- **Extract `ParallaxEmbed`** into its own `'use client'` component (it needs framer-motion scroll hooks) — `apps/web/src/components/YouTubeParallaxEmbed.tsx`
- **Make `YouTubeGrid` a Server Component** — remove `'use client'`, accept `videos` prop from the parent server page
- Parent (`apps/web/src/app/page.tsx`) calls `getLatestPlaylistVideos()` and passes results down

**Data shape change** — current hardcoded:
```ts
{ artist: string, date: string, accent: string, youtubeUrl: string }
```
New from API:
```ts
{ videoId: string, title: string, publishedAt: string, thumbnail: string }
```
Video URL becomes: `https://www.youtube.com/watch?v={videoId}`  
Date formatted from `publishedAt` ISO string.  
Accent colors: cycle through `['#B57048', '#488DB5', '#FF8C00']` (existing palette).

### 2c. Update: `apps/web/src/app/page.tsx`

Add server-side data fetch at top of the page component:
```ts
const videos = await getLatestPlaylistVideos('PL5gTeopOibQREpXSSqHwVaZTWv1EdUuki', 4);
```
Pass `videos` as prop to `<YouTubeGrid videos={videos} />`.

### 2d. Optional: Channel stats on homepage

Add a small stats strip to the home page (or footer) showing:
```
🎵  47 videos  ·  1.2K subscribers  ·  84K views
```
Fetched via `getChannelStats()`, displayed as a subtle `text-text-muted` line near the YouTubeGrid header.

---

## Files to Create / Modify

| Action | File |
|---|---|
| CREATE | `apps/web/src/components/VenueMap.tsx` |
| CREATE | `apps/web/src/components/PlaceBadge.tsx` |
| CREATE | `apps/web/src/components/YouTubeParallaxEmbed.tsx` |
| CREATE | `apps/web/src/lib/queries/places.ts` |
| CREATE | `apps/web/src/lib/queries/youtube.ts` |
| CREATE | `apps/web/scripts/populate-place-ids.mjs` |
| MODIFY | `apps/web/src/app/venues/[slug]/page.tsx` — add VenueMap + PlaceBadge |
| MODIFY | `apps/web/src/components/YouTubeGrid.tsx` — server component, accept videos prop |
| MODIFY | `apps/web/src/app/page.tsx` — fetch videos, pass to YouTubeGrid |
| MODIFY | `apps/web/.env.local` — add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY + YOUTUBE_API_KEY |
| MODIFY | `apps/web/.env.local.example` — document new vars |

---

## Implementation Order

1. Add env vars to `.env.local` and `.env.local.example`
2. `places.ts` query utility + `VenueMap.tsx` + `PlaceBadge.tsx` — venue page enrichment
3. Update `venues/[slug]/page.tsx` — wire in map + badge
4. `youtube.ts` query utility — extract `ParallaxEmbed` to its own client component
5. Update `YouTubeGrid.tsx` to server component with props
6. Update `app/page.tsx` to fetch and pass videos
7. `populate-place-ids.mjs` script — one-time DB enrichment for venue Place IDs

---

## Verification

| Check | How |
|---|---|
| Map renders on venue page | `npm run dev`, visit `/venues/suite-e-studios` |
| Map falls back gracefully | Temporarily null out lat/lng, confirm address search fallback works |
| Place badge shows rating | Confirm Suite E Studios appears with ★ rating |
| YouTubeGrid shows real videos | Homepage — confirm cards match actual latest playlist videos |
| No API key exposed client-side | `view-source:stpetemusic.live` — confirm `YOUTUBE_API_KEY` not present, only `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` |
| Build passes | `npm run build --workspace=apps/web` — no TS errors |
| Cache works | Check Vercel/Amplify logs — confirm `unstable_cache` hit on second load |
