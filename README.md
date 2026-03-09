# StPeteMusic — Automation & Infrastructure

**Purpose:** Centralized hub for all @StPeteMusic brand tools, automation, and infrastructure. Houses n8n workflows, documentation, and supporting tools for managing social media, events, and community engagement in St. Petersburg, FL.

**Live n8n instance:** https://n8n-stpetemusic.duckdns.org

---

## Project Structure

```
/
├── README.md                        # This file
├── CLAUDE.md                        # Claude Code guidance
├── AWS_SETUP.md                     # AWS infrastructure quick reference
├── .env.example                     # Environment variable template (commit this)
├── .env                             # Local secrets (DO NOT COMMIT)
├── .gitignore
│
├── infrastructure/                  # Terraform IaC (manages all AWS resources)
│   ├── main.tf                      # Provider config + S3 remote backend
│   ├── variables.tf                 # Input variables
│   ├── outputs.tf                   # Output values (IP, URLs, SG ID)
│   ├── ec2.tf                       # EC2 instance, Elastic IP, Security Group
│   ├── backup.tf                    # S3 backup bucket (disabled, ready to enable)
│   ├── database.tf                  # RDS PostgreSQL (disabled, ready to enable)
│   └── terraform.tfvars.example     # Example variable values (no secrets)
│
├── .github/
│   └── workflows/
│       ├── terraform-plan.yml       # Runs terraform plan on PRs
│       └── terraform-apply.yml      # Runs terraform apply on merge to main
│
├── n8n/                             # n8n automation engine
│   ├── CLAUDE.md                    # n8n-specific Claude guidance
│   ├── docker-compose.yaml          # Local development setup
│   ├── docker-compose.prod.yaml     # Production (AWS EC2) setup
│   ├── local-files/                 # Read/write files for workflows (CSV, MD)
│   └── workflows/
│       └── StPeteMusic/             # Active workflows (source of truth)
│           ├── obsidian-post-creator.json
│           ├── obsidian-to-youtube-posting.json
│           ├── youtube-shorts-tracker-creator.json
│           └── system-prompt.md     # AI agent instructions
│
├── data/                            # Data archives (gitignored)
│
└── docs/                            # Project documentation
    ├── AWS_DEPLOYMENT.md            # Step-by-step AWS deployment guide
    ├── OBSIDIAN_DATAVIEW_QUERIES.md
    └── YOUTUBE_SHORTS_*.md
```

---

## Infrastructure

n8n runs on **AWS EC2 (t3.micro, free tier)** with HTTPS via Let's Encrypt. All infrastructure is managed with **Terraform** — see `infrastructure/`.

| Resource | Value |
|---|---|
| n8n URL | https://n8n-stpetemusic.duckdns.org |
| Server | AWS EC2 t3.micro, `us-east-1` |
| SSH Key | `~/.ssh/stpetemusic-n8n.pem` |
| DNS | DuckDNS free subdomain |
| SSL | Let's Encrypt (auto-renews) |

> Quick reference: `AWS_SETUP.md` | Step-by-step from scratch: `docs/AWS_DEPLOYMENT.md`

### AWS Console — Quick Links

All resources are in `us-east-1` (N. Virginia).

