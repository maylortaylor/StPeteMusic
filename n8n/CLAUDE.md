# CLAUDE.md — n8n

Guidance for Claude Code when working inside the `n8n/` directory.

---

## Overview

This directory contains the n8n workflow automation engine for @StPeteMusic.

| File | Purpose |
|---|---|
| `docker-compose.yaml` | Local development |
| `docker-compose.prod.yaml` | Production (AWS EC2) |
| `local-files/` | Files read/written by workflows (CSV, MD) — mounted into container |
| `workflows/StPeteMusic/` | **Active workflows only** — source of truth |

---

## Active Workflows

Only `workflows/StPeteMusic/` is active. All other workflow directories are legacy/reference.

| File | Purpose | AI Used |
|---|---|---|
| `obsidian-post-creator.json` | Chat agent → YouTube post metadata → Obsidian draft | Claude (default) |
| `obsidian-to-youtube-posting.json` | Obsidian draft → YouTube publish | Claude (default) |
| `youtube-shorts-tracker-creator.json` | YouTube Shorts tracking and creation | Gemini (backup) |
| `system-prompt.md` | Source of truth for AI agent system prompt | — |

### System Prompt Rule

`system-prompt.md` is the **human-readable source of truth**. When editing AI agent instructions:
1. Edit `system-prompt.md` first
2. Sync the `systemMessage` field inside the workflow JSON
3. Commit both files together

---

## AI Configuration

| Role | Model | Credential Name |
|---|---|---|
| Default | Anthropic Claude | `Anthropic Claude (Default)` |
| Backup | Google Gemini | `Google Gemini (Backup)` |

When adding AI nodes to workflows, always select `Anthropic Claude (Default)` unless there's a specific reason to use Gemini.

---

## Local Development

```bash
# Start n8n locally
cd n8n
docker-compose up -d
# UI: http://localhost:5678

# Stop
docker-compose down

# View logs
docker logs -f n8n
```

Environment variables load from `../.env` (project root).

---

## Production

n8n runs on AWS EC2 at https://n8n.stpetemusic.live

```bash
# SSH into server
ssh -i ~/.ssh/stpetemusic-n8n.pem ec2-user@n8n.stpetemusic.live

# On server — start/restart n8n
cd ~/stpetemusic/n8n
docker-compose -f docker-compose.prod.yaml --env-file ../.env up -d

# Deploy updated workflows to server (run from Mac)
scp -i ~/.ssh/stpetemusic-n8n.pem -r \
  ./workflows/StPeteMusic/ \
  ec2-user@n8n.stpetemusic.live:~/stpetemusic/n8n/workflows/
```

See `../AWS_SETUP.md` for full production reference.

---

## Key Differences: Local vs Production

| Setting | Local | Production |
|---|---|---|
| URL | `http://localhost:5678` | `https://n8n.stpetemusic.live` |
| Protocol | http | https |
| Port exposed | `5678:5678` | `127.0.0.1:5678:5678` (nginx proxies) |
| Auth | None | Owner account login required |
| Compose file | `docker-compose.yaml` | `docker-compose.prod.yaml` |

---

## OAuth Redirect URI

For all OAuth credential setup (YouTube, Instagram, Facebook) in n8n or external developer portals:

```
https://n8n.stpetemusic.live/rest/oauth2-credential/callback
```

---

## OBSIDIAN_HOST Environment Variable

All Obsidian HTTP request nodes use `{{ $env.OBSIDIAN_HOST }}` — never hardcode the URL.

| Environment | Value |
|---|---|
| Local (`docker-compose.yaml`) | `http://host.docker.internal:27123` |
| Production (`docker-compose.prod.yaml`) | `http://<TAILSCALE_IP>:27123` (run `tailscale ip -4` on your Mac) |

**If the Obsidian nodes fail in production:** check Tailscale is running on both Mac and EC2, and that Obsidian's Local REST API plugin is active on the Mac.

**If you re-import a workflow** that has the hardcoded URL, manually update each Obsidian node's URL field to `={{ $env.OBSIDIAN_HOST }}/...` (note the leading `=`).

---

## local-files/ Directory

Files placed in `n8n/local-files/` are mounted into the container at `/files`.

Workflows can read/write to `/files/` using the filesystem node or Code nodes with `fs`.
Useful for: CSV data imports, Markdown templates, batch processing files.

```js
// In n8n Code node
const fs = require('fs');
const data = fs.readFileSync('/files/my-data.csv', 'utf8');
```

---

## Editing Workflows

**Never edit workflow JSON directly in production.** Workflow:
1. Edit/test locally or in the n8n UI
2. Export workflow: **Workflow menu → Download**
3. Replace the file in `workflows/StPeteMusic/`
4. Validate JSON: `python3 -c "import json; json.load(open('workflow.json')); print('OK')"`
5. Commit and push

---

## Adding New Credentials in n8n UI

1. **Settings → Credentials → Add Credential**
2. Name credentials clearly: `Anthropic Claude (Default)`, `Google Gemini (Backup)`, `YouTube OAuth`, etc.
3. For OAuth platforms, use the redirect URI above
4. Test the credential before using in workflows

---

## Credentials Currently Configured

| Credential | Platform | Notes |
|---|---|---|
| Anthropic Claude (Default) | Anthropic API | Default for all AI nodes |
| Google Gemini (Backup) | Google AI | Backup AI |
| Facebook/Instagram | Meta Graph API | Requires app review for live access |
| YouTube OAuth | Google | OAuth2, reconnect if expired |

---

## Workflow JSON Validation

Before importing any workflow into n8n, validate it:

```bash
python3 -c "import json; json.load(open('workflow.json')); print('Valid')"
```

n8n will reject invalid JSON silently or show a confusing error.
