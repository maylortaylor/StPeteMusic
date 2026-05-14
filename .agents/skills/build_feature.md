# Skill: build_feature — @frontend

## Objective

Implement features in the Next.js web app (`apps/web`) and admin portal (`apps/admin`) based on an approved spec from `@orchestrator`.

---

## Rules of Engagement

- Always read the approved spec from `production_artifacts/specs/` before writing any code
- Prefer editing existing files over creating new ones
- All DB access must go through `@stpetemusic/db` (`packages/db/`) — never raw DB connections in app code
- Admin routes must be protected by Clerk — follow patterns in `apps/admin/src/middleware.ts`
- Run `pnpm typecheck` after changes — fix all TypeScript errors before reporting done

---

## Context: Which App?

| Feature type | Target app | Pattern reference |
|---|---|---|
| Public-facing pages (events, discover, venues) | `apps/web` | `apps/web/src/app/` |
| Admin management (CRUD, dashboards, content tools) | `apps/admin` | `apps/admin/src/app/dashboard/` |
| Shared data access | `packages/db/src/schema.ts` | Drizzle ORM |
| API endpoints (admin) | `apps/admin/src/app/api/` | Existing route patterns |

---

## Instructions

1. **Read the spec** from `production_artifacts/specs/[feature].md` — understand all acceptance criteria before touching code.

2. **Explore existing patterns** before writing new code:
   - For admin pages: read `apps/admin/src/components/artists/artist-form.tsx` and `apps/admin/src/app/dashboard/artists/page.tsx` as reference patterns
   - For API routes: read `apps/admin/src/app/api/artists/route.ts` for the standard CRUD pattern
   - For DB access: read `packages/db/src/schema.ts` for existing tables

3. **Database changes** (if needed):
   - Add new tables/columns to `packages/db/src/schema.ts` using Drizzle syntax
   - Never modify existing column types — only add new columns
   - New migrations run via `pnpm --filter @stpetemusic/db db:push` (dev) or `db:migrate` (prod)

4. **Build the feature** following these conventions:
   - Functional components only, no class components
   - Server components by default — add `"use client"` only when hooks or browser events are needed
   - Single quotes, semicolons, 2-space indent (matches ESLint config)
   - Props interfaces prefixed with `I` (e.g., `IPostCardProps`)
   - Tailwind for all styling — no inline styles except when data-driven
   - Forms: TanStack Form + Zod validation (match pattern in `artist-form.tsx`)
   - Tables: TanStack Table (match pattern in existing admin pages)
   - Toasts: Sonner (`toast.success()`, `toast.error()`)

5. **After building**, report:
   - Files created/modified (with line counts)
   - Any DB changes made
   - How to test the feature manually

---

## Key Import Aliases

```ts
import { db } from '@stpetemusic/db';
import { artists, venues, events } from '@stpetemusic/db/schema';
// Admin app alias:
import { Component } from '@/components/...';
import { api } from '@/lib/api';
```
