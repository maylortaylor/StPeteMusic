---
topic: infrastructure
triggers: aws, amplify, dns, cloudflare, tofu, terraform, ec2, tailscale, hosting, deploy, branch, git, listmonk, newsletter, ssl, ci, cd
updated: 2026-04-30
---

# Infrastructure

## Web App (AWS Amplify SSR)
| Item | Value |
|---|---|
| Production URL | https://www.stpetemusic.live |
| Amplify app ID | `d1fjwgk99cbqor` |
| Staging URL | https://develop.d1fjwgk99cbqor.amplifyapp.com |
| Hosting mode | `WEB_COMPUTE` (SSR — required for API routes) |

**Listmonk credential sync**: Amplify's `LISTMONK_USERNAME`/`LISTMONK_PASSWORD` must match SSM values at `/stpetemusic/listmonk/username` and `/stpetemusic/listmonk/password`. Drift → 403 → 500 errors.
**Diagnose**: `https://www.stpetemusic.live/api/newsletter/health`

## DNS (Cloudflare — sole DNS provider)
Route 53 hosted zone deleted. All 3 records must be **DNS only (grey cloud — NOT proxied)**:
- `www` and `@` (apex) → `d35nc2e8nr92q9.cloudfront.net`
- ACM validation CNAME for SSL

⚠️ Cloudflare proxy (orange cloud) must stay OFF — Amplify ACM SSL requires direct DNS resolution.

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
