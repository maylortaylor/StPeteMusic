# Analytics & Tracking Plan — StPeteMusic

## Goal
Add visitor tracking, click maps, traffic source attribution, and a foundation for future Google Ads — with minimal ongoing code changes.

## Chosen Stack

| Tool | Purpose | Cost |
|---|---|---|
| **Google Tag Manager (GTM)** | Single script container — manage all tags from a web UI, no future code deploys | Free |
| **Google Analytics 4 (GA4)** | Page views, sessions, traffic sources, user journeys | Free |

**Why GTM as the container:** GA4 and future ad pixels (Google Ads, Facebook) are all added _inside_ GTM from its web dashboard — no more layout.tsx changes once GTM is wired in.

---

## Step 1 — Account Setup ✅ COMPLETE

### Google Tag Manager ✅
- Account: `StPeteMusic` · Container: `stpetemusic.live`
- GTM ID: `GTM-WW7MSP3L`

### Google Analytics 4 ✅
- Measurement ID: `G-RZJP9NFXX4`
- **TODO (GTM dashboard):** Tags → New → **Google Analytics: GA4 Configuration** → paste `G-RZJP9NFXX4` → Trigger: **All Pages** → Save → Publish

### Microsoft Clarity
- Skipped — not needed.

---

## Step 2 — Code Changes ✅ COMPLETE

### Installed
```bash
cd apps/web
npm install @next/third-parties
```

### `apps/web/src/app/layout.tsx` ✅
- Added `<GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID} />` inside `<html>`, before `<body>`
- Renders both the `<head>` script and `<body>` noscript iframe automatically

### `apps/web/src/types/global.d.ts` ✅
- Added `window.dataLayer` type declaration

### Environment variable ✅
- `NEXT_PUBLIC_GTM_ID=GTM-WW7MSP3L` added to Amplify Console (main + develop branches)
- **Trigger a new build** in Amplify if not already done — `NEXT_PUBLIC_*` vars are inlined at build time

---

## Step 3 — GTM Tag Configuration

All done in the GTM web dashboard — no code changes required.

### Required tags

#### 1. GA4 Configuration — fires All Pages ✅ COMPLETE
1. GTM Dashboard → Tags → New
2. Tag Type: **Google Analytics: GA4 Configuration**
3. Measurement ID: `G-RZJP9NFXX4`
4. Trigger: **All Pages**
5. Save → Publish

#### 2. GA4 Event: Newsletter Signup ✅ (code side done — GTM side pending)
The component already pushes `{ event: 'newsletter_signup' }` to `window.dataLayer` on successful subscribe.

**Wire it up in GTM:**

**Step A — Create the Trigger:**
1. GTM Dashboard → Triggers → New
2. Name: `newsletter_signup`
3. Trigger type: **Custom Event**
4. Event name: `newsletter_signup`
5. Save

**Step B — Create the Tag:**
1. GTM Dashboard → Tags → New
2. Name: `GA4 Event - Newsletter Signup`
3. Tag type: **Google Analytics: GA4 Event**
4. **Configuration Tag:** select `GA4 Configuration - All Pages` (the tag from step 1 above — do NOT enter a Measurement ID here, it is inherited from that tag)
5. Event name: `newsletter_signup`
6. Trigger: `newsletter_signup` (the trigger from Step A)
7. Save → **Publish**

#### 3. Future: Google Ads (when ready)
- **Google Ads Conversion Linker** — All Pages (required for cross-domain attribution)
- **Google Ads Conversion Tracking** — fires on specific conversion events

---

## Step 4 — Verify It's Working

1. Install [Google Tag Assistant](https://tagassistant.google.com) Chrome extension
2. Visit https://www.stpetemusic.live → Tag Assistant should confirm GTM is firing
3. GA4 → **Realtime** report → visit the site in another tab — your session should appear within seconds
4. To test the newsletter event: submit the newsletter form, then check GA4 Realtime → Events for `newsletter_signup`
5. DevTools Network tab → filter by `googletagmanager.com` to confirm requests fire

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
| `apps/web/package.json` | Added `@next/third-parties` |
| `apps/web/src/app/layout.tsx` | Added `<GoogleTagManager>` component |
| `apps/web/src/components/NewsletterSignup.tsx` | Added `window.dataLayer.push` on successful subscribe |
| `apps/web/src/types/global.d.ts` | Added `window.dataLayer` type |
| Amplify Console | Added `NEXT_PUBLIC_GTM_ID=GTM-WW7MSP3L` env var |
