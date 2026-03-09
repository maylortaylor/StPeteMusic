# AWS Deployment Guide — n8n for StPeteMusic

> **Goal:** Deploy n8n on a free AWS EC2 instance with a public HTTPS URL so your workflows
> can receive webhooks from Instagram, Facebook, YouTube, and Obsidian — accessible from anywhere.
>
> **URL:** `https://n8n-stpetemusic.duckdns.org`
> **Cost:** $0 for the first 12 months (AWS Free Tier)
> **Skill level:** Beginner-friendly — every step is explained

---

## Architecture Overview

```
Your Browser / Obsidian / IG / FB / YouTube
         │
         ▼
https://n8n-stpetemusic.duckdns.org   ← Free DuckDNS subdomain
         │
         ▼
AWS Elastic IP (stable public IP, free while attached)
         │
         ▼
EC2 t3.micro — Amazon Linux 2023 (free tier)
  ├── nginx  (reverse proxy: HTTPS:443 → localhost:5678)
  ├── Certbot (Let's Encrypt free SSL cert, auto-renews)
  └── Docker
        └── n8n container
              ├── /home/node/.n8n  → n8n_data volume (EBS)
              └── /files           → local-files/ (CSV, MD, etc.)
```

---

## AWS Concepts (Quick Reference)

