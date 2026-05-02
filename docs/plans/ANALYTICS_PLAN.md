# Analytics & Tracking Plan — StPeteMusic

## Goal
Add visitor tracking, click maps, traffic source attribution, and a foundation for future Google Ads — with minimal ongoing code changes.

## Chosen Stack

| Tool | Purpose | Cost |
|---|---|---|
| **Google Tag Manager (GTM)** | Single script container — manage all tags from a web UI, no future code deploys | Free |
| **Google Analytics 4 (GA4)** | Page views, sessions, traffic sources, user journeys | Free |
| **Microsoft Clarity** | Heatmaps, session recordings, click maps | Free |

**Why GTM as the container:** GA4, Clarity, and future ad pixels (Google Ads, Facebook) are all added _inside_ GTM from its web dashboard — no more layout.tsx changes once GTM is wired in. GTM also natively supports Microsoft Clarity as a Community Template tag.

---

## Step 1 — Account Setup (Do this first)

### Google Tag Manager
1. Go to https://tagmanager.google.com → **Create Account**
2. Account Name: `StPeteMusic` · Container Name: `stpetemusic.live` · Target platform: **Web**
3. Copy your **GTM ID** (format: `GTM-XXXXXXX`)

### Google Analytics 4
1. Go to https://analytics.google.com → **Admin → Create Property**
2. Property name: `StPeteMusic` · Timezone: `US/Eastern` · Currency: `USD`
3. Data stream → Web → URL: `https://www.stpetemusic.live`
4. Copy your **Measurement ID** (format: `G-XXXXXXXXXX`)
5. In GTM: Tags → New → **Google Analytics: GA4 Configuration** → paste Measurement ID → Trigger: **All Pages** → Save → Publish

### Microsoft Clarity
1. Go to https://clarity.microsoft.com → **Add new project**
2. Name: `StPeteMusic` · Website: `https://www.stpetemusic.live`
3. Copy your **Project ID** (6-char alphanumeric like `abc123`)
4. In GTM: Tags → New → **Community Templates** → search "Microsoft Clarity" → install → paste Project ID → Trigger: **All Pages** → Save → Publish

At this point GTM handles both GA4 and Clarity — **no second script tag needed in your code**.

---

## Step 2 — Code Changes

### Install the package
```bash
cd apps/web
npm install @next/third-parties
```

### Modify `apps/web/src/app/layout.tsx`

Add two imports and one component — that's it:

```tsx
import { GoogleTagManager } from '@next/third-parties/google';

// Inside RootLayout, inside <html>:
export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      {process.env.NEXT_PUBLIC_GTM_ID && (
        <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID} />
      )}
      <body ...>
        {children}
      </body>
    </html>
  );
}
```

`GoogleTagManager` from `@next/third-parties` automatically renders both the `<script>` tag in `<head>` and the `<noscript>` iframe fallback in `<body>`.

### Environment variable

Add to `apps/web/.env.local`:
```
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
```

### Add to Amplify (critical — build-time, not runtime)

`NEXT_PUBLIC_*` variables are **inlined at build time** by Next.js. They must be present when Amplify runs the build, not just at runtime.

In Amplify Console → App → Environment variables:
- Add `NEXT_PUBLIC_GTM_ID` = `GTM-XXXXXXX`
- Set it for the **main** and **develop** branches (or all branches)
- **Trigger a new build** after adding — existing builds won't pick it up

Also add `NEXT_PUBLIC_GTM_ID` to GitHub Secrets if it's referenced in a CI build workflow.

---

## Step 3 — GTM Tag Configuration

All of this is done in the GTM web dashboard — no code changes:

### Required tags
1. **GA4 Configuration** — fires All Pages (set up in Step 1)
2. **Clarity** — fires All Pages (set up in Step 1)
3. **GA4 Event: Newsletter Signup** — trigger on custom event `newsletter_signup`

### For future Google Ads (when ready)
4. **Google Ads Conversion Linker** — fires All Pages — required for cross-domain attribution
5. **Google Ads Conversion Tracking** — fires on specific conversion events

### Custom event from the newsletter form

Push to dataLayer in the subscribe form's success handler (in the component that calls `/api/newsletter/subscribe`):

```ts
// After successful subscribe API call:
window.dataLayer?.push({ event: 'newsletter_signup' });
```

Add a TypeScript declaration in `apps/web/src/types/global.d.ts` (or a new file) to avoid type errors:
```ts
interface Window {
  dataLayer: Record<string, unknown>[];
}
```

---

## Step 4 — Verify It's Working

1. Install [Google Tag Assistant](https://tagassistant.google.com) Chrome extension
2. Visit https://www.stpetemusic.live → Tag Assistant should confirm GTM is firing
3. GA4 → **Realtime** report → visit the site in another tab — your session should appear within seconds
4. Clarity → wait ~24 hours → heatmaps and session recordings will appear
5. DevTools Network tab → filter by `googletagmanager.com` and `clarity.ms` to confirm requests fire

---

## Future: Google Ads

1. Create a Google Ads account
2. Link Google Ads to GA4 (1-click in GA4 Admin → Google Ads Links)
3. In GTM: add **Google Ads Conversion Linker** (All Pages) + conversion tags for specific actions
4. Import GA4 audiences directly into Google Ads for remarketing

No additional code changes to the app needed.

---

## Files Touched

| File | Change |
|---|---|
| `apps/web/package.json` | Add `@next/third-parties` dependency |
| `apps/web/src/app/layout.tsx` | Add `<GoogleTagManager>` component |
| `apps/web/.env.local` | Add `NEXT_PUBLIC_GTM_ID` |
| `apps/web/src/types/global.d.ts` | Add `window.dataLayer` type (optional but clean) |
| Amplify Console | Add `NEXT_PUBLIC_GTM_ID` env var + trigger rebuild |
