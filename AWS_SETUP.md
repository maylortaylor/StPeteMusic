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

## Next Steps Planned

- [ ] PostgreSQL database (see `docs/POSTGRES_PLAN.md` when created)
- [ ] Automated S3 backups on a schedule
- [ ] Pin n8n to a specific version tag instead of `latest`
- [ ] Restrict SSH port 22 to your home IP in the Security Group
