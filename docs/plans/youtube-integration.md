# YouTube Integration — StPeteMusic Admin

## Context
The StPeteMusic YouTube channel has grown significantly in 2025 with many livestreams and regular uploads, but video metadata (titles, descriptions, tags) is inconsistent and poorly optimized for search. The goal is a programmatic cleanup: fetch all videos, match them to Suite E Studios' Google Calendar events, generate uniform titles/descriptions/tags via Claude, and publish approved updates back to YouTube — all managed through the existing admin app. New uploads should auto-queue via YouTube webhooks.

---

## Decisions Made

| Decision | Choice |
|---|---|
| YouTube write auth | OAuth2 — YOUTUBE_OAUTH_CLIENT_ID + SECRET already in .env, need YOUTUBE_REFRESH_TOKEN |
| Video scope | All videos on the channel |
| Metadata format | Strict template (see below) |
| Timestamp source | Google Calendar (suite.e.stpete@gmail.com) for band names; timestamps added manually in review UI |
| Playlist strategy | Venue-based (existing) + year playlists + Livestreams + Short Clips |
| Unmatched videos | Queue with "guessed" flag, Claude extracts from existing title + DB band info |
| New upload trigger | PubSubHubbub webhooks → auto-queue in admin; manual fetch button as fallback |
| Review flow | Required for every video before any YouTube write |

---

## Title & Description Templates

### Title Rules

**Single artist/band video:**
```
{Band Name} at {Venue Name} // {MM.DD.YYYY} #{tag1} #{tag2}
```

**Multi-band event (3+ performers, Final Friday, etc.):**
```
{Event Name} at {Venue Name} // {MM.DD.YYYY} #{tag1} #{tag2}
```
If no distinct event name exists: `Live at {Venue Name} ft. {Band1}, {Band2} & {Band3} // {MM.DD.YYYY}`
- If that's still too long: drop Band3 entirely (never truncate or shorten a band name)
- If still too long: drop Band2 as well
- Never abbreviate or shorten band names to fit — always drop the whole name

**Truncation logic (YouTube limit: 100 chars, applied in order):**
1. Try full date `MM.DD.YYYY`
2. Still over 100? Shorten to `MM.DD.YY`
3. Still over 100? Drop hashtags from title (they appear in description + tags field)
4. Still over 100? Drop trailing band names (Band3 first, then Band2) — never truncate mid-name
5. Still over 100? Abbreviate venue (e.g., "Suite E" instead of "Suite E Studios")

**Missing field fallbacks:**
- No artist/event name → use existing YouTube title text as-is for the name portion
- No venue → `{Artist/Event} // {date} {tags}` (omit "at {Venue}")
- No date from calendar → use YouTube upload date
- Completely unknown → `Live Performance // {upload date}` + flag as "needs_review"

### Description Template

```
{Title repeated verbatim}

[IF venue is Suite E Studios:]
Produced by: Rob Morey @Suite.E.Studios // St Petersburg, FL // Multimedia Production Studio
Assisted by: Matt "Maylor" Taylor @Suite.E.Studios

[IF any other venue / NOT Suite E Studios:]
Produced by: Matt "Maylor" Taylor

[TIMESTAMPS BLOCK — omit entirely if not yet entered]
0:00 - {Band 1}
0:00 - {Band 2}
0:00 - {Band 3}

Things you should check out:
-- St Pete Music || https://StPeteMusic.live
[IF band has instagram_url in DB] -- {Band Name} || {instagram_url}
[IF band has website in DB]       -- {Band Name} || {website_url}
-- St Pete Music Instagram || https://www.instagram.com/stpetemusic/
-- St Pete Music Facebook || https://www.facebook.com/stpeteflmusic/
-- Suite E Studios || https://SuiteEStudios.com/

StPete Music is a youtube channel, website, and community that is dedicated to showing off the best musicians, artists, bands, and performers in the Greater Tampa Bay and St Petersburg, FL area. Our website has links to all the bands and venues you see.

// EMAIL //
TheBurgMusic@gmail.com
or
Suite.E.StPete@gmail.com
```

**Description limits:** YouTube max = 5,000 chars. Template static portion ≈ 500 chars + timestamps + band links. Validate at generation time and warn in review UI if approaching limit.

