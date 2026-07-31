---
topic: infrastructure
triggers: aws, amplify, dns, cloudflare, tofu, terraform, ec2, tailscale, hosting, deploy, branch, git, listmonk, newsletter, ssl, ci, cd, admin, monitoring, alarms, cloudwatch, sns, health, alerting, uptime, gh, github-cli, aws-cli, account, profile, architecture, map, diagram, streaming, rtmp, obs, mediamtx, hls, live, cors, csp, cookies, disk, disk full, no space left, vod-watcher, watchdog
updated: 2026-07-31
---

# Infrastructure

## AWS Architecture Overview

```
Internet
    │
    ▼
[Cloudflare DNS] ──────────────────────────────────────────────────
    │                          │                       │
    ▼                          ▼                       ▼
[CloudFront]            [CloudFront]            [EC2 t3.small]
d35nc2e8nr92q9          d2ltgwfvkan5js          54.235.171.182
    │                          │                nginx (SSL via Let's Encrypt)
    ▼                          ▼                       │
[Amplify SSR]           [Amplify SSR]           ├── n8n.stpetemusic.live
Web App                 Admin App (Clerk auth)  ├── listmonk.stpetemusic.live
d1fjwgk99cbqor          d2n0tn0yijqxny          └── hls.stpetemusic.live
stpetemusic.live        admin.stpetemusic.live          │
    │                          │                   Docker containers
    │                          │                   ├── n8n (automation engine)
    └──────────┬───────────────┘                   ├── listmonk (newsletter)
               │                                   └── mediamtx (RTMP:1935 → HLS)
               ▼
        [RDS PostgreSQL 16]
        stpetemusic-postgres.cmnogyowgoe1.us-east-1.rds.amazonaws.com
        DB: stpetemusic  (web app + admin data)

Supporting infrastructure:
  IaC state:    S3 stpetemusic-terraform-state + DynamoDB stpetemusic-terraform-locks
  Assets CDN:   S3 (AWS_ASSETS_BUCKET) → CloudFront (ASSETS_CDN_URL)
  Monitoring:   CloudWatch alarms → SNS stpetemusic-alerts → theburgmusic@gmail.com
  Admin auth:   Clerk → SSM /stpetemusic/clerk/*
  Newsletter:   SSM /stpetemusic/listmonk/* (creds must match Amplify env vars)
  Streaming:    live.stpetemusic.live → Cloudflare redirect → EC2 mediamtx RTMP/HLS
```

### Service Map

| Service | Public URL | Backed by |
|---|---|---|
| Web app | stpetemusic.live | Amplify `d1fjwgk99cbqor` → CloudFront → Next.js SSR |
| Admin | admin.stpetemusic.live | Amplify `d2n0tn0yijqxny` → CloudFront → Next.js SSR |
| n8n automation | n8n.stpetemusic.live | EC2 `i-03874197d725b0455` → Docker |
| Newsletter | listmonk.stpetemusic.live | EC2 → Docker (listmonk) |
| Live stream redirect | live.stpetemusic.live | Cloudflare redirect ruleset |
| HLS video CDN | hls.stpetemusic.live | EC2 nginx → mediamtx HLS output |
| Database | (internal, no public URL) | RDS PostgreSQL 16 |
| Media assets | ASSETS_CDN_URL (env var) | S3 + CloudFront |

---

## Web App (AWS Amplify SSR)
| Item | Value |
|---|---|
| Production URL | https://www.stpetemusic.live |
| Amplify app ID | `d1fjwgk99cbqor` |
| Staging URL | https://develop.d1fjwgk99cbqor.amplifyapp.com |
| Hosting mode | `WEB_COMPUTE` (SSR — required for API routes) |
| Monorepo root | `apps/web` |

**Listmonk credential sync**: Amplify's `LISTMONK_USERNAME`/`LISTMONK_PASSWORD` must match SSM values at `/stpetemusic/listmonk/username` and `/stpetemusic/listmonk/password`. Drift → 403 → 500 errors.
**Diagnose**: `https://www.stpetemusic.live/api/newsletter/health`
**CloudFront cache headers**: Amplify overrides `next.config.mjs` Cache-Control for public assets (`max-age=5`). Fix via Amplify Custom Headers YAML or CloudFront behaviors — see [`docs/infrastructure/CLOUDFRONT_CACHE_POLICY.md`](../docs/infrastructure/CLOUDFRONT_CACHE_POLICY.md).

