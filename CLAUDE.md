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

### Production n8n
- **URL:** https://n8n-stpetemusic.duckdns.org
- **Server:** AWS EC2 t3.micro (`us-east-1`, free tier)
- **SSH:** `ssh -i ~/.ssh/stpetemusic-n8n.pem ec2-user@n8n-stpetemusic.duckdns.org`
- **Quick reference:** `AWS_SETUP.md`
- **Full deployment guide:** `docs/AWS_DEPLOYMENT.md`
- **IaC:** Terraform — see `infrastructure/` (active, state in S3 `stpetemusic-terraform-state`)

### Terraform
- **State bucket:** `stpetemusic-terraform-state` (S3, `us-east-1`, versioned + encrypted)
- **Lock table:** `stpetemusic-terraform-locks` (DynamoDB, pay-per-request)
- **CI:** `terraform plan` on every PR touching `infrastructure/`; `terraform apply` on merge to main
- **Rule:** Never edit AWS resources manually — always change `.tf` files and let CI apply
- **Local commands:** `cd infrastructure && terraform plan` / `terraform apply`
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
https://n8n-stpetemusic.duckdns.org/rest/oauth2-credential/callback
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

| Secret | Description |
|--------|-------------|
| `EC2_HOST` | EC2 hostname (`n8n-stpetemusic.duckdns.org`) |
| `EC2_USER` | EC2 SSH user (`ec2-user`) |
| `EC2_SSH_KEY` | EC2 SSH private key (contents of `.pem` file) |
| `AWS_ACCESS_KEY_ID` | AWS credentials for Terraform |
| `AWS_SECRET_ACCESS_KEY` | AWS credentials for Terraform |
| `POSTGRES_USER` | PostgreSQL username |
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `DB_ENCRYPTION_KEY` | pgcrypto column-level encryption key |
| `N8N_ENCRYPTION_KEY` | n8n credential encryption key |
| `N8N_API_KEY` | n8n API key |
| `OBSIDIAN_HOST` | Obsidian REST API URL (Tailscale IP, e.g. `http://100.x.x.x:27123`) |
| `CLAUDE_API_KEY_N8N_STPETEMUSIC` | Anthropic Claude API key |
| `GROQ_API_KEY` | Groq LLM API key |
| `N8N_GEMINI_API_KEY` | Google Gemini API key |
| `IG_USER_ID` | Instagram Business Account ID (`17841461021088145`) |
| `IG_ACCESS_TOKEN` | Instagram Page Access Token (rotate when expired) |
| `FB_PAGE_ID` | Facebook Page ID (`686234848147122`) |
| `FB_ACCESS_TOKEN` | Facebook Page Access Token |
| `YOUTUBE_CLIENT_ID` | YouTube OAuth2 client ID |
| `YOUTUBE_CLIENT_SECRET` | YouTube OAuth2 client secret |
| `YOUTUBE_API_KEY` | YouTube Data API key |
| `NOTION_API_KEY` | Notion integration token (optional) |

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
AWS_PROFILE=personal terraform init -reconfigure
```

**Problem:** `terraform plan` shows no changes but changes are expected

**Solution:** State might be out of sync:
```bash
AWS_PROFILE=personal terraform refresh
AWS_PROFILE=personal terraform plan
```

### n8n Server Down

**Problem:** `https://n8n-stpetemusic.duckdns.org` not responding

**Solutions (in order):**
1. Check AWS status:
   ```bash
   AWS_PROFILE=personal aws ec2 describe-instance-status \
     --instance-ids i-03874197d725b0455 --region us-east-1
   ```

2. Restart Docker containers:
   ```bash
   ssh -i ~/.ssh/stpetemusic-n8n.pem ec2-user@n8n-stpetemusic.duckdns.org \
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
AWS_PROFILE=personal terraform apply
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
