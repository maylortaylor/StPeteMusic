# StPeteMusic — Project Roadmap

> **Status:** Phase 1 in progress — CI/CD wired up, going live at stpetemusic.live
> **Last Updated:** April 18, 2026
> **Author:** Matt Taylor (@maylortaylor)
> **Stack:** Next.js 14 · Listmonk · Payload CMS · PostgreSQL · AWS (Terraform IaC) · n8n · AWS Amplify

---

## Table of Contents

1. [Project Vision](#1-project-vision)
2. [Current State](#2-current-state)
3. [Architecture Overview](#3-architecture-overview)
4. [Launch Checklist — This Week](#4-launch-checklist--this-week)
5. [Phase Roadmap](#5-phase-roadmap)
6. [DNS Migration Strategy](#6-dns-migration-strategy)
7. [Architecture Decisions](#7-architecture-decisions)
8. [Memory Budget](#8-memory-budget)
9. [n8n Automation Workflows](#9-n8n-automation-workflows)
10. [Site Map & Features](#10-site-map--features)
11. [Database Schema](#11-database-schema)
12. [AWS Infrastructure & Cost Estimate](#12-aws-infrastructure--cost-estimate)
13. [Environment Variables Reference](#13-environment-variables-reference)

---

## 1. Project Vision

**StPeteMusic** is a community hub for the greater St. Petersburg, FL music and arts scene.

### Goals

- Showcase local bands, DJs, visual artists, solo artists, and venues
- Promote upcoming events and live music in the area
- Drive traffic to YouTube channel and Patreon
- Help artists connect with venues and each other
- Send automated weekly event newsletters
- Publish and schedule content via API (n8n workflows)
- Accept patron media uploads from events (Phase 3)

### Primary CTAs

- Subscribe to YouTube channel
- Sign up for newsletter
- Buy Final Friday tickets

---

## 2. Current State

### Running in Production

| Component | Status | Details |
|---|---|---|
| **EC2 t3.micro** | ✅ Running | `us-east-1`, Elastic IP `54.235.171.182`, instance `i-03874197d725b0455` |
| **Terraform IaC** | ✅ Active | S3 state backend (`stpetemusic-terraform-state`) + DynamoDB lock table |
| **GitHub Actions** | ✅ Active | `terraform-plan.yml`, `terraform-apply.yml`, `ci.yml`, `deploy.yml` |
| **n8n** | ✅ Running | https://n8n-stpetemusic.duckdns.org (Docker on EC2, nginx, Let's Encrypt) |
| **PostgreSQL 16** | ✅ Running | Docker on EC2, pgcrypto encryption, memory-tuned for t3.micro |
| **S3 backup bucket** | ✅ Active | 7-day lifecycle, IAM instance profile auth, every 2 days at 4am |

### Built but Not Yet Deployed

| Component | Status | Details |
|---|---|---|
| **`apps/web/`** | ✅ Scaffolded | Next.js 14 App Router + Tailwind, all brand colors/fonts |
| **`DESIGN.md`** | ✅ Done | Full StPeteMusic design system for AI-assisted UI work |
| **`packages/types/`** | ✅ Done | Shared TypeScript interfaces (Artist, Venue, Event, Post) |
| **`docker-compose.dev.yml`** | ✅ Done | PostgreSQL + Listmonk for local dev |
| **Newsletter API route** | ✅ Done | `POST /api/newsletter/subscribe` → Listmonk |

### Not Yet Started

| Component | Phase |
|---|---|
| AWS Amplify deployment | Phase 1 |
| Custom domain (`stpetemusic.live`) connected to Amplify | Phase 1 |
| Listmonk on EC2 (production) | Phase 1 |
| AWS SES production access | Phase 1 |
| Payload CMS (`apps/cms/`) | Phase 2 |
| Real event/artist data from CMS | Phase 2 |
| Blog + media gallery | Phase 2 |

### Active n8n Workflows

| Workflow | Purpose |
|---|---|
| `obsidian-post-creator` | Chat agent → generates YouTube post metadata → writes Obsidian draft |
| `obsidian-to-youtube-posting` | Publishes Obsidian drafts to YouTube + Instagram |
| `youtube-shorts-tracker-creator` | Tracks and creates YouTube Shorts |

---

## 3. Architecture Overview

```
stpetemusic.live (DNS via Cloudflare)
│
├── www.stpetemusic.live    → Next.js 14 frontend (AWS Amplify SSR)
├── cms.stpetemusic.live    → Payload CMS 3.x (AWS EC2, PM2) — Phase 2
└── n8n.stpetemusic.live    → n8n automation server (AWS EC2, Docker)
```

**Phase 1 simplified (this week):**
```
stpetemusic.live / www.stpetemusic.live  → AWS Amplify (Next.js SSR)
n8n.stpetemusic.live                     → EC2 (existing n8n)
newsletter.stpetemusic.live              → EC2 (Listmonk, new)
```

### High-Level Data Flow

```
n8n workflow triggers
  ├── POST to Payload CMS API  (Phase 2)
  ├── POST to Listmonk API     (newsletter — Phase 1)
  └── POST to Meta/YouTube API (social post — active)

User newsletter signup
  └── POST /api/newsletter/subscribe → Listmonk on EC2
```

---

## 4. Launch Checklist — This Week

Ordered by dependency. Items marked **(you)** require manual action.

### Step 1 — Prototype locally

- [ ] `cd apps/web && npm install`
- [ ] `docker compose -f docker-compose.dev.yml up -d` (starts Listmonk + Postgres)
- [ ] `cp apps/web/.env.local.example apps/web/.env.local` and fill in values
- [ ] `cd apps/web && npm run dev` → verify at http://localhost:3000
- [ ] Open http://localhost:9000, create Listmonk admin account + list
- [ ] Set `LISTMONK_LIST_ID` in `.env.local`, test newsletter signup end-to-end

### Step 2 — Domain ✅ Done

- [x] `stpetemusic.live` registered on Cloudflare Registrar
- [ ] Get Cloudflare API token (Zone:Edit) and Zone ID → save as GitHub Secrets:
  - `CLOUDFLARE_API_TOKEN`
  - `CLOUDFLARE_ZONE_ID`

### Step 3 — AWS Amplify deployment

- [ ] Create GitHub PAT (`repo` scope) → add as `GITHUB_TOKEN_AMPLIFY` GitHub Secret
- [ ] PR with `infrastructure/amplify.tf` + `amplify.yml` → `terraform plan` runs → merge → `terraform apply` creates Amplify app
- [ ] After apply: `cd infrastructure && terraform output amplify_app_id` → add as `AMPLIFY_APP_ID` GitHub Secret
- [ ] In Amplify console → `stpetemusic-web` → `main` branch → set env vars: `LISTMONK_USERNAME`, `LISTMONK_PASSWORD`
- [ ] Trigger first build: push empty commit to `develop` or click "Run job" in Amplify console
- [ ] Verify staging at https://develop.d1fjwgk99cbqor.amplifyapp.com
- [ ] Verify production at https://main.d1fjwgk99cbqor.amplifyapp.com
- [ ] In Cloudflare DNS: add CNAMEs for `www` + `@` pointing to Amplify's provided domain
- [ ] Uncomment `aws_amplify_domain_association` in `amplify.tf` → re-apply

### Step 4 — Listmonk on EC2

- [ ] Add Listmonk install + PM2 startup to `.github/workflows/deploy.yml`
- [ ] Add nginx server block for `newsletter.stpetemusic.com` → Listmonk port 9000
- [ ] Request Certbot SSL cert for `newsletter.stpetemusic.com`
- [ ] Add GitHub Secrets for production Listmonk:
  - `LISTMONK_ADMIN_USER`
  - `LISTMONK_ADMIN_PASSWORD`
  - `LISTMONK_LIST_ID`
- [ ] Verify newsletter signup works end-to-end in production

### Step 5 — AWS SES production access **(you)**

- [ ] In AWS Console → SES → Request production access (exit sandbox)
- [ ] Verify `TheBurgMusic@gmail.com` as sender identity in SES
- [ ] Configure Listmonk SMTP to use SES (host: `email-smtp.us-east-1.amazonaws.com`)
- [ ] Add SES SMTP credentials to GitHub Secrets:
  - `SES_SMTP_USERNAME`
  - `SES_SMTP_PASSWORD`

### Step 6 — AWS Amplify deployment (handled in Step 3 above)

See Step 3 — Amplify replaces Vercel. Domain is `stpetemusic.live`.

### Step 7 — DNS migration for n8n **(careful)**

Before changing n8n config, add new OAuth redirect URI first (see [Section 6](#6-dns-migration-strategy)):

- [ ] Add `https://n8n.stpetemusic.live/rest/oauth2-credential/callback` to Google Cloud Console
- [ ] Add same URI to Meta Developer Dashboard
- [ ] Update `n8n/docker-compose.prod.yaml` env vars
- [ ] Push → deploy → test all n8n workflows

---

## 5. Phase Roadmap

### Phase 0 — Infrastructure & Documentation ✅ Complete

- [x] EC2, Terraform, n8n, PostgreSQL, GitHub Actions CI/CD running
- [x] Root `package.json` with npm workspaces
- [x] ROADMAP.md accurate
- [x] DESIGN.md brand system

---

### Phase 1 — Frontend Live at stpetemusic.com

> **Status: In Progress** | Goal: end of week

- [x] `apps/web/` Next.js 14 scaffold + Tailwind
- [x] Landing page (hero, events teaser, YouTube embed, newsletter, footer)
- [x] `/events` stub page
- [x] `/discover` stub page
- [x] `POST /api/newsletter/subscribe` → Listmonk
- [x] `docker-compose.dev.yml` for local dev
- [x] `packages/types/` shared TypeScript interfaces
- [ ] **Local prototype verified** (Step 1 above)
- [ ] **stpetemusic.com registered** (Step 2)
- [ ] **Cloudflare DNS via Terraform** (Step 3)
- [ ] **Listmonk running on EC2** (Step 4)
- [ ] **AWS SES production access** (Step 5)
- [x] **CI/CD: develop branch + web-ci.yml + test suite** (done)
- [x] **AWS Amplify Terraform config + build spec** (done — needs apply)
- [ ] **AWS Amplify deployed at Amplify URL** (Step 3)
- [ ] **stpetemusic.live custom domain connected** (Step 3)
- [ ] **n8n migrated to n8n.stpetemusic.live** (Step 7)
- [ ] Replace YouTube playlist embed with individual video iframes once videos are public

---

### Phase 2 — Payload CMS + Real Content

> **Status: Not Started** | After Phase 1 is stable

#### PR 2a — Payload CMS on EC2

```bash
npx create-payload-app@latest apps/cms
```

- Collections: Artists, Venues, Events, Posts, BlogPosts, Media
- Google OAuth admin login (TheBurgMusic@gmail.com allowlist)
- S3 media storage (`stpetemusic-media` bucket)
- Deploy via `deploy.yml` as PM2 process on port 3001
- nginx: `cms.stpetemusic.com` → port 3001
- Terraform: add `cms.stpetemusic.com` DNS record

#### PR 2b — Frontend Pulls Real Data

- Seed Artists, Venues, Events in Payload admin
- `/events` page: fetch from Payload REST API
- `/discover` page: fetch Artists from Payload
- Newsletter signup → Listmonk API (already wired, just needs real list ID)

#### PR 2c — S3 Media Bucket

Add `infrastructure/s3-media.tf`:
```hcl
resource "aws_s3_bucket" "media" { bucket = "stpetemusic-media" }
resource "aws_s3_bucket" "patron_uploads" { bucket = "stpetemusic-patron-uploads" }
```

#### PR 2d — Blog + Contact

- `/blog` and `/blog/[slug]` from Payload BlogPosts
- `/media` gallery from Payload Media + S3
- Contact form → Resend → `TheBurgMusic@gmail.com`

---

### Phase 3 — Automation Suite

> **Status: Not Started** | After Phase 2 stable

- n8n: YouTube RSS → auto-create Payload post
- n8n: weekly events newsletter (Payload → Listmonk campaigns API)
- n8n: event day social reminders (Facebook + Instagram)
- n8n: scheduled post publisher cron
- n8n: patron upload flow (Google Drive → Payload)
- YouTube Data API v3 dynamic feed on homepage (replace hardcoded embeds)
- Full-text search across `/discover`
- CloudWatch monitoring + SNS alerts

---

## 6. DNS Migration Strategy

**Current:** n8n OAuth redirect URIs registered to `n8n-stpetemusic.duckdns.org`

**Zero-downtime migration plan:**

1. `stpetemusic.live` is registered on Cloudflare ✅
2. Add `n8n.stpetemusic.live` A record via Terraform → EC2 IP `54.235.171.182`
3. Add nginx server block + Certbot cert for `n8n.stpetemusic.live`
4. **Before touching n8n config** — add new redirect URI to both:
   - Google Cloud Console: `https://n8n.stpetemusic.live/rest/oauth2-credential/callback`
   - Meta Developer Dashboard: same
5. Update `n8n/docker-compose.prod.yaml`:
   ```yaml
   N8N_HOST: n8n.stpetemusic.live
   WEBHOOK_URL: https://n8n.stpetemusic.live/
   ```
6. Push → deploy.yml restarts n8n → test all workflows + OAuth reconnection
7. After 1–2 weeks stable: remove DuckDNS nginx block + remove old OAuth URIs

> ⚠️ If Cloudflare orange-cloud proxy breaks n8n WebSocket connections, switch the n8n DNS record to "DNS only" (gray cloud).

---

## 7. Architecture Decisions

| Decision | Choice | Reason |
|---|---|---|
| **Frontend hosting** | AWS Amplify SSR | Free tier covers our scale; AWS-native; SSR required for API routes; built-in branch previews; ~$0/mo |
| **Newsletter** | Listmonk (PM2 binary on EC2) | ~50MB RAM vs Docker overhead — critical on t3.micro |
| **Newsletter SMTP** | AWS SES from EC2 | First 62k/month free; ~4,300/month newsletter = $0 |
| **DNS** | Cloudflare (free) | No markup, free CDN, free SSL, free email routing |
| **IaC** | Terraform (existing) | Already in production, state in S3 |
| **CMS** | Payload 3.x (Phase 2) | Single PM2 process, no separate server, Next.js native |
| **Database** | PostgreSQL on EC2 (not RDS) | Saves ~$13/mo; fine at this scale |
| **Design system** | DESIGN.md | Plain-text brand system AI reads for consistent UI generation |

---

## 8. Memory Budget

**t3.micro = 1GB RAM + 2GB swap**

| Process | Budget | Notes |
|---|---|---|
| PostgreSQL 16 | ~256MB | Tuned with `shared_buffers` |
| n8n | ~1,024MB limit | `mem_limit: 1024m` in docker-compose.prod.yaml |
| Listmonk | ~50MB | Binary, very lean |
| Payload CMS (Phase 2) | ~300MB | `--max-old-space-size=256` in PM2 |
| **Phase 1 total** | **~1.3GB** | Relies on swap — monitor after Listmonk deploy |
| **Phase 2 total** | **~1.6GB** | Monitor closely; upgrade to t3.small if needed |

If memory pressure: move n8n's PostgreSQL to share the main instance (saves ~50MB), or upgrade to t3.small (~$17/mo, 2GB RAM).

---

## 9. n8n Automation Workflows

### Active

| Workflow | Trigger | Purpose |
|---|---|---|
| `obsidian-post-creator` | Manual / chat | Generate YouTube post metadata → write Obsidian draft |
| `obsidian-to-youtube-posting` | Manual / scheduled 4hr | Publish Obsidian drafts to YouTube + Instagram |
| `youtube-shorts-tracker-creator` | Scheduled | Track and create YouTube Shorts |

### Planned (Phase 3)

| Workflow | Trigger | Purpose |
|---|---|---|
| YouTube RSS → Payload post | RSS trigger | Auto-create post when new video published |
| Weekly events newsletter | Monday 8am | Payload events → Listmonk campaign → send |
| Event day social reminder | Day-of, 10am | Auto-post to Facebook + Instagram on show days |
| Scheduled post publisher | Every 15 min | Publish scheduled Payload posts |

---

## 10. Site Map & Features

### `www.stpetemusic.live`

```
/                       → Landing page ✅ built
  - Hero + inline newsletter signup
  - Upcoming events teaser (3 cards, hardcoded → Phase 2: Payload API)
  - YouTube playlist embed (→ Phase 3: YouTube Data API)
  - Full newsletter section
  - Social links footer

/events                 → Events calendar stub ✅ built (→ Phase 2: Payload data)
/discover               → Artist directory stub ✅ built (→ Phase 2: Payload data)
/blog                   → Blog / editorial (Phase 2)
/media                  → Photo & video gallery (Phase 2)
/contact                → Contact form → Resend → Gmail (Phase 2)
```

### `cms.stpetemusic.com` (Phase 2)

Payload CMS admin — Google SSO, TheBurgMusic@gmail.com only.
Collections: Artists, Venues, Events, Posts, BlogPosts, Media, Subscribers.

### `newsletter.stpetemusic.com` (Phase 1)

Listmonk admin UI for managing subscribers and campaigns.

---

## 11. Database Schema

PostgreSQL 16 running on EC2. Payload will use `payload_` prefixed tables (no conflicts with existing schema).

### Existing Tables (`database/schema.sql`)

Contains tables for contacts, stats, and templates used by n8n workflows.

### Payload Collections (Phase 2, auto-generated)

Payload generates its own `payload_` prefixed tables.

### Custom Tables

```sql
-- Events <-> Performers (many-to-many)
CREATE TABLE event_performers (
  event_id     UUID REFERENCES payload_events(id),
  performer_id UUID,
  performer_type TEXT,  -- band, dj, solo_artist
  headline     BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (event_id, performer_id)
);

-- Patron Media Uploads (Phase 3)
CREATE TABLE media_uploads (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id       UUID,
  uploader_name  TEXT,
  uploader_email TEXT,
  drive_file_url TEXT NOT NULL,
  file_type      TEXT,  -- image, video
  approved       BOOLEAN DEFAULT FALSE,
  uploaded_at    TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 12. AWS Infrastructure & Cost Estimate

> Baseline: ~5,000 page views/month, ~1,000 emails/week (4,300+/month)

| Service | Year 1 (Free Tier) | Year 2+ | Notes |
|---|---|---|---|
| EC2 t3.micro | **$0** | **~$8.50/mo** | n8n + Listmonk + CMS + DB |
| EBS 20GB gp3 | **$0** | **~$1.60/mo** | Already provisioned |
| Elastic IP | **$0** | **$0** | Attached to running instance |
| S3 Media (Phase 2) | **$0** (5GB free) | **~$0.60/mo** | Images + event media |
| AWS SES | **$0** | **$0** | EC2-originated, first 62k/mo free |
| AWS Amplify (Next.js SSR) | **Free** | **~$0–2/mo** | 1000 build min/mo + 15GB bandwidth free; SSR compute ~$0.00001/req |
| Cloudflare DNS | **Free** | **Free** | DNS + CDN + SSL + DDoS protection |
| Domain stpetemusic.live | **~$10/yr** | **~$10/yr** | Cloudflare Registrar ✅ registered |

| Scenario | Monthly | Annual |
|---|---|---|
| Year 1 | **~$0–1** | **~$10–12** (domain only) |
| Year 2+ (EC2 + S3) | **~$11–12** | **~$140–155** |

---

## 13. Environment Variables Reference

### `apps/web` (AWS Amplify + `.env.local`)

```bash
LISTMONK_API_URL=https://newsletter.stpetemusic.com   # prod; http://localhost:9000 for local
LISTMONK_USERNAME=admin
LISTMONK_PASSWORD=                                     # GitHub Secret: LISTMONK_ADMIN_PASSWORD
LISTMONK_LIST_ID=1                                     # Set after creating list in Listmonk admin

# Phase 2
# NEXT_PUBLIC_PAYLOAD_API_URL=https://cms.stpetemusic.com
```

### EC2 `.env` (written by `deploy.yml` from GitHub Secrets)

See `CLAUDE.md` for the full secrets table. Phase 1 additions:

| GitHub Secret | Purpose |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Terraform Cloudflare provider |
| `CLOUDFLARE_ZONE_ID` | DNS zone for stpetemusic.com |
| `LISTMONK_ADMIN_USER` | Listmonk admin username |
| `LISTMONK_ADMIN_PASSWORD` | Listmonk admin password |
| `LISTMONK_LIST_ID` | Default newsletter list ID |
| `SES_SMTP_USERNAME` | AWS SES SMTP username |
| `SES_SMTP_PASSWORD` | AWS SES SMTP password |

---

*Source of truth for the StPeteMusic project. Update this file when phases complete or priorities shift.*
