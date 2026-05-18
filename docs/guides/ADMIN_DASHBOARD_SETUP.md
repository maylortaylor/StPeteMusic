# Phase 1 Admin Dashboard Setup Guide

Phase 1 is now complete and pushed to `feature/admin-dashboard-phase1`. This guide covers what's been built and the manual setup steps you need to run locally.

---

## What's Been Implemented

### 1. **packages/db** — Type-Safe Database Layer
- Drizzle ORM schema definition for all StPeteMusic entities
- PostgreSQL connection pool (mirrors `apps/web` pattern)
- Exported types for use in admin app
- Sensitive columns marked and excluded:
  - `artists.venmo, zelle, other_payment` (encrypted BYTEA)
  - `persons.email, phone` (encrypted BYTEA)

### 2. **apps/admin** — Admin Dashboard Application
- Next.js 16 + shadcn/ui + TanStack Table/Form
- Clerk authentication (Google OAuth + email/password)
- Protected dashboard routes and middleware
- Responsive sidebar navigation
- Artists CRUD fully implemented as reference pattern

### 3. **Artists CRUD Module** (Reference Implementation)
- **List page** (`/dashboard/artists`)
  - TanStack Table with sorting/filtering
  - Columns: Name, Type, Username, Active toggle, Public toggle, Edit button
  - Inline toggles for quick actions (no page reload)
  - "New Artist" button

- **Create page** (`/dashboard/artists/new`)
  - TanStack Form + Zod validation
  - All artist fields (name, type, socials, genres, tags, notes)
  - Automatic slug generation from name
  - Form submission with error toast notifications

- **Edit page** (`/dashboard/artists/[id]`)
  - Load existing artist data
  - Full form with all editable fields
  - Delete capability (prepare for Phase 1.5)

- **API Routes** (Clerk-protected)
  - `GET /api/artists` — list all artists
  - `POST /api/artists` — create new artist
  - `GET /api/artists/[id]` — fetch single artist
  - `PUT /api/artists/[id]` — full update
  - `PATCH /api/artists/[id]` — partial update (toggles)

### 4. **Placeholder Pages**
- Venues, Persons, Organizations, Templates (ready for Phase 1.3 implementation)

---

## Manual Setup Steps

### Step 1: Create Clerk Application

1. Go to https://dashboard.clerk.com
2. Create a new application
3. Choose authentication method: **Google OAuth + Email/Password**
4. Complete the Clerk setup wizard
5. In Clerk Dashboard, navigate to **API Keys** and save:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (starts with `pk_`)
   - `CLERK_SECRET_KEY` (starts with `sk_`)

### Step 2: Configure Clerk Redirects

In Clerk Dashboard → **Allowed redirect URIs**, add:
```
http://localhost:3001
http://localhost:3001/auth/callback
https://admin.stpetemusic.live
https://admin.stpetemusic.live/auth/callback
```

### Step 3: Set Up Local Environment

```bash
cd apps/admin
cp .env.local.example .env.local
```

Edit `apps/admin/.env.local` and fill in:

```bash
# Get DATABASE_URL from your AWS RDS console or .env if you have it
DATABASE_URL=postgresql://stpetemusic:PASSWORD@stpetemusic-postgres.cmnogyowgoe1.us-east-1.rds.amazonaws.com:5432/stpetemusic

# From Clerk dashboard
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx

# These are fine as-is
NEXT_PUBLIC_SITE_URL=http://localhost:3001
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
```

### Step 4: Verify Database Connection

Test your DATABASE_URL with:
```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM artists;"
```

Should return a number (count of artists in DB). If it fails, verify:
- RDS instance is running
- Password is correct
- You're not behind a restricted network

### Step 5: Install Dependencies

```bash
npm install
```

This will:
- Install root workspace dependencies
- Install apps/admin dependencies
- Install packages/db dependencies

### Step 6: Run Local Dev Server

```bash
npm run dev:admin
```

This starts the admin app on `http://localhost:3001`

### Step 7: Test the Flow

1. Navigate to `http://localhost:3001`
2. Click "Sign in" → you'll be redirected to Clerk sign-in
3. Sign in with Google or email/password
4. After auth, you'll redirect to `/dashboard`
5. Click **Artists** in sidebar
6. Try:
   - Viewing the artists list
   - Clicking "New Artist" to add one
   - Editing an artist
   - Toggling the "Active" button (inline, no reload)

---

## If Something Goes Wrong

### `DATABASE_URL is not set`
→ Check that `apps/admin/.env.local` exists and has `DATABASE_URL=...`

### `Clerk keys not found`
→ Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` are in `.env.local`
→ Make sure you didn't accidentally commit `.env.local` (should be in `.gitignore`)

### `Error: Failed to fetch artists`
→ Check that you're signed in (Clerk middleware protecting routes)
→ Verify DATABASE_URL works locally: `psql $DATABASE_URL -c "SELECT 1"`
→ Check browser DevTools → Network tab → API response status/error

### `Clerk sign-in page doesn't appear`
→ Check `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is correct (should start with `pk_`)
→ Verify Clerk app is active in Clerk Dashboard
→ Clear browser cookies and try again

---

## Running the Full Stack

```bash
# Terminal 1: Local PostgreSQL + services
npm run dev:services

# Terminal 2: Admin app
npm run dev:admin

# Terminal 3 (optional): Web app (if you want to test both)
npm run dev:web
```

---

## Next Steps (Phase 1.2 - 1.4)

After testing locally:

1. **Phase 1.2** — Venues CRUD
2. **Phase 1.3** — Persons + Organizations CRUD
3. **Phase 1.4** — Templates CRUD + Dashboard Home brand snapshot
4. **Phase 1.5** — Amplify deployment setup + DNS configuration for `admin.stpetemusic.live`

---

## Key Files

| File | Purpose |
|---|---|
| `packages/db/src/schema.ts` | Drizzle ORM schema definition |
| `packages/db/src/db.ts` | Database connection pool |
| `apps/admin/src/middleware.ts` | Clerk authentication middleware |
| `apps/admin/src/app/dashboard/artists/page.tsx` | Artists list |
| `apps/admin/src/components/artists/artist-form.tsx` | Artists form (create/edit) |
| `apps/admin/src/app/api/artists/route.ts` | Artists API endpoints |

---

## Production Deployment (Later)

When ready for `admin.stpetemusic.live`:

1. Create new Amplify app in AWS Console
2. Point to same GitHub repo
3. Use custom build spec: `amplify.admin.yml` (to be created)
4. Add environment variables to Amplify:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `DATABASE_URL`
5. Update Clerk allowed redirects to production URL
6. Create CNAME in Cloudflare: `admin` → Amplify CloudFront

---

## Questions?

Refer to the implementation plan at `docs/plans/ADMIN_DASHBOARD_PLAN.md` for architecture details.
