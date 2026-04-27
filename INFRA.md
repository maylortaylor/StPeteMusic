# StPeteMusic — Infrastructure Reference

> Single source of truth for all hosting, DNS, CI/CD, and infrastructure.
> Last updated: 2026-04-19

---

## Quick Links

| Service | URL / ID |
|---------|----------|
| **Production site** | https://www.stpetemusic.live |
| **Staging site** | https://develop.d1fbansqjv3e63.amplifyapp.com |
| **Amplify console** | https://us-east-1.console.aws.amazon.com/amplify/apps/d1fbansqjv3e63 |
| **GitHub repo** | https://github.com/maylortaylor/StPeteMusic |
| **GitHub Secrets** | https://github.com/maylortaylor/StPeteMusic/settings/secrets/actions |
| **Cloudflare DNS** | https://dash.cloudflare.com → stpetemusic.live → DNS → Records |
| **n8n automation** | https://n8n-stpetemusic.duckdns.org |
| **Listmonk (newsletter)** | https://listmonk.stpetemusic.live |
| **AWS console** | https://us-east-1.console.aws.amazon.com (us-east-1, N. Virginia) |

---

## Domain & DNS — Cloudflare

**Registrar / DNS provider:** Cloudflare
**Account email:** TheBurgMusic@gmail.com
**Domain:** `stpetemusic.live`
**Nameservers:** `cora.ns.cloudflare.com` · `kurt.ns.cloudflare.com`
**Zone setup:** Full (Cloudflare manages DNS)

### Current DNS Records

| Type | Name | Content | Proxy | Purpose |
|------|------|---------|-------|---------|
| CNAME | `_ddf1b33c5eab2d...` | `_bf19e363018afab...` | DNS only ✅ | ACM SSL validation (do not touch) |
| CNAME | `stpetemusic.live` | `d6q9oiwscagw.cloudfront.net` | ⚠️ Proxied | Apex domain → Amplify |
| CNAME | `www` | `d6q9oiwscagw.cloudfront.net` | ⚠️ Proxied | www → Amplify |
| A | `listmonk` | `54.235.171.182` | DNS only ✅ | Listmonk newsletter admin → EC2 |
| NS | — | `cora.ns.cloudflare.com` | — | Nameserver |
| NS | — | `kurt.ns.cloudflare.com` | — | Nameserver |

### ⚠️ Known Issue — Proxy Status

The `stpetemusic.live` and `www` CNAMEs are currently **Proxied (orange cloud)**.
This is blocking Amplify from completing domain activation.

**Fix:** Edit both CNAMEs in Cloudflare → toggle orange cloud → grey cloud (DNS only) → Save.
Once Amplify domain activation completes you can evaluate re-enabling proxy (not recommended — CloudFront is already a CDN).

---

## Web App — AWS Amplify

**App name:** `stpetemusic-web`
**App ID:** `d1fbansqjv3e63`
**Region:** `us-east-1` (N. Virginia)
**Hosting type:** SSR / `WEB_COMPUTE` — required for Next.js API routes
**Build spec:** `amplify.yml` at repo root
**Framework:** Next.js 14.2 (App Router)

### URLs

| Environment | URL |
|-------------|-----|
| Production (main branch) | https://www.stpetemusic.live |
| Amplify default (prod) | https://main.d1fbansqjv3e63.amplifyapp.com |
| Staging (develop branch) | https://develop.d1fbansqjv3e63.amplifyapp.com |

### Branch → Deploy Mapping

| Branch | Environment | Auto-deploy | Notes |
|--------|-------------|-------------|-------|
| `main` | PRODUCTION | ✅ | Merge triggers prod build |
| `develop` | DEVELOPMENT | ✅ | PR previews enabled |
| `feature/*` | — | ❌ | No auto-deploy |

**Rule: Never push directly to `main`.** Branch protection requires CI + 1 PR review.

### Custom Domain Status (as of 2026-04-19)

1. ✅ SSL creation — complete
2. ⏳ SSL configuration — *"Adding subdomains records to your DNS provider..."* (blocked by Cloudflare proxy — see fix above)
3. ⬜ Domain activation — pending step 2

### Secrets in Amplify Console

These are set per-branch directly in the Amplify console (not in Terraform or GitHub Secrets):

