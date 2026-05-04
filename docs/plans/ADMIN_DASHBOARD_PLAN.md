# Plan: admin.stpetemusic.live — Brand Command Center

## Context

StPeteMusic is a community music brand in St. Pete, FL. It promotes local artists, bands, and venues via Instagram, YouTube, Facebook, and a website. Revenue goals include ad revenue from traffic and sponsored local business placements. The admin dashboard is not just a DB editor — it is the **marketing command center**: manage content, track social reach, analyze growth, and eventually track monetization.

Today: no admin interface exists. Content changes require direct SQL. Social media data is being collected into `post_stats`, `account_snapshots`, `ig_mentions` by n8n — but no one can see it without writing queries.

---

## Architecture Decisions

| Decision | Choice | Reason |
|---|---|---|
| Location | `apps/admin` in existing monorepo | Shares `packages/types` + new `packages/db` |
| Auth | Clerk (Google OAuth + email/password) | Built into starter kit; allowlist to 2 admins; free tier |
| Starter kit | https://github.com/Kiranism/next-shadcn-dashboard-starter | Next.js 16, shadcn/ui, TanStack Table+Form, Recharts — all needed |
| DB layer | Drizzle ORM in new `packages/db` | Type-safe CRUD; web app's raw `pg` untouched |
| Editing UX | List table → `/entity/[id]` edit page | 25-30 fields per entity is too many for modal/inline |
| Quick toggles | `is_active` + `visible_on_website` inline | One-click UX for the most frequent admin action |
| Deployment | Separate Amplify app + `amplify.admin.yml` | Amplify Gen 1 can't host two WEB_COMPUTE apps in one YML |

---

## Dashboard Navigation — Full Vision

```
Dashboard Home           ← Brand snapshot: followers, top post, upcoming events, active artists

Content Management
├─ Artists               ← Full CRUD (30+ fields)
├─ Venues                ← Full CRUD (25+ fields)
├─ Events                ← Full CRUD + performer linking
├─ Persons               ← Full CRUD (no encrypted email/phone)
└─ Organizations         ← Full CRUD

Social Media
├─ Performance           ← post_stats: top posts by reach/views/engagement per platform
├─ Growth                ← account_snapshots: follower trend charts per platform
└─ Mentions              ← ig_mentions: who's tagging us; link unlinked handles to artists

Analytics
└─ Website               ← GA4: pageviews, top pages, traffic sources, device breakdown

Content Tools
├─ Templates             ← CRUD on templates table (captions, prompts, hashtags, email)
├─ n8n Workflows  ⬀      ← External link → https://n8n.stpetemusic.live
└─ Newsletters    ⬀      ← External link → https://listmonk.stpetemusic.live

[Future] Monetization
└─ Sponsors / Ads        ← Track local business placements, sponsored content
```

---

## Phase 1: Content Management (DB CRUD)

### New monorepo structure

```
StPeteMusic/
├── amplify.admin.yml              ← new
├── apps/admin/                    ← new: stripped from starter kit
│   ├── middleware.ts              ← Clerk: protect all routes except /auth
│   ├── next.config.mjs            ← env-inline DATABASE_URL + CLERK_SECRET_KEY
│   └── src/
│       ├── app/
│       │   ├── auth/[[...sign-in]]/page.tsx
│       │   └── dashboard/
│       │       ├── layout.tsx     ← sidebar + topbar
│       │       ├── page.tsx       ← Brand snapshot (redirect stub in Phase 1)
│       │       ├── artists/[id]/  ← edit page
│       │       ├── venues/[id]/
│       │       ├── events/[id]/
│       │       ├── persons/[id]/
│       │       ├── organizations/[id]/
│       │       ├── social/        ← Phase 2
│       │       ├── analytics/     ← Phase 2
│       │       └── templates/[id]/← Phase 1 (edit content templates)
│       ├── features/              ← per-entity: table + form + Zod schema
│       └── app/api/               ← route handlers (Clerk-guarded)
└── packages/db/                   ← new: Drizzle ORM
    └── src/
        ├── pool.ts                ← mirrors apps/web/src/lib/db.ts:1-39
        ├── schema/                ← drizzle-kit introspect output
        └── queries/               ← typed CRUD helpers
```

### `packages/db` setup