| Term | What It Is |
|------|-----------|
| **EC2** | A virtual server in the cloud (like a computer you rent) |
| **t3.micro** | The server size: 1GB RAM, 2 vCPU — free tier eligible |
| **EBS** | The hard drive attached to your EC2 server |
| **Elastic IP** | A static public IP that stays the same even if you restart the server |
| **Security Group** | A firewall that controls what traffic can reach your server |
| **Key Pair** | SSH credentials — a `.pem` file you use to log into your server |
| **AMI** | The operating system image (we'll use Amazon Linux 2023) |

---

## Prerequisites

Before starting, make sure you have:
- [ ] AWS account at https://aws.amazon.com (personal, not PSD)
- [ ] AWS CLI configured: `aws configure --profile personal`
- [ ] A DuckDNS account at https://www.duckdns.org (free, sign in with Google)
- [ ] This repo cloned locally

Verify your AWS profile is correct:
```bash
aws sts get-caller-identity --profile personal
# Should show your personal AWS account ID, NOT a PSD account
```

---

## Phase 1 — Launch EC2 Instance

### 1.1 — Create a Key Pair (Your SSH Login Credential)

A key pair is how you securely SSH into your server. AWS gives you a `.pem` file —
keep this safe, you cannot re-download it.

```bash
# Create the key pair and save the .pem file
aws ec2 create-key-pair \
  --key-name stpetemusic-n8n \
  --query 'KeyMaterial' \
  --output text \
  --profile personal \
  --region us-east-1 > ~/.ssh/stpetemusic-n8n.pem

# Set correct permissions (required for SSH to work)
chmod 400 ~/.ssh/stpetemusic-n8n.pem
```

> **What this does:** Creates an RSA key pair in AWS and downloads the private key to
> `~/.ssh/stpetemusic-n8n.pem`. The `.pem` extension stands for Privacy Enhanced Mail —
> it's just a standard format for cryptographic keys.

### 1.2 — Create a Security Group (Firewall Rules)

A Security Group acts as a firewall. We need to open 3 ports:
- **22** — SSH (so you can log in from your Mac)
- **80** — HTTP (for Let's Encrypt domain verification)
- **443** — HTTPS (for n8n web UI and webhooks)

```bash
# Create the security group
aws ec2 create-security-group \
  --group-name stpetemusic-n8n-sg \
  --description "n8n StPeteMusic server" \
  --profile personal \
  --region us-east-1

# NOTE: Save the GroupId from the output above (looks like sg-0abc123...)
# Replace YOUR_SG_ID below with that value

# Allow SSH from anywhere (you can restrict to your IP later)
aws ec2 authorize-security-group-ingress \
  --group-id YOUR_SG_ID \
  --protocol tcp --port 22 --cidr 0.0.0.0/0 \
  --profile personal --region us-east-1

# Allow HTTP (needed for Let's Encrypt cert validation)
aws ec2 authorize-security-group-ingress \
  --group-id YOUR_SG_ID \
  --protocol tcp --port 80 --cidr 0.0.0.0/0 \
  --profile personal --region us-east-1

# Allow HTTPS (n8n web UI + webhooks)
aws ec2 authorize-security-group-ingress \
  --group-id YOUR_SG_ID \
  --protocol tcp --port 443 --cidr 0.0.0.0/0 \
  --profile personal --region us-east-1
```

### 1.3 — Find the Amazon Linux 2023 AMI ID

AMI = Amazon Machine Image (the OS). This ID changes by region, so look it up:

```bash
aws ec2 describe-images \
  --owners amazon \
  --filters "Name=name,Values=al2023-ami-2023*-x86_64" \
             "Name=state,Values=available" \
  --query 'sort_by(Images, &CreationDate)[-1].ImageId' \
  --output text \
  --profile personal \
  --region us-east-1
# Save the output — it looks like ami-0abc123...
```

### 1.4 — Launch the EC2 Instance

```bash
aws ec2 run-instances \
  --image-id YOUR_AMI_ID \
  --instance-type t3.micro \
  --key-name stpetemusic-n8n \
  --security-group-ids YOUR_SG_ID \
  --block-device-mappings '[{"DeviceName":"/dev/xvda","Ebs":{"VolumeSize":20,"VolumeType":"gp3"}}]' \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=stpetemusic-n8n}]' \
  --profile personal \
  --region us-east-1

# Save the InstanceId from the output (looks like i-0abc123...)
```

> **Volume size:** 20GB gp3 — well within the 30GB free tier. This stores your OS,
> Docker images, n8n data, and your CSV/MD files.

### 1.5 — Allocate and Attach an Elastic IP

An Elastic IP is a static public IP address. Without it, your server's IP changes every
time you stop and start it — which would break your DuckDNS URL. It's free as long as
it's attached to a running instance.

```bash
# Allocate an Elastic IP
aws ec2 allocate-address \
  --domain vpc \
  --profile personal \
  --region us-east-1
# Save AllocationId (eipalloc-...) and PublicIp from output

# Attach it to your instance
aws ec2 associate-address \
  --instance-id YOUR_INSTANCE_ID \
  --allocation-id YOUR_ALLOCATION_ID \
  --profile personal \
  --region us-east-1
```

> **Write down your Elastic IP** — you'll need it for DuckDNS in the next phase.

---

## Phase 2 — DuckDNS Free Domain Setup

DuckDNS gives you a free subdomain (like `n8n-stpetemusic.duckdns.org`) that points to
your server's Elastic IP. It's free forever and works with Let's Encrypt for HTTPS.

### 2.1 — Register the Subdomain

1. Go to https://www.duckdns.org
2. Sign in with your Google account (use TheBurgMusic@gmail.com or personal)
3. In the "sub domain" field, type: `n8n-stpetemusic`
4. Click **"add domain"**
5. In the **current ip** field, enter your **Elastic IP** from Phase 1
6. Click **"update ip"**

Your domain is now live: `n8n-stpetemusic.duckdns.org` → your server IP.

### 2.2 — Verify It Works

```bash
# From your Mac terminal — should return your Elastic IP
nslookup n8n-stpetemusic.duckdns.org
```

---

## Phase 3 — SSH Into Your Server

```bash
# SSH into the EC2 instance
ssh -i ~/.ssh/stpetemusic-n8n.pem ec2-user@n8n-stpetemusic.duckdns.org

# Or using the Elastic IP directly:
ssh -i ~/.ssh/stpetemusic-n8n.pem ec2-user@YOUR_ELASTIC_IP
```

> **First time connecting:** You'll see a warning about "authenticity of host" — type `yes`
> to accept. This is normal for first-time SSH connections.

---

## Phase 4 — Server Setup (Run These Inside EC2)

All commands from here run **inside your EC2 instance** via SSH.

### 4.1 — System Update

```bash
# Update all system packages
sudo dnf update -y
```

### 4.2 — Install Docker

```bash
# Install Docker
sudo dnf install docker -y

# Start Docker and enable it to auto-start on reboot
sudo systemctl enable docker
sudo systemctl start docker

# Add your user to the docker group (so you don't need sudo for docker commands)
sudo usermod -aG docker ec2-user

# Apply group change without logging out
newgrp docker

# Verify Docker works
docker --version
```

### 4.3 — Install Docker Compose

```bash
# Download Docker Compose (check https://github.com/docker/compose/releases for latest version)
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64" \
  -o /usr/local/bin/docker-compose

# Make it executable
sudo chmod +x /usr/local/bin/docker-compose

# Verify
docker-compose --version
```

### 4.4 — Install nginx

nginx is a web server we'll use as a reverse proxy. It handles HTTPS and forwards
requests to n8n running on port 5678.

```bash
sudo dnf install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 4.5 — Install Certbot (Let's Encrypt SSL)

Certbot automates getting and renewing free SSL certificates from Let's Encrypt.

```bash
# Install EPEL repository (extra packages for Amazon Linux)
sudo dnf install -y python3-pip
sudo pip3 install certbot certbot-nginx

# Or via snap (may be available):
sudo dnf install -y snapd
sudo systemctl enable --now snapd.socket
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

---

## Phase 5 — HTTPS with nginx + Let's Encrypt

### 5.1 — Basic nginx Config (HTTP first)

```bash
sudo nano /etc/nginx/conf.d/n8n.conf
```

Paste this initial config (HTTP only — for cert validation):

```nginx
server {
    listen 80;
    server_name n8n-stpetemusic.duckdns.org;

    location / {
        proxy_pass http://localhost:5678;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Save and exit (`Ctrl+X`, then `Y`, then `Enter`).

```bash
# Test the config is valid
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### 5.2 — Get the SSL Certificate

```bash
sudo certbot --nginx -d n8n-stpetemusic.duckdns.org \
  --non-interactive \
  --agree-tos \
  --email TheBurgMusic@gmail.com
```

Certbot will:
1. Verify you control the domain (via the HTTP server we set up)
2. Download a free SSL certificate
3. Automatically update your nginx config to use HTTPS

### 5.3 — Final nginx Config (HTTPS + WebSocket support)

n8n uses WebSockets for real-time UI updates. After Certbot runs, replace the nginx
config with this production version:

```bash
sudo nano /etc/nginx/conf.d/n8n.conf
```

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name n8n-stpetemusic.duckdns.org;
    return 301 https://$host$request_uri;
}

# HTTPS + proxy to n8n
server {
    listen 443 ssl;
    server_name n8n-stpetemusic.duckdns.org;

    ssl_certificate /etc/letsencrypt/live/n8n-stpetemusic.duckdns.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/n8n-stpetemusic.duckdns.org/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Max upload size for media files
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:5678;
        proxy_http_version 1.1;

        # WebSocket support (required for n8n UI)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts for long-running workflows
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
    }
}
```

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### 5.4 — Set Up Auto-Renewal

Let's Encrypt certificates expire every 90 days. Certbot can auto-renew them.

```bash
# Test that renewal works
sudo certbot renew --dry-run