| Secret | Used by |
|--------|---------|
| `LISTMONK_USERNAME` | Newsletter signup API route |
| `LISTMONK_PASSWORD` | Newsletter signup API route |
| `LISTMONK_API_URL` | Newsletter signup API route — set to `https://listmonk.stpetemusic.live` |
| `LISTMONK_LIST_ID` | Newsletter signup API route — set to `1` (the default first list) |

---

## CI/CD — GitHub Actions

**Repo:** https://github.com/maylortaylor/StPeteMusic
**Account:** maylortaylor@gmail.com

### Workflows

| File | Trigger | What it does |
|------|---------|--------------|
| `web-ci.yml` | PR to `develop` or `main` | Lint, typecheck, test |
| `deploy.yml` | Push to `main` | Writes `.env` on EC2 from GitHub Secrets → restarts n8n |
| `terraform-plan.yml` | PR touching `infrastructure/` | `terraform plan` |
| `terraform-apply.yml` | Merge to `main` touching `infrastructure/` | `terraform apply` |

### GitHub Secrets (full list)

> These are the source of truth for all sensitive values. Never commit secrets to files.
> Manage at: https://github.com/maylortaylor/StPeteMusic/settings/secrets/actions

| GitHub Secret | Written to `.env` as | Purpose |
|---------------|----------------------|---------|
| `EC2_HOST` | — | SSH target (deploy only) |
| `EC2_USER` | — | SSH user (deploy only) |
| `EC2_SSH_KEY` | — | SSH private key (deploy only) |
| `AWS_ACCESS_KEY_ID` | — | AWS credentials (Terraform only) |
| `AWS_SECRET_ACCESS_KEY` | — | AWS credentials (Terraform only) |
| `POSTGRES_USER` | `POSTGRES_USER` | PostgreSQL username |
| `POSTGRES_PASSWORD` | `POSTGRES_PASSWORD` | PostgreSQL password |
| `DB_ENCRYPTION_KEY` | `DB_ENCRYPTION_KEY` | pgcrypto column-level encryption |
| `N8N_ENCRYPTION_KEY` | `N8N_ENCRYPTION_KEY` | n8n credential encryption |
| `N8N_API_KEY` | `N8N_API_KEY` | n8n API key |
| `OBSIDIAN_HOST` | `OBSIDIAN_HOST` | Tailscale URL for Obsidian REST API |
| `ANTHROPIC_API_KEY` | `CLAUDE_API_KEY_N8N_STPETEMUSIC` | Anthropic Claude API key |
| `GROQ_API_KEY` | `GROQ_API_KEY` | Groq LLM API key |
| `N8N_GEMINI_API_KEY` | `N8N_GEMINI_API_KEY` | Google Gemini API key |
| `IG_USER_ID` | `IG_USER_ID` | Instagram Business Account ID |
| `IG_APP_ID` | `IG_APP_ID` | Instagram App ID |
| `IG_ACCESS_TOKEN` | `IG_ACCESS_TOKEN` | Instagram Page Access Token (permanent) |
| `FB_PAGE_ID` | `FB_PAGE_ID` | Facebook Page ID |
| `FB_ACCESS_TOKEN` | `FB_ACCESS_TOKEN` | Facebook Page Access Token |
| `GOOGLE_CLIENT_ID` | `YOUTUBE_CLIENT_ID` | YouTube/Google OAuth2 client ID |
| `GOOGLE_CLIENT_SECRET` | `YOUTUBE_CLIENT_SECRET` | YouTube/Google OAuth2 client secret |
| `YOUTUBE_API_KEY` | `YOUTUBE_API_KEY` | YouTube Data API key |
| `NOTION_API_KEY` | `NOTION_API_KEY` | Notion integration token (optional) |
| `LISTMONK_USERNAME` | `LISTMONK_USERNAME` | Listmonk admin username (also used by Next.js API route) |
| `LISTMONK_PASSWORD` | `LISTMONK_PASSWORD` | Listmonk admin password (also used by Next.js API route) |

---

## Newsletter — Listmonk on EC2

**URL:** https://listmonk.stpetemusic.live
**Admin login:** uses `LISTMONK_USERNAME` / `LISTMONK_PASSWORD` GitHub Secrets
**Container:** `stpetemusic-listmonk` in `n8n/docker-compose.prod.yaml`
**Database:** `listmonk` (separate DB in the shared Postgres container)

### How the newsletter works end-to-end

```
User fills form on www.stpetemusic.live
  → POST /api/newsletter/subscribe (Next.js API route on Amplify)
  → HTTP Basic Auth POST to https://listmonk.stpetemusic.live/api/subscribers
  → Listmonk stores subscriber in its DB
  → You send campaigns from Listmonk admin UI
```