## Admin App (AWS Amplify SSR)
| Item | Value |
|---|---|
| Production URL | https://admin.stpetemusic.live |
| Amplify app ID | `d2n0tn0yijqxny` |
| Staging URL | https://develop.d2n0tn0yijqxny.amplifyapp.com |
| Hosting mode | `WEB_COMPUTE` |
| Monorepo root | `apps/admin` |
| CloudFront | `d2ltgwfvkan5js.cloudfront.net` |

Auth via Clerk. Env vars (`CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`) sourced from SSM at `/stpetemusic/clerk/*`.
Database: `stpetemusic` on RDS (`stpetemusic-postgres.cmnogyowgoe1.us-east-1.rds.amazonaws.com`).

**Runtime env var gotcha**: Amplify WEB_COMPUTE does NOT inject non-`NEXT_PUBLIC_*` env vars at runtime. Fix: `amplify.yml` writes specific vars to `.env.production` during preBuild, then copies into `.next/` artifact. **Every new server-only env var needs two changes**: (1) add to `environment_variables` in `infrastructure/amplify.tf` and push to `main` (`tofu-apply.yml` deploys it automatically and then triggers an Amplify redeploy), AND (2) add the corresponding `echo "VAR=$VAR" >> .env.production` line in `amplify.yml`. Missing either step = env var silently absent at runtime → 500/502. ⚠️ **Env var names CANNOT start with `AWS_`** — Amplify rejects the entire update with `BadRequestException: Environment variables cannot start with the reserved prefix "AWS"`. Use alternative prefixes (e.g. `ASSETS_BUCKET` instead of `AWS_ASSETS_BUCKET`). S3/SDK credentials are provided via `iam_service_role_arn` on the Amplify app (see `infrastructure/iam.tf` `aws_iam_role.amplify_admin_ssr`) — do NOT try to pass `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` as env vars.

## DNS (Cloudflare — sole DNS provider)
Route 53 hosted zone deleted. All records must be **DNS only (grey cloud — NOT proxied)**:
- `www` and `@` (apex) → `d35nc2e8nr92q9.cloudfront.net`
- `admin` → `d2ltgwfvkan5js.cloudfront.net`
- ACM validation: `_ddf1b33c5eab2d60eddc95848a12d240` → `_bf19e363018afabe1b2e49737993dac9.jkddzztszm.acm-validations.aws`
- `live` and `livestream` → `192.0.2.1` (dummy IP, proxy ON) — Cloudflare redirect ruleset fires before origin

⚠️ Cloudflare proxy (orange cloud) must stay OFF for Amplify records — ACM SSL requires direct DNS resolution.
⚠️ `acm_validation` record has `allow_overwrite = true` in cloudflare.tf — safe, it's static after cert issuance.
⚠️ If domain association is deleted+recreated, a **new CloudFront distribution** is issued. You must: delete old CNAME, recreate domain association, add new CNAME, then trigger a fresh build to wire the new distribution.
⚠️ Cloudflare API token needs **Zone:Single Redirect:Edit** in addition to DNS:Edit — without it `tofu apply` creates DNS records but fails silently on `cloudflare_ruleset`. See `docs/infrastructure/DNS_CLOUDFLARE.md` for full token permission list.

## Database Migrations

Migrations run **automatically on every deploy to `main`** via `deploy.yml` → SSH → `database/migrate.sh`.

- Runner: `postgres:16-alpine` Docker container, connects to RDS with `PGSSLMODE=require`
- Tracking: `schema_migrations` table in the `stpetemusic` DB records every applied filename
- Idempotent: `apply_if_new` skips already-applied files — safe to redeploy
- **Adding a migration**: drop a `NNN_description.sql` file in `database/migrations/` — it will be auto-discovered and applied on the next deploy. No edits to `migrate.sh` needed.

## n8n Production Server (AWS EC2)
- URL: https://n8n.stpetemusic.live
- Server: EC2 `t3.small` (`i-03874197d725b0455`, `us-east-1`, **not free-tier eligible** — only `t2.micro`/`t3.micro` qualify; resized up from `t3.micro` at some point without this doc being updated)
- Root volume: 20GB `gp3` — keep an eye on usage; recordings pile up locally if `vod-watcher.service` ever stops uploading (see VOD pipeline note below)
- SSH: `ssh -i ~/.ssh/stpetemusic-n8n.pem ec2-user@n8n.stpetemusic.live`
- Quick reference: `AWS_SETUP.md` · Full guide: `docs/AWS_DEPLOYMENT.md`