**Shorts description:** Same template, no timestamps block (Shorts are too short for multiple bands). Omit "Produced by" unless explicitly a Suite E recording.

### Tags Strategy

Claude generates YouTube SEO-optimized tags filling as close to 500 chars as possible.
Priority: brand terms → exact band name → band name variations → genre/style → location → event type.
Base brand tags always included (hardcoded, ~130 chars):
`St Pete Music, StPeteMusic, Saint Petersburg Florida, St Petersburg FL, Tampa Bay Music, Florida Live Music, Suite E Studios, Live Music, Local Music`
Remaining ~370 chars allocated to band-specific + genre + event tags by Claude.

---

## Architecture

### New DB Tables (`packages/db/src/schema.ts`)

**`youtube_config`** (single-row config table)
- `footer_links` (JSONB — `[{label, url}]`) — "Things you should check out" links, editable in admin UI
- `channel_bio` (text) — the "StPete Music is a youtube channel..." paragraph
- `contact_emails` (JSONB — `[string]`) — email addresses in footer
- `prompt_version` (varchar) — tracks which Claude prompt version generated proposals (e.g., `v1`, `v2`)
- `updated_at`

**`youtube_videos`**
- `video_id` (PK, YouTube video ID)
- `title`, `description`, `tags[]`, `thumbnail_url`, `duration_seconds`
- `published_at`, `is_livestream`, `is_short`
- `proposed_title`, `proposed_description`, `proposed_tags[]`, `proposed_playlist_ids[]`
- `status`: `pending_review | approved | published | needs_timestamps | skipped`
- `prompt_version` (varchar) — which Claude prompt version generated this proposal (for re-gen targeting)
- `calendar_event_id`, `calendar_event_link` (GCal htmlLink), `calendar_match_confidence`: `confirmed | guessed | none`
- `timestamps` (JSONB — `[{time: "1:14:30", band_name: "Bauxmonk", artist_id?: uuid}]`)
- `reviewed_at`, `published_to_youtube_at`, `review_notes`

**`youtube_playlists`**
- `playlist_id` (PK, YouTube playlist ID)
- `name`, `description`, `video_count`, `playlist_type`: `venue | year | series | content_type`
- `synced_at`

### New Files

**Scripts**
- `scripts/get-youtube-token.mjs` — one-time OAuth flow to generate YOUTUBE_REFRESH_TOKEN

**Lib / Services** (`apps/admin/src/lib/`)
- `youtube-client.ts` — YouTube Data API v3 client (OAuth2, list videos, update metadata, manage playlists)
- `google-calendar.ts` — Google Calendar API client (fetch events by date range, match to videos)
- `youtube-metadata.ts` — Claude-powered generator (title, description, tags) with specialized YouTube SEO prompt

**API Routes** (`apps/admin/src/app/api/youtube/`)
- `GET /api/youtube/videos` — paginated list with status filters
- `POST /api/youtube/videos/sync` — fetch all channel videos from YouTube, match to calendar, generate proposals, store in DB
- `GET /api/youtube/videos/[id]` — single video with full proposal
- `PATCH /api/youtube/videos/[id]` — edit proposed title/description/tags/timestamps
- `POST /api/youtube/videos/[id]/approve` — mark approved
- `POST /api/youtube/videos/[id]/publish` — write approved metadata to YouTube API (also handles re-publish)
- `POST /api/youtube/videos/[id]/regenerate` — re-run Claude proposal generation for a single video
- `POST /api/youtube/videos/bulk-approve` — approve multiple video IDs at once
- `GET /api/youtube/playlists` — list playlists (fetches from YouTube + local DB)
- `POST /api/youtube/playlists/create` — create a new playlist on YouTube + store in DB
- `POST /api/youtube/subscribe` — register PubSubHubbub subscription (called on first deploy)
- `POST /api/webhooks/youtube` — PubSubHubbub receiver: handles GET (hub.challenge verification handshake) AND POST (new upload notification → auto-generate → queue)

**Admin Pages** (`apps/admin/src/app/dashboard/youtube/`)
- `/dashboard/youtube` — review queue (table with filters: all / pending / approved / published / needs_timestamps / guessed)
- `/dashboard/youtube/[videoId]` — individual review screen (see UI spec below)