### SMTP configuration (required for sending emails)

Listmonk needs an outgoing SMTP server to send newsletters. Configure it in the admin UI:
**Settings → SMTP → Add SMTP server**

Recommended: **AWS SES** (already have AWS account, ~$0.10/1,000 emails)
1. Verify `stpetemusic.live` domain in SES console (us-east-1)
2. Create SMTP credentials in SES (not IAM — use SES-specific SMTP user)
3. In Listmonk Settings → SMTP:
   - Host: `email-smtp.us-east-1.amazonaws.com`
   - Port: `587`, TLS: STARTTLS
   - Username/Password: from SES SMTP credentials
   - From email: `newsletter@stpetemusic.live`

Alternative: **Resend** (free tier: 3,000 emails/month)
- SMTP host: `smtp.resend.com`, port `587`
- Username: `resend`, Password: your Resend API key
- Verify `stpetemusic.live` domain at resend.com first

### First-time setup checklist

1. ☐ Add DNS A record in Cloudflare: `listmonk` → `54.235.171.182` (DNS only, grey cloud)
2. ☐ Add `LISTMONK_USERNAME` + `LISTMONK_PASSWORD` to GitHub Secrets
3. ☐ Push to `main` → deploy runs → Listmonk starts + nginx config + certbot SSL issued
4. ☐ In Amplify console → main branch env vars → add:
   - `LISTMONK_API_URL` = `https://listmonk.stpetemusic.live`
   - `LISTMONK_LIST_ID` = `1`
5. ☐ Login to `https://listmonk.stpetemusic.live` → confirm the "Newsletter" list exists (ID 1)
6. ☐ Configure SMTP (see above) so Listmonk can actually send emails
7. ☐ Trigger Amplify redeploy (or push a commit) so new env vars take effect

---

## Automation Server — n8n on EC2

**URL:** https://n8n-stpetemusic.duckdns.org
**Server:** AWS EC2 `t3.micro` · `us-east-1` · Free tier
**Instance ID:** `i-03874197d725b0455`
**Elastic IP allocation:** `eipalloc-0a2ebbeef75ce8009`
**SSH:** `ssh -i ~/.ssh/stpetemusic-n8n.pem ec2-user@n8n-stpetemusic.duckdns.org`
**OAuth redirect URI:** `https://n8n-stpetemusic.duckdns.org/rest/oauth2-credential/callback`

### n8n Container Config

| Setting | Value |
|---------|-------|
| Memory limit | `1024m` (required for YouTube video uploads) |
| Binary data mode | `filesystem` (videos stored on disk, not in Node heap) |
| File access restriction | `/files` |
| Video storage path (host) | `~/stpetemusic/n8n/local-files/videos/` |
| Video storage path (container) | `/files/videos/` |
| nginx media serving | `https://n8n-stpetemusic.duckdns.org/media/<filename>` |

### Active Workflows

| Workflow | File | Purpose |
|----------|------|---------|
| obsidian-to-youtube-posting | `n8n/workflows/StPeteMusic/obsidian-to-youtube-posting.json` | Reads Obsidian posts → publishes to YouTube + Instagram |
| obsidian-post-creator | `n8n/workflows/StPeteMusic/obsidian-post-creator.json` | Chat agent → generates post metadata → writes draft to Obsidian |

---

## Infrastructure as Code — Terraform

**State bucket:** `stpetemusic-terraform-state` (S3, `us-east-1`, versioned + encrypted)
**Lock table:** `stpetemusic-terraform-locks` (DynamoDB, pay-per-request)
**IaC directory:** `infrastructure/`
**AWS profile:** `personal`

### Managed Resources

| Resource | ID |
|----------|----|
| EC2 instance | `i-03874197d725b0455` |
| Elastic IP | `eipalloc-0a2ebbeef75ce8009` |
| Security Group | `sg-03a69e68cf7077cf3` |

### Pending (commented out in Terraform)

- RDS PostgreSQL (`database.tf`)
- S3 backup bucket (`backup.tf`)

### Common Terraform Commands

```bash
cd infrastructure
AWS_PROFILE=personal terraform init
AWS_PROFILE=personal terraform plan
AWS_PROFILE=personal terraform apply
```

**Rule: Never edit AWS resources manually — always change `.tf` files and let CI apply.**

---

