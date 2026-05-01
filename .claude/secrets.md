---
topic: secrets
triggers: secret, token, env, github secret, rotate, credential, password, api key, ig_access_token
updated: 2026-04-30
---

# Secrets Management

**GitHub Secrets are the single source of truth.** Manage at: `Settings → Secrets → Actions`

**Do NOT:**
- Edit `~/stpetemusic/.env` on EC2 directly — it is **overwritten on every deploy**
- Commit any secrets to `.env` or any other file
- SSH to rotate a token — update the GitHub Secret instead and let deploy apply it

**How it works:**
```
GitHub Secrets → deploy.yml (on push to main) → writes ~/stpetemusic/.env → n8n restarts
```

## Required GitHub Secrets
| GitHub Secret Name | Written to `.env` as | Description |
|--------------------|----------------------|-------------|
| `EC2_HOST` | — | SSH target |
| `EC2_USER` | — | SSH user |
| `EC2_SSH_KEY` | — | SSH private key |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | — | Terraform only |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` | same | PostgreSQL |
| `DB_ENCRYPTION_KEY` | same | pgcrypto encryption key |
| `N8N_ENCRYPTION_KEY` / `N8N_API_KEY` | same | n8n encryption + API key |
| `OBSIDIAN_HOST` | same | Tailscale URL `http://<IP>:27123` |
| `ANTHROPIC_API_KEY` | `CLAUDE_API_KEY_N8N_STPETEMUSIC` | Claude |
| `GROQ_API_KEY` / `N8N_GEMINI_API_KEY` | same | Groq + Gemini |
| `IG_USER_ID` / `IG_APP_ID` / `IG_ACCESS_TOKEN` | same | Instagram |
| `FB_PAGE_ID` / `FB_ACCESS_TOKEN` | same | Facebook |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `YOUTUBE_API_KEY` | YouTube vars | YouTube |
| `LISTMONK_USERNAME` / `LISTMONK_PASSWORD` | same | Listmonk API user (NOT admin login) |

## Rotating a Secret
1. Get new token value
2. GitHub → Settings → Secrets → Actions → update the secret
3. Push any commit to `main` (or re-run last deploy workflow)
4. n8n picks up new token after container restarts

## Instagram Token (`IG_ACCESS_TOKEN`)
Uses Page Access Token (never expires if derived from long-lived user token).
To rotate: short-lived User Token → long-lived → Page Token from `950900529511914/owned_pages`.
