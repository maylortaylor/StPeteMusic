# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Purpose

This workspace contains small apps and a knowledge database (markdown files, CSVs) for **@StPeteMusic** — a community organization showcasing bands in the greater St. Petersburg, FL and Tampa Bay area.

## Brand Context

### Primary Brands
- **@StPeteMusic** — Music promoter brand for booking, marketing, and managing live shows
- **Suite E Studios** — Partner venue/community space in the Historic Warehouse Arts District, St. Pete FL (~1700 sqft warehouse)
- **Tangent LLC** — Parent company (use only in legal/formal contexts)

### Key Links
| Platform | URL |
|----------|-----|
| Main Website | https://linktr.ee/stpetemusic |
| Instagram | https://www.instagram.com/StPeteMusic |
| Facebook | https://www.facebook.com/StPeteFLMusic |
| YouTube | https://youtube.com/@StPeteMusic |
| EventBrite (general) | https://www.eventbrite.com/o/st-pete-music-105663485881 |
| EventBrite (#FinalFriday) | https://final-friday.eventbrite.com/ |
| Suite E Studios | https://linktr.ee/suite_e_studios |

## Anchor Events

### Final Friday (Monthly)
- Last Friday of each month
- Doors: 7pm | Band 1: 8-9pm | Band 2: 9-10:20pm | Band 3: 10:45pm-midnight
- Hashtags: #FinalFriday #StPeteMusic
- Always tag performing bands by Instagram handle

### Instant Noodles (Monthly)
- Last Wednesday of each month
- Doors: 6pm | Community jam: 7-10pm
- Community jam session (not open mic) — building the band from the ground up
- Hashtags: #InstantNoodles #FinalWednesday #StPeteMusic

### Second Saturday Art Walk
- Warehouse Arts District community activation
- Focus on artists and in-studio activities

## Content Guidelines

### Tone
- Enthusiastic, authentic, community-oriented, welcoming
- Slightly informal but professional
- Passionate about arts, culture, and music

### Keywords to Use
Community, arts, culture, music, local, St. Pete, St Pete Music, Warehouse Arts District, vibrant, unique, connect, experience, discover, live music, collaboration, creativity

### Event Promotion Format
Always include:
1. Who / What / When / Why It Matters
2. Clear CTAs
3. Date, time, cost, what to expect
4. Cross-branding tags: @suite.e.studios @stpetemusic #StPeteMusic
5. Tag all performing artists/bands

## Team Reference
- **Owners (Suite E):** Matt Taylor & Austen Van Der Bleek
- **Support:** Rob Morey & Alex MacDonald
- **@StPeteMusic:** Managed by Matt Taylor

## Infrastructure

### Web App (apps/web)

| Item | Value |
|---|---|
| **Hosting** | AWS Amplify (SSR mode — `WEB_COMPUTE`, required for API routes) |
| **Build spec** | `amplify.yml` at repo root |
| **Production URL** | https://www.stpetemusic.live |
| **Amplify default (prod)** | https://main.d1fjwgk99cbqor.amplifyapp.com |
| **Staging URL** | https://develop.d1fjwgk99cbqor.amplifyapp.com |
| **Amplify app ID** | `d1fjwgk99cbqor` (also set as `AMPLIFY_APP_ID` GitHub Secret) |
| **Secrets in Amplify console** | `LISTMONK_USERNAME`, `LISTMONK_PASSWORD`, `LISTMONK_API_URL` (managed by Terraform via SSM) |

> ⚠️ **Listmonk credential sync:** Amplify's `LISTMONK_USERNAME`/`LISTMONK_PASSWORD` must match the SSM values at `/stpetemusic/listmonk/username` and `/stpetemusic/listmonk/password`. If they drift, the subscribe API returns 403 and the website gets 500 errors.
>
> **Important:** Listmonk API auth uses a **dedicated API user**, NOT the admin login. The API user (`stpetemusic-newsletter-api`) is created in the Listmonk admin UI under Settings → API credentials. The admin login password and API key are different.
>
> To diagnose: hit `https://www.stpetemusic.live/api/newsletter/health` — it shows the exact status and username Listmonk receives.
> To fix: update SSM params directly (`aws ssm put-parameter --name /stpetemusic/listmonk/username --value "stpetemusic-newsletter-api" ...` and same for password), then run `aws amplify update-app --app-id d1fjwgk99cbqor --environment-variables "..."` and trigger a rebuild.
> `LISTMONK_API_URL` must be set to `https://listmonk.stpetemusic.live` — default is `http://localhost:9000` which fails on Amplify with 503.
> `LISTMONK_LIST_ID=3` — "St Pete Music Newsletter" list. Verify via `curl -u stpetemusic-newsletter-api:<key> https://listmonk.stpetemusic.live/api/lists` if subscribe still fails.

### DNS (Cloudflare)

Route 53 hosted zone deleted — Cloudflare is the sole DNS provider.
CloudFront distribution: `d35nc2e8nr92q9.cloudfront.net`

All 3 records must be **DNS only (grey cloud — NOT proxied)**:

| Type | Name | Target |
|---|---|---|
| CNAME | `_ddf1b33c5eab2d60eddc95848a12d240` | `_bf19e363018afabe1b2e49737993dac9.jkddzztszm.acm-validations.aws.` |
| CNAME | `www` | `d35nc2e8nr92q9.cloudfront.net` |
| CNAME | `@` (apex) | `d35nc2e8nr92q9.cloudfront.net` |

> ⚠️ Cloudflare proxy (orange cloud) must stay OFF — Amplify ACM SSL requires direct DNS resolution.

### Branch Workflow

| Branch | Purpose | Auto-deploy |
|---|---|---|
| `main` | Production | Amplify (PRODUCTION environment) |
| `develop` | Staging / integration | Amplify (DEVELOPMENT environment, PR previews enabled) |
| `feature/*` | Feature work | No auto-deploy |

**Working on a feature:**
1. `git checkout -b feature/my-thing develop`
2. Open PR → `develop` → `web-ci.yml` runs (lint, typecheck, test)
3. Merge → Amplify auto-builds staging at `https://develop.<id>.amplifyapp.com`
4. Open PR → `main` → same CI gates
5. Merge → Amplify auto-builds production

**Rule: Never push directly to main.** Branch protection requires CI + 1 PR review.

### Production n8n
- **URL:** https://n8n.stpetemusic.live
- **Server:** AWS EC2 t3.micro (`us-east-1`, free tier)
- **SSH:** `ssh -i ~/.ssh/stpetemusic-n8n.pem ec2-user@n8n.stpetemusic.live`
- **Quick reference:** `AWS_SETUP.md`
- **Full deployment guide:** `docs/AWS_DEPLOYMENT.md`
- **IaC:** OpenTofu — see `infrastructure/` (active, state in S3 `stpetemusic-terraform-state`)

### OpenTofu
- **State bucket:** `stpetemusic-terraform-state` (S3, `us-east-1`, versioned + encrypted)
- **Lock table:** `stpetemusic-terraform-locks` (DynamoDB, pay-per-request)
- **CI:** `tofu plan` on every PR touching `infrastructure/`; `tofu apply` on merge to main
- **Rule:** Never edit AWS resources manually — always change `.tf` files and let CI apply
- **Local commands:** `cd infrastructure && AWS_PROFILE=personal tofu plan` / `tofu apply`
- **Managed resources:** Security Group `sg-03a69e68cf7077cf3`, EC2 `i-03874197d725b0455`, EIP `eipalloc-0a2ebbeef75ce8009`
- **Pending (commented out):** RDS PostgreSQL (`database.tf`), S3 backup bucket (`backup.tf`)

### Tailscale (Mac ↔ EC2 VPN)
- Encrypted tunnel so n8n on EC2 can reach Obsidian running on your Mac
- Mac Tailscale IP: run `tailscale ip -4` on your Mac to find it (do not hardcode in docs)
- All Obsidian workflow nodes use `{{ $env.OBSIDIAN_HOST }}` — set to `http://<TAILSCALE_IP>:27123` in server `.env`
- If Obsidian nodes fail: verify Tailscale is active on Mac and Obsidian Local REST API plugin is running

### AI Configuration
- **Default AI:** Anthropic Claude (`CLAUDE_API_KEY_N8N_STPETEMUSIC`)
- **Backup AI:** Google Gemini (`N8N_GEMINI_API_KEY`)
- Always use Claude as default in new workflow AI nodes

### OAuth Redirect URI (for all platforms)
```
https://n8n.stpetemusic.live/rest/oauth2-credential/callback
```

### Secrets Management

**GitHub Secrets are the single source of truth for all sensitive values.**

Manage them at: `https://github.com/maylortaylor/StPeteMusic/settings/secrets/actions`

**Do NOT:**
- Edit `~/stpetemusic/.env` on EC2 directly — it is **overwritten on every deploy**
- Commit any secrets to `.env` or any other file
- SSH to rotate a token — update the GitHub Secret instead and let deploy apply it

**How it works:**
```
GitHub Secrets → deploy.yml (on push to main) → writes ~/stpetemusic/.env → n8n restarts
```

**Required GitHub Secrets (all must be set for deploy to succeed):**

> The table below uses **GitHub Secret names** (what you set in repo settings).
> Some secrets are written to `.env` under a different variable name — noted in the Description column.

| GitHub Secret Name | Written to `.env` as | Description |
|--------------------|----------------------|-------------|
| `EC2_HOST` | — | SSH target (used by deploy only, not in `.env`) |
| `EC2_USER` | — | SSH user (used by deploy only, not in `.env`) |
| `EC2_SSH_KEY` | — | SSH private key (used by deploy only, not in `.env`) |
| `AWS_ACCESS_KEY_ID` | — | AWS credentials for Terraform only |
| `AWS_SECRET_ACCESS_KEY` | — | AWS credentials for Terraform only |
| `POSTGRES_USER` | `POSTGRES_USER` | PostgreSQL username |
| `POSTGRES_PASSWORD` | `POSTGRES_PASSWORD` | PostgreSQL password |
| `DB_ENCRYPTION_KEY` | `DB_ENCRYPTION_KEY` | pgcrypto column-level encryption key |
| `N8N_ENCRYPTION_KEY` | `N8N_ENCRYPTION_KEY` | n8n credential encryption key |
| `N8N_API_KEY` | `N8N_API_KEY` | n8n API key |
| `OBSIDIAN_HOST` | `OBSIDIAN_HOST` | Tailscale URL for Obsidian REST API (e.g. `http://100.x.x.x:27123`) |
| `ANTHROPIC_API_KEY` | `CLAUDE_API_KEY_N8N_STPETEMUSIC` | Anthropic Claude API key |
| `GROQ_API_KEY` | `GROQ_API_KEY` | Groq LLM API key |
| `N8N_GEMINI_API_KEY` | `N8N_GEMINI_API_KEY` | Google Gemini API key |
| `IG_USER_ID` | `IG_USER_ID` | Instagram Business Account ID |
| `IG_APP_ID` | `IG_APP_ID` | Instagram App ID |
| `IG_ACCESS_TOKEN` | `IG_ACCESS_TOKEN` | Instagram Page Access Token — use **permanent** Page token (derived from long-lived user token, never expires). See obsidian-to-youtube-posting section for rotation steps. |
| `FB_PAGE_ID` | `FB_PAGE_ID` | Facebook Page ID |
| `FB_ACCESS_TOKEN` | `FB_ACCESS_TOKEN` | Facebook Page Access Token |
| `GOOGLE_CLIENT_ID` | `YOUTUBE_CLIENT_ID` | YouTube/Google OAuth2 client ID |
| `GOOGLE_CLIENT_SECRET` | `YOUTUBE_CLIENT_SECRET` | YouTube/Google OAuth2 client secret |
| `YOUTUBE_API_KEY` | `YOUTUBE_API_KEY` | YouTube Data API key |
| `NOTION_API_KEY` | `NOTION_API_KEY` | Notion integration token *(optional)* |
| `LISTMONK_USERNAME` | `LISTMONK_USERNAME` | Listmonk **API user** username (`stpetemusic-newsletter-api`) — NOT the admin login. Create in Listmonk UI: Settings → API credentials |
| `LISTMONK_PASSWORD` | `LISTMONK_PASSWORD` | Listmonk **API user** access key — NOT the admin login password. Generate in Listmonk UI: Settings → API credentials |

**To rotate a secret (e.g. IG_ACCESS_TOKEN):**
1. Get the new token value
2. Go to GitHub → Settings → Secrets → Actions → update `IG_ACCESS_TOKEN`
3. Push any commit to `main` (or re-run the last deploy workflow) to apply it
4. n8n picks up the new token after the container restarts

**To update OBSIDIAN_HOST when your Tailscale IP changes:**
1. Run `tailscale ip -4` on your Mac
2. Update `OBSIDIAN_HOST` secret to `http://<new-ip>:27123`
3. Push to main to deploy

---

## N8N Workflows

**Active workflows only:** `n8n/workflows/StPeteMusic/` — do not import from other directories.

See `n8n/CLAUDE.md` for detailed n8n guidance.

The `system-prompt.md` file is the **source of truth** for AI agent instructions — always keep it in sync with the `systemMessage` field in the corresponding workflow JSON.

### obsidian-to-youtube-posting (YouTube + Instagram)

**File:** `n8n/workflows/StPeteMusic/obsidian-to-youtube-posting.json`
**Trigger:** Manual + scheduled every 4 hours
**Purpose:** Reads Obsidian posts with `status: ready`, downloads the video from Google Drive, and publishes to YouTube and/or Instagram based on the `platform` frontmatter field.

**Flow:**
```
Query Obsidian Vault → Extract Post Data → Platform Check
  [YouTube]: Download file (Google Drive) → Upload video → Add to Playlist
  [IG]:      Download Drive File (HTTP Request, public URL) → Save to Videos Folder
               → Create IG Container → Wait 30s → Check IG Status (poll every 30s)
               → Is Ready? (FINISHED or SCHEDULED)
                 → Should Publish Now?
                   → FINISHED: Publish IG Reel (immediate)
                   → SCHEDULED: skip (Instagram auto-publishes at postDate)
Both paths → Get Obsidian File Content → Build Updated Content → Update Obsidian Status (published)
```

**Google Drive download:**
- Files must be **public (shared-by-link)** — the IG branch downloads via public URL directly to disk (`/files/videos/`) without loading into Node.js heap
- YouTube branch uses the Google Drive OAuth node (binary data required for YouTube API)
- Direct download URL format: `https://drive.usercontent.google.com/download?id=FILE_ID&export=download&confirm=t`

**Instagram scheduling:**
- Uses Instagram Graph API scheduling: `published=false` + `scheduled_publish_time` (Unix timestamp from `postDate`)
- `postDate` must be **10 min – 75 days** in the future when the container is created
- If `postDate` is already past, the container stays `FINISHED` and the workflow calls `media_publish` immediately
- Container status polling: checks `status_code` every 30s until `FINISHED` or `SCHEDULED`
- No need to call `media_publish` for scheduled posts — Instagram handles it automatically

**nginx `/media/` serving:**
- Videos saved to `~/stpetemusic/n8n/local-files/videos/` on EC2 (mounted as `/files/videos/` in container)
- nginx serves them at `https://n8n.stpetemusic.live/media/<filename>` — this is the `video_url` sent to Instagram
- **Requires:** `chmod o+x /home/ec2-user` so nginx can traverse the home dir (applied automatically by `deploy.yml` and `user_data.sh`)

**Memory / stability:**
- n8n container: `mem_limit: 1024m` — required for large video uploads to YouTube
- Binary data mode: `filesystem` — binary stored on disk, not in Node.js heap
- `N8N_RESTRICT_FILE_ACCESS_TO=/files` — required for `ReadWriteFile` node to write to `/files/videos/`

**Instagram token:**
- Uses `$env.IG_ACCESS_TOKEN` (Page Access Token, never expires if derived from a long-lived user token)
- To rotate: generate short-lived User Token → exchange for long-lived → get Page Token from `950900529511914/owned_pages`
- Update `IG_ACCESS_TOKEN` GitHub Secret — deploy applies it automatically

---

### obsidian-post-creator (YouTube-only)

**File:** `n8n/workflows/StPeteMusic/obsidian-post-creator.json`
**Purpose:** Chat-based agent that generates YouTube post metadata and writes drafts to Obsidian.

**AI Output — single flat JSON object:**
```json
{
  "bandName": "Beach Terror",
  "bandInstagram": "@beach_terror",
  "caption": "🎸 02.23 @BeachTerror at @Suite.E.Studios",
  "postDate": "2026-02-18 11:00:00",
  "recordDate": "2026-02-07 20:00:00",
  "hashtags": ["#StPeteMusic", "#SuiteEStudios", "#StPeteFL", "#TampaBay"],
  "mentions": ["@StPeteMusic", "@suite.e.studios", "@beach_terror"],
  "status": "draft",
  "platform": "YouTube",
  "suiteEStudios": "Suite E Studios",
  "suiteEStudiosInstagram": "@suite.e.studios",
  "eventType": "Music",
  "mediaType": "Video",
  "mediaLink": ""
}
```

**Date format:** `"YYYY-MM-DD HH:MM:SS"` — required by YouTube API.
**`recordDate`**: when the performance happened (ask user if unknown).
**`postDate`**: future weekday, 3–7 days out, default time `11:00:00`.

**Tools on AI Agent:**
- `Think` — internal reasoning
- `Ask For Clarification` — call when band name, Instagram handle, or record date is missing
- `Read Obsidian Posts` — reads existing drafts for style consistency

**Workflow nodes:** Chat Trigger → AI Agent → Parse AI Output → JSON to YAML + Template → Write to Obsidian

**When updating the system prompt:**
1. Edit `system-prompt.md` first (readable source of truth)
2. Sync the `systemMessage` field in the JSON workflow
3. Commit both files

---

## Technical Configuration

### Google Account
- **Primary Gmail:** TheBurgMusic@gmail.com (manages all @StPeteMusic accounts and integrations)
- **Content Database:** [Google Sheets](https://docs.google.com/spreadsheets/d/1kzzR8zPxxNmNmp7hXFwzWMoVZh7ZLC9GZBnob1UNYo8/edit?usp=sharing)
  - `IG_PastPosts` tab: Archive of past Instagram posts for style reference
  - `PostSchedule` tab: Future posts queue for social media

### Key Files
| File | Purpose |
|---|---|
| `AWS_SETUP.md` | Production server quick reference |
| `docs/AWS_DEPLOYMENT.md` | Full step-by-step AWS setup guide |
| `n8n/CLAUDE.md` | n8n-specific Claude guidance |
| `n8n/docker-compose.yaml` | Local development |
| `n8n/docker-compose.prod.yaml` | Production (AWS) |
| `.env.example` | Environment variable template (safe to commit — no real values) |
| `.envrc` | direnv configuration (auto-loads environment) |
| `.pre-commit-config.yaml` | Git pre-commit hooks (prevents credential leaks) |
| `scripts/setup.sh` | One-command setup script |
| `.github/workflows/deploy.yml` | CI/CD deploy — writes `.env` on EC2 from GitHub Secrets |

---

## Setup & Environment Isolation

### First-Time Setup

Run the setup script to install dependencies and validate configuration:

```bash
bash scripts/setup.sh
```

This will:
1. ✅ Check direnv is installed (or guide you to install it)
2. ✅ Load `.envrc` to isolate environment
3. ✅ Validate `.env` file with your credentials
4. ✅ Verify AWS credentials are configured
5. ✅ Validate Terraform syntax
6. ✅ Validate n8n workflow JSON
7. ✅ Check Docker is available

### direnv (.envrc)

When you `cd` into this directory, direnv automatically:
- Unsets problematic global env vars (like `AWS_WEB_IDENTITY_TOKEN_FILE` from PSD projects)
- Sets `AWS_PROFILE=personal` for AWS CLI
- Loads your local `.env` file

**Setup direnv:**
```bash
brew install direnv
# Add to ~/.zshrc (or ~/.bashrc):
# eval "$(direnv hook zsh)"
# Then reload shell: exec zsh
```

**Allow direnv in this project:**
```bash
direnv allow
```

### Pre-Commit Hooks

Git hooks automatically prevent:
- ❌ Committing AWS credentials (AKIA keys)
- ❌ Committing `.env` file
- ❌ Bad Terraform syntax
- ❌ Private keys
- ❌ Large files

**Install pre-commit hooks:**
```bash
pip install pre-commit
pre-commit install
```

**Run manually to test:**
```bash
pre-commit run --all-files
```

---

## Troubleshooting

### AWS Credentials Issues

**Problem:** `Error: No valid credential sources found`

**Solution:**
1. Verify `.envrc` is allowed: `direnv allow`
2. Configure AWS profile:
   ```bash
   aws configure --profile personal
   ```
3. Test: `AWS_PROFILE=personal aws sts get-caller-identity`

**Problem:** AWS commands reference `/Users/matttaylor/Documents/_dev/amver-hub/aws_token`

**Solution:** This is contamination from PSD projects. The `.envrc` file should clean this up automatically:
```bash
direnv allow
cd .  # refresh environment
AWS_PROFILE=personal aws sts get-caller-identity
```

If it persists, check your shell config (`.zshrc`, `.bashrc`) for `AWS_WEB_IDENTITY_TOKEN_FILE` and remove it.

### Terraform Issues

**Problem:** `Backend initialization required`

**Solution:**
```bash
cd infrastructure
unset AWS_WEB_IDENTITY_TOKEN_FILE && AWS_PROFILE=personal tofu init -reconfigure
```

**Problem:** `tofu plan` shows no changes but changes are expected

**Solution:** State might be out of sync:
```bash
unset AWS_WEB_IDENTITY_TOKEN_FILE
AWS_PROFILE=personal tofu refresh
AWS_PROFILE=personal tofu plan
```

### n8n Server Down

**Problem:** `https://n8n.stpetemusic.live` not responding

**Solutions (in order):**
1. Check AWS status:
   ```bash
   AWS_PROFILE=personal aws ec2 describe-instance-status \
     --instance-ids i-03874197d725b0455 --region us-east-1
   ```

2. Restart Docker containers:
   ```bash
   ssh -i ~/.ssh/stpetemusic-n8n.pem ec2-user@n8n.stpetemusic.live \
     "cd ~/stpetemusic/n8n && docker-compose -f docker-compose.prod.yaml restart"
   ```

3. Reboot instance:
   ```bash
   AWS_PROFILE=personal aws ec2 reboot-instances \
     --instance-ids i-03874197d725b0455 --region us-east-1
   ```

4. Full stop/start:
   ```bash
   AWS_PROFILE=personal aws ec2 stop-instances --instance-ids i-03874197d725b0455 --region us-east-1
   sleep 30
   AWS_PROFILE=personal aws ec2 start-instances --instance-ids i-03874197d725b0455 --region us-east-1
   ```

### SSH Access Denied

**Problem:** `Connection refused` or `Operation timed out`

**Reason:** SSH is restricted to a specific IP (see `infrastructure/ec2.tf`)

**Solution:** Update the security group in Terraform:
```hcl
# In infrastructure/ec2.tf, find aws_security_group.n8n
# Update cidr_blocks for port 22:
cidr_blocks = ["YOUR.IP.ADDRESS/32"]  # Replace with your public IP
```

Then apply:
```bash
cd infrastructure
unset AWS_WEB_IDENTITY_TOKEN_FILE && AWS_PROFILE=personal tofu apply
```

### Environment Variable Leakage

**Problem:** Global env vars from other projects interfere

**Prevention:**
- ✅ Always run from this project directory (direnv will isolate environment)
- ✅ Use `AWS_PROFILE=personal` explicitly when not in directory
- ✅ Pre-commit hooks prevent committing bad configs
- ✅ Run setup.sh to validate clean environment

**If contamination happens:**
```bash
unset AWS_WEB_IDENTITY_TOKEN_FILE
unset DATABASE_URL
unset KEYCLOAK_ISSUER
direnv allow
cd .  # refresh
```
