# CLAUDE.md — StPeteMusic

Small apps + knowledge base for @StPeteMusic, a community music org in St. Pete, FL.
Parent company: Tangent LLC. Partner venue: Suite E Studios.

## Quick Reference
- Production: https://www.stpetemusic.live · Amplify app ID: `d1fjwgk99cbqor`
- Staging: https://develop.d1fjwgk99cbqor.amplifyapp.com
- Never push directly to `main` — CI + 1 PR review required
- Managed by Matt Taylor (@maylortaylor) · team: Matt + Austen Van Der Bleek

## Deep Context
> Match task keywords → read that file. Skip the rest.

| Keywords | File |
|---|---|
| brand, @stpetemusic, suite e, team, social, ig, fb, instagram, facebook, youtube, eventbrite | [brand.md](.claude/brand.md) |
| event, final friday, instant noodles, art walk, second saturday, jam, band, content, post, caption | [events.md](.claude/events.md) |
| infra, aws, amplify, ec2, dns, tofu, terraform, branch, git, listmonk, newsletter, ssl, ci | [infrastructure.md](.claude/infrastructure.md) |
| n8n, workflow, obsidian, posting, youtube, instagram, google drive, video, reel, publish | [n8n.md](.claude/n8n.md) |
| secret, token, github secret, rotate, credential, listmonk, env var, environment variable | [secrets.md](.claude/secrets.md) |
| setup, direnv, envrc, pre-commit, install, first-time, hooks | [setup.md](.claude/setup.md) |
| error, down, debug, troubleshoot, ssh, 403, 500, not responding, connection refused | [troubleshooting.md](.claude/troubleshooting.md) |

## Key Files
| File | Purpose |
|---|---|
| `AWS_SETUP.md` | Production server quick reference |
| `docs/AWS_DEPLOYMENT.md` | Full AWS setup guide |
| `n8n/CLAUDE.md` | n8n-specific guidance |
| `.github/workflows/deploy.yml` | CI/CD — writes `.env` on EC2 from GitHub Secrets |
| `.env.example` | Env variable template (safe to commit) |