# Add a cron job to auto-renew twice daily (standard practice)
sudo crontab -e
```

Add this line:
```
0 */12 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx
```

---

## Phase 6 — Deploy n8n

### 6.1 — Create the Project Directory

```bash
mkdir -p ~/stpetemusic/n8n/local-files
cd ~/stpetemusic
```

### 6.2 — Create the Environment File

```bash
nano ~/stpetemusic/.env
```

Fill in your values (reference `.env.example` in the repo):

```bash
# === AI ===
N8N_API_KEY=                          # Generate in n8n after first login
CLAUDE_API_KEY_N8N_STPETEMUSIC=       # From Anthropic console
GROQ_API_KEY=                         # From console.groq.com
N8N_GEMINI_API_KEY=                   # From Google AI Studio

# === Social Media ===
IG_USER_ID=
IG_ACCESS_TOKEN=
FB_PAGE_ID=
FB_ACCESS_TOKEN=
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=
YOUTUBE_API_KEY=

# === n8n Encryption (generate a random string) ===
N8N_ENCRYPTION_KEY=                   # Run: openssl rand -hex 32
```

Generate the encryption key:
```bash
openssl rand -hex 32
# Copy the output into N8N_ENCRYPTION_KEY above
```

> **IMPORTANT:** Never commit `.env` to git. It's already in `.gitignore`.

### 6.3 — Create docker-compose.prod.yaml

```bash
nano ~/stpetemusic/n8n/docker-compose.prod.yaml
```

```yaml
services:
  n8n:
    image: n8nio/n8n:latest
    container_name: n8n
    restart: unless-stopped
    # No port 5678 exposed externally — nginx handles all traffic
    environment:
      # Core
      - N8N_HOST=n8n-stpetemusic.duckdns.org
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - WEBHOOK_URL=https://n8n-stpetemusic.duckdns.org/
      - GENERIC_TIMEZONE=America/New_York

      # Security
      - N8N_ENCRYPTION_KEY=${N8N_ENCRYPTION_KEY}

      # Execution
      - N8N_BLOCK_ENV_ACCESS_IN_NODE=false
      - NODE_FUNCTION_ALLOW_BUILTIN=fs
      - N8N_DEFAULT_BINARY_DATA_MODE=filesystem
      - N8N_LOG_LEVEL=info

      # API Keys (passed from .env)
      - N8N_API_KEY=${N8N_API_KEY}
      - CLAUDE_API_KEY_N8N_STPETEMUSIC=${CLAUDE_API_KEY_N8N_STPETEMUSIC}
      - GROQ_API_KEY=${GROQ_API_KEY}
      - N8N_GEMINI_API_KEY=${N8N_GEMINI_API_KEY}
      - IG_USER_ID=${IG_USER_ID}
      - IG_ACCESS_TOKEN=${IG_ACCESS_TOKEN}
      - FB_PAGE_ID=${FB_PAGE_ID}
      - FB_ACCESS_TOKEN=${FB_ACCESS_TOKEN}
      - YOUTUBE_CLIENT_ID=${YOUTUBE_CLIENT_ID}
      - YOUTUBE_CLIENT_SECRET=${YOUTUBE_CLIENT_SECRET}
      - YOUTUBE_API_KEY=${YOUTUBE_API_KEY}

    volumes:
      - n8n_data:/home/node/.n8n
      - ./local-files:/files

    networks:
      - n8n-net