| Resource | ID | Console Link |
|---|---|---|
| EC2 Instance | `i-03874197d725b0455` | [Open in Console](https://us-east-1.console.aws.amazon.com/ec2/home?region=us-east-1#Instances:instanceId=i-03874197d725b0455) |
| Elastic IP | `54.235.171.182` | [Open in Console](https://us-east-1.console.aws.amazon.com/ec2/home?region=us-east-1#Addresses:AllocationId=eipalloc-0a2ebbeef75ce8009) |
| Security Group | `sg-03a69e68cf7077cf3` | [Open in Console](https://us-east-1.console.aws.amazon.com/ec2/home?region=us-east-1#SecurityGroup:groupId=sg-03a69e68cf7077cf3) |
| EBS Volume (20GB gp3) | — | [EC2 → Volumes](https://us-east-1.console.aws.amazon.com/ec2/home?region=us-east-1#Volumes) |
| Free Tier Usage | — | [Billing → Free Tier](https://us-east-1.console.aws.amazon.com/billing/home#/freetier) |
| Billing Budgets | — | [Billing → Budgets](https://us-east-1.console.aws.amazon.com/billing/home#/budgets) |
| IAM User | `maylortaylor` | [IAM → Users](https://us-east-1.console.aws.amazon.com/iam/home#/users) |

### Terraform State Backend

Terraform remote state is stored in S3, locked via DynamoDB. **Never edit AWS resources manually** — always go through Terraform.

| Resource | ID | Console Link |
|---|---|---|
| S3 State Bucket | `stpetemusic-terraform-state` | [Open in Console](https://s3.console.aws.amazon.com/s3/buckets/stpetemusic-terraform-state?region=us-east-1) |
| DynamoDB Lock Table | `stpetemusic-terraform-locks` | [Open in Console](https://us-east-1.console.aws.amazon.com/dynamodbv2/home?region=us-east-1#table?name=stpetemusic-terraform-locks) |
| GitHub Actions | — | [Actions → Runs](https://github.com/maylortaylor/StPeteMusic/actions) |

**Terraform workflow:**
```bash
cd infrastructure
terraform plan    # preview changes (also runs automatically on PRs)
terraform apply   # apply changes (also runs automatically on merge to main)
```

**Import existing resources** (already done — documented here for reference):
```bash
terraform import aws_security_group.n8n sg-03a69e68cf7077cf3
terraform import aws_instance.n8n i-03874197d725b0455
terraform import aws_eip.n8n eipalloc-0a2ebbeef75ce8009
```

---

## Active Workflows

Only workflows in `n8n/workflows/StPeteMusic/` are considered active. All others are legacy/reference.

| Workflow | Purpose | AI |
|---|---|---|
| `obsidian-post-creator.json` | Chat agent → generates YouTube post metadata → writes draft to Obsidian | Claude (default) |
| `obsidian-to-youtube-posting.json` | Publishes Obsidian drafts to YouTube | Claude (default) |
| `youtube-shorts-tracker-creator.json` | Tracks and creates YouTube Shorts | Gemini (backup) |

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
ssh -i ~/.ssh/stpetemusic-n8n.pem ec2-user@n8n-stpetemusic.duckdns.org

# View n8n logs
docker logs -f n8n

# Restart n8n
docker restart n8n

# Update n8n to latest version
docker pull n8nio/n8n:latest
cd ~/stpetemusic/n8n
docker-compose -f docker-compose.prod.yaml --env-file ../.env up -d
```

See `AWS_SETUP.md` for full production reference.

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
https://n8n-stpetemusic.duckdns.org/rest/oauth2-credential/callback
```

---

## Roadmap

### Now — Active
- [x] n8n on AWS EC2 (always-on, HTTPS, free tier)
- [x] Obsidian → YouTube posting pipeline
- [x] YouTube Shorts tracker
- [x] Claude as default AI, Gemini as backup
- [x] Terraform IaC — all AWS resources version-controlled in `infrastructure/`
- [x] Terraform remote state — S3 bucket + DynamoDB lock table
- [x] GitHub Actions — `terraform plan` on PRs, `terraform apply` on merge to main

### Next
- [ ] Instagram access token (pending Facebook app review workaround)
- [ ] GitHub Actions — JSON validation, security scanning, Dependabot
- [ ] Workflow: multi-platform posting (IG + FB + YouTube from one trigger)

### Future
- [ ] PostgreSQL database (n8n conversation history + StPeteMusic data) — `infrastructure/database.tf` ready to uncomment
- [ ] Automated S3 backups of n8n data — `infrastructure/backup.tf` ready to uncomment
- [ ] Obsidian → Instagram posting pipeline
- [ ] Event management (EventBrite API)

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

*Last updated: March 2026 | Maintained by Matt Taylor (@maylortaylor)*
