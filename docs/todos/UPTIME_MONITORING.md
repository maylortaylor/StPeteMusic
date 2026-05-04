# TODO: Set Up Uptime Monitoring

> **Action required by:** Matt Taylor (account-based setup, no code change needed)
> **Priority:** Before launch

## What to do

Sign up (free) at https://uptimerobot.com and create monitors for these 4 endpoints:

| Monitor name | URL | Type | Alert threshold |
|---|---|---|---|
| StPeteMusic — Homepage | `https://www.stpetemusic.live` | HTTP(S) | Down for 2 min |
| StPeteMusic — Newsletter API | `https://www.stpetemusic.live/api/newsletter/health` | HTTP(S) | Down for 2 min |
| n8n | `https://n8n.stpetemusic.live` | HTTP(S) | Down for 5 min |
| Listmonk | `https://listmonk.stpetemusic.live` | HTTP(S) | Down for 5 min |

## Settings

- **Check interval:** 5 minutes (free tier supports this)
- **Alert contact:** `maylortaylor@gmail.com`
- **Expected HTTP status:** 200 for all (the health endpoint returns 200 when Listmonk is reachable)

## Notes

- The newsletter health endpoint is at `apps/web/src/app/api/newsletter/health/route.ts` — it pings Listmonk and returns `{ status: "ok" }` or `{ status: "error" }`.
- n8n and Listmonk run on the EC2 instance (`t3.small`, us-east-1). If both go down simultaneously it's likely an EC2 or Nginx issue.
- SSL certs on EC2 are managed by Certbot (auto-renews). If an HTTPS alert fires on n8n/Listmonk, check `sudo certbot renew --dry-run` on the EC2 instance.