## Live Streaming (OBS → MediaMTX → CloudFront → /live)

OBS publishes RTMP directly to the EC2 box; MediaMTX ingests it, records it, and serves HLS; CloudFront fronts the HLS for the public `/live` page.

| Item | Value |
|---|---|
| RTMP ingest | `rtmp://stream.stpetemusic.live` (→ EC2 EIP `54.235.171.182:1935`) |
| HLS playback (CDN) | `https://hls.stpetemusic.live/live/index.m3u8` |
| HLS origin (direct, bypasses CDN) | ⚠️ `https://n8n.stpetemusic.live/hls/live/index.m3u8` currently serves n8n's own SPA HTML with a `200`, **not** a manifest — it does not work as an origin-isolation test. Use the CDN URL and read `x-cache` / `Set-Cookie` headers instead, or `docker exec stpetemusic-mediamtx` on the box. |
| RTMP server | MediaMTX (`bluenviron/mediamtx`), `n8n/docker-compose.prod.yaml` + `n8n/mediamtx/mediamtx.yml` |
| Stream key source of truth | SSM `/stpetemusic/streaming/rtmp_stream_key` + GitHub secret `RTMP_STREAM_KEY` (kept in sync — both written together by `infrastructure/streaming.tf` / deploy) |
| CloudFront distribution | `infrastructure/streaming.tf` → `aws_cloudfront_distribution.hls_stream` |

⚠️ **Server-side recording is OFF** (`record: no` in `mediamtx.yml`, set 2026-07-31). The 20 GB
root volume cannot safely hold a long stream: a recording is only closed — and only then
uploadable/deletable by `vod-watcher` — at `recordSegmentDuration`, which defaults to **1h**. An
in-progress hour accumulates with nothing able to reclaim it (`disk-watchdog` deliberately never
purges an in-progress recording), so at ~20 GB/h the ~12 GB free is gone in ~30 min and RTMP/HLS
drop mid-show. OBS records locally and Restream keeps a copy, so the EC2 copy was a redundant
third. `recordSegmentDuration: 5m` is pre-set so re-enabling (`record: yes`) is bounded from the
start — **do not fall back to the 1h default**. Before re-enabling for a multi-hour stream, check
`df -h /` has room for several segments. HLS itself is served from RAM (no `hlsDirectory`), so
viewers never consume disk.

**Correct OBS settings**: Server `rtmp://stream.stpetemusic.live` · Stream Key `live?user=stream&pass=<RTMP_STREAM_KEY value>`. MediaMTX's internal RTMP auth takes credentials as a query string on the path (`user`/`pass`), **not** the `rtmp://user:pass@host` userinfo form, and **not** OBS's separate "Use Authentication" username/password fields (unconfirmed/unsupported by MediaMTX — leave that checkbox off).