networks:
  n8n-net:
    driver: bridge

volumes:
  n8n_data:
    driver: local
```

### 6.4 — Copy Workflow Files to Server

From your **local Mac** (not inside SSH):

```bash
# Copy workflow files to the server
scp -i ~/.ssh/stpetemusic-n8n.pem -r \
  /Users/matttaylor/Documents/_dev/maylortaylor/StPeteMusic/n8n/workflows/StPeteMusic/ \
  ec2-user@n8n-stpetemusic.duckdns.org:~/stpetemusic/n8n/workflows/
```

### 6.5 — Start n8n

Back **inside SSH**:

```bash
cd ~/stpetemusic/n8n

docker-compose -f docker-compose.prod.yaml up -d

# Watch logs to make sure it starts correctly
docker logs -f n8n
```

Look for: `n8n ready on 0.0.0.0, port 5678`

### 6.6 — First Login + Owner Account Setup

1. Open your browser: `https://n8n-stpetemusic.duckdns.org`
2. n8n will prompt you to create an **owner account**
   - Use `TheBurgMusic@gmail.com` or your preferred email
   - Set a strong password
3. Log in with those credentials going forward

> **Why this matters:** Without an owner account, n8n is wide open to anyone who finds
> the URL. The owner account is your first line of security.

---

