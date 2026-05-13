# CLAUDE.md — StPeteMusic

Small apps + knowledge base for @StPeteMusic, a community music org in St. Pete, FL.
Parent company: Tangent LLC. Partner venue: Suite E Studios.

## Quick Reference
- Production: https://www.stpetemusic.live · Amplify app ID: `d1fjwgk99cbqor`
- Staging: https://develop.d1fjwgk99cbqor.amplifyapp.com
- Never push directly to `main` — CI + 1 PR review required
- Managed by Matt Taylor (@maylortaylor) · team: Matt + Austen Van Der Bleek

## Deep Context
> **Load by domain, not by keyword.** Before planning or implementing anything, ask: which of these domains will my work touch? Load every matching file before you start — don't wait for keywords.

| Load when... | File |
|--------------|------|
| Brand & social accounts (@stpetemusic, suite e, team, IG, FB, YouTube, EventBrite) | [brand.md](.claude/brand.md) |
| Events & content (final friday, instant noodles, art walk, captions, posts, shows, bands) | [events.md](.claude/events.md) |
| Infrastructure & deployment (aws, amplify, ec2, dns, tofu, terraform, ssl, cloudflare, listmonk, CI) | [infrastructure.md](.claude/infrastructure.md) |
| n8n & automation (workflows, obsidian, posting, youtube, instagram, google drive, video, reel) | [n8n.md](.claude/n8n.md) |
| Facebook & Instagram webhooks (fb automation, ig automation, page webhook, comment, message, mention) | [n8n-fb-ig-automation.md](.claude/n8n-fb-ig-automation.md) |
| Secrets & credentials (tokens, github secrets, env vars, rotate, listmonk, credential management) | [secrets.md](.claude/secrets.md) |
| Local setup (direnv, envrc, pre-commit, install, first-time, hooks) | [setup.md](.claude/setup.md) |
| Debugging & troubleshooting (errors, down, ssh, 403, 500, not responding, connection refused) | [troubleshooting.md](.claude/troubleshooting.md) |
| Ads & analytics (google ads, microsoft ads, bing, meta pixel, GTM, clarity, paid, advertising) | [ads-accounts-todo.md](.claude/ads-accounts-todo.md) |

## Key Files
| File | Purpose |
|---|---|
| `AWS_SETUP.md` | Production server quick reference |
| `docs/AWS_DEPLOYMENT.md` | Full AWS setup guide |
| `n8n/CLAUDE.md` | n8n-specific guidance |
| `.github/workflows/deploy.yml` | CI/CD — writes `.env` on EC2 from GitHub Secrets |
| `.env.example` | Env variable template (safe to commit) |