1. `drizzle-kit introspect` against local DB → commit generated schema files
2. Validate against `database/schema.sql` + all 16 migrations in `database/migrations/`
3. Mark BYTEA columns `.$type<never>()` and exclude from all selects:
   - `artists`: `venmo`, `zelle`, `other_payment`
   - `persons`: `email`, `phone`
   - `venues`: check migration 001 — email/phone may have been migrated to plain TEXT (verify)
4. Pool pattern: copy from `apps/web/src/lib/db.ts:11-26` exactly

### Entity CRUD — common pattern

**List page**: Server Component → TanStack Table → sortable, paginated, nuqs URL state.
Table columns always include: Name, Status toggle (`is_active`), Visible toggle, Created At, Edit button.
`is_active` / `visible_on_website` fire `PATCH /api/{entity}/{id}` inline (no page reload).

**Edit/Create page**: TanStack Form v1 + Zod v3 (NOT v4 — TanStack Form incompatibility).
Long forms use shadcn `<Tabs>` to group fields. `slug` auto-generates from name on create.
Sonner toast on success/error.

### Entity-specific notes

| Entity | Key notes |
|---|---|
| **Artists** | Tab groups: Basic Info / Media+Social / Notes. Never expose `venmo`/`zelle`/`other_payment`. `genres` + `tags` as chip inputs |
| **Venues** | Add `contact_name` to `packages/types` `Venue` interface (in DB, missing from type). `lat`/`lng` as side-by-side number inputs |
| **Events** | `google_event_id` hidden; admin-created events get `admin-${crypto.randomUUID()}`. `event_performers`: artist multi-select combobox, diff on save → insert/delete join rows |
| **Persons** | No email/phone fields. Warning banner: "Email and phone are encrypted and cannot be edited here." |
| **Organizations** | Simplest — no relationships, just fields |
| **Templates** | Dynamic editor per `type`: textarea (captions/prompts), 500-char-limited textarea (youtube_hashtags), subject+body (email). `content` is JSONB — parse on read, stringify on write |

---

## Phase 2a: Social Media Dashboard (HIGH VALUE — data already exists)

The `post_stats`, `account_snapshots`, and `ig_mentions` tables are **already being populated by n8n**. This is the brand's social media data warehouse. Building charts on top costs almost nothing.

### `/dashboard/social/performance`

Data source: `post_stats` (platform, post_type, views, reach, likes, shares, saves, follows, artist_id)

- **Top Posts table**: sortable by views / reach / engagement rate (likes+comments+shares / reach). Columns: caption snippet, platform, post_type, published_at, views, reach, engagement rate, artist name.
- **Platform filter**: Instagram / YouTube / Facebook / TikTok tabs
- **Best content type**: bar chart — Reels vs Photo vs Carousel vs Short (avg engagement rate) → tells you what format to invest in
- **Top artist associations**: which artists appear in best performing posts → guides who to feature more

All data read-only. Queries against `post_stats` joined to `artists`.

### `/dashboard/social/growth`

Data source: `account_snapshots` (platform, recorded_at, followers, following, posts_count, extra_metrics JSONB)

- **Follower trend**: multi-line Recharts chart — Instagram / YouTube / Facebook / TikTok over time
- **Platform cards**: current follower count + delta vs 30 days ago per platform
- **extra_metrics**: surface platform-specific extras (reach_30d, impressions) if present

### `/dashboard/social/mentions`

Data source: `ig_mentions` (instagram_handle, total_mentions, first/last_mentioned_at, artist_id FK)

- Table: handle, total mentions, last mentioned, linked artist (or "unlinked")
- **Link action**: click unlinked handle → artist search combobox → save `artist_id` FK
- Closes the loop between community tagging and the artist database

---

## Phase 2b: Website Analytics (GA4)

### `/dashboard/analytics`

Server-side fetch via GA4 Data API using a GCP service account (no iframe — avoids requiring each admin to have GA access). Reuse logic from `apps/web/scripts/ga4-export.mjs`.

Recharts renders:
- Sessions + users last 30 days (line chart)
- Top 10 pages by pageviews (horizontal bar)
- Traffic sources: organic / social / direct / referral (pie chart)
- Device breakdown: mobile / desktop / tablet

1-hour `unstable_cache` revalidation. New env vars: `GOOGLE_SERVICE_ACCOUNT_JSON`, `GA4_PROPERTY_ID`

---

## Phase 2c: Content Templates

### `/dashboard/templates`

