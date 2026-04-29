# Listmonk Status — StPeteMusic

> Last updated: 2026-04-29
> Branch: `fix/listmonk-startup-order`

This document captures the current state of the Listmonk newsletter feature, what has been completed, what is actively broken, and what the next steps are.

---

## What Listmonk Is

[Listmonk](https://listmonk.app) is a self-hosted newsletter and mailing list manager. It runs as a Docker container alongside n8n on the EC2 instance and is accessible at `https://listmonk.stpetemusic.live`. The Next.js web app calls Listmonk's API when a visitor submits the newsletter signup form.

---

## Architecture (Current)

```
Visitor → stpetemusic.live (Amplify/Next.js)
            → POST /api/newsletter/subscribe
              → Listmonk API (https://listmonk.stpetemusic.live)
                → RDS PostgreSQL (listmonk_stpetemusic database)

EC2 (t3.micro, us-east-1):
  Docker:
    - n8n            → port 5678 (nginx proxies → n8n.stpetemusic.live)
    - listmonk       → port 9000 (nginx proxies → listmonk.stpetemusic.live)

RDS (PostgreSQL 16, db.t4g.micro):
  - n8n              (n8n workflow data)
  - listmonk_stpetemusic  (subscribers, lists, campaigns)
```

Secrets are managed in GitHub Secrets → injected into EC2 `.env` on every deploy. Listmonk credentials are also stored in AWS SSM Parameter Store and read by the deploy script and by OpenTofu (for Amplify env vars).

---

## What Has Been Completed

### Infrastructure
- [x] RDS PostgreSQL 16 instance provisioned via OpenTofu (`infrastructure/database.tf`)
- [x] RDS security group scoped to EC2 only (no public access)
- [x] RDS host stored in SSM (`/stpetemusic/rds/host`) — deploy reads it with retry loop
- [x] `listmonk_stpetemusic` database exists on RDS
- [x] Docker Postgres container removed — both n8n and Listmonk use RDS
- [x] Listmonk credentials in SSM (`/stpetemusic/listmonk/username`, `/stpetemusic/listmonk/password`)

### Docker / Compose
- [x] Listmonk service added to `n8n/docker-compose.prod.yaml`
- [x] SSL mode configured: `LISTMONK_db__ssl_mode=require` (RDS requires SSL)
- [x] Startup command: `echo y | ./listmonk --install --idempotent && ./listmonk`
  - `--idempotent`: skip install if tables already exist (no data wipe on restart)
  - `echo y`: feeds the "continue?" prompt in case of a non-TTY environment

### nginx / TLS
- [x] `n8n/nginx/listmonk.conf` added — proxies `listmonk.stpetemusic.live` → `localhost:9000`
- [x] Deploy writes conf to `/etc/nginx/conf.d/listmonk.conf` and reloads nginx
- [x] Certbot configured for `listmonk.stpetemusic.live`

### CI/CD
- [x] Deploy workflow reads SSM params on EC2 (not injected from GitHub)
- [x] 15-minute retry loop for RDS SSM param (handles tofu-apply race)
- [x] `PGSSLMODE=require` set when running psql commands from deploy
- [x] OpenTofu plan uses `-lock=false` to avoid stale state locks in CI

### Next.js
- [x] `apps/web/src/app/api/newsletter/subscribe/route.ts` — API route built
- [x] `NewsletterSignup.tsx` component built (form with loading/success/error states)
- [x] Amplify env vars set: `LISTMONK_API_URL`, `LISTMONK_LIST_ID=3`, `LISTMONK_USERNAME`, `LISTMONK_PASSWORD`

---

## Current Issue — Listmonk Container Crash Loop

**Symptom:** After every deploy, `docker ps` shows:
```
stpetemusic-listmonk   Restarting (1) 19 seconds ago
```
Exit code `1` means the Listmonk process itself exited non-zero.

**Root cause identified (fix in progress):**  
The deploy script was running `CREATE DATABASE listmonk_stpetemusic` *after* `docker-compose up -d`. Since `docker-compose up -d` is non-blocking, Listmonk started and ran `--install --idempotent` before the database existed on RDS. Result: connection error → exit 1 → restart loop.

**Fix in `fix/listmonk-startup-order` (pending merge):**
```
Before:
  1. docker-compose up -d  ← Listmonk starts, --install fails (DB doesn't exist yet)
  2. CREATE DATABASE listmonk_stpetemusic

After:
  1. CREATE DATABASE listmonk_stpetemusic  ← DB exists before Listmonk starts
  2. docker-compose up -d
```

Also added: `docker logs stpetemusic-listmonk --tail 40` is now printed in the GitHub Actions log after the health check. Any future crash reason will be visible directly in the Actions run output without needing SSH.

---

## What Still Needs to Be Done

### Immediate (unblock Listmonk)
- [ ] Merge `fix/listmonk-startup-order` → `main` and let deploy run
- [ ] Confirm `docker ps` shows `stpetemusic-listmonk   Up X minutes`
- [ ] Confirm `https://listmonk.stpetemusic.live` loads the admin UI
- [ ] Confirm newsletter subscribe form on `https://www.stpetemusic.live` works end-to-end

### Cleanup
- [ ] Remove old orphan `stpetemusic-postgres` Docker container from EC2 if present
  ```bash
  docker rm -f stpetemusic-postgres 2>/dev/null || true
  ```
- [ ] Update `docs/NEWSLETTER_SETUP.md` — it references the old Docker Postgres setup and is now outdated

### SMTP (required before sending any newsletters)
Listmonk is running but can't actually send emails until SMTP is configured in the admin UI.
- Options: **Resend** (free tier: 3k/month) or **AWS SES** (cheapest at scale)
- Configure at: `https://listmonk.stpetemusic.live` → Settings → SMTP
- Verify `stpetemusic.live` domain with whichever provider

### First Login / Admin Setup
- [ ] Log into `https://listmonk.stpetemusic.live` with credentials from SSM
- [ ] Confirm mailing list "StPeteMusic Newsletter" exists (created automatically by deploy if subscriber count was 0)
- [ ] Note the list ID — it should be `3` (that's what `LISTMONK_LIST_ID=3` in Amplify expects)
  - If the ID is different, update `LISTMONK_LIST_ID` in both Amplify env vars and `infrastructure/amplify.tf`

---

## Key Files

| File | Purpose |
|---|---|
| `n8n/docker-compose.prod.yaml` | Listmonk service definition |
| `n8n/nginx/listmonk.conf` | nginx proxy for listmonk.stpetemusic.live |
| `infrastructure/database.tf` | RDS instance + SSM parameter |
| `infrastructure/amplify.tf` | Passes Listmonk creds to Next.js via Amplify env vars |
| `infrastructure/iam.tf` | EC2 IAM policy — SSM read permission |
| `.github/workflows/deploy.yml` | Reads SSM creds, creates DB, starts containers |
| `apps/web/src/app/api/newsletter/subscribe/route.ts` | Next.js API route → Listmonk |
| `apps/web/src/components/NewsletterSignup.tsx` | Frontend form component |

---

## Relevant GitHub Secrets

| Secret | Used For |
|---|---|
| `LISTMONK_USERNAME` | Listmonk admin login + Next.js API auth |
| `LISTMONK_PASSWORD` | Listmonk admin login + Next.js API auth |
| `POSTGRES_USER` | RDS connection for n8n + Listmonk |
| `POSTGRES_PASSWORD` | RDS connection for n8n + Listmonk |

Listmonk credentials also live in SSM:
- `/stpetemusic/listmonk/username`
- `/stpetemusic/listmonk/password`
