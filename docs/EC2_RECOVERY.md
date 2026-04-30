# EC2 Recovery — StPeteMusic Production Server

> Last updated: 2026-04-28
> Branch: `fix/listmonk-startup-order`

This document captures the current production incident, root cause, what has been tried, and the verified fix. Written as a handoff so any agent or person can pick this up.

---

## Current State (as of 2026-04-28)

| Service | Status |
|---|---|
| `stpetemusic.live` | ✅ UP (Amplify, unaffected) |
| `n8n.stpetemusic.live` | ❌ DOWN (Docker stopped and disabled via SSM) |
| `listmonk.stpetemusic.live` | ❌ DOWN (502 — container never starts) |

**EC2 instance state:**
- Instance: `i-03874197d725b0455` · t3.micro · us-east-1
- Docker: stopped and disabled (intentional — needed to break OOM freeze loop)
- SSH: connects but commands hang immediately (sshd accepts connection, shell hangs)
- SSM Session Manager: **working** — this is the only way to run commands on the instance

---

## Root Cause

**t3.micro (1GB RAM) cannot run n8n + listmonk simultaneously.**

Memory breakdown:
- n8n: `mem_limit: 1024m` = entire RAM budget
- listmonk: `mem_limit: 256m`
- OS + nginx overhead: ~200MB
- **Total needed: ~1480MB on a 1024MB machine**

Both containers have `restart: unless-stopped`. On every boot:
1. Docker starts
2. Both containers launch simultaneously
3. Combined usage instantly exceeds 1GB
4. Linux OOM killer fires, killing random processes including sshd
5. Instance appears frozen — SSH connects but hangs
6. Auto-recovery restarts the instance → loop repeats

This was introduced when listmonk was added to `docker-compose.prod.yaml`. Previously only n8n ran and fit within 1GB.

### Secondary Bug: Startup Order Race (also in this branch)

Before the fix in this branch, `docker-compose up -d` was launching Listmonk before the database existed:

```
Old deploy order (broken):
  1. docker-compose up -d  ← Listmonk starts, --install fails (DB doesn't exist yet)
  2. CREATE DATABASE listmonk_stpetemusic  ← Too late
  Result: exit code 1 → restart loop
```

Fixed in this branch: DB creation now happens BEFORE `docker-compose up -d`.

---

## What Has Been Tried

1. **EC2 reboot** via `aws ec2 reboot-instances` → froze again on boot (Docker starts too fast)
2. **Stop/start instance** → froze again on boot (same root cause)
3. **SSH race** to stop Docker immediately after boot → always hangs before command executes
4. **SSM Run Command** — successfully stopped and disabled Docker ✅
5. **SSM memory check** — confirmed 1910MB RAM, 2GB swap active ✅
6. **SSM startup script** — attempted to start Docker + n8n + listmonk in sequence via SSM; may not have been passed correctly

---

## Immediate Recovery (SSM Commands)

Docker is disabled. Use SSM `send-command` to get n8n back without SSH.

**Important**: Always `unset AWS_WEB_IDENTITY_TOKEN_FILE` before any `aws` CLI command on a Mac with PSD credentials configured — it causes silent auth failures.

### Step 1 — Re-enable Docker, start n8n only

```bash
unset AWS_WEB_IDENTITY_TOKEN_FILE

aws ssm send-command \
  --instance-ids i-03874197d725b0455 \
  --document-name "AWS-RunShellScript" \
  --timeout-seconds 300 \
  --parameters '{"commands":[
    "sudo systemctl enable docker",
    "sudo systemctl start docker",
    "sleep 15",
    "cd /home/ec2-user/stpetemusic/n8n && docker-compose -f docker-compose.prod.yaml --env-file ../.env up -d n8n",
    "sleep 90",
    "docker ps"
  ]}' \
  --region us-east-1 --profile personal
```

Note the `CommandId` from the output, then check results:

```bash
aws ssm get-command-invocation \
  --command-id <CommandId> \
  --instance-id i-03874197d725b0455 \
  --region us-east-1 --profile personal
```

> Start **n8n only** — do NOT start listmonk yet on t3.micro. Wait for the t3.small upgrade (PR merge).

### Step 2 — Verify n8n is up

```bash
curl -sf https://n8n.stpetemusic.live/healthz
# Should return: {"status":"ok"}
```

---

## Permanent Fix — Merge PR #52

**PR #52** (`fix/listmonk-startup-order`) is ready to merge and contains the permanent fix:

