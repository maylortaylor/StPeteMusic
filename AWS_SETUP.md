# Web App — Amplify + Cloudflare DNS

## Current State

| Item | Value |
|---|---|
| **Amplify App ID** | `d1fjwgk99cbqor` |
| **CloudFront Distribution** | `d35nc2e8nr92q9.cloudfront.net` |
| **Domain** | `stpetemusic.live` |
| **DNS Provider** | Cloudflare (Route 53 hosted zone deleted — no longer in use) |
| **Amplify Domain Status** | Check with command below |

## Cloudflare DNS Records

All 3 records must be **DNS only (grey cloud — NOT proxied)** for Amplify SSL to work.

| Type | Name | Target |
|---|---|---|
| CNAME | `_ddf1b33c5eab2d60eddc95848a12d240` | `_bf19e363018afabe1b2e49737993dac9.jkddzztszm.acm-validations.aws.` |
| CNAME | `www` | `d35nc2e8nr92q9.cloudfront.net` |
| CNAME | `@` (apex) | `d35nc2e8nr92q9.cloudfront.net` |

Add at: dash.cloudflare.com → stpetemusic.live → DNS → Records

> ⚠️ Do NOT enable Cloudflare proxy (orange cloud) — Amplify ACM SSL validation requires direct DNS resolution.

## Check Domain Status

```bash
cd /Users/matt.taylor/Documents/_dev/maylortaylor/StPeteMusic
unset AWS_WEB_IDENTITY_TOKEN_FILE; AWS_PROFILE=personal aws amplify get-domain-association \
  --app-id d1fjwgk99cbqor \
  --domain-name stpetemusic.live \
  --region us-east-1 \
  --query 'domainAssociation.{status: domainStatus, verified: subDomains[*].verified}'
```

You're looking for `"status": "AVAILABLE"`.

---

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
