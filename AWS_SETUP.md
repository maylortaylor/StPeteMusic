## Amplify Custom Domain — Troubleshooting Notes (stpetemusic.live)

### Problem Summary
SSL creation/configuration kept failing when adding `stpetemusic.live` as a custom domain in AWS Amplify.

### Root Causes Identified

**1. Wrong CloudFront distribution in Cloudflare DNS**
Every time you delete and re-add the domain in Amplify, AWS creates a **new** CloudFront distribution with a different URL. The `www` CNAME in Cloudflare must be updated each time to the new URL shown in **Amplify → Actions → View DNS Records**.

**2. Cloudflare CNAME flattening at root domain**
Cloudflare silently converts CNAME records at the root/apex domain (`stpetemusic.live`) into A records (CNAME Flattening). AWS ACM cannot validate against a flattened A record, causing SSL configuration to hang for hours then timeout.
- **Fix:** Use `www` as the only active subdomain in Amplify. Enable the "Setup redirect from stpetemusic.live to www.stpetemusic.live" checkbox. Click "Exclude root" to remove the root as an active subdomain.

**3. Stale CloudFront alias lock**
When Amplify deletes a domain, the underlying CloudFront distribution takes **5–15 minutes** to fully release the `www.stpetemusic.live` alias. Re-adding the domain immediately causes a new error: "DNS record points to another CloudFront distribution."
- **Fix:** After deleting the domain in Amplify, wait at least 10 minutes before re-adding it.

### Correct Cloudflare DNS Records

| Type | Name | Content | Proxy Status |
|---|---|---|---|
| CNAME | `_ddf1b33c5eab2d60eddc95848a12d240` | `_bf19e363018afabe1b2e49737993dac9.jkddzztszm.acm-validations.aws.` | DNS only |
| CNAME | `www` | `<CloudFront URL from Amplify View DNS Records>` | DNS only ✅ |

> ⚠️ Do NOT add a CNAME for the root `stpetemusic.live` — Cloudflare will flatten it and break SSL validation.
> ⚠️ Do NOT enable Cloudflare proxy (orange cloud) — Amplify's CloudFront handles CDN/SSL.

### Correct Amplify Domain Configuration

- Domain: `stpetemusic.live`
- Active subdomains: `www → main` only (root excluded)
- Redirect: `https://stpetemusic.live → https://www.stpetemusic.live` ✅ checked
- SSL: Amplify managed certificate

### Step-by-Step Fix Process

1. In Amplify → Custom Domains → **Delete** the existing `stpetemusic.live` domain
2. **Wait 10+ minutes** for AWS to release the CloudFront alias lock
3. In Cloudflare → DNS → delete the `stpetemusic.live` root CNAME (keep `www` and ACM verification CNAME)
4. In Amplify → Add domain → type `stpetemusic.live` → Configure domain
5. Click **"Exclude root"** to remove root from active subdomains
6. Ensure `www → main` is set and redirect checkbox is checked
7. Click **Add domain**
8. Immediately go to **Actions → View DNS Records** — copy the new CloudFront URL (e.g. `dXXXXXXXXXX.cloudfront.net`)
9. In Cloudflare → update `www` CNAME to the new CloudFront URL
10. Wait 5–15 minutes for SSL creation and configuration to complete

### Amplify App Details

| Resource | Value |
|---|---|
| Amplify App ID | `d1fjwgk99cbqor` |
| App Name | stpetemusic-web |
| Default Domain | `d1fjwgk99cbqor.amplifyapp.com` |

# AWS Setup — Quick Reference

Current infrastructure for the StPeteMusic n8n automation server.

> For the full step-by-step guide to rebuild from scratch, see `docs/AWS_DEPLOYMENT.md`.

---

## Current Infrastructure

| Resource | Value |
|---|---|
| **AWS Account** | `767350869653` (maylortaylor personal) |
| **Region** | `us-east-1` |
| **EC2 Instance** | `i-03874197d725b0455` (t3.micro) |
| **Elastic IP** | `54.235.171.182` |
| **Security Group** | `sg-03a69e68cf7077cf3` |
| **SSH Key** | `~/.ssh/stpetemusic-n8n.pem` |
| **DuckDNS Domain** | `n8n-stpetemusic.duckdns.org` |
| **n8n URL** | https://n8n-stpetemusic.duckdns.org |
| **SSL Cert** | Let's Encrypt via Certbot (expires June 7, 2026, auto-renews) |

---

## Server Stack

