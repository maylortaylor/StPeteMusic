# Listmonk Status — StPeteMusic

> Last updated: 2026-04-30
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

## Newsletter Subscribe — Fixed (2026-04-30)

The subscribe form on `www.stpetemusic.live` was returning HTTP 500. Root cause and fix:

**Root cause:** Triple mismatch between Listmonk, SSM, and Amplify credentials:
1. SSM had username `stpetemusic-listmonk-admin` — but Listmonk's API user is `stpetemusic-newsletter-api`
2. SSM had an incorrect/default password that didn't match the API user's key
3. Amplify was reading from SSM, so it was sending wrong credentials to Listmonk → 403 → 500

**What Listmonk API auth actually uses:**
- The API does **not** use the admin login credentials (those are session-based for the UI only)
- The API uses a **dedicated API user** created in the Listmonk admin panel under Settings → API credentials
- The API user for this project is `stpetemusic-newsletter-api`

**Fix applied (2026-04-30):**
1. Updated SSM `/stpetemusic/listmonk/username` → `stpetemusic-newsletter-api`
2. Updated SSM `/stpetemusic/listmonk/password` → the API user's access key (from Listmonk Settings)
3. Updated Amplify env vars directly via AWS CLI with the correct SSM values
4. Triggered Amplify rebuild (job #76) — build succeeded
5. Verified: `GET /api/newsletter/health` returns `status: 409` (credentials accepted; test email already exists)

**To rotate the API key in the future:**
1. Login to `https://listmonk.stpetemusic.live` → Settings → API credentials → regenerate key
2. Update GitHub Secret `LISTMONK_PASSWORD` to the new key
3. Run `cd infrastructure && AWS_PROFILE=personal tofu apply` (pushes to SSM + Amplify)
4. Trigger Amplify rebuild or push to main

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

## Pending — Startup Order Fix (fix/listmonk-startup-order, not yet merged)

The subscribe form is now working (credentials fixed), but the `fix/listmonk-startup-order` branch should still be merged to prevent future deploy crashes.

**What the branch fixes:**
- `echo y` piped to listmonk install command (prevents TTY hang on non-interactive Docker)
- `CREATE DATABASE listmonk_stpetemusic` moved to run **before** `docker-compose up -d` (previously ran after — race condition on fresh deploys)
- Deploy race condition fixes, auto-start systemd service, EC2 access improvements
- Docker logs printed in CI output after health check (no SSH needed to debug crashes)

**The original crash loop:**
The deploy script was running `CREATE DATABASE listmonk_stpetemusic` *after* `docker-compose up -d`. Since compose is non-blocking, Listmonk started and ran `--install --idempotent` before the database existed on RDS → connection error → exit 1 → restart loop.

Now that the database tables already exist, `--idempotent` skips the install step and Listmonk starts fine. But the next time the database is wiped or a fresh EC2 is provisioned, this race will resurface. Merge the branch to prevent it.

---

## What Still Needs to Be Done

### Immediate
- [x] ~~Confirm `https://listmonk.stpetemusic.live` loads the admin UI~~ ✓ working
- [x] ~~Confirm newsletter subscribe form on `https://www.stpetemusic.live` works end-to-end~~ ✓ fixed 2026-04-30
- [ ] Merge `fix/listmonk-startup-order` → `main` (startup order + race condition fixes)

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
