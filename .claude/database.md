---
topic: database
triggers: db, schema, migration, drizzle, postgres, table, query, model, uuid, column, seed
updated: 2026-05-18
---

# Database

**ORM:** Drizzle ORM (`packages/db/`)  
**Engine:** PostgreSQL 16 (RDS, `stpetemusic-postgres.cmnogyowgoe1.us-east-1.rds.amazonaws.com`)  
**Schema source of truth:** `packages/db/src/schema.ts`  
**Migrations:** `database/migrations/` — auto-applied on deploy to `main` via `amplify.yml`

## Running Migrations Locally

```bash
pnpm --filter @stpetemusic/db build    # compile schema
pnpm db:migrate                         # apply pending migrations
```

Always verify a rollback path before pushing a migration. Drizzle has no built-in rollback — write the inverse SQL manually if needed.

## Schema Tables

| Table | Primary Key | Notes |
|---|---|---|
| `artists` | `uuid` | `venmo`, `zelle`, `other_payment` — **encrypted BYTEA, never select in admin** |
| `venues` | `uuid` | Linked to `google_calendar_id`, `facebook_page_id` |
| `persons` | `uuid` | `email`, `phone` — **encrypted BYTEA, never select in admin** |
| `organizations` | `uuid` | External orgs (sponsors, partners) |
| `events` | `uuid` | `review_status`: `approved`/`pending_review`; `source`: origin system |
| `event_performers` | composite `(event_id, artist_id)` | Junction table, cascades on delete |
| `post_stats` | `uuid` | Per-post engagement metrics (views, likes, comments, shares, saves) |
| `account_snapshots` | `uuid` | Periodic follower/following counts per platform |
| `ig_mentions` | `uuid` | Unique per `instagram_handle`; tracks mention history |
| `templates` | `uuid` | Reusable caption/content templates; `platform` + `type` classify them |
| `featured_artists` | `uuid` | Status: `pending_enrichment → enrichment_ready → enrichment_approved → newsletter_generated → newsletter_approved → blog_generated → blog_approved` |
| `featured_venues` | `uuid` | One per `featured_month` (unique); status: `draft → approved` |
| `social_posts` | `uuid` | Status: `draft → pending_approval → approved → scheduled → published → failed → archived`; `platform`: instagram/facebook/youtube/newsletter |
| `brand_guidelines` | `uuid` | Only one row should have `is_active=true` at a time |
| `youtube_config` | `uuid` | Single-row config; stream override + YT API response cache |
| `youtube_videos` | `video_id varchar(20)` | Status: `pending_review → needs_timestamps → approved → published / skipped`; `calendar_match_confidence`: confirmed/guessed/none |
| `youtube_playlists` | `playlist_id varchar(50)` | `playlist_type`: venue/year/series/content_type |
| `blog_posts` | `uuid` | Status: `draft → approved → published`; `post_type`: artist_spotlight/event_recap/venue_feature/general |
| `tag_definitions` | `uuid` | Controlled vocabulary for tags |
| `eventbrite_events` | `eventbrite_id varchar(50)` | Synced from Eventbrite API; status mirrors Eventbrite states |

## Conventions

- **All UUIDs** — `uuid('id').primaryKey().defaultRandom()` unless table uses a natural key (YouTube video_id, Eventbrite ID)
- **Timestamps** — every table has `created_at` + `updated_at` (with timezone). `updated_at` uses `.$onUpdate(() => new Date())`
- **Soft delete** — use `is_active: boolean` where supported; hard delete only for junction tables
- **JSONB** — use `extra_data` for unstructured/future fields; use typed `jsonb().$type<T>()` for structured arrays
- **Encrypted fields** — `bytea` columns hold encrypted data; never query them through the admin app

## Drizzle Query Pattern

```ts
import { db } from '@stpetemusic/db';
import { eq } from 'drizzle-orm';
import { artists } from '@stpetemusic/db/schema';

// Simple select
const artist = await db.query.artists.findFirst({
  where: eq(artists.slug, 'band-name'),
});

// Insert
await db.insert(artists).values({ name: 'Band', slug: 'band', type: 'band' });
```

## Migration Naming

Files in `database/migrations/` use zero-padded sequential numbers: `0001_...sql`, `0018_...sql`.  
Generate with: `pnpm drizzle-kit generate` (then review before committing).
