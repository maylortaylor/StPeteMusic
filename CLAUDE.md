# CLAUDE.md — StPeteMusic

⚠️ **Public site + admin are retired here, live on roboBOREALIS now.** Since 2026-09-22
`stpetemusic.live`, `www` and `admin` serve from `roboborealis-platform`'s
`clients/stpetemusic/` (Galaxy tier). This repo now holds only `infrastructure/` (the live
stream CDN, RTMP health check, alarms, Cloudflare DNS, GCP), an n8n workflow archive,
`database/` history and docs. The `.claude/` topic files were refreshed 2026-09-23 (#355).

Infrastructure + knowledge base for @StPeteMusic, a community music org in St. Pete, FL.
Parent company: Tangent LLC. Partner venue: Suite E Studios.

## Quick Reference
- Production: https://www.stpetemusic.live, served by roboborealis-platform (`clients/stpetemusic/`). The apps that used to be here were removed in #351.
- Never push directly to `main` — CI + 1 PR review required
- Managed by Matt Taylor (@maylortaylor) · team: Matt + Austen Van Der Bleek
- Key skills: `/github`, `/brainstorm` (before features), `/grill-me` (pre-push), `/security-review`, `/feature-dev:feature-dev`

## Deep Context
> **Load by domain, not by keyword.** Before planning or implementing anything, ask: which of these domains will my work touch? Load every matching file before you start — don't wait for keywords.

| Load when... | File |
|--------------|------|
| Brand & social accounts (@stpetemusic, suite e, team, IG, FB, YouTube, EventBrite) | [brand.md](.claude/brand.md) |
| Events & content (final friday, instant noodles, art walk, captions, posts, shows, bands) | [events.md](.claude/events.md) |
| Infrastructure (aws, dns, tofu, terraform, ssl, cloudflare, CI, streaming, rtmp, obs, mediamtx, hls, live page, alarms, gcp) | [infrastructure.md](.claude/infrastructure.md) |
| n8n & automation (workflows, obsidian, posting, youtube, instagram, google drive, video, reel) | [n8n.md](.claude/n8n.md) |
| Facebook & Instagram webhooks (fb automation, ig automation, page webhook, comment, message, mention) | [FACEBOOK_INSTAGRAM_AUTOMATION.md](docs/plans/FACEBOOK_INSTAGRAM_AUTOMATION.md) |
| Secrets & credentials (tokens, github secrets, env vars, rotate, listmonk, credential management) | [secrets.md](.claude/secrets.md) |
| Local setup (direnv, envrc, pre-commit, install, first-time, hooks) | [SETUP.md](SETUP.md) |
| Debugging & troubleshooting (errors, down, 403, 500, not responding, connection refused, site down, streaming, rtmp, obs not connecting, live page broken, tofu, credentials) | [troubleshooting.md](.claude/troubleshooting.md) |
| Ads & analytics (google ads, microsoft ads, bing, meta pixel, GTM, clarity, paid, advertising) | [ads-accounts-todo.md](.claude/ads-accounts-todo.md) |

## Key Files
| File | Purpose |
|---|---|
| `n8n/CLAUDE.md` | n8n-specific guidance |
| `.env.example` | Env variable template (safe to commit) |
