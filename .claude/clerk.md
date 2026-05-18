---
topic: clerk
triggers: clerk, auth, authentication, protected, middleware, sign-in, session, login, dashboard, route, authorize
updated: 2026-05-18
---

# Clerk Auth (Admin App)

**Version:** Clerk v6 (`@clerk/nextjs`)  
**App:** `apps/admin/` only — the public web app has no auth  
**Middleware:** `apps/admin/src/middleware.ts`

## CRITICAL: Filename Must Be `middleware.ts`

**Never rename** `middleware.ts` to `proxy.ts`, `auth.ts`, or anything else.  
Clerk v6 resolves middleware by exact filename convention — renaming causes a **500 on every page** (production outage). This has happened before.

## Current Middleware Pattern

```ts
// apps/admin/src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Deny-by-default: protect everything except sign-in.
// Never switch to an allow-list approach — a new page would be silently public.
const isPublicRoute = createRouteMatcher(['/sign-in(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) await auth.protect();
});

export const config = {
  matcher: [
    '/((?!_next|api/health|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api(?!/health)|trpc)(.*)',
  ],
};
```

**Pattern:** Deny-by-default (everything protected unless explicitly listed as public). The `api/health` endpoint is excluded from auth in the matcher.

## Adding a New Protected Page

1. Create the page file under `apps/admin/src/app/(dashboard)/your-route/page.tsx`
2. No middleware changes needed — deny-by-default already protects it
3. The `(dashboard)` route group applies shared layout + nav

## Adding a New Public API Route

To make an API route accessible without auth (e.g., webhooks, health checks):

**Option A — Exclude in matcher** (preferred for static paths):
```ts
// In middleware.ts config.matcher, add your path to the exclusion pattern
'/(api(?!/health|/your-public-endpoint)|trpc)(.*)',
```

**Option B — Add to public routes list** (preferred for dynamic paths):
```ts
const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/api/your-webhook(.*)']);
```

## Reading Auth in Server Components / Route Handlers

```ts
import { auth } from '@clerk/nextjs/server';

// In a Server Component or Route Handler
const { userId } = await auth();
if (!userId) return new Response('Unauthorized', { status: 401 });
```

## Environment Variables

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
```

Stored in GitHub Secrets → injected into Amplify env vars at deploy time.  
Local: set in `apps/admin/.env.local` (gitignored).

## Clerk Dashboard

Login at https://dashboard.clerk.com with the `TheBurgMusic@gmail.com` account.  
Application: `stpetemusic-admin`
