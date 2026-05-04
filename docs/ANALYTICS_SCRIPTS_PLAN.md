# Analytics Scripts — Action Plan

> **Status:** Planned — not yet implemented
> **Owner:** Matt Taylor
> **Prereqs:** GA4 property `G-RZJP9NFXX4` live with data, `GOOGLE_ANALYTICS_SA_JSON` env var set (service account with Viewer role on GA4 + Search Console)

All scripts live in `apps/web/scripts/` and follow the same pattern as the existing `ga4-export.mjs`:
- Load env via `dotenv` from `.env.local` then root `.env`
- Auth via `loadSACredentials()` from `google-auth.mjs`
- Output CSV or Markdown to `data/` at repo root
- Run with `node apps/web/scripts/<script>.mjs`

Add each to `apps/web/package.json` under `scripts:`:
```json
"ga4:weekly":   "node scripts/ga4-weekly-report.mjs",
"ga4:artists":  "node scripts/ga4-artist-performance.mjs",
"ga4:funnel":   "node scripts/ga4-funnel.mjs",
"ga4:sources":  "node scripts/ga4-acquisition.mjs",
"gsc:queries":  "node scripts/search-console-queries.mjs"
```

---

## Scripts to Build

### 1. `ga4-weekly-report.mjs`
**Purpose:** Weekly stakeholder summary (Matt + Austen). Run every Monday.

**Dimensions:** `date`, `pagePath`, `sessionDefaultChannelGroup`
**Metrics:** `sessions`, `activeUsers`, `screenPageViews`, `bounceRate`, `averageSessionDuration`
**Date range:** last 7 days vs. prior 7 days (week-over-week delta)
**Output:** `data/weekly-YYYY-MM-DD.md` — Markdown table with ↑↓ arrows for changes

**Key sections:**
- Total sessions / users / pageviews (WoW delta)
- Top 5 pages by views
- Top traffic source
- Newsletter signups this week (filter `eventName == newsletter_signup`)

---

### 2. `ga4-artist-performance.mjs`
**Purpose:** Which artists are getting views and driving engagement. Run monthly.

**Dimensions:** `pagePath`, `eventName`
**Metrics:** `screenPageViews`, `eventCount`
**Filter:** `pagePath` starts with `/discover/`
**Output:** `data/artist-performance-YYYY-MM-DD.csv`

**Columns:** `artist_slug`, `page_views`, `artist_click_events`, `social_click_events`, `ticket_click_events`

Join page view data with event data by parsing slug from `pagePath`. Shows which artists generate discovery vs. action.

---

### 3. `ga4-funnel.mjs`
**Purpose:** Measure the visitor → engaged → converted funnel.

**Funnel steps:**
1. Homepage visit (`pagePath == /`)
2. Artist or event page visit (`pagePath` starts with `/discover/` or `/events`)
3. Conversion event (`ticket_link_click` OR `newsletter_signup` OR `contact_form_submit`)

**Output:** `data/funnel-YYYY-MM-DD.csv` + console summary with drop-off rates.

Uses `runFunnelReport` from `BetaAnalyticsDataClient` if available, otherwise approximates with separate queries.

---

### 4. `ga4-acquisition.mjs`
**Purpose:** Where is traffic coming from? Answers "is Instagram driving visits?"

**Dimensions:** `sessionDefaultChannelGroup`, `sessionSource`, `sessionMedium`
**Metrics:** `sessions`, `activeUsers`, `conversions`
**Date range:** last 30 days
**Output:** `data/acquisition-YYYY-MM-DD.csv`

**Channel groups to look for:** Organic Search, Direct, Organic Social (Instagram/Facebook), Referral, Email.

---

### 5. `search-console-queries.mjs`
**Purpose:** What search queries bring people to the site? Feeds SEO decisions.

**API:** Google Search Console API (`googleapis` package, `searchconsole.v1`)
**Auth:** Same service account — must have Search Console property access granted.
**Endpoint:** `searchanalytics.query`
**Dimensions:** `query`, `page`
**Date range:** last 28 days
**Output:** `data/gsc-queries-YYYY-MM-DD.csv`

**Columns:** `query`, `page`, `clicks`, `impressions`, `ctr`, `position`
**Sort by:** `clicks` descending

**Setup note:** Service account email must be added as a User in Search Console:
> Search Console → Settings → Users and permissions → Add user → `[sa-email]@[project].iam.gserviceaccount.com`

---

## Env vars needed

Add to `apps/web/.env.local` (gitignored):
```bash
GA4_PROPERTY_ID=535560580
GA4_MEASUREMENT_ID=G-RZJP9NFXX4
GOOGLE_ANALYTICS_SA_JSON=<full JSON string from service account key file>
GSC_SITE_URL=https://www.stpetemusic.live
```

Or use file path approach:
```bash
GOOGLE_APPLICATION_CREDENTIALS=./scripts/sa-key.json
```
