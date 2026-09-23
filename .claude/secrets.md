---
topic: secrets
triggers: secret, token, env, github secret, rotate, credential, password, api key, ig_access_token, env var
updated: 2026-09-23
---

# Secrets

There is no deploy from this repo any more, so no `.env` is written anywhere from here.

## Where each secret lives now

| Secret | Home |
|---|---|
| Site/admin runtime (DB URL, auth, Google OAuth, YouTube key, linktree URL, HLS URL) | SSM `/roboborealis/stpetemusic/*`, rendered onto the platform box by its `render-env.sh` |
| n8n env (FB/IG tokens, `N8N_WEBHOOK_SECRET`, Resend, alert email) | SSM `/roboborealis/services/stpetemusic/*`, passed into n8n by `40-n8n.sh` |
| n8n credentials (Anthropic, Google OAuth, Postgres) | n8n's own credential store on the services box |
| RTMP stream key | SSM `/roboborealis/services/mediamtx/rtmp_stream_key` |
| This repo's CI (Cloudflare, GCP, `alert_email`, `clarity_project_id`) | GitHub Secrets, passed as `TF_VAR_*` by `tofu-plan.yml` / `tofu-apply.yml` |

Many `TF_VAR_*` lines in the two tofu workflows now feed variables nothing uses. They are
harmless. Remove them with the matching variables when convenient.

**Local reference copy:** `.env` in this repo (gitignored) still holds the original values, and
is where the platform's SSM copies were taken from. Never commit it.

## Instagram token (`IG_ACCESS_TOKEN`)

A Page Access Token, which never expires if derived from a long-lived user token. To rotate:
short-lived User Token → long-lived → Page Token from `950900529511914/owned_pages`. Then update
SSM `/roboborealis/services/stpetemusic/ig_access_token` and re-run the platform's
`deploy-services.yml`.