```
EC2 t3.micro (Amazon Linux 2023)
  ├── nginx 1.28          — reverse proxy, handles HTTPS
  ├── Certbot             — Let's Encrypt SSL, auto-renews every 12h via cron
  ├── Tailscale           — VPN tunnel to Mac (for Obsidian Local REST API)
  └── Docker 25
        └── n8nio/n8n:latest
              ├── volume: n8n_data      → /home/node/.n8n (workflows, credentials, DB)
              └── volume: local-files   → ~/stpetemusic/n8n/local-files/ (CSV, MD files)
```

---

## SSH Access

```bash
ssh -i ~/.ssh/stpetemusic-n8n.pem ec2-user@n8n-stpetemusic.duckdns.org
```

> Key file must have permissions `400`: `chmod 400 ~/.ssh/stpetemusic-n8n.pem`

---

## n8n Management

All commands run **inside SSH** unless noted.

```bash
# View running containers
docker ps

# Live n8n logs
docker logs -f n8n

# Restart n8n
docker restart n8n

# Stop n8n
cd ~/stpetemusic/n8n
docker-compose -f docker-compose.prod.yaml --env-file ../.env down

# Start n8n
cd ~/stpetemusic/n8n
docker-compose -f docker-compose.prod.yaml --env-file ../.env up -d

# Update n8n to latest version
docker pull n8nio/n8n:latest
cd ~/stpetemusic/n8n
docker-compose -f docker-compose.prod.yaml --env-file ../.env up -d
```

---

## Update Environment Variables

```bash
# Edit the .env file on the server
nano ~/stpetemusic/.env

# Restart n8n to apply changes
cd ~/stpetemusic/n8n
docker-compose -f docker-compose.prod.yaml --env-file ../.env up -d
```

---

## nginx Management

```bash
# Check nginx status
sudo systemctl status nginx

# Test nginx config before reloading
sudo nginx -t

# Reload nginx (apply config changes without downtime)
sudo systemctl reload nginx

# nginx config location
sudo nano /etc/nginx/conf.d/n8n.conf
```

---

## SSL Certificate

```bash
# Check cert status and expiry
sudo certbot certificates

# Manually renew (normally auto-renews via cron)
sudo certbot renew

# Test auto-renewal
sudo certbot renew --dry-run
```

Auto-renewal cron runs every 12 hours:
```
0 */12 * * * /usr/local/bin/certbot renew --quiet && systemctl reload nginx
```

---

## Backup n8n Data

```bash
# On EC2 — backup n8n volume to a tar file
docker run --rm \
  -v n8n_data:/source \
  -v ~/backups:/backup \
  alpine tar czf /backup/n8n-backup-$(date +%Y%m%d).tar.gz -C /source .

# From your Mac — copy backup down
scp -i ~/.ssh/stpetemusic-n8n.pem \
  ec2-user@n8n-stpetemusic.duckdns.org:~/backups/n8n-backup-*.tar.gz \
  ~/Downloads/
```

---

## Deploy Updated Workflows

```bash
# From your Mac — copy local workflows to server
scp -i ~/.ssh/stpetemusic-n8n.pem -r \
  /Users/matttaylor/Documents/_dev/maylortaylor/StPeteMusic/n8n/workflows/StPeteMusic/ \
  ec2-user@n8n-stpetemusic.duckdns.org:~/stpetemusic/n8n/workflows/

# Then import in n8n UI at https://n8n-stpetemusic.duckdns.org
```

---

## DuckDNS Update

