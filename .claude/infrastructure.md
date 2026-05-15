---
topic: infrastructure
triggers: aws, amplify, dns, cloudflare, tofu, terraform, ec2, tailscale, hosting, deploy, branch, git, listmonk, newsletter, ssl, ci, cd, admin
updated: 2026-05-06
---

# Infrastructure

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

**Runtime env var gotcha**: Amplify WEB_COMPUTE does NOT inject non-`NEXT_PUBLIC_*` env vars at runtime. Fix: `amplify.yml` writes specific vars to `.env.production` during preBuild, then copies into `.next/` artifact. **Every new server-only env var needs two changes**: (1) add to Amplify console via `AWS_PROFILE=personal aws amplify update-app --app-id d2n0tn0yijqxny --cli-input-json ...`, AND (2) add the corresponding `echo "VAR=$VAR" >> .env.production` line in `amplify.yml`. Missing either step = env var silently absent at runtime → 500/502.

## DNS (Cloudflare — sole DNS provider)
Route 53 hosted zone deleted. All records must be **DNS only (grey cloud — NOT proxied)**:
- `www` and `@` (apex) → `d35nc2e8nr92q9.cloudfront.net`
- `admin` → `d2ltgwfvkan5js.cloudfront.net`
- ACM validation: `_ddf1b33c5eab2d60eddc95848a12d240` → `_bf19e363018afabe1b2e49737993dac9.jkddzztszm.acm-validations.aws`

⚠️ Cloudflare proxy (orange cloud) must stay OFF — Amplify ACM SSL requires direct DNS resolution.
⚠️ `acm_validation` record has `allow_overwrite = true` in cloudflare.tf — safe, it's static after cert issuance.
⚠️ If domain association is deleted+recreated, a **new CloudFront distribution** is issued. You must: delete old CNAME, recreate domain association, add new CNAME, then trigger a fresh build to wire the new distribution.

## n8n Production Server (AWS EC2)
- URL: https://n8n.stpetemusic.live
- Server: EC2 t3.micro (`us-east-1`, free tier)
- SSH: `ssh -i ~/.ssh/stpetemusic-n8n.pem ec2-user@n8n.stpetemusic.live`
- Quick reference: `AWS_SETUP.md` · Full guide: `docs/AWS_DEPLOYMENT.md`

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

## Branch Workflow
| Branch | Purpose | Auto-deploy |
|---|---|---|
| `main` | Production | Amplify (PRODUCTION) |
| `develop` | Staging / integration | Amplify (DEVELOPMENT) |
| `feature/*` | Feature work | No |

Never push directly to `main`. CI: lint + typecheck + test required.
