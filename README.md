# StPeteMusic — Automation & Infrastructure

**Purpose:** Centralized hub for all @StPeteMusic brand tools, automation, and infrastructure. Houses n8n workflows, documentation, and supporting tools for managing social media, events, and community engagement in St. Petersburg, FL.

**Live n8n instance:** https://n8n.stpetemusic.live

---

## Project Structure

```
/
├── apps/
│   ├── web/              # Next.js SSR — stpetemusic.live (Amplify d1fjwgk99cbqor)
│   └── admin/            # Next.js SSR admin — admin.stpetemusic.live (Amplify d2n0tn0yijqxny)
├── infrastructure/       # OpenTofu IaC (manages all AWS resources)
├── n8n/                  # n8n automation engine + workflows
│   ├── CLAUDE.md         # n8n-specific Claude guidance
│   └── workflows/StPeteMusic/  # Active workflows (source of truth)
├── database/             # PostgreSQL migrations (auto-applied on every deploy to main)
├── docs/                 # Architecture docs, runbooks, incident reports, roadmap
├── .github/workflows/    # CI/CD pipelines (ci, deploy, amplify-deploy, tofu-apply)
├── .claude/              # Context files for Claude Code agents (load before any task)
├── CLAUDE.md             # Agent entry point — load this first
├── SETUP.md              # First-time developer setup guide
├── AWS_SETUP.md          # Production server quick reference
└── .env.example          # Env var template (safe to commit — no real secrets)
```

---

## Infrastructure

All AWS resources are managed with **OpenTofu** — see `infrastructure/`. **Never edit AWS resources manually** — change the `.tf` files and let CI apply them.

> Full architecture map + CLI reference: `.claude/infrastructure.md`

| Resource | Value |
|---|---|
| Web app | https://www.stpetemusic.live (Amplify `d1fjwgk99cbqor`) |
| Admin app | https://admin.stpetemusic.live (Amplify `d2n0tn0yijqxny`) |
| n8n automation | https://n8n.stpetemusic.live (EC2 `i-03874197d725b0455`) |
| Newsletter | https://listmonk.stpetemusic.live (EC2 Docker) |
| Server IP | `54.235.171.182` · SSH: `ssh -i ~/.ssh/stpetemusic-n8n.pem ec2-user@n8n.stpetemusic.live` |
| DNS | Cloudflare for `stpetemusic.live` |
| Database | RDS PostgreSQL 16 (`stpetemusic-postgres.cmnogyowgoe1.us-east-1.rds.amazonaws.com`) |

### AWS Resources

All resources in `us-east-1` (N. Virginia). AWS account: `maylortaylor` · profile: `personal`.

