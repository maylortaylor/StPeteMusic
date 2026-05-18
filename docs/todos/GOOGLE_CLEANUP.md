# Google Services Cleanup Checklist

Post-launch housekeeping for all Google accounts and GCP projects.
Items are grouped by urgency — do **Before Launch** first.

---

## Before Launch

### 1. Add GA4_PROPERTY_ID to env files

`ga4:setup` confirmed the property:
- **Measurement ID:** `G-RZJP9NFXX4`
- **Property ID:** `535560580`

```bash
# apps/web/.env.local — add this line
GA4_PROPERTY_ID=535560580
```

Also add the placeholder to `apps/web/.env.local.example`:
```
# Google Analytics 4
GA4_PROPERTY_ID=your_ga4_property_id_here   # get from: npm run ga4:setup
```

### 2. Run ga4:conversions

Marks the key business events as GA4 conversions:

```bash
npm run ga4:conversions --workspace=apps/web
```

Expected: `newsletter_signup`, `contact_form_submit`, `ticket_link_click`, `cta_click`, `event_click` all toggled on.

### 3. Verify GTM is firing in production

After the next deploy, open the site in Chrome and use GTM Preview mode
(`tagmanager.google.com → GTM-WW7MSP3L → Preview`) to confirm:
- GA4 config tag fires on page load
- `newsletter_signup` fires when you subscribe
- `cta_click` fires when you click Tune In / Get Tickets

Then check GA4 Realtime: `analytics.google.com → Reports → Realtime`  
Confirm `page_view` appears within 30 seconds.

---

## Launch Day

### 4. Google Search Console

1. Go to `search.google.com/search-console` (TheBurgMusic@gmail.com)
2. Add property → **Domain** method → enter `stpetemusic.live`
3. Copy the TXT verification record value
4. Add to `infrastructure/cloudflare.tf`:
   ```hcl
   resource "cloudflare_record" "gsc_verification" {
     zone_id = var.cloudflare_zone_id
     name    = "@"
     type    = "TXT"
     value   = "google-site-verification=PASTE_VALUE_HERE"
     proxied = false
   }
   ```
5. `tofu apply` to push the DNS record
6. Back in Search Console → Verify
7. Sitemaps → submit `https://www.stpetemusic.live/sitemap.xml`
8. Request indexing manually for: `/`, `/events`, `/discover`, `/venues`
9. Admin → Google Analytics → Link to property `535560580` (StPeteMusic)

### 5. Bing Webmaster Tools

1. `bing.com/webmasters` → Import from Google Search Console
2. Done — takes 2 minutes, covers ~8% of search traffic

---

## GCP Migration (not blocking launch — do within 2 weeks)

### Current state
| Project | Location | Status |
|---------|----------|--------|
| `project-bb73c742-70e6-4419-a66` | No org | Main (Maps API) |
| `stpetemusic-analytics` | No org | GA4 + GTM APIs |
| `stpetemusic-youtube-n8n` | No org | OLD — replace with spm-n8n-workflows |
| `spm-gcalendar-website` | No org | OLD — replace with spm-n8n-workflows |
| `spm-n8n-workflows` | No org (to create) | NEW consolidated n8n project |

### Target state (all under `theburgmusic-org` / ID `982527051911`)
- `project-bb73c742-70e6-4419-a66` — Maps API
- `stpetemusic-analytics` — GA4 Data API, GA4 Admin API, Tag Manager API
- `spm-n8n-workflows` — YouTube, Calendar, Sheets

### Steps

#### Step A: Move existing projects into the org

Google doesn't let you "move" projects via API — you must do this in the GCP Console:

1. `console.cloud.google.com` → select `project-bb73c742-70e6-4419-a66`
2. IAM & Admin → Settings → Move → select `theburgmusic-org`
3. Repeat for `stpetemusic-analytics`

#### Step B: Import into Terraform

```bash
cd infrastructure

# Auth
gcloud auth application-default login

# Export org ID
export TF_VAR_google_org_id="982527051911"
export TF_VAR_google_project_id="project-bb73c742-70e6-4419-a66"

# Import existing projects so Terraform doesn't try to recreate them
tofu import 'google_project.stpetemusic[0]'  project-bb73c742-70e6-4419-a66
tofu import 'google_project.analytics[0]'    stpetemusic-analytics

# Plan — should show only the new spm-n8n-workflows project as an add
tofu plan

# Apply — creates spm-n8n-workflows + enables all APIs
tofu apply
```

#### Step C: n8n OAuth migration (do this before deleting old projects)

1. GCP Console → `spm-n8n-workflows` → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID (Web application)
   - Redirect URI: `https://n8n.stpetemusic.live/rest/oauth2-credential/callback`
3. Download the JSON → update GitHub Secrets: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
4. In n8n (`n8n.stpetemusic.live`):
   - Re-authorize: YouTube, Google Calendar, Google Sheets credentials
   - Use the new OAuth client from `spm-n8n-workflows`
5. Test: trigger a workflow that uses each service — confirm it runs without error

#### Step D: Decommission old projects (only after Step C is verified)

```bash
# Remove billing first (prevents accidental charges during deletion window)
# GCP Console → Billing → select each project → Disable billing

# Then delete (30-day hold before permanent removal)
gcloud projects delete stpetemusic-youtube-n8n
gcloud projects delete spm-gcalendar-website
```

---

## Ongoing Monitoring

| Tool | URL | What to check |
|------|-----|---------------|
| GA4 Realtime | analytics.google.com | Active users, events firing |
| GTM Preview | tagmanager.google.com | Tag firing before any GTM changes |
| Search Console | search.google.com/search-console | Indexing coverage, Core Web Vitals |
| GCP Billing | console.cloud.google.com/billing | Stay under free tier |

### GA4 free tier limits
- 10M events/month per property
- Data retention: 2 months by default → extend to 14 months in Admin → Data Retention

### GTM housekeeping
- Run `npm run gtm:backup --workspace=apps/web` before any GTM changes
- Use `npm run gtm:apply` to push config changes from `apps/data/gtm-config.json`
- Never edit tags directly in the GTM UI — edit `gtm-config.json` and apply

---

*Generated 2026-05-05 — post-commit 02fc875*
