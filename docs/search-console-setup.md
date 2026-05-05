# Google Search Console + Bing Webmaster Setup

Verify `stpetemusic.live`, submit sitemaps, link GA4, and import to Bing.
Do this on launch day or immediately after.

**Google account:** `theburgmusic@gmail.com`  
**Site:** `https://www.stpetemusic.live`  
**GA4 Property:** `535560580` (StPeteMusic)

---

## Step 1 — Add Domain property in Search Console

1. Go to: `search.google.com/search-console` → log in as `theburgmusic@gmail.com`
2. Click **+ Add property** (top left dropdown)
3. Choose **Domain** (not URL prefix) — enter: `stpetemusic.live`
   - Domain method verifies all subdomains and protocols at once
4. Google shows a TXT record to add. It looks like:
   ```
   google-site-verification=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```
   **Copy the full value.**

---

## Step 2 — Add TXT record to Cloudflare via Tofu

Add the record to `infrastructure/cloudflare.tf`:

```hcl
resource "cloudflare_record" "gsc_verification" {
  zone_id = var.cloudflare_zone_id
  name    = "@"
  type    = "TXT"
  value   = "google-site-verification=PASTE_VALUE_HERE"
  proxied = false
}
```

Then apply:

```bash
cd infrastructure
export AWS_PROFILE=personal
export TF_VAR_cloudflare_api_token="$(grep CLOUDFLARE_API_TOKEN apps/admin/.env.local | cut -d= -f2)"
export TF_VAR_cloudflare_zone_id="$(grep CLOUDFLARE_ZONE_ID apps/admin/.env.local | cut -d= -f2)"
export TF_VAR_google_org_id="982527051911"
export TF_VAR_google_project_id="project-bb73c742-70e6-4419-a66"

tofu plan  -target=cloudflare_record.gsc_verification
tofu apply -target=cloudflare_record.gsc_verification
```

> **Alternative (faster):** Add the TXT record directly in the Cloudflare dashboard at
> `dash.cloudflare.com → stpetemusic.live → DNS → Add record`
> Type: TXT, Name: @, Content: (paste verification value), Proxy: DNS only (grey cloud)

---

## Step 3 — Verify in Search Console

1. Back in Search Console → click **Verify**
2. DNS propagation is usually instant through Cloudflare but can take up to 5 minutes
3. On success: `"Ownership verified"` — you'll see the property dashboard

---

## Step 4 — Submit sitemap

1. In Search Console: left sidebar → **Sitemaps**
2. Enter: `sitemap.xml`
3. Click **Submit**

Confirm Next.js is generating the sitemap:

```bash
curl -s https://www.stpetemusic.live/sitemap.xml | head -20
```

Should return valid XML with URLs for `/`, `/events`, `/discover`, `/venues`, etc.

If the sitemap returns 404, check `apps/web/app/sitemap.ts` (or add one — see below).

<details>
<summary>Add sitemap.ts if missing</summary>

Create `apps/web/src/app/sitemap.ts`:

```ts
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://www.stpetemusic.live';
  return [
    { url: base, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/events`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/discover`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/venues`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
  ];
}
```

</details>

---

## Step 5 — Request indexing for key pages

In Search Console → URL Inspection:

1. Paste `https://www.stpetemusic.live` → **Request indexing**
2. Paste `https://www.stpetemusic.live/events` → **Request indexing**
3. Paste `https://www.stpetemusic.live/discover` → **Request indexing**
4. Paste `https://www.stpetemusic.live/venues` → **Request indexing**

(Rate limit: ~10 requests/day — do the 4 most important ones)

---

## Step 6 — Link GA4 to Search Console

1. In Search Console: **Settings** (gear icon, bottom left) → **Associations**
2. Click **Associate** → choose **Google Analytics**
3. Select property: `StPeteMusic` (`535560580`)
4. Confirm

This unlocks the "Queries" report in GA4 showing which search terms drive traffic.

---

## Step 7 — Bing Webmaster Tools (2 minutes)

1. Go to: `bing.com/webmasters`
2. Click **Import from Google Search Console**
3. Sign in with Google (`theburgmusic@gmail.com`) → grant access
4. Select `stpetemusic.live` → **Import**
5. Done — Bing auto-imports your sitemap too

---

## Ongoing: Core Web Vitals in Search Console

After ~4 weeks of traffic, Search Console will show field data for:
- **Core Web Vitals** (LCP, FID/INP, CLS) — real user measurements
- **Mobile Usability** — any mobile-specific issues

Check monthly: Search Console → **Experience** → Core Web Vitals

---

## Quick verification checklist

```bash
# Sitemap accessible
curl -s https://www.stpetemusic.live/sitemap.xml | grep '<url>' | wc -l

# TXT record propagated
dig TXT stpetemusic.live | grep "google-site-verification"

# robots.txt allows crawling
curl -s https://www.stpetemusic.live/robots.txt
```