| Resource | ID | Console Link |
|---|---|---|
| Web Amplify app | `d1fjwgk99cbqor` | [Open in Console](https://us-east-1.console.aws.amazon.com/amplify/home?region=us-east-1#/d1fjwgk99cbqor) |
| Admin Amplify app | `d2n0tn0yijqxny` | [Open in Console](https://us-east-1.console.aws.amazon.com/amplify/home?region=us-east-1#/d2n0tn0yijqxny) |
| EC2 Instance | `i-03874197d725b0455` | [Open in Console](https://us-east-1.console.aws.amazon.com/ec2/home?region=us-east-1#Instances:instanceId=i-03874197d725b0455) |
| Elastic IP | `54.235.171.182` | [Open in Console](https://us-east-1.console.aws.amazon.com/ec2/home?region=us-east-1#Addresses:AllocationId=eipalloc-0a2ebbeef75ce8009) |
| Security Group | `sg-03a69e68cf7077cf3` | [Open in Console](https://us-east-1.console.aws.amazon.com/ec2/home?region=us-east-1#SecurityGroup:groupId=sg-03a69e68cf7077cf3) |
| IAM User | `maylortaylor` | [IAM → Users](https://us-east-1.console.aws.amazon.com/iam/home#/users) |
| Free Tier Usage | — | [Billing → Free Tier](https://us-east-1.console.aws.amazon.com/billing/home#/freetier) |

### OpenTofu State Backend

| Resource | ID | Console Link |
|---|---|---|
| S3 State Bucket | `stpetemusic-terraform-state` | [Open in Console](https://s3.console.aws.amazon.com/s3/buckets/stpetemusic-terraform-state?region=us-east-1) |
| DynamoDB Lock Table | `stpetemusic-terraform-locks` | [Open in Console](https://us-east-1.console.aws.amazon.com/dynamodbv2/home?region=us-east-1#table?name=stpetemusic-terraform-locks) |
| GitHub Actions | — | [Actions → Runs](https://github.com/maylortaylor/StPeteMusic/actions) |

**OpenTofu workflow** (direnv sets `AWS_PROFILE=personal` automatically):
```bash
cd infrastructure
AWS_PROFILE=personal tofu plan    # preview changes (also runs automatically on PRs)
AWS_PROFILE=personal tofu apply   # apply changes (also runs automatically on merge to main)
```

---

## Active Workflows

Only workflows in `n8n/workflows/StPeteMusic/` are considered active. All others are legacy/reference.

See `n8n/workflows/StPeteMusic/` for the current list.

**AI Configuration:**
- **Default:** Anthropic Claude (`CLAUDE_API_KEY_N8N_STPETEMUSIC`)
- **Backup:** Google Gemini (`N8N_GEMINI_API_KEY`)

---

## Local Development Setup

For local testing before pushing changes to production.

### Prerequisites
- Docker + Docker Compose
- All credentials in `.env` (copy from `.env.example`)

### Run locally

```bash
# 1. Copy environment template
cp .env.example .env
# Fill in your credentials

# 2. Start n8n
cd n8n
docker-compose up -d

# 3. Open n8n UI
open http://localhost:5678

# 4. Import workflows from n8n/workflows/StPeteMusic/
```

### Stop local n8n

```bash
cd n8n
docker-compose down
```

---

## Production Management

```bash
# SSH into server
ssh -i ~/.ssh/stpetemusic-n8n.pem ec2-user@n8n.stpetemusic.live

# View n8n logs
docker logs -f n8n

# Restart n8n
docker restart n8n

# Update n8n to latest version
docker pull n8nio/n8n:latest
cd ~/stpetemusic/n8n
docker-compose -f docker-compose.prod.yaml --env-file ../.env up -d
```

See `docs/infrastructure/SERVER_OPERATIONS.md` for full production reference.

---

## Environment Variables

| Variable | Purpose | Required |
|---|---|---|
| `N8N_ENCRYPTION_KEY` | n8n data encryption | Yes |
| `CLAUDE_API_KEY_N8N_STPETEMUSIC` | Anthropic Claude (default AI) | Yes |
| `GROQ_API_KEY` | Groq LLM | Optional |
| `N8N_GEMINI_API_KEY` | Google Gemini (backup AI) | Optional |
| `IG_USER_ID` | Instagram Business account ID | For IG workflows |
| `IG_ACCESS_TOKEN` | Instagram access token (60-day expiry) | For IG workflows |
| `FB_PAGE_ID` | Facebook Page ID | For FB workflows |
| `FB_ACCESS_TOKEN` | Facebook access token | For FB workflows |
| `YOUTUBE_CLIENT_ID` | YouTube OAuth client ID | For YT workflows |
| `YOUTUBE_CLIENT_SECRET` | YouTube OAuth client secret | For YT workflows |
| `YOUTUBE_API_KEY` | YouTube Data API key | For YT workflows |

> Never commit `.env` — it's gitignored. See `.env.example` for the full template.

### Token Expiration

| Token | Expiry | How to Refresh |
|---|---|---|
| Instagram/Facebook | 60 days | `curl "https://graph.instagram.com/access_token?grant_type=ig_refresh_token&access_token=YOUR_TOKEN"` |
| YouTube | Managed by OAuth | Re-authenticate in n8n Credentials UI |

---

## Workflows — OAuth Redirect URI

When setting up OAuth credentials (YouTube, Instagram, Facebook) in n8n or Google/Meta Developer portals, use this callback URL:

```
https://n8n.stpetemusic.live/rest/oauth2-credential/callback
```

---

See `docs/plans/ROADMAP.md` for current roadmap.

---

## Quick Setup

First time? Run the setup script:

```bash
bash scripts/setup.sh
```

This validates your environment, credentials, and configuration in one command.

See **CLAUDE.md** for detailed setup and troubleshooting.

---

## Safeguards

To prevent issues like credential leakage or environment contamination:

| Safeguard | How It Works |
|-----------|------------|
| **direnv (.envrc)** | Auto-isolates environment when you cd into the directory — unsets problematic global vars |
| **Pre-commit hooks** | Prevents secrets and bad configs from being committed |
| **Setup script** | Validates all dependencies and configuration |
| **GitHub Actions** | Runs OpenTofu plan on PRs to catch infrastructure issues |

All three are now in place and active. See CLAUDE.md for setup instructions.

---

---

## Brand Reference

**@StPeteMusic** — Community music promoter, St. Petersburg FL

| Platform | URL |
|---|---|
| Instagram | https://www.instagram.com/StPeteMusic |
| Facebook | https://www.facebook.com/StPeteFLMusic |
| YouTube | https://youtube.com/@StPeteMusic |
| Linktree | https://linktr.ee/stpetemusic |

**Anchor Events:**
- **Final Friday** — Last Friday of each month, Suite E Studios
- **Instant Noodles** — Last Wednesday of each month, community jam
- **Second Saturday Art Walk** — Warehouse Arts District

**Team:** Matt Taylor (owner), Austen Van Der Bleek (co-owner), Rob Morey, Alex MacDonald

---

*Last updated: June 2026 | Maintained by Matt Taylor (@maylortaylor)*