## VPN — Tailscale (Mac ↔ EC2)

Encrypted tunnel so n8n on EC2 can reach Obsidian running on your Mac.

- Mac Tailscale IP: run `tailscale ip -4` on your Mac (do not hardcode)
- All Obsidian workflow nodes use `{{ $env.OBSIDIAN_HOST }}` = `http://<TAILSCALE_IP>:27123`
- Update `OBSIDIAN_HOST` GitHub Secret when Tailscale IP changes → push to main → deploys

---

## Google / Content Accounts

| Account | Purpose |
|---------|---------|
| `TheBurgMusic@gmail.com` | Primary — manages all @StPeteMusic integrations |
| Google Sheets content DB | https://docs.google.com/spreadsheets/d/1kzzR8zPxxNmNmp7hXFwzWMoVZh7ZLC9GZBnob1UNYo8 |

### Google Sheets Tabs

| Tab | Purpose |
|-----|---------|
| `IG_PastPosts` | Archive of past Instagram posts (style reference) |
| `PostSchedule` | Future posts queue |

---

## Codebase — Web App

**Location:** `apps/web/`
**Stack:** Next.js 14.2 · React 18.3 · TypeScript · Tailwind CSS 3.4 · Framer Motion 12

### Key Directories

```
apps/web/
  src/
    app/                  # Next.js App Router pages + API routes
      page.tsx            # Home page
      events/page.tsx     # Events listing
      discover/page.tsx   # Discover page
      api/newsletter/subscribe/route.ts
    components/           # All UI components
  public/
    images/               # Static photos (drop new photos here)
      hero/               # hero-1.jpg, hero-2.jpg (wide venue shots)
      events/
        final-friday/     # hero.jpg
        instant-noodles/  # hero.jpg
      vibes/              # vibe-1..4.jpg, strip-1..10.jpg
```

### Photo Drop Locations

| Slot | Path | Spec |
|------|------|------|
| Hero background (cycles) | `public/images/hero/hero-1.jpg`, `hero-2.jpg` | Landscape, 2400px+ wide |
| Final Friday event panel | `public/images/events/final-friday/hero.jpg` | Landscape, 1600px+ |
| Instant Noodles panel | `public/images/events/instant-noodles/hero.jpg` | Landscape, 1600px+ |
| Vibes grid (4 cells) | `public/images/vibes/vibe-1.jpg` … `vibe-4.jpg` | Any ratio, 1200px+ |
| Photo strip (10 cards) | `public/images/vibes/strip-1.jpg` … `strip-10.jpg` | Portrait 4:5, 1200px+ |

---

## EC2 Quick Commands

```bash
# SSH in
ssh -i ~/.ssh/stpetemusic-n8n.pem ec2-user@n8n-stpetemusic.duckdns.org

# Restart n8n
cd ~/stpetemusic/n8n && docker-compose -f docker-compose.prod.yaml restart

# Check instance status
AWS_PROFILE=personal aws ec2 describe-instance-status \
  --instance-ids i-03874197d725b0455 --region us-east-1

# Reboot
AWS_PROFILE=personal aws ec2 reboot-instances \
  --instance-ids i-03874197d725b0455 --region us-east-1
```

---

## Current Action Items (as of 2026-04-27)

- [ ] **Fix Cloudflare proxy** — toggle `stpetemusic.live` and `www` CNAMEs from Proxied → DNS only to unblock Amplify domain activation
- [ ] **Verify domain activation** — after Cloudflare fix, watch Amplify console for step 3 completion
- [ ] **Add photos** — drop hero/event/vibes/strip photos into `apps/web/public/images/` to activate photo sections on the site
- [ ] **Newsletter — Cloudflare DNS** — add A record: `listmonk` → `54.235.171.182`, DNS only (grey cloud)
- [ ] **Newsletter — GitHub Secrets** — add `LISTMONK_USERNAME` + `LISTMONK_PASSWORD` at github.com/maylortaylor/StPeteMusic/settings/secrets/actions
- [ ] **Newsletter — push to main** — triggers deploy: starts Listmonk container, creates DB, issues SSL cert
- [ ] **Newsletter — Amplify env vars** — in Amplify console (main branch): add `LISTMONK_API_URL=https://listmonk.stpetemusic.live` and `LISTMONK_LIST_ID=1`
- [ ] **Newsletter — SMTP** — login to listmonk.stpetemusic.live → Settings → SMTP → configure AWS SES or Resend so emails actually send