## Phase 7 — Configure AI Credentials in n8n

### 7.1 — Add Anthropic Claude (Default AI)

1. In n8n: **Settings → Credentials → Add Credential**
2. Search for: `Anthropic`
3. Name it: `Anthropic Claude (Default)`
4. Paste your `CLAUDE_API_KEY_N8N_STPETEMUSIC` value
5. Save

### 7.2 — Add Google Gemini (Backup AI)

1. **Settings → Credentials → Add Credential**
2. Search for: `Google Gemini`
3. Name it: `Google Gemini (Backup)`
4. Paste your `N8N_GEMINI_API_KEY`
5. Save

### 7.3 — Add Instagram / Facebook / YouTube

Repeat the process for each platform using the values from your `.env` file.

---

## Phase 8 — Import Workflows

> **Important:** Only import workflows from `n8n/workflows/StPeteMusic/`. Skip any
> Notion-related workflows for now.

1. In n8n: **Workflows → Import from File**
2. Import each `.json` file from `~/stpetemusic/n8n/workflows/StPeteMusic/`
3. Open each workflow and:
   - Update any hardcoded URLs to use `https://n8n-stpetemusic.duckdns.org`
   - Verify credentials are connected (look for green dots on nodes)
   - Activate the workflow (toggle at top right)

---

## Maintenance Reference

### SSH into the server
```bash
ssh -i ~/.ssh/stpetemusic-n8n.pem ec2-user@n8n-stpetemusic.duckdns.org
```

### Common Docker commands
```bash
# View running containers
docker ps

# View n8n logs (live)
docker logs -f n8n

# Restart n8n
docker restart n8n

# Stop n8n
docker-compose -f docker-compose.prod.yaml down

# Start n8n
docker-compose -f docker-compose.prod.yaml up -d

# Update n8n to latest version
docker pull n8nio/n8n:latest
docker-compose -f docker-compose.prod.yaml up -d
```

### Update DuckDNS IP (if Elastic IP ever changes)
```bash
curl "https://www.duckdns.org/update?domains=n8n-stpetemusic&token=YOUR_DUCKDNS_TOKEN&ip="
```

> Get your DuckDNS token from https://www.duckdns.org after logging in.

### Backup n8n data
```bash
# On EC2: backup n8n volume to a tar file
docker run --rm \
  -v n8n_data:/source \
  -v ~/backups:/backup \
  alpine tar czf /backup/n8n-backup-$(date +%Y%m%d).tar.gz -C /source .

# Copy backup to your Mac
scp -i ~/.ssh/stpetemusic-n8n.pem \
  ec2-user@n8n-stpetemusic.duckdns.org:~/backups/n8n-backup-*.tar.gz \
  ~/Downloads/
```

---

## Cost Monitoring

After deploying, check your AWS costs:
```bash
# View current month estimated charges
aws ce get-cost-and-usage \
  --time-period Start=$(date +%Y-%m-01),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --profile personal
```

Also set up a billing alert in AWS Console → Billing → Budgets → Create Budget.
Recommended: Alert at $5/month while on free tier.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't SSH in | Check Security Group has port 22 open; verify `.pem` permissions (`chmod 400`) |
| n8n not loading | `docker logs n8n` to see errors; check nginx is running: `sudo systemctl status nginx` |
| SSL cert errors | Run `sudo certbot renew`; check cert expiry: `sudo certbot certificates` |
| Webhook not receiving | Verify `WEBHOOK_URL` env var is set correctly; check n8n logs |
| "Connection refused" | n8n may not be running: `docker ps` to check |
| DuckDNS not resolving | Update IP at duckdns.org; wait 1-2 min for DNS propagation |

---

## Next Steps

- [ ] Set up PostgreSQL (see `docs/POSTGRES_PLAN.md`)
- [ ] Set up automated backups to S3
- [ ] Pin n8n to a specific version instead of `latest` for stability
- [ ] Restrict SSH access to your home IP in the Security Group