If the Elastic IP ever changes (shouldn't happen, but just in case):

1. Go to https://www.duckdns.org
2. Update `n8n-stpetemusic` → new IP
3. Or via curl (get your token from duckdns.org after login):
```bash
curl "https://www.duckdns.org/update?domains=n8n-stpetemusic&token=YOUR_TOKEN&ip=NEW_IP"
```

---

## AWS CLI Commands (from your Mac)

```bash
# Check instance is running
aws ec2 describe-instances \
  --instance-ids i-03874197d725b0455 \
  --query 'Reservations[0].Instances[0].State.Name' \
  --profile personal --region us-east-1

# Start instance (if stopped)
aws ec2 start-instances \
  --instance-ids i-03874197d725b0455 \
  --profile personal --region us-east-1

# Stop instance (saves money, but n8n goes offline)
aws ec2 stop-instances \
  --instance-ids i-03874197d725b0455 \
  --profile personal --region us-east-1

# View current month estimated cost
aws ce get-cost-and-usage \
  --time-period Start=$(date +%Y-%m-01),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --profile personal
```

---

## Cost Reference

| Resource | Free Tier | After 12 Months |
|---|---|---|
| EC2 t3.micro | Free (750 hrs/mo) | ~$8.35/mo |
| EBS 20GB gp3 | Free (30GB included) | Free |
| Elastic IP | Free (while attached) | Free |
| DuckDNS | Free forever | Free |
| Let's Encrypt SSL | Free forever | Free |
| **Total** | **$0** | **~$8-10/mo** |

> After free tier ends, consider switching to `t4g.nano` (ARM, ~$3/mo) if n8n performs well.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| 502 Bad Gateway | n8n not running — `docker ps`, then `docker restart n8n` |
| Can't SSH | Check `.pem` permissions (`chmod 400`); verify Security Group has port 22 open |
| SSL cert error | `sudo certbot renew`; check expiry with `sudo certbot certificates` |
| Webhook not firing | Verify `WEBHOOK_URL=https://n8n-stpetemusic.duckdns.org/` in `.env` |
| n8n won't start | `docker logs n8n` to see errors; check `.env` has `N8N_ENCRYPTION_KEY` set |

---

## Tailscale (Mac ↔ EC2 VPN)

Tailscale creates an encrypted tunnel so n8n on EC2 can reach Obsidian running on your Mac.

| Device | Tailscale IP |
|---|---|
| Mac (maylortaylor) | run `tailscale ip -4` on your Mac |
| EC2 server | assigned automatically |

**Obsidian Local REST API** must be running on your Mac (port 27123) for Obsidian workflow nodes to work.

```bash
# Verify the tunnel is alive from EC2
ping -c 2 $(tailscale ip -4)

# Check Tailscale status on EC2
sudo tailscale status
```

If the tunnel drops (rare), on EC2: `sudo tailscale up`

---

## OBSIDIAN_HOST Environment Variable

Workflows use `{{ $env.OBSIDIAN_HOST }}` for all Obsidian API calls.

| Environment | Value |
|---|---|
| Local dev (`docker-compose.yaml`) | `http://host.docker.internal:27123` (hardcoded) |
| Production (`docker-compose.prod.yaml`) | `http://<TAILSCALE_IP>:27123` (from server `.env` — run `tailscale ip -4` on your Mac) |

To update the production value:
```bash
# SSH in and edit .env
ssh -i ~/.ssh/stpetemusic-n8n.pem ec2-user@n8n-stpetemusic.duckdns.org
nano ~/stpetemusic/.env  # update OBSIDIAN_HOST=
docker restart n8n
```

---

## Terraform State Backend

Terraform remote state is stored in S3 with DynamoDB locking.

| Resource | Value |
|---|---|
| **S3 Bucket** | `stpetemusic-terraform-state` |
| **State Key** | `stpetemusic/terraform.tfstate` |
| **DynamoDB Table** | `stpetemusic-terraform-locks` |
| **Region** | `us-east-1` |
| **Profile** | `personal` |

Bootstrap commands (run once, manually — already done):

```bash
# Create state bucket
aws s3api create-bucket --bucket stpetemusic-terraform-state --region us-east-1 --profile personal

# Enable versioning
aws s3api put-bucket-versioning --bucket stpetemusic-terraform-state \
  --versioning-configuration Status=Enabled --profile personal

# Enable encryption
aws s3api put-bucket-encryption --bucket stpetemusic-terraform-state \
  --server-side-encryption-configuration \
  '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}' \
  --profile personal

# Block public access
aws s3api put-public-access-block --bucket stpetemusic-terraform-state \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" \
  --profile personal

# Create DynamoDB lock table
aws dynamodb create-table --table-name stpetemusic-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST --region us-east-1 --profile personal
```

## Terraform Workflow

```bash
cd infrastructure

# First-time setup
terraform init

# Import existing resources (one-time, already done)
terraform import aws_security_group.n8n sg-03a69e68cf7077cf3
terraform import aws_instance.n8n i-03874197d725b0455
terraform import aws_eip.n8n eipalloc-0a2ebbeef75ce8009

# Normal workflow
terraform plan    # preview changes
terraform apply   # apply changes
```

CI/CD: `terraform plan` runs on every PR touching `infrastructure/`. `terraform apply` runs on merge to main.
GitHub Secrets required: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`

---

## Next Steps Planned

- [x] Terraform — infrastructure as code (`infrastructure/` directory)
- [ ] PostgreSQL database (see `docs/POSTGRES_PLAN.md` when created)
- [ ] Automated S3 backups on a schedule
- [ ] Pin n8n to a specific version tag instead of `latest`
- [ ] Restrict SSH port 22 to your home IP in the Security Group
