# Skill: manage_infra — @infra

## Objective

Manage all AWS infrastructure, CI/CD, DNS, and server operations using infrastructure-as-code only. Never touch the AWS console.

---

## Rules of Engagement

- **Never use the AWS console for infrastructure changes** — all changes via OpenTofu/Terraform in `infrastructure/`
- **Cloudflare DNS must stay "DNS only" (grey cloud)** — never enable orange cloud proxy. Amplify ACM requires direct DNS resolution. Enabling proxy breaks SSL certificate validation.
- **Amplify env var rule:** Non-`NEXT_PUBLIC_` vars must be written to `.env.production` in Amplify preBuild — see `amplify.yml`. Changing them in Amplify console alone is not enough.
- **Listmonk credential sync:** `LISTMONK_USERNAME` / `LISTMONK_PASSWORD` in Amplify env vars must match SSM values at `/stpetemusic/listmonk/{username,password}`. Drift causes 403/500 errors. If credentials don't match, update SSM first, then update Amplify env vars.
- Always run `tofu plan` before `tofu apply` — show the plan to the user before applying
- Never push directly to `main` — all infrastructure changes via PR with CI pass

---

## Infrastructure Reference

| Resource | Details |
|----------|---------|
| Web App | Amplify SSR · app ID: `d1fjwgk99cbqor` → `stpetemusic.live` |
| Admin App | Amplify SSR · app ID: `d2n0tn0yijqxny` → `admin.stpetemusic.live` |
| Database | RDS PostgreSQL 16 · `stpetemusic-postgres.cmnogyowgoe1.us-east-1.rds.amazonaws.com` |
| n8n Server | EC2 t3.micro · `54.235.171.182` → `n8n.stpetemusic.live` |
| DNS | Cloudflare (DNS only — never proxy) |
| State | S3 `stpetemusic-terraform-state` + DynamoDB lock table |

---

## Instructions

### For OpenTofu/Terraform Changes

1. Read `infrastructure/` to understand the current state
2. Make changes to the relevant `.tf` files
3. Run `tofu plan` — present output to user
4. Wait for user approval before `tofu apply`
5. After apply, verify the resource in AWS CLI (not console)

### For Amplify Deployments

1. Deployments trigger automatically from `main` branch push (via `.github/workflows/deploy.yml`)
2. To trigger manual deploy: use Amplify CLI or push a commit
3. If env vars need updating: update in Amplify console AND check if SSM sync is needed

### For EC2 / n8n Operations

```bash
# SSH into n8n server
ssh -i ~/.ssh/stpetemusic-n8n.pem ec2-user@n8n.stpetemusic.live

# Restart n8n
cd ~/stpetemusic/n8n
docker-compose -f docker-compose.prod.yaml --env-file ../.env up -d

# Deploy updated workflows
scp -i ~/.ssh/stpetemusic-n8n.pem -r \
  ./n8n/workflows/StPeteMusic/ \
  ec2-user@n8n.stpetemusic.live:~/stpetemusic/n8n/workflows/
```

### For DNS Changes

1. All DNS managed in Cloudflare dashboard (account: TheBurgMusic@gmail.com)
2. Never enable proxy (orange cloud) on any Amplify-pointed records
3. After DNS change, verify propagation: `dig stpetemusic.live` or `nslookup`
4. SSL cert validation can take 5–30 minutes after DNS propagation

---

## Files to Know

- `infrastructure/` — all OpenTofu resource definitions
- `amplify.yml` — Amplify build config (preBuild env var injection)
- `.github/workflows/deploy.yml` — CI/CD pipeline
- `.claude/infrastructure.md` — full AWS stack reference
- `.env.example` — all env var documentation