**9 bugs fixed 2026-06-21 onward (PRs #236-#242, #254, + healthcheck fix 2026-07-31) — read before touching this pipeline again:**

1. **MediaMTX does not expand `${VAR}` syntax inside its own `mediamtx.yml`.** `pass: "${RTMP_STREAM_KEY}"` in the file is a *literal string* unless something substitutes it first — Docker Compose's `environment:` block only sets the var inside the container process, not inside this mounted file. `deploy.yml`'s "Injecting RTMP_STREAM_KEY into MediaMTX config" step does a real string-replace on the EC2 host after syncing the file, before `docker-compose up`. If you ever see auth fail with a correct key, check this step actually ran (`gh run view <id> --log | grep Injecting`) and that the placeholder wasn't reverted into the live config by mistake.
2. **CloudFront must whitelist the `cookieCheck` and `hlsSession` cookies** (`forwarded_values.cookies` in `streaming.tf`, both cache behaviors) — MediaMTX's HLS server round-trips these to track viewer sessions; `forward = "none"` silently strips `Set-Cookie` and the manifest 302-redirect-loops forever.
3. **CloudFront must also forward the query string** (`query_string = true`, not `false`) — MediaMTX's redirect target is `?cookieCheck=1`, and the origin requires *both* the cookie and that query param together to return `200`.
4. **`n8n/nginx/n8n.conf`'s `/hls/` location must NOT add its own `Access-Control-Allow-Origin` header.** MediaMTX (configured `hlsAllowOrigin: '*'`) already correctly reflects the request's specific `Origin` for credentialed requests; nginx adding a second static `*` header produces two ACAO headers, which browsers hard-reject for cookie-bearing (credentialed) requests.
5. **MediaMTX does not support `HEAD` requests on the HLS manifest endpoint — always `404`s, regardless of live status.** Any health/liveness check against `.../live/index.m3u8` must use `GET` (and replay the cookie-redirect manually if not using a real browser/`curl -L -b/-c`, since plain `fetch()` has no auto cookie jar across redirects).
6. **The site's CSP needs `media-src` and `connect-src` to include `https://hls.stpetemusic.live`** (`apps/web/next.config.mjs`) — without it the browser blocks the cross-origin media load at the security-policy layer, before CORS/cookies are even evaluated. Symptom: player renders but shows nothing; console shows `Media load rejected by URL safety check`.
7. **Browsers only allow unmuted autoplay after a user gesture.** `apps/web/src/components/LivePlayer.tsx` explicitly sets `video.muted = true` in JS (not just the JSX attribute, which races against the dynamically-attached source) and calls `.play()` once the source is ready, with an "Unmute the stream" overlay button.
8. **`vod-watcher.service` (uploads recordings to S3) crash-looped for ~5 weeks (~307k restarts) on `Permission denied` watching `/var/lib/docker/volumes/n8n_recordings/_data`.** Root cause was **not** SELinux (it's in permissive/non-enforcing mode on this host — checked `getenforce`, it logs AVC denials but doesn't block anything). The real cause: `/var/lib/docker` itself is mode `710` root:root, so `ec2-user` (who the service runs as) has zero permission to traverse into it, regardless of permissions deeper in the tree. Fixed with a targeted ACL: `setfacl -m u:ec2-user:x /var/lib/docker` (doesn't touch Docker's own permission bits or affect other users). Separately, `vod-watcher.sh` never deleted the local file after a successful upload or checked the upload actually succeeded — fixed in PR #254 to delete on confirmed success and keep the file for retry on failure. Until that PR is deployed, every stream's recordings will keep accumulating on the 20GB root volume — watch disk usage (`df -h /` was at 76% after one ~2hr stream). ⚠️ The "many small fragments" seen on past streams were **not** caused by a flaky connection — that was bug #9 below.

9. **A healthcheck that names a binary the image doesn't have will get the container killed every ~2 minutes, forever.** `mediamtx`'s healthcheck probed `wget http://127.0.0.1:9997/v3/paths/list`, but the `bluenviron/mediamtx` image is **distroless — no `wget`, no `curl`, no shell** (`exec: "wget": executable file not found in $PATH`), and `mediamtx.yml` never sets `api:` (defaults to `no`), so nothing listened on `:9997` either. The check could never pass → container marked `unhealthy` after 3×30s → `autoheal` (`AUTOHEAL_CONTAINER_LABEL=all`) restarted it → repeat. **Every stream was silently chopped into ~2-minute fragments and dropped for viewers each time** (the 2026-07-25 show produced 120 files in `s3://stpetemusic-vod/`, each ~2 min apart). `stpetemusic-listmonk` had the same class of bug — its probe hit `/api/health`, which now requires auth and returns `403`; the unauthenticated endpoint is `/health`. Fixed by probing with the binary the image actually ships (`/mediamtx --version`) and using listmonk's `/health`. **Always `docker exec` a proposed healthcheck against the real image before committing it.** To spot this: `docker inspect <c> --format '{{.State.StartedAt}}'` twice a few minutes apart — if it moves, something is restarting the container.

Full root-cause writeup: see Claude memory `project_live_streaming_fixes.md` (cross-session, not in this repo).

**Disk-full outage 2026-07-19 + durable auto-cleanup (feature/ec2-disk-cleanup-hardening):** the 20 GB root
volume hit 100% from accumulated recordings → RTMP `:1935` refused, HLS 502, `/live` blank. Root cause of the
recurrence: `deploy.yml` set up `vod-watcher.service` (uploads recordings to S3 then deletes) but **never granted
the `setfacl -m u:ec2-user:x /var/lib/docker` ACL** it needs to traverse into the recordings volume (dir is
`710 root:root`), so it silently crash-looped. Fixes: (1) `vod-watcher.service` now has
`ExecStartPre=+/usr/bin/setfacl …` so the ACL self-heals on every start/reboot; (2) new `scripts/disk-watchdog.sh`
on a 10-min systemd timer purges recordings >6 h (emergency purge of finished recordings when disk >80%, never
touching an in-progress one) and publishes a `StPeteMusic/Host DiskUsedPercent` custom metric; (3) new
`stpetemusic-ec2-disk-high` CloudWatch alarm (85%, `treat_missing_data=breaching`) pages before the wedge. Recovery
runbook when it's already 100% full (SSH + SSM output both hang): use SSM `AWS-RunShellScript` and encode the
resulting `df` percent in the script's `exit` code (`exit $(df --output=pcent / | tail -1 | tr -dc 0-9)`) since
`ResponseCode` propagates even when output capture can't write — then purge `*.mp4`/`*.ts` under
`/var/lib/docker/volumes`, `docker-compose … up -d`, reapply the ACL, restart `vod-watcher`.

**Debugging approach that worked**: test each layer independently with `curl` — origin (`n8n.stpetemusic.live/hls/...`) vs. CDN (`hls.stpetemusic.live/...`) separately to isolate CloudFront-only issues — then use a headless browser (Playwright is already a devDependency) for anything `curl` can't see: CORS, CSP, cookie credentials, autoplay policy. Several of these bugs were invisible to `curl` and only manifested in real browser enforcement.

## OpenTofu (IaC)
- State: S3 bucket `stpetemusic-terraform-state` · Lock: DynamoDB `stpetemusic-terraform-locks`
- **Rule**: Never edit AWS resources manually — always change `.tf` files and let CI apply
- Run: `cd infrastructure && AWS_PROFILE=personal tofu plan` / `tofu apply`
- Managed: Security Group `sg-03a69e68cf7077cf3`, EC2 `i-03874197d725b0455`, EIP `eipalloc-0a2ebbeef75ce8009`
- **Local import**: use `infrastructure/import-vars.tfvars` (gitignored) with dummy values to satisfy required var validations — `tofu import -var-file=import-vars.tfvars '<resource>' <id>`
- **Stale lock**: if `tofu import` fails with lock error, run `tofu force-unlock <lock-id>` and type `yes`

## Tailscale (Mac ↔ EC2 VPN)
Encrypted tunnel so n8n on EC2 can reach Obsidian on your Mac.
- Mac IP: `tailscale ip -4` (do NOT hardcode in docs)
- All Obsidian nodes use `{{ $env.OBSIDIAN_HOST }}` = `http://<TAILSCALE_IP>:27123`
- If Obsidian nodes fail: verify Tailscale is active + Obsidian Local REST API plugin is running

## Monitoring & Alerting

### CloudWatch Alarms → SNS → theburgmusic@gmail.com
Defined in `infrastructure/alarms.tf` (merged PR #199). Six alarms, all free tier:

| Alarm | Threshold | Namespace |
|---|---|---|
| `stpetemusic-rtmp-unhealthy` | Route53 TCP:1935 status < 1 for 3 min | AWS/Route53 |
| `stpetemusic-ec2-cpu-high` | CPU > 85% for 10 min | AWS/EC2 |
| `stpetemusic-ec2-status-check-failed` | StatusCheckFailed > 0 for 2 min | AWS/EC2 |
| `stpetemusic-rds-cpu-high` | CPU > 80% for 10 min | AWS/RDS |
| `stpetemusic-rds-storage-low` | FreeStorageSpace < 2 GB | AWS/RDS |
| `stpetemusic-cloudfront-5xx-high` | 5xxErrorRate > 5% for 10 min | AWS/CloudFront |

SNS topic: `stpetemusic-alerts` — view ARN in `tofu output alerts_sns_topic_arn`.
**After any `tofu apply` that creates the SNS subscription**: check `theburgmusic@gmail.com` for AWS confirmation email and click the link — alarms won't fire until confirmed.

### Post-Deploy Smoke Tests (CI)
- `deploy.yml` — after EC2 deploy: curls `n8n.stpetemusic.live/healthz` and `listmonk.stpetemusic.live/api/health`
- `amplify-deploy.yml` — after Amplify builds: curls `www.stpetemusic.live/api/health`, `admin.stpetemusic.live/api/health`, `hls.stpetemusic.live`

### n8n Health Monitor Workflow
File: `n8n/workflows/StPeteMusic/health-monitor.json`
- Runs every 15 min on the EC2 n8n instance
- Pings all 5 HTTPS endpoints (web app, admin, n8n, listmonk, HLS CDN)
- Emails `theburgmusic@gmail.com` via Resend if any fail
- Subject format: `[StPeteMusic] ALERT: N endpoint(s) down` (Gmail-filterable)
- **Must be manually activated** in the n8n UI after first deploy: https://n8n.stpetemusic.live
- RTMP (TCP:1935) is NOT checked here — covered by Route53 + CloudWatch alarm

### Health Endpoints
| URL | What it checks |
|---|---|
| `https://www.stpetemusic.live/api/health` | Web app alive + env var presence |
| `https://admin.stpetemusic.live/api/health` | Admin app alive + env var presence |
| `https://n8n.stpetemusic.live/healthz` | n8n container healthy |
| `https://listmonk.stpetemusic.live/api/health` | Listmonk API healthy |
| `https://www.stpetemusic.live/api/newsletter/health` | Listmonk connectivity (deep check) |

### Gmail Filter Setup (One-time)
Add these at gmail.com/settings/filters → label `StPeteMusic/Alarms`, mark important:
1. `from:(no-reply@sns.amazonaws.com) (stpetemusic)` — CloudWatch alarm emails
2. `from:(hello@stpetemusic.live) subject:(🚨 StPeteMusic)` — n8n health monitor emails

## Branch Workflow
| Branch | Purpose | Auto-deploy |
|---|---|---|
| `main` | Production | Amplify (PRODUCTION) |
| `develop` | Staging / integration | Amplify (DEVELOPMENT) |
| `feature/*` | Feature work | No |

Never push directly to `main`. CI: lint + typecheck + test required.

---

## CLI Quick Reference

> Verify both accounts before running any destructive command.

### AWS CLI — always use `--profile personal`

- IAM user: `maylortaylor` · Profile: `personal` · Region: `us-east-1`
- `direnv` auto-sets `AWS_PROFILE=personal` when you `cd` into this project — no flag needed locally
- In GitHub Actions, AWS creds are injected via GitHub Secrets — no profile flag needed in CI

| Task | Command |
|---|---|
| Verify identity | `aws sts get-caller-identity --profile personal` |
| Check direnv set it | `echo $AWS_PROFILE` (should print `personal`) |
| Trigger Amplify build | `aws amplify start-job --app-id <APP_ID> --branch-name main --job-type RELEASE --profile personal` |
| List Amplify builds | `aws amplify list-jobs --app-id <APP_ID> --branch-name main --profile personal` |
| Update Amplify env var | `aws amplify update-app --app-id <APP_ID> --environment-variables KEY=VALUE --profile personal` |
| Read SSM secret | `aws ssm get-parameter --name /stpetemusic/<key> --with-decryption --profile personal` |
| List IaC state bucket | `aws s3 ls s3://stpetemusic-terraform-state --profile personal` |
| Check EC2 status | `aws ec2 describe-instances --instance-ids i-03874197d725b0455 --query 'Reservations[].Instances[].State.Name' --profile personal` |
| List CloudWatch alarms | `aws cloudwatch describe-alarms --alarm-name-prefix stpetemusic --profile personal` |

Amplify app IDs: web = `d1fjwgk99cbqor` · admin = `d2n0tn0yijqxny`

### GitHub CLI — `maylortaylor` account

| Task | Command |
|---|---|
| Verify account | `gh auth status` (must show `maylortaylor`) |
| List recent CI runs | `gh run list --repo maylortaylor/StPeteMusic` |
| Watch a run live | `gh run watch <run-id>` |
| View run logs | `gh run view <run-id> --log` |
| List repo secrets | `gh secret list --repo maylortaylor/StPeteMusic` |
| Set a secret | `gh secret set SECRET_NAME --repo maylortaylor/StPeteMusic` |
| Open a PR | `gh pr create --base main` |
