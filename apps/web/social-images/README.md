# Social / OG Share Images

This folder is the **single source of truth** for all Open Graph (OG) share images — the preview image shown when a link to stpetemusic.live is shared on Facebook, Twitter/X, Discord, iMessage, etc.

## Image Specs

| Property | Value |
|---|---|
| Format | **PNG** |
| Dimensions | **1200 × 630 px** (standard OG ratio 1.91:1) |
| Max file size | ~1 MB (keep under 500 KB if possible) |
| Color space | sRGB |
| Transparency | Not supported by most platforms — use a solid background |

> **Facebook crops to roughly 1200×628** in the feed preview. Keep important content away from the very top/bottom edges.

## File Naming

Files must follow the pattern `{page}-header.png` — the `-header` suffix is stripped to derive the config key.

| File | Page | Config key |
|---|---|---|
| `homepage-header.png` | `stpetemusic.live` (root / Facebook share image) | `homepage` |
| `about-header.png` | `/about` | `about` |
| `events-header.png` | `/events` | `events` |
| `discover-header.png` | `/discover` | `discover` |
| `live-header.png` | `/live` | `live` |
| `venues-header.png` | `/venues` | `venues` |
| `tickets-header.png` | `/tickets` | `tickets` |

Do **not** put hashes in the filenames — the GitHub Action computes and appends a content hash automatically.

## How to Update an Image

1. Create your new PNG at 1200×630 px
2. Drop it in this folder with the same filename (e.g. `homepage-header.png`)
3. Open a PR, get it reviewed, and merge to `main`
4. The **Sync Social Images to CDN** GitHub Action runs automatically and:
   - Computes a SHA-256 content hash of each changed image
   - Uploads to S3 as `s3://stpetemusic-assets/social/{name}-{hash8}.png`
   - Serves via `https://cdn.stpetemusic.live/social/{name}-{hash8}.png`
   - Updates `apps/web/src/config/social-images.ts` with the new CDN URLs
   - Commits the manifest update back to `main` (triggers a second Amplify build)
   - Creates a CloudFront cache invalidation
   - Triggers a Facebook Graph API re-scrape for all 7 pages

Because the content hash changes when the image changes, all social platforms (Facebook, Twitter/X, Discord, Slack) treat it as a brand-new URL and fetch the fresh image. **No manual cache-busting required.**

## Cache Timing

| Platform | Expected update time |
|---|---|
| CloudFront CDN | ~5 minutes (invalidation) |
| Facebook | ~5–30 minutes (Graph API scrape runs automatically) |
| Twitter/X | Up to 7 days (no public scrape API; manual: [Card Validator](https://cards-dev.twitter.com/validator)) |
| Discord/Slack | Near-instant on new paste (they re-fetch on share) |

## First-Time Setup (One-Time)

Before the Action can run, a GitHub Actions **variable** must be set:

1. After merging this PR, wait for `tofu-apply.yml` to finish
2. Run: `cd infrastructure && tofu output assets_cdn_distribution_id`
3. Go to **GitHub → repo Settings → Secrets and variables → Actions → Variables tab**
4. Add variable: `CDN_DISTRIBUTION_ID` = the value from step 2
5. Go to **Actions → "Sync Social Images to CDN" → Run workflow** to do the initial upload

After that one-time step, future image updates are fully automatic on merge.

## Where the URLs Live

`apps/web/src/config/social-images.ts` — **auto-generated, do not edit manually.** The Action rewrites this file on every run. All page metadata files import from here.
