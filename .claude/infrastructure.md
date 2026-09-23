---
topic: infrastructure
triggers: aws, dns, tofu, terraform, ssl, cloudflare, CI, streaming, rtmp, obs, mediamtx, hls, live page, alarm, gcp
updated: 2026-09-23
---

# Infrastructure

**The website, admin, database and n8n do not live in this repo.** Since 2026-09-22 they run on
the roboBOREALIS platform (`roboborealis/roboborealis-platform`, client `clients/stpetemusic/`).
That repo's `docs/INFRASTRUCTURE.md` is the authoritative inventory for the whole AWS account.

AWS account `767350869653`, profile `personal`, region `us-east-1`. Prefix commands with `awsp`
(an alias that unsets the stray PSD `AWS_ROLE_ARN` / `AWS_WEB_IDENTITY_TOKEN_FILE`).

## What this repo's OpenTofu still manages

| File | Resources |
|---|---|
| `streaming.tf` | `hls.stpetemusic.live` CloudFront (`ERXPX1DCL48LU`) + ACM cert, Route 53 TCP health check on RTMP `:1935` |
| `alarms.tf` | SNS topic `stpetemusic-alerts` (email), alarms `stpetemusic-cloudfront-5xx-high` and `stpetemusic-rtmp-unhealthy` |
| `cloudflare.tf` | DNS for `stpetemusic.live`: apex/`www`/`admin` → the platform CloudFront, `stream` + `n8n` → the services box (`18.211.32.207`), `hls`, verification records |
| `gcp*.tf` | GCP projects: analytics (GA4/GTM/Sheets + GitHub OIDC), `spm-n8n-workflows` (YouTube/Calendar/Sheets/Forms APIs), Maps JS |
| `secrets.tf` | SSM `clarity_project_id` |

State: S3 `stpetemusic-terraform-state`, lock table `stpetemusic-terraform-locks`.
CI: `tofu-plan.yml` on PRs touching `infrastructure/**`, `tofu-apply.yml` on merge to `main`.
Budget `stpetemusic-monthly` ($5, `Project=stpetemusic`) lives in the platform repo's bootstrap.

⚠️ `variables.tf` still requires the retired `db_username` / `db_password` (RDS), so CI must keep
passing those secrets until the variables are removed.

## Live streaming

```
OBS / Restream ──RTMP──▶ stream.stpetemusic.live:1935 (services box, mediamtx)
                          └─HLS─▶ n8n.stpetemusic.live/hls ◀── CloudFront hls.stpetemusic.live
                                                             ◀── stpetemusic.live/live (platform)
```

- mediamtx runs on the platform **services box** (`roboborealis-services`, `i-00a2e6f72b886b28b`),
  configured by the platform repo's `infrastructure/services/provision/42-mediamtx.sh`.
- The stream key is SSM `/roboborealis/services/mediamtx/rtmp_stream_key`. OBS Stream Key format:
  `live?user=stream&pass=<key>`.
- Recording is off (platform ADR-0028). There is no VOD bucket and no go-live social webhook.
- The platform site reads `HLS_STREAM_URL` from SSM `/roboborealis/stpetemusic/hls-stream-url`.

## Retired (do not look for these)

Deleted 2026-09-22/23: both Amplify apps, the RDS instance and its snapshot, the `stpetemusic-n8n`
EC2 box and its EIP, the linktree Lambda + API Gateway + DynamoDB, `stpetemusic-assets` and
`cdn.stpetemusic.live`, `stpetemusic-vod`, and the old admin's IAM user. The legacy databases
survive only as dumps in `s3://roboborealis-services-backups/legacy-rds-final/`.