### Review Screen UI (per video)
- Thumbnail preview + YouTube link
- **Side-by-side**: current title vs proposed title (editable)
- **Side-by-side**: current description vs proposed description (editable textarea)
- Proposed tags (editable, char counter showing x/500)
- Proposed playlist assignments (checkboxes — includes new playlists)
- Calendar match: event name + date + **link to GCal event** (`event.htmlLink`) + confidence badge (Confirmed / Guessed / No Match)
- Livestream flag + **"Add Timestamps"** expandable section (band name + time fields, pre-filled from calendar if match found)
- Actions: **Approve** / **Skip** / **Regenerate Proposal** / **Publish to YouTube** (only shown after Approve)
- Re-publish: approved + already-published videos show **"Re-publish"** to push updated timestamps or edits back to YouTube

### Queue Page (`/dashboard/youtube`)
- Filters: All / Pending Review / Needs Timestamps / Approved / Published / Guessed / No Match
- Stats bar: total videos, pending count, needs-timestamps count, published count
- **Bulk approve**: checkbox-select multiple "Confirmed" match videos → approve all at once (for high-confidence batch cleanup)
- Sort by: status, upload date, confidence

---

## Playlist Auto-Assignment Logic

| Playlist | Trigger |
|---|---|
| Livestreams | `is_livestream = true` (from YouTube API `liveStreamingDetails`) |
| Short Clips | `duration_seconds < 180` or YouTube Shorts aspect ratio |
| Year (2024/2025/2026) | `published_at` year |
| Venue playlists | Calendar event location matches existing playlist name |
| Final Friday | Calendar event title contains "Final Friday" |

**Playlist creation:** New playlists (Livestreams, Short Clips, year playlists) must be created in YouTube before assignment. Add `POST /api/youtube/playlists/create` endpoint + a "Manage Playlists" tab in the YouTube dashboard page to create/view playlists. Playlist YouTube IDs stored in `youtube_playlists` table after creation.

---

## YouTube API Quota Management

YouTube Data API v3 daily quota: **10,000 units**
- `videos.list` (read): 1 unit per request (up to 50 videos per call)
- `videos.update` (write): **50 units per video**
- For 200 videos: 200 × 50 = 10,000 units — hits the daily limit exactly

**Mitigation — slow and cautious by design:**
- Sync (read all videos): cheap (1 unit per 50 videos) — run freely
- Publishing writes: **hard cap of 50 videos/day** — conservative ceiling well under the quota
- Queue page shows a "daily budget" counter (units used / 10,000)
- If quota is exhausted mid-batch, remaining approved videos stay queued and auto-resume next day automatically
- No bulk-publish-all button — deliberate friction to prevent accidental quota burn
- Consider requesting a quota increase in Google Cloud Console once channel exceeds 200 videos

---

## Environment Variables Needed

| Var | Status | Notes |
|---|---|---|
| `YOUTUBE_OAUTH_CLIENT_ID` | ✅ Added | From Google Cloud Console |
| `YOUTUBE_OAUTH_CLIENT_SECRET` | ✅ Added | From Google Cloud Console |
| `YOUTUBE_REFRESH_TOKEN` | ❌ Missing | Generated by `scripts/get-youtube-token.mjs` |
| `YOUTUBE_API_KEY` | ✅ Existing | Already used for subscriber stats |
| `GOOGLE_CALENDAR_ID` | ❌ New | Value: `suite.e.stpete@gmail.com` |

Google Cloud project also needs **Google Calendar API** enabled (currently only YouTube Data API v3 is enabled).

---

## Implementation Order

### Phase 1 — Auth & Setup (must complete before any other work)
1. **Write `scripts/get-youtube-token.mjs`** — one-time OAuth flow, user runs it locally, pastes YOUTUBE_REFRESH_TOKEN into .env
2. **Manual: Enable Google Calendar API** in Google Cloud Console (YouTube Data API v3 already on)
3. **Manual: Add `GOOGLE_CALENDAR_ID=suite.e.stpete@gmail.com` to `.env.local`**