Full CRUD on the `templates` table. These templates drive the n8n AI caption/prompt pipeline — editing them changes what gets posted to Instagram/YouTube.

- List: name, platform, type, is_active, tags, last updated
- Edit page: dynamic content editor based on `type`:
  - `post/caption/description`: textarea for `raw` + variable list (e.g. `{bandName}`)
  - `youtube_hashtags`: textarea with 500-char counter
  - `prompt`: large textarea (AI system prompts are long)
  - `email`: separate Subject + Body inputs

---

## Phase 3 (Future): Monetization

Placeholder nav item "Sponsors & Ads" — plan the module in a future session.

Monetization paths:
1. **Local business paid placements** — business name, placement location, date range, cost, impressions
2. **Google AdSense revenue** — AdSense API integration, monthly revenue chart
3. **Sponsored content** — tag `post_stats` rows as sponsored, track CPM / brand value

---

## Dashboard Home (Brand Snapshot)

### `/dashboard` — command center overview

4 stat cards:
- Active artists (`artists WHERE is_active = true`)
- Active venues (`venues WHERE is_active = true`)
- Upcoming events (`events WHERE start_time > now()`)
- Instagram followers (latest `account_snapshots` for instagram)

2-column layout below:
- Left: Top 3 upcoming events
- Right: Latest top-performing post from `post_stats` (by reach, last 30 days)

Simple server component — fast DB queries, no GA4 call on home page.

---

## Files to Create / Modify

| File | Action |
|---|---|
| `amplify.admin.yml` | Create |
| `apps/admin/**` | Create (scaffold from starter, strip, add features) |
| `packages/db/**` | Create (Drizzle schema + queries) |
| `packages/types/src/index.ts` | Edit — add `contact_name?: string` to `Venue` |
| `package.json` (root) | Edit — add `apps/admin` to workspaces |

**Reference files (read before implementing):**
- `apps/web/src/lib/db.ts` — pool pattern to replicate
- `database/schema.sql` + `database/migrations/001-016_*.sql` — validate introspection against these
- `apps/web/next.config.mjs` — env-inline pattern to replicate in admin
- `packages/types/src/index.ts` — existing interfaces to import and extend
- `amplify.yml` — existing Amplify build spec format reference
- `apps/web/scripts/ga4-export.mjs` — GA4 API calls to replicate in Phase 2b

---

## Deployment

1. `amplify.admin.yml` at repo root — mirrors `amplify.yml` but with `appRoot: apps/admin`
2. New Amplify app in AWS Console → same GitHub repo, branch `main` → custom build spec: `amplify.admin.yml`
3. Hosting type: `WEB_COMPUTE` (SSR), custom domain: `admin.stpetemusic.live`
4. Cloudflare: `admin` CNAME → Amplify CloudFront (grey cloud, no proxy)

**Amplify env vars (admin app):**
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/auth
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
DATABASE_URL
GOOGLE_SERVICE_ACCOUNT_JSON   (Phase 2b)
GA4_PROPERTY_ID               (Phase 2b)
```

**`apps/admin/next.config.mjs`** — inline sensitive vars for Amplify Gen 1 Lambda (same pattern as web app):
```js
env: {
  DATABASE_URL: process.env.DATABASE_URL ?? '',
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY ?? '',
}
```

---

## Implementation Order

| Sprint | Focus |
|---|---|
| 1 | `apps/admin` scaffold + `packages/db` + Clerk auth + sidebar layout |
| 2 | Artists CRUD (reference implementation — establishes all patterns) |
| 3 | Venues + Events (with performer linking) + Persons + Organizations |
| 4 | Templates CRUD + Amplify deploy + DNS |
| 5 | Social Media Dashboard (post_stats + account_snapshots + ig_mentions) |
| 6 | GA4 website analytics + Dashboard Home brand snapshot |
| Future | Monetization/Sponsors module |

---

## Verification

1. `npm run dev --workspace=apps/admin` → loads at `localhost:3001`
2. Sign in with Google → redirects to `/dashboard`
3. Unauthenticated `/api/artists` returns 401
4. Create artist → appears on `stpetemusic.live/discover`
5. Toggle `is_active` on artist → removed from public site
6. Edit template → n8n uses updated template on next automation run
7. `/dashboard/social/performance` shows post data from `post_stats`
8. `/dashboard/social/growth` shows follower trend from `account_snapshots`
9. `admin.stpetemusic.live` resolves correctly after Amplify deploy
