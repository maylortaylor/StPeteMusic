# GCP Project Migration + n8n OAuth Re-auth

Move all GCP projects into `theburgmusic-org` and consolidate the two old n8n integration
projects (`stpetemusic-youtube-n8n`, `spm-gcalendar-website`) into the new unified
`spm-n8n-workflows` project.

**Org ID:** `982527051911` (theburgmusic-org)  
**gcloud account:** `theburgmusic@gmail.com`

---

## Current project state (as of 2026-05-05)

| Project ID | Status | Action |
|------------|--------|--------|
| `project-bb73c742-70e6-4419-a66` | ✅ In org, in tofu state | Done |
| `stpetemusic-analytics` | ✅ Moved to org, in tofu state | Done |
| `stpetemusic-youtube-n8n` | ✅ Deleted 2026-05-05 | Done |
| `spm-gcalendar-website` | ✅ Deleted 2026-05-05 | Done |
| `spm-n8n-workflows` | ✅ Created, APIs enabled | Done |

---

## ✅ Phases 1–3 complete (2026-05-05)
- Both existing projects imported into tofu state
- `spm-n8n-workflows` created with YouTube, Calendar, Sheets APIs enabled
- Fix the ADC quota project warning (one-time):
  ```bash
  gcloud auth application-default set-quota-project project-bb73c742-70e6-4419-a66
  ```

---

## Phase 1 — Pre-flight (run in terminal)

```bash
# Confirm gcloud auth
gcloud auth list
# Should show: theburgmusic@gmail.com as ACTIVE

# Install gcloud beta (one-time, interactive)
gcloud components install beta

# Set application default credentials for Terraform/tofu Google provider
gcloud auth application-default login
# Opens browser → log in as theburgmusic@gmail.com → approve

# Confirm AWS personal profile works (needed for tofu S3 backend)
aws sts get-caller-identity --profile personal
# Should return your account ID 767350869653
```

---

## Phase 2 — Move stpetemusic-analytics into the org

`project-bb73c742-70e6-4419-a66` is already in the org.
`stpetemusic-analytics` is not — move it now:

```bash
gcloud beta projects move stpetemusic-analytics --organization=982527051911
```

Expected output: `Updated project [stpetemusic-analytics].`

Verify:
```bash
gcloud projects describe stpetemusic-analytics --format="value(parent.id)"
# Should print: 982527051911
```

---

## Phase 3 — Tofu: import existing projects + create spm-n8n-workflows

> **⚠️ AWS credential conflict:** Your shell has PSD credential env vars that override
> `AWS_PROFILE=personal`. Run tofu in a clean shell to avoid the `amver-hub/aws_token` error:
>
> ```bash
> # Option A — open a fresh Terminal tab (no .zshrc PSD sourcing), then:
> export AWS_PROFILE=personal
>
> # Option B — unset PSD overrides in the current shell:
> unset AWS_CREDENTIAL_PROCESS AWS_WEB_IDENTITY_TOKEN_FILE AWS_ROLE_ARN
> export AWS_PROFILE=personal
> ```

```bash
cd /Users/matt.taylor/Documents/_dev/maylortaylor/StPeteMusic/infrastructure

# Confirm personal profile works before proceeding
aws sts get-caller-identity --profile personal

# Load all required vars
export AWS_PROFILE=personal
export TF_VAR_google_org_id="982527051911"
export TF_VAR_google_project_id="project-bb73c742-70e6-4419-a66"
export TF_VAR_cloudflare_api_token="$(grep CLOUDFLARE_API_TOKEN ../apps/admin/.env.local | cut -d= -f2)"
export TF_VAR_cloudflare_zone_id="$(grep CLOUDFLARE_ZONE_ID ../apps/admin/.env.local | cut -d= -f2)"

# Init (pulls latest state from S3)
tofu init

# Import existing projects so tofu won't try to recreate them
tofu import 'google_project.stpetemusic[0]'  project-bb73c742-70e6-4419-a66
tofu import 'google_project.analytics[0]'    stpetemusic-analytics

# Plan — should show only spm-n8n-workflows and its API enables as new resources
tofu plan -target=google_project.n8n_workflows \
          -target=google_project_service.youtube \
          -target=google_project_service.calendar \
          -target=google_project_service.sheets

# Apply those targets
tofu apply -target=google_project.n8n_workflows \
           -target=google_project_service.youtube \
           -target=google_project_service.calendar \
           -target=google_project_service.sheets
```

Expected: `Apply complete! Resources: 4 added, 0 changed, 0 destroyed.`

---

## Phase 4 — Create OAuth 2.0 client in GCP Console (manual)

This step cannot be done via CLI — the OAuth consent screen must be configured in the UI.

1. Go to: `console.cloud.google.com/apis/credentials?project=spm-n8n-workflows`
2. **Configure OAuth consent screen first** (if prompted):
   - User type: **External**
   - App name: `SPM n8n Workflows`
   - User support email: `theburgmusic@gmail.com`
   - Developer contact: `theburgmusic@gmail.com`
   - Scopes: add `youtube.upload`, `calendar.events`, `spreadsheets`
   - Test users: add `theburgmusic@gmail.com`
   - Save and continue
3. **Create credential → OAuth 2.0 Client ID:**
   - Application type: **Web application**
   - Name: `n8n OAuth Client`
   - Authorized redirect URI: `https://n8n.stpetemusic.live/rest/oauth2-credential/callback`
   - Click **Create**
4. **Download JSON** (or note the Client ID and Client Secret)
5. **Update GitHub Secrets** at `github.com/maylortaylor/StPeteMusic/settings/secrets/actions`:
   - `GOOGLE_CLIENT_ID` → paste Client ID
   - `GOOGLE_CLIENT_SECRET` → paste Client Secret

---

## Phase 5 — Re-authorize n8n credentials

1. Open `https://n8n.stpetemusic.live`
2. Go to: **Settings → Credentials**
3. For each of these credentials, open → edit → reconnect:

   | Credential | Type | Reconnect with |
   |-----------|------|----------------|
   | YouTube (StPeteMusic) | Google OAuth2 | spm-n8n-workflows client |
   | Google Calendar | Google OAuth2 | spm-n8n-workflows client |
   | Google Sheets | Google OAuth2 | spm-n8n-workflows client |

4. For each reconnect:
   - Click **Connect** (or **Reconnect**)
   - Select `theburgmusic@gmail.com`
   - Grant requested permissions
   - Save credential

---

## Phase 6 — Verify n8n workflows

Run these workflows manually once to confirm they work with the new credentials:

- **YouTube workflow** — post or check a draft
- **Google Calendar workflow** — fetch upcoming events
- **Google Sheets workflow** — read from a sheet

In n8n: open each workflow → **Execute workflow** → confirm green success nodes.

---

## Phase 7 — Decommission old projects

Only do this **after Phase 6 is verified**.

```bash
# Remove billing first (GCP Console — cannot be done via CLI)
# console.cloud.google.com/billing → top-left dropdown → switch to each old project
# Billing → Disable billing on this project

# Then request deletion (30-day hold before permanent removal)
gcloud projects delete stpetemusic-youtube-n8n
gcloud projects delete spm-gcalendar-website
```

Confirm:
```bash
gcloud projects list | grep -E "youtube-n8n|gcalendar"
# Should show both with lifecycleState: DELETE_REQUESTED
```

---

## Quick status check at any time

```bash
gcloud projects list --format="table(projectId,name,parent.type,parent.id,lifecycleState)"
```