### Phase 2 — Data Layer
4. **`apps/admin` dependencies** — add `googleapis` to admin's package.json (keep in web too)
5. **DB migration** — add `youtube_config`, `youtube_videos`, and `youtube_playlists` tables
6. **`youtube-client.ts`** — OAuth2 client: list videos (paginated, all pages), update video metadata, create/list/assign playlists; includes quota tracking helper
7. **`google-calendar.ts`** — fetch events by date range, fuzzy-match to video by date + title keywords, return `htmlLink`
8. **`youtube-metadata.ts`** — Claude prompts for: title (template + truncation logic), description (template + conditional blocks + band links from DB), tags (500-char SEO budget)

### Phase 3 — Sync & Generation
9. **`POST /api/youtube/videos/sync`** — orchestrates: fetch all videos → match to calendar → generate proposals → store in DB; idempotent (re-run safe)
10. **`POST /api/youtube/playlists/create`** — create Livestreams, Short Clips, year playlists on YouTube + store IDs in DB
11. **Playlist sync step** — fetch existing channel playlists (venue playlists) → store in `youtube_playlists` before first video sync

### Phase 4 — Admin UI
12. **Queue page** `/dashboard/youtube` — table, stats bar, filters, bulk approve, sort
13. **Review page** `/dashboard/youtube/[videoId]` — side-by-side diff, GCal link, tag counter, playlist checkboxes, timestamp entry, approve/publish/regenerate/re-publish

### Phase 5 — Publish & Webhooks
14. **Approve + publish API routes** — write to YouTube Data API v3; respect quota limit (50/day); re-publish support; set `categoryId: "10"` (Music) + `defaultAudioLanguage: "en"` on every update
15. **`POST /api/webhooks/youtube`** — handle GET verification handshake (hub.challenge) AND POST new-video notification → auto-generate → queue
16. **`POST /api/youtube/subscribe`** — register PubSubHubbub subscription (run manually once after deploy)
17. **Pinned comment** — after publish, auto-post a pinned comment: if timestamps exist show setlist; if not, show band names + Instagram/website from DB (uses YouTube Comments API, same OAuth)
18. **Daily polling cron** — lightweight Next.js cron route that checks for videos uploaded in last 48h not in DB; fallback for missed webhooks
19. **`youtube_config` admin UI** — settings page to edit footer links, channel bio, emails without code deploy

---

## Enhancements Included

These are baked into the implementation plan above — not future work:

| Enhancement | Where | Why |
|---|---|---|
| **Pinned comment with setlist** | Phase 5 publish step | Second indexed entry on the video; strong YouTube SEO signal. If timestamps exist: `📌 Setlist: Band1 0:00 / Band2 1:14`. If no timestamps: band names + Instagram + website links from DB. Always posted. |
| **Music category + language** | `videos.update` call | Set `categoryId: "10"` (Music) + `defaultAudioLanguage: "en"` on all videos — two extra fields, essentially free, real algorithm signal |
| **Pre-populate timestamps from existing description** | Sync step | If current description already has timestamp text, parse + pre-fill review UI fields — saves re-entering what's already there |
| **Description template as DB config** | `youtube_config` table | Footer links, emails, channel bio stored in DB — update from admin UI without a code deploy |
| **Publish newest-first ordering** | Publish queue | 2025/2026 content gets indexed first; benefits from SEO improvements soonest |
| **Daily polling fallback** | Cron job | Checks last 48h for new videos not in DB — catches any PubSubHubbub missed notifications |
| **Prompt version tracking** | `youtube_videos.prompt_version` | When you improve the Claude prompt later, bulk re-generate only videos on the old version |

---

## Verification

1. Run `scripts/get-youtube-token.mjs` → confirm YOUTUBE_REFRESH_TOKEN is valid
2. Hit `POST /api/youtube/videos/sync` → confirm videos appear in DB with proposals
3. Open `/dashboard/youtube` → verify review queue renders with correct status filters
4. Open one video review page → verify side-by-side diff, GCal link opens correct event
5. Approve + publish one test video → verify YouTube title/description/tags updated
6. Upload a test unlisted video to YouTube → confirm webhook fires → video appears in review queue automatically
7. Add timestamps to a flagged livestream → confirm they render in description on publish
8. Verify pinned comment appears on the published video with correct setlist
9. Update a footer link in `youtube_config` → re-generate a video proposal → confirm new link appears in description
10. Upload a second test video → confirm daily polling cron catches it within 24h if webhook was missed