| Change | File | Purpose |
|---|---|---|
| t3.micro → t3.small (2GB RAM) | `infrastructure/ec2.tf` | Eliminates OOM permanently |
| DB creation before compose up | `.github/workflows/deploy.yml` | Fixes Listmonk startup crash |
| Healthchecks + depends_on | `n8n/docker-compose.prod.yaml` | Listmonk waits for n8n to be healthy |
| Swap active on every deploy | `.github/workflows/deploy.yml` | Prevents swap loss on instance restart |
| systemd auto-start service | `.github/workflows/deploy.yml` | Containers restart after EC2 reboots |
| Workflow concurrency fix | both workflow files | Prevents tofu + deploy race condition |

**Merging PR #52 triggers:**
1. `tofu-apply.yml` runs → `tofu apply` upgrades instance to t3.small (~2 min stop/start)
2. `deploy.yml` runs (queued, not concurrent) → writes .env, starts both containers
3. systemd `stpetemusic.service` is installed → containers auto-start on future reboots

---

## Key AWS Resources

| Resource | Value |
|---|---|
| Instance ID | `i-03874197d725b0455` |
| Instance type (current) | t3.micro |
| Instance type (after PR merge) | t3.small |
| Elastic IP | `eipalloc-0a2ebbeef75ce8009` |
| Region | us-east-1 |
| AWS profile | `personal` |
| SSH key | `~/.ssh/stpetemusic-n8n.pem` |
| SSH command | `ssh -i ~/.ssh/stpetemusic-n8n.pem -F /dev/null ec2-user@n8n.stpetemusic.live` |
| SSM interactive shell | `aws ssm start-session --target i-03874197d725b0455 --profile personal` |

---

## Easy Access — Makefile Targets

After cloning/pulling this repo, use `make` instead of copy-pasting long commands:

```bash
make ssm                      # Interactive SSM shell (no SSH key needed)
make ssh                      # Traditional SSH (requires port 22 + correct IP)
make docker-ps                # Check container status via SSM
make docker-logs-listmonk     # Tail listmonk logs via SSM
make ssm-result CMD=<id>      # Get SSM command output
make tofu-plan                # Plan infrastructure changes
make tofu-apply               # Apply infrastructure changes
```

---

## Bugs Found and Fixed in PR #52

### Bug 1 — tofu-apply and deploy race condition (HIGH)
Both workflows fired simultaneously on push to `main`. tofu-apply could stop the EC2 instance while deploy was SSHing into it → SSH timeout.

**Fix**: Same `concurrency: group: production-deploy` in both workflow files.

### Bug 2 — No auto-start after EC2 reboot (HIGH)
`user_data.sh` runs only on first boot. If the instance reboots, Docker starts but containers stay down.

**Fix**: deploy.yml now installs `/etc/systemd/system/stpetemusic.service` on every deploy.

### Bug 3 — Deploy healthcheck too short (MEDIUM)
n8n can take up to 150s to become healthy. Listmonk waits for n8n. Deploy only waited 90s for listmonk → false timeout warnings.

**Fix**: listmonk health poll extended to 300s; n8n healthcheck retries reduced from 5→3.

### Bug 4 — Docker daemon restart on every deploy (MEDIUM)
Restarting Docker stops all running containers briefly. Deploy was doing this unconditionally.

**Fix**: Only restart Docker daemon if `daemon.json` changed.

---

## What Still Needs to Be Done (Post-PR)

- [ ] **SMTP configuration** in Listmonk UI (required before sending emails)
  - Options: Resend (free tier: 3k/month) or AWS SES
  - Configure at: `https://listmonk.stpetemusic.live` → Settings → SMTP
- [ ] **First admin login** — verify credentials, check mailing list ID = 3
- [ ] **Remove orphan containers** if present:
  ```bash
  docker rm -f stpetemusic-postgres 2>/dev/null || true
  ```
- [ ] **Update `docs/NEWSLETTER_SETUP.md`** — references old Docker Postgres setup

---

## Important Notes

- **Always** `unset AWS_WEB_IDENTITY_TOKEN_FILE` before AWS CLI commands on this Mac (PSD credential contamination from OIDC token)
- SSH `-F /dev/null` bypasses a macOS SSH config issue that causes hangs
- Listmonk password rotation after first install requires updating it in the PostgreSQL DB (via Listmonk UI or SQL) — rotating GitHub Secrets alone is not enough
- Port 22 is open to `0.0.0.0/0` in the SG — SSH key auth is the only guard. SSM is available as a keyless alternative.
