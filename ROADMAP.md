# StPeteMusic — Project Roadmap

> **Status:** Phase 1.5 nearly complete — all branches merged, newsletter verified, n8n workflow wiring is the only remaining item
> **Last Updated:** May 1, 2026
> **Author:** Matt Taylor (@maylortaylor)
> **Stack:** Next.js 16 · Listmonk · Payload CMS · PostgreSQL (RDS) · AWS (OpenTofu IaC) · n8n · AWS Amplify

---

## Table of Contents

1. [Project Vision](#1-project-vision)
2. [Current State](#2-current-state)
3. [Architecture Overview](#3-architecture-overview)
4. [Next Steps — Phase 1.5](#4-next-steps--phase-15)
5. [Phase Roadmap](#5-phase-roadmap)
6. [Architecture Decisions](#6-architecture-decisions)
7. [Memory Budget](#7-memory-budget)
8. [n8n Automation Workflows](#8-n8n-automation-workflows)
9. [Site Map & Features](#9-site-map--features)
10. [Database Schema](#10-database-schema)
11. [AWS Infrastructure & Cost Estimate](#11-aws-infrastructure--cost-estimate)
12. [Environment Variables Reference](#12-environment-variables-reference)

---

## 1. Project Vision

**StPeteMusic** is a community hub for the greater St. Petersburg, FL music and arts scene.

### Goals

- Showcase local bands, DJs, visual artists, solo artists, and venues
- Promote upcoming events and live music in the area
- Drive traffic to YouTube channel and Patreon
- Help artists connect with venues and each other
- Send automated monthly event newsletters
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
| **Next.js Web App** | ✅ Live | https://www.stpetemusic.live (AWS Amplify SSR, prod + staging) |
| **EC2 t3.micro** | ✅ Running | `us-east-1`, Elastic IP `54.235.171.182`, instance `i-03874197d725b0455` |
| **RDS PostgreSQL 16** | ✅ Running | `db.t4g.micro`, databases: `n8n` + `listmonk_stpetemusic` (SSL required) |
| **OpenTofu IaC** | ✅ Active | S3 state backend (`stpetemusic-terraform-state`) + DynamoDB lock table |
| **GitHub Actions CI/CD** | ✅ Active | `tofu-plan.yml`, `tofu-apply.yml`, `ci.yml`, `deploy.yml`, `web-ci.yml` |
| **n8n** | ✅ Running | https://n8n.stpetemusic.live (Docker on EC2, nginx, Let's Encrypt) |
| **Listmonk** | ✅ Running | https://listmonk.stpetemusic.live (Docker on EC2, nginx, Let's Encrypt) |
| **Newsletter Signup** | ✅ Working | `POST /api/newsletter/subscribe` → Listmonk list ID 3 |
| **Newsletter Send** | ✅ Working | Resend SMTP configured in Listmonk admin (smtp.resend.com:465, from: `newsletter@stpetemusic.live`) |
| **Newsletter Analytics** | ✅ Active | Open tracking (`{{ TrackView }}`), click tracking (per-campaign), UTM params on site links |
| **Resend SMTP** | ✅ Configured | Domain `stpetemusic.live` verified, from: `newsletter@stpetemusic.live` |
| **S3 Backup Bucket** | ✅ Active | `stpetemusic-n8n-backups`, 7-day lifecycle, every 2 days at 4am |

### Code Complete — Not Yet Deployed to AWS

| Component | Status | Details |
|---|---|---|
| **Linktree API** | ✅ Deployed | Lambda + DynamoDB + API GW live at `qag1q0ijn5.execute-api.us-east-1.amazonaws.com` |
| **LinkTreeSection (stpetemusic.live)** | ✅ Live | Homepage "Find Us Everywhere" section — fetches via `/api/linktree` proxy, renders sorted link cards |
| **WordPress Widget (suiteestudios.com)** | ✅ Ready | `apps/web/public/linktree-widget.html` — paste-ready snippet with Suite E brand styling; install guide in `docs/wordpress-linktree-widget.md` |
| **Newsletter n8n Workflows** | 🟡 Files exist | `newsletter-draft-creator.json`, `newsletter-publisher.json` — not yet imported into n8n UI |

### Completed This Session (April 30, 2026)

| Component | Details |
|---|---|
| **Newsletter end-to-end test** | Resend SMTP configured in Listmonk admin UI; test campaign sent and verified |
| **Newsletter open tracking** | `{{ TrackView }}` pixel added to `newsletter-base.html` template |
| **Newsletter click tracking** | Enabled per-campaign in Listmonk UI; per-link stats visible in campaign Analytics tab |
| **Newsletter UTM params** | All stpetemusic.live links in template tagged with `utm_source=newsletter&utm_medium=email&utm_campaign=monthly` + unique `utm_content` per link |
| **SEO — metadata** | `layout.tsx`: `metadataBase`, title template (`St. Pete Music \| %s`), updated description, OG image (`/images/hero/hero-1.jpg`) |
| **SEO — per-page metadata** | `generateMetadata()` on homepage, `/events`, `/discover` with page-specific titles + descriptions |
| **SEO — structured data** | Organization + MusicVenue JSON-LD on homepage; MusicEvent JSON-LD on `/events` (Final Friday + Instant Noodles); MusicGroup JSON-LD on `/discover` (4 featured artists) |
| **Branded 404 page** | `not-found.tsx` — Nav + orange "404" + copy + CTAs (Home, Events) + Footer |
| **Branded error page** | `global-error.tsx` — "Try Again" + "Back to Home" with brand styling |

### Not Yet Started

| Component | Phase |
|---|---|
| Import newsletter n8n workflows + set up Google Sheets + Listmonk credentials | Phase 1.5 |
| Merge `fix/listmonk-startup-order` branch | Phase 1.5 |
| S3 media bucket for images/video | Phase 2 |
| Payload CMS (`apps/cms/`) | Phase 2 |
| Real event/artist data from CMS | Phase 2 |
| Blog + media gallery | Phase 2 |

### Active n8n Workflows (Deployed)

| Workflow | Trigger | Purpose |
|---|---|---|
| `obsidian-post-creator` | Manual / chat | Generate YouTube post metadata → write Obsidian draft |
| `obsidian-to-youtube-posting` | Manual / scheduled 4hr | Publish Obsidian drafts to YouTube + Instagram |
| `youtube-shorts-tracker-creator` | Scheduled | Track and create YouTube Shorts |

### n8n Workflows (Files Exist, Not Yet Deployed)

| Workflow | Trigger | Purpose |
|---|---|---|
| `newsletter-draft-creator` | Monthly (1st, 9am ET) + manual | Read Google Sheets → Claude AI → Obsidian newsletter draft |
| `newsletter-publisher` | Manual | Obsidian approved draft → Listmonk campaign (draft, not sent) |

---

## 3. Architecture Overview

```
stpetemusic.live (DNS via Cloudflare — grey cloud, DNS only)
│
├── www.stpetemusic.live         → Next.js 16 (AWS Amplify SSR) ✅ live
├── listmonk.stpetemusic.live    → Listmonk (Docker on EC2) ✅ live
├── n8n.stpetemusic.live         → n8n (Docker on EC2) ✅ live
├── cms.stpetemusic.live         → Payload CMS 3.x (EC2, PM2) — Phase 2
└── linktree-api (AWS API GW)    → Lambda → DynamoDB — Phase 1.5
```

### High-Level Data Flow

```
n8n workflow triggers
  ├── POST to Listmonk API     (newsletter campaigns — active)
  ├── POST to Obsidian REST    (draft creation — active)
  └── POST to Meta/YouTube API (social posts — active)

User newsletter signup
  └── POST /api/newsletter/subscribe → Listmonk (list ID 3)

Linktree scraper (Phase 1.5)
  └── EventBridge (hourly) → Lambda scraper → DynamoDB
      → Lambda API → HTTP API Gateway (public)
      → stpetemusic.live and suiteestudios.com fetch via JS
```

---

## 4. Next Steps — Phase 1.5

### ~~A — Deploy Linktree API~~ ✅ Complete

API is live at `https://qag1q0ijn5.execute-api.us-east-1.amazonaws.com/linktree`.

- `GET /linktree` — returns array of all profiles (stpetemusic + suite_e_studios)
- Scraped hourly via EventBridge + Lambda → DynamoDB
- `/api/linktree` proxy route on stpetemusic.live avoids CORS in local dev + caches 5 min in prod

### ~~Embed linktree data on stpetemusic.live~~ ✅ Complete

`LinkTreeSection` component on homepage fetches and renders sorted links + socials for the `stpetemusic` profile.

### ~~Share linktree API with Suite E Studios~~ ✅ Complete

`apps/web/public/linktree-widget.html` — self-contained HTML/CSS/JS snippet with Suite E brand styling (black cards, orange hover, Helvetica Neue). Install guide: `docs/wordpress-linktree-widget.md`.

### ~~B — Test Newsletter Send~~ ✅ Complete

Resend SMTP configured in Listmonk admin UI (`smtp.resend.com:465`, username: `resend`, password: API key, from: `newsletter@stpetemusic.live`). Test campaign sent and verified in inbox + Resend dashboard.

Also completed: open tracking pixel (`{{ TrackView }}`), click tracking (per-campaign setting), and UTM parameters on all stpetemusic.live links in the base template.

### C — Import Newsletter n8n Workflows

1. Log into https://n8n.stpetemusic.live
2. Import `newsletter-draft-creator.json` and `newsletter-publisher.json`
3. Create a **Google Sheets OAuth2** credential → wire to both sheet-reading nodes in `newsletter-draft-creator`
4. Create an **HTTP Basic Auth** credential named `Listmonk API` (username: `stpetemusic-newsletter-api`, password: API key from Listmonk Settings → API credentials)
5. Wire `Listmonk API` credential to the `Create Listmonk Campaign` node in `newsletter-publisher`
6. Activate the `newsletter-draft-creator` workflow (it runs automatically on the 1st of each month)

### D — Merge `fix/listmonk-startup-order` Branch

Merge this branch to prevent a race condition on fresh EC2 deploys. Not urgent (RDS tables already exist), but should be done before the next time a fresh EC2 is provisioned.

---

## 5. Phase Roadmap

### Phase 0 — Infrastructure & Documentation ✅ Complete

- [x] EC2, OpenTofu, n8n, GitHub Actions CI/CD running
- [x] Root `package.json` with npm workspaces
- [x] ROADMAP.md + DESIGN.md brand system

---

### Phase 1 — Frontend Live at stpetemusic.live ✅ Complete

- [x] `apps/web/` Next.js scaffold + Tailwind
- [x] Landing page (hero, events teaser, YouTube embed, newsletter, footer)
- [x] `/events` stub page
- [x] `/discover` stub page
- [x] `POST /api/newsletter/subscribe` → Listmonk
- [x] `docker-compose.dev.yml` for local dev
- [x] `packages/types/` shared TypeScript interfaces
- [x] CI/CD: `develop` branch + `web-ci.yml` + test suite
- [x] AWS Amplify deployed — production at `www.stpetemusic.live`
- [x] `stpetemusic.live` custom domain connected via Cloudflare
- [x] Listmonk running on EC2 at `listmonk.stpetemusic.live`
- [x] Resend SMTP configured — `newsletter@stpetemusic.live`
- [x] RDS PostgreSQL provisioned (replaces Docker Postgres)
- [x] n8n migrated to `n8n.stpetemusic.live` (OAuth URIs updated)
- [x] Newsletter email base template created (`apps/web/src/email-templates/newsletter-base.html`)
- [x] n8n newsletter automation workflows created (not yet deployed to n8n UI)
- [x] SEO: `metadataBase`, title template, OG image, per-page `generateMetadata()` on all pages
- [x] SEO: JSON-LD structured data — Organization+MusicVenue (homepage), MusicEvent (/events), MusicGroup (/discover)
- [x] Branded 404 (`not-found.tsx`) and error (`global-error.tsx`) pages

---

### Phase 1.5 — Linktree API + Newsletter Pipeline

> **Status: Nearly Complete** — n8n workflow wiring is the only remaining item

- [x] Deploy Linktree API (Lambda + DynamoDB + API GW live)
- [x] Embed linktree data on `www.stpetemusic.live` — `LinkTreeSection` component + `/api/linktree` proxy
- [x] Share linktree widget with Suite E Studios — `linktree-widget.html` + WordPress install guide
- [x] Test newsletter send end-to-end (Resend SMTP configured + campaign verified in inbox)
- [x] Newsletter analytics: open tracking pixel, click tracking, UTM params on template links
- [ ] Import newsletter n8n workflows + wire Google Sheets + Listmonk credentials
- [x] Merge `fix/listmonk-startup-order` branch

---

### Phase 2 — Payload CMS + Real Content

> **Status: Not Started** | After Phase 1.5 is stable

#### PR 2a — Payload CMS on EC2

```bash
npx create-payload-app@latest apps/cms
```

- Collections: Artists, Venues, Events, Posts, BlogPosts, Media
- Google OAuth admin login (TheBurgMusic@gmail.com allowlist)
- S3 media storage (`stpetemusic-media` bucket — see PR 2c)
- Deploy via `deploy.yml` as PM2 process on port 3001
- nginx: `cms.stpetemusic.live` → port 3001

#### PR 2b — Frontend Pulls Real Data

- Seed Artists, Venues, Events in Payload admin
- `/events` page: fetch from Payload REST API
- `/discover` page: fetch Artists from Payload

#### PR 2c — S3 Media Bucket

Add `infrastructure/s3-media.tf`:
- `stpetemusic-media` — public-read images/video for website
- `stpetemusic-patron-uploads` — private, patron-submitted content (Phase 3)
- CORS for `stpetemusic.live` and `suiteestudios.com`

Also: uncomment `aws_s3_bucket.listmonk_media` in `infrastructure/backup.tf` to migrate Listmonk media from Docker volume to S3 (prevents data loss if EC2 is rebuilt).

#### PR 2d — Blog + Contact

- `/blog` and `/blog/[slug]` from Payload BlogPosts
- `/media` gallery from Payload Media + S3
- Contact form → Resend → `TheBurgMusic@gmail.com`

---

### Phase 3 — Automation Suite

> **Status: Not Started** | After Phase 2 stable

- n8n: YouTube RSS → auto-create Payload post
- n8n: event day social reminders (Facebook + Instagram)
- n8n: scheduled post publisher cron
- n8n: patron upload flow (Google Drive → Payload)
- YouTube Data API v3 dynamic feed on homepage (replace hardcoded embeds)
- Full-text search across `/discover`
- CloudWatch monitoring + SNS alerts

---

## 6. Architecture Decisions

| Decision | Choice | Reason |
|---|---|---|
| **Frontend hosting** | AWS Amplify SSR | Free tier covers our scale; AWS-native; SSR required for API routes; built-in branch previews; ~$0/mo |
| **Newsletter** | Listmonk (Docker on EC2) | Self-hosted, full control, ~50MB RAM; Docker matches n8n deployment pattern |
| **Newsletter SMTP** | Resend | Domain verified, simple API, generous free tier; SES production access requires business justification |
| **DNS** | Cloudflare (free, DNS-only / grey cloud) | Amplify ACM SSL requires direct DNS resolution — orange cloud breaks SSL |
| **IaC** | OpenTofu | Fork of Terraform, already in production, state in S3 |
| **CMS** | Payload 3.x (Phase 2) | Single PM2 process, no separate server, Next.js native |
| **Database** | RDS PostgreSQL db.t4g.micro | Moved off EC2 Docker for durability + managed backups; free tier eligible Y1 |
| **Linktree API** | Lambda + DynamoDB + API Gateway | ~$0/mo, serverless, no EC2 RAM impact, hourly scrape |
| **Design system** | DESIGN.md | Plain-text brand system AI reads for consistent UI generation |

---

## 7. Memory Budget

**t3.micro = 1GB RAM + 2GB swap**

PostgreSQL is now on RDS — off-instance. EC2 only runs Docker containers.

| Process | Budget | Notes |
|---|---|---|
| n8n | ~1,024MB limit | `mem_limit: 1024m` in docker-compose.prod.yaml |
| Listmonk | ~50MB | Docker container, lean binary |
| nginx | ~20MB | Proxy for n8n + Listmonk |
| **Phase 1 total** | **~1.1GB** | Relies on swap — monitor |
| Payload CMS (Phase 2) | +300MB | `--max-old-space-size=256` in PM2 |
| **Phase 2 total** | **~1.4GB** | Monitor closely; upgrade to t3.small if needed |

If memory pressure: upgrade to t3.small (~$17/mo, 2GB RAM).

---

## 8. n8n Automation Workflows

### Active (Deployed to n8n.stpetemusic.live)

| Workflow | Trigger | Purpose |
|---|---|---|
| `obsidian-post-creator` | Manual / chat | Generate YouTube post metadata → write Obsidian draft |
| `obsidian-to-youtube-posting` | Manual / scheduled 4hr | Publish Obsidian drafts to YouTube + Instagram |
| `youtube-shorts-tracker-creator` | Scheduled | Track and create YouTube Shorts |

### Ready to Deploy (Phase 1.5)

| Workflow | Trigger | Purpose |
|---|---|---|
| `newsletter-draft-creator` | Monthly (1st, 9am ET) + manual | Google Sheets → Claude AI → Obsidian newsletter draft |
| `newsletter-publisher` | Manual | Approved Obsidian draft → Listmonk draft campaign |

### Monthly Newsletter Pipeline (after workflows deployed)

```
1st of month (auto) or manual
  → Read PostSchedule + IG_PastPosts from Google Sheets
  → Claude Sonnet drafts HTML newsletter
  → Writes to Obsidian: StPeteMusic/newsletters/{YYYY}/{MM}-newsletter.md
       status: "draft"

Edit in Obsidian → set status: "approved"

Run Newsletter Publisher (manual)
  → Reads approved draft from Obsidian
  → Creates Listmonk campaign (draft, not sent)
  → Updates Obsidian: status: "queued"

Log into listmonk.stpetemusic.live → Campaigns → Send
```

### Planned (Phase 3)

| Workflow | Trigger | Purpose |
|---|---|---|
| YouTube RSS → Payload post | RSS trigger | Auto-create post when new video published |
| Event day social reminder | Day-of, 10am | Auto-post to Facebook + Instagram on show days |
| Scheduled post publisher | Every 15 min | Publish scheduled Payload posts |

---

## 9. Site Map & Features

### `www.stpetemusic.live`

```
/                       → Landing page ✅ live
  - Hero + inline newsletter signup
  - Upcoming events teaser (3 cards, hardcoded → Phase 2: Payload API)
  - YouTube playlist embed (→ Phase 3: YouTube Data API)
  - Full newsletter section
  - "Find Us Everywhere" Linktree links section ✅ (auto-fetched from API)
  - Social links footer

/events                 → Events calendar stub ✅ built (→ Phase 2: Payload data)
/discover               → Artist directory stub ✅ built (→ Phase 2: Payload data)
/blog                   → Blog / editorial (Phase 2)
/media                  → Photo & video gallery (Phase 2)
/contact                → Contact form → Resend → Gmail (Phase 2)
```

### `linktree-api` (Phase 1.5)

Serverless API returning scraped Linktree data for both brands:
- `GET /linktree` → all profiles (stpetemusic + suite_e_studios)
- `GET /linktree/{profile}` → single profile
- Scraped hourly via EventBridge + Lambda
- Source files: `services/linktree-api/`, `infrastructure/linktree.tf`

### `cms.stpetemusic.live` (Phase 2)

Payload CMS admin — Google SSO, TheBurgMusic@gmail.com only.
Collections: Artists, Venues, Events, Posts, BlogPosts, Media, Subscribers.

---

## 10. Database Schema

RDS PostgreSQL 16 (off-instance). Payload will use `payload_` prefixed tables (no conflicts with existing schema).

### Existing Tables (`database/schema.sql`)

Tables for contacts, social stats, and templates used by n8n workflows.

Notable: `artists` table has `linktree_url` column — Phase 1.5 can populate this from the linktree API.

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

## 11. AWS Infrastructure & Cost Estimate

> Baseline: ~5,000 page views/month, ~1,000 emails/month

| Service | Year 1 (Free Tier) | Year 2+ | Notes |
|---|---|---|---|
| EC2 t3.micro | **$0** | **~$8.50/mo** | n8n + Listmonk + nginx (Docker) |
| EBS 20GB gp3 | **$0** | **~$1.60/mo** | Already provisioned |
| Elastic IP | **$0** | **$0** | Attached to running instance |
| RDS db.t4g.micro | **$0** (free tier) | **~$13/mo** | PostgreSQL — n8n + Listmonk databases |
| S3 Backup Bucket | **$0** | **~$0.10/mo** | n8n backups, 7-day lifecycle |
| S3 Media (Phase 2) | **$0** (5GB free) | **~$0.60/mo** | Images + event media |
| Lambda + DynamoDB (Linktree) | **$0** | **$0** | Well within free tier at this scale |
| AWS Amplify (Next.js SSR) | **Free** | **~$0–2/mo** | 1000 build min/mo + 15GB bandwidth free |
| Cloudflare DNS | **Free** | **Free** | DNS + SSL + DDoS protection |
| Resend SMTP | **Free** | **Free** | 3,000 emails/mo free tier; ~1,000/mo usage |
| Domain stpetemusic.live | **~$10/yr** | **~$10/yr** | Cloudflare Registrar ✅ registered |

| Scenario | Monthly | Annual |
|---|---|---|
| Year 1 | **~$0** | **~$10** (domain only) |
| Year 2+ (EC2 + RDS + S3) | **~$25–27** | **~$305–325** |

---

## 12. Environment Variables Reference

### `apps/web` (AWS Amplify + `.env.local`)

```bash
LISTMONK_API_URL=https://listmonk.stpetemusic.live  # prod; http://localhost:9000 for local
LISTMONK_USERNAME=stpetemusic-newsletter-api         # API user (NOT admin login)
LISTMONK_PASSWORD=                                   # API user access key (from Listmonk Settings → API credentials)
LISTMONK_LIST_ID=3                                   # "StPeteMusic Newsletter" list

# Phase 2
# NEXT_PUBLIC_PAYLOAD_API_URL=https://cms.stpetemusic.live
```

### EC2 `.env` (written by `deploy.yml` from GitHub Secrets)

See `CLAUDE.md` for the full secrets table. Key values:

| GitHub Secret | Purpose |
|---|---|
| `LISTMONK_USERNAME` | Listmonk API user (`stpetemusic-newsletter-api`) |
| `LISTMONK_PASSWORD` | Listmonk API user access key |
| `POSTGRES_USER` | RDS connection for n8n + Listmonk |
| `POSTGRES_PASSWORD` | RDS connection for n8n + Listmonk |

Listmonk credentials also in SSM:
- `/stpetemusic/listmonk/username`
- `/stpetemusic/listmonk/password`

---

*Source of truth for the StPeteMusic project. Update this file when phases complete or priorities shift.*
